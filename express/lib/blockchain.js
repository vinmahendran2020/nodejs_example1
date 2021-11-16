var Web3 = require('web3');
const EthereumTx = require('ethereumjs-tx').Transaction;
const config = require('../config/config.js');
const logger = require('../lib/log').getLogger('BlockchainManager')
const fs = require('fs');
const path = require('path');
const request = require('request')

class BlockchainConnection {

    constructor(rpcProvider, web3) {
        logger.TraceHeadder('Constructor', [rpcProvider, web3]);
        logger.Debug(`Creating new blockchain connection to`, rpcProvider);
        if (web3) this.web3 = web3;
        else this.web3 = new Web3(new Web3.providers.HttpProvider(config.BC[rpcProvider].rpcEndpoint));
        this.chainId = config.BC[rpcProvider].chainId;
        this.testIdentity = config.BC[rpcProvider].testIdentity;

        this.contracts = new Map();
        logger.Trace(`Loading contracts`);
        // Object.entries(contracts).map(obj => {
        //     const key = obj[0];
        //     const value = obj[1];

        //     this.contracts.set(
        //         obj[1].name, new this.web3.eth.Contract(obj[1].abi, obj[1].contractAddress)
        //     );
        //     logger.Debug(`Contract ${obj[1].name} loaded`);
        // });
        this.loadContracts(config.BC[rpcProvider].contractsPath, config.BC[rpcProvider].contractsNames, this.contracts)
    }

    /** 
    * Loads all the contracts specified in the configuration contractsPath mentioned in the configuration contractsNames param
    * @param contractsPath Paths with the compiled smart contracts
    * @param contractsNames  Arrays with the names of the contracts
    * @return Map with the loaded contract instances
    */
    async loadContracts(contractsPath, contractsNames, contracts) {
        const networkId = await this.web3.eth.net.getId()
        for (let index = 0; index < contractsNames.length; index++) {
            const element = contractsNames[index];
            const filePath = path.join(contractsPath, element + '.json');
            try {
                var parsedContract = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))
                if (parsedContract.networks[networkId] == undefined) {
                    logger.Fatal(`Contract ${contractsNames[index]} not deployed on network ${networkId}`)
                }
                let contractInstance = new this.web3.eth.Contract(parsedContract.abi, parsedContract.networks[networkId].address)
                contractInstance.bytecode = parsedContract.bytecode
                contracts.set(
                    contractsNames[index],
                    contractInstance
                );
                logger.Debug(`Contract ${contractsNames[index]} loaded`)
            } catch (error) {
                logger.Err(error.message)
                /* istanbul ignore else */ // Depends on ganache only
                if (error.message.substring('networkID is not defined')) {
                    logger.Fatal('Node did not respond to query, maybe is down or unaccessible')
                } else {
                    logger.Fatal('Couldn load contract ' + filePath + ' as specified in config.js file');
                }
            }

        }
        return contracts
    }

    /** 
    * Returns test identity, will be changed by HSM/KMS signing functionality
    * @param functionContract contract function name
    * @param params  parameters of the function
    * @param contractInstance instance of contract
    * @param txReceiptCallback  callback to retrieve the hash. Dont wait to the mining.
    * @param chainId  type of blockchain
    * @param ether  sendEther to payable transactions
    * @return hash
    */
    getIdentity() {
        logger.TraceHeadder('getIdentity', []);
        logger.Trace(`Test identity returned`, this.testIdentity);
        return this.testIdentity;
    }

    getChainId() {
        logger.TraceHeadder('getChainId', []);
        logger.Trace(`ChainID returned`, this.chainId);
        return this.chainId;
    }

    /** 
    * This function deploys a smart contract in a deterministic address using create2
    * @param functionContract Contract to be deployed
    * @param params  parameters of the function
    * @param contractInstance instance of contract
    * @param txReceiptCallback  callback to retrieve the hash. Dont wait to the mining.
    * @param chainId  type of blockchain
    * @param ether  sendEther to payable transactions
    * @return hash
    */
    async sendRawTransaction(contractOptions, callbacks, options) {
        const { functionName, functionParams, contractName, contractAddress } = contractOptions
        const { txHashCallback, txReceiptCallback, errorCallback } = callbacks
        const { chainId, ether, nonce } = options

        logger.TraceHeadder('sendRawTransaction', [functionName, functionParams, contractName, txReceiptCallback, errorCallback, chainId, ether]);
        try {
            const tx = await this.createTransactionWContractAddress(functionName, functionParams, contractName, contractAddress,
                this.getIdentity().address, ether, nonce)

            const signedTx = this.signTransaction(this.getIdentity().privateKey, tx, chainId);

            this.sendSignedTransaction(signedTx, txHashCallback, errorCallback, txReceiptCallback);

            logger.Debug(`Sent tx to ${functionName}@${contractName} with params ${functionParams}`);

        } catch (err) {
            throw err
        }
    }

    /** 
    * Sends a signed transaction and provides the results in different callbacks for the different states of the transaction
    * @param signedTx signed transaction
    * @param txReceiptCallback  callback to return the hash.Dont wait to be mined
    * @param errorCallBack callback to return Error.
    * @return 
    */
    sendSignedTransaction(signedTx, txHashCallback, errorCallBack, txReceiptCallback, txConfirmedCallback) {
        logger.TraceHeadder('sendSignedTransaction', [signedTx, txHashCallback, errorCallBack, txReceiptCallback, txConfirmedCallback]);
        try {
            this.web3.eth.sendSignedTransaction(signedTx)
                .once('transactionHash', function (hash) {
                    logger.Info(`Transaction hash:`, hash);
                    txHashCallback(hash);
                })
                .once('receipt', function (receipt) {
                    logger.Debug(`Receipt returned by the node:`, receipt);
                    /* istanbul ignore else */
                    if (txReceiptCallback) txReceiptCallback(receipt);
                })
                .once('confirmation', function (confirmationNumber, receipt) {
                    logger.Info(`Transaction mined:`, receipt.transactionHash);
                    logger.Info(`Successful transaction:`, receipt.status);
                    logger.Trace(`Confirmed by:`, confirmationNumber, 'blocks');
                    /* istanbul ignore else */
                    if (txConfirmedCallback) txConfirmedCallback(receipt);
                })
                .on('error', function (error) {
                    errorCallBack(error);
                })
        } catch (err) {
            logger.Err(err);
            throw err
        }
    }


    /**
      * Creates a transaction ready to be signed
      * @param functionName contract function name
      * @param functionParamsArray parameters of the function
      * @param contractInstance instance of contract
      * @param AccountAddress address of contract
      * @param ether sendEther to payable transactions
      * @return object
      */
    async createTransaction(functionName, functionParamsArray, contractName, AccountAddress, ether, accNonce) {
        logger.TraceHeadder('createTransaction', [functionName, functionParamsArray, contractName, AccountAddress, ether, accNonce]);
        try {
            var contractInstance;
            if (typeof contractName === 'string') contractInstance = this.contracts.get(contractName);
            else contractInstance = contractName;

            const bytecode = contractInstance.methods[functionName](...functionParamsArray).encodeABI();
            //const gasL = await contractInstance.methods[functionName](...functionParamsArray).estimateGas(); //TODO: fix these for tests 

            const gasL = 6721975;
            if (!accNonce) accNonce = await this.web3.eth.getTransactionCount(AccountAddress, "pending");
            logger.Trace(`Account nonce is ${accNonce}`)
            const contractAddr = contractInstance._address;
            if (!ether) ether = "0x00"
            const txParams = {
                from: AccountAddress,
                nonce: accNonce,
                gasPrice: await this.getGasPrice(),
                gasLimit: gasL,
                to: contractAddr,
                // value: web3.utils.toHex(3622400000000000),
                value: ether,
                data: bytecode,
            };
            logger.Trace(`Tx created:`);
            logger.Trace(txParams);
            return txParams;
        } catch (err) {
            logger.Err(err);
            throw err
        }
    }

    /**
      * Creates a transaction ready to be signed with a user defined address
      * @param functionName contract function name
      * @param functionParamsArray parameters of the function
      * @param contractInstance instance of contract
      * @param accountAddress address of contract
      * @param ether sendEther to payable transactions
      * @return object
      */
    async createTransactionWContractAddress(functionName, functionParamsArray, contractName, contractAddress, accountAddress, ether, accNonce) {
        logger.TraceHeadder('createTransactionWContractAddress', [functionName, functionParamsArray, contractName, accountAddress, ether, accNonce]);
        try {
            const contractCode = await this.web3.eth.getCode(contractAddress)
            if (contractCode === '0x') throw new Error('There is no contract with the specified address')
            var contractInstance;
            if (typeof contractName === 'string') contractInstance = this.contracts.get(contractName);
            else contractInstance = contractName;

            const bytecode = contractInstance.methods[functionName](...functionParamsArray).encodeABI();
            //const gasL = await contractInstance.methods[functionName](...functionParamsArray).estimateGas(); //TODO: fix these for tests 
            const gasL = 6721975;
            if (accNonce === undefined) accNonce = await this.web3.eth.getTransactionCount(accountAddress, "pending");

            if (!ether) ether = "0x00"
            const txParams = {
                from: accountAddress,
                nonce: accNonce,
                gasPrice: await this.getGasPrice(),
                gasLimit: gasL,
                to: contractAddress,
                // value: web3.utils.toHex(3622400000000000),
                value: ether,
                data: bytecode,
            };
            logger.Trace(`Tx created:`);
            logger.Trace(txParams);
            return txParams;
        } catch (err) {
            logger.Err(err);
            throw new Error(err);
        }
    }

    /**
      * Signs the payload data, signing is done externally, used strictly for testing
      * @param signed payload to be signed
      * @return tx hash
      */
    signTransaction(privateKey, transaction, chainId) {
        logger.TraceHeadder('signTransaction', [privateKey, transaction, chainId]);
        try {
            const tx = new EthereumTx(transaction, chainId);
            let privKey = Buffer.from(privateKey, 'hex');

            tx.sign(privKey);
            const signedTX = `0x${tx.serialize().toString('hex')}`;
            logger.Trace(`Signed transaction: ${JSON.stringify(signedTX, null, 2)}`);
            return signedTX;
        } catch (err) {
            logger.Err(err)
            throw err
        }
    }


    /**
     * Reads a value from the blockchain
     * @param functionName contract function name
     * @param paramsArray  parameters of the function
     * @param contractName string with contract name or contract instance 
     * @param contractAddress  (optional) contract address
     * @return object
     */
    async sendCall(functionName, paramsArray, contractName, contractAddress) {
        logger.TraceHeadder('sendCall', [functionName, paramsArray, contractName]);
        try {
            const contractCode = await this.web3.eth.getCode(contractAddress)
            if (contractCode === '0x') throw new Error('There is no contract with the specified address')

            if (contractName) {
                var contract;
                if (contractName && typeof contractName === 'string') {
                    contract = this.contracts.get(contractName);
                    // If there is no such contract
                    if (typeof contract === 'undefined') {
                        logger.Err('Contract name not recognized');
                        throw new Error('Contract name not recognized');
                    }
                    contract.options.address = contractAddress
                }
                else contract = contractName;
                logger.Debug(`Call ${functionName} sent to contract ${contractName} @ ${contractAddress}`)
                return await contract.methods[functionName](...paramsArray).call();
            }
            logger.Err('sendCall() needs a the name of the contract');
            throw new Error('sendCall() needs a the name of the contract');
        } catch (err) {
            throw err;

        }
    }

    /**
     * Deploys a smart contract leveraging the create2 OPCODE
     * It checks for a factory, deploys it if it can find it, checks 
     * if the smart contract to be deployed exists and deploys it if it doesnt
     * @param contractName contract to be deployed
     * @param paramsTypes  types of parameters of constructor
     * @param paramsData  parameters of constructor
     * @return callback
     */
    async deploy(deployerAddress, contractBytecode, paramsTypes, paramsData, salt, address, privateKey, chainId, nonce, errorCallback, minedCallback) {
        logger.TraceHeadder('deploy', [contractBytecode, paramsTypes, paramsData]);
        try {
            const factory = this.contracts.get('Factory')
            if (factory == undefined) {
                throw new Error('Contract Factory needs to be defined inside the configuration file');
            }
            const factoryContract = new this.web3.eth.Contract(factory._jsonInterface, deployerAddress)
            if (!await this.isContract(deployerAddress)) { //Deploy if contract is not already deployed
                throw new Error(`Contract Factory is not deployed on ${deployerAddress}, please deploy it (IE truffle) and paste the correct address inside the configuration file`);
            }

            logger.Trace('Computing future address')
            // constructor arguments are appended to contract bytecode
            const bytecode = `${contractBytecode}${this.encodeParameters(paramsTypes, paramsData).slice(2)}`
            const computedAddr = this.buildCreate2Address(
                deployerAddress,
                this.numberToUint256(salt),
                bytecode
            )
            logger.Trace('Future address is')
            logger.Trace(computedAddr)
            // if (!await this.isContract(computedAddr)){
            //     throw new Error(`That contract has already been deployed, it address is: ${computedAddr}`);
            // }

            logger.Trace('Deploying contract')

            let transaction = await this.createTransactionWContractAddress("deploy2", [bytecode, salt, address],
                "Factory", deployerAddress, address, "0x00", nonce);
            let signedTransaction = await this.signTransaction(privateKey, transaction, chainId);

            this.sendSignedTransaction(signedTransaction, function (hash) { logger.Trace(hash) }, errorCallback,
                function (receipt) { logger.Trace(receipt) }, minedCallback);
            logger.Info(`Deployment sent`);


        } catch (err) {
            logger.Err(err);
            throw err;

        }
    }

    /***************************************************************/
    /**************Auxiliar functions **********************/
    /***************************************************************/
    addContractInstanceToMap(name, contractInstance) {
        this.contracts.set(name, contractInstance);
    }

    toBytes32(param) {
        return this.web3.utils.utf8ToHex(param);
    }

    hexToNumberString(hex) {
        return this.web3.utils.hexToNumberString(hex);
    }

    // deterministically computes the smart contract address given
    // the account the will deploy the contract (factory contract)
    // the salt as uint256 and the contract bytecode
    buildCreate2Address(creatorAddress, saltHex, byteCode) {
        logger.TraceHeadder('buildCreate2Address', [creatorAddress, saltHex, byteCode], 'blockchain')
        const rawAddr = `0x${this.web3.utils.sha3(`0x${[
            'ff',
            creatorAddress,
            saltHex,
            this.web3.utils.sha3(byteCode)
        ].map(x => x.replace(/0x/, '')).join('')}`).slice(-40)}`.toLowerCase()
        logger.Debug(`Expected address ${rawAddr}`)
        return rawAddr
    }

    // converts an int to uint256
    numberToUint256(value) {
        const hex = value.toString(16)
        return `0x${'0'.repeat(64 - hex.length)}${hex}`
    }

    // encodes parameter to pass as contract argument
    encodeParameters(dataType, data) {
        return this.web3.eth.abi.encodeParameters(dataType, data)
    }

    // returns true if contract is deployed on-chain
    async isContract(address) {
        const code = await this.web3.eth.getCode(address)
        return code.slice(2).length > 0
    }

    getDeploymentAddressFromFactoryTx(receipt) {
        try {
            if (!receipt.status) throw new Error('Transaction was mined but it failed')
            const deploymentAddress = '0x' + receipt.logs[1].data.substring(26, 66);
            const deploymentTransaction = receipt.transactionHash;
            return { deploymentAddress, deploymentTransaction }
        } catch (error) {
            logger.Warn('Transaction rejected')
            logger.Warn('Receipt:', receipt)
            logger.Warn('Error:', error.message)
            logger.BLKError(receipt)
            return {
                error: 'Deployment transaction mined and failed, look at the receipt for more information',
                possibleReasons: [
                    'Contract with that input+salt already exists',
                    'Transaction ran out of gas',
                    'Bad transaction signature',
                ],
                receipt
            }
        }

    }

    getGasPrice() {
        const outterScope = this
        return new Promise((resolve, reject) => {
            request('https://ethgasstation.info/json/ethgasAPI.json', function (error, response, body) {
                if (error) {
                    reject(error)
                    return
                }
                const txSpeed = process.env.TX_SPEED
                if (!["fast", "fastest", "safeLow", "average"].includes(txSpeed)) {
                    reject("TX_SPEED value incorrect, only fast, fastest, safeLow and average are allowed")
                }
                const price = JSON.parse(body)[txSpeed]
                let price2wei = parseInt(price) * 100000000

                if (price2wei > process.env.MAX_GASPRICE) {
                    price2wei = process.env.MAX_GASPRICE
                } else if (price2wei < process.env.MIN_GASPRICE) {
                    price2wei = process.env.MIN_GASPRICE
                }

                const price2Hex = outterScope.web3.utils.toHex(price2wei)
                resolve(price2Hex)

            });
        })
    }

}
module.exports = {
    BlockchainConnection
};