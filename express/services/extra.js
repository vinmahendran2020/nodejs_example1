const blockchainInstance = require("../lib/blockchainInstance");
const config = require('../config/config.js');
const logger = require('../lib/log').getLogger('service/extra')


let envConfig
/* istanbul ignore next */
if (!process.env['NODE_ENV']) {
    process.env['NODE_ENV'] = 'local'
    envConfig = config.BC[process.env['NODE_ENV']]
    console.log(`Running in local mode, will connect to node running at ${envConfig.rpcEndpoint}`)
}
/* istanbul ignore next */
else {
    envConfig = config.BC[process.env['NODE_ENV']]
    try {
        console.log(`Running in remote mode, will connect to node running at ${envConfig.rpcEndpoint}, to chain ${JSON.stringify(envConfig.chainId), null, 2}`)
    } catch (error) {
        logger.Fatal(`Environment ${process.env['NODE_ENV']} not recognized, please select a valid one located in config.js`)
        return
    }
}

async function mintSecurity(tsin, mints, nonce, acronym) {
    var response = {}

    try {
        const blockchain = blockchainInstance.get()
        const WT = blockchain.contracts.get('WhitneyToken')
        const FC = blockchain.contracts.get('Factory')
        /* istanbul ignore next */
        if (typeof WT === 'undefined')
            throw new Error('Error 404: Contract WhitneyToken needs to be defined inside the configuration');
        /* istanbul ignore next */
        if (typeof FC === 'undefined')
            throw new Error('Error 404: Contract WhitneyToken needs to be defined inside the configuration');

        let addresses = []
        let amounts = []
        mints.forEach(mint => {
            addresses.push(mint.address)
            amounts.push(mint.tokens)
        })

        const salt = 1
        const privateKey = blockchain.getIdentity().privateKey
        const address = blockchain.getIdentity().address
        const chainId = blockchain.getChainId()
        const contractByteCode = WT.bytecode
        const paramsTypes = ['uint256', 'uint8', 'string', "string"]
        const acrm = acronym || "WT"
        const paramsData = [0, 0, tsin, acrm]

        return await new Promise((resolve, reject) => {
            blockchain.deploy(FC._address, contractByteCode, paramsTypes, paramsData, salt, address, privateKey, chainId, nonce,
                function (err) {
                    reject(new Error(err));

                }, async function (receipt) {
                    logger.Trace(`Tx Receipt:`, receipt)

                    let newSecurity = blockchain.getDeploymentAddressFromFactoryTx(receipt)
                    /* istanbul ignore next */ // Only on mainnet
                    if (newSecurity.error) {
                        reject(new Error(newSecurity.error));
                        return
                    }

                    const tx = await blockchain.createTransactionWContractAddress('batchMint', [addresses, amounts],
                        "WhitneyToken", newSecurity.deploymentAddress, blockchain.getIdentity().address, "0x00", nonce)
                    logger.Trace(`batchMint TX Body:`, tx)

                    const signedTx = await blockchain.signTransaction(
                        blockchain.getIdentity().privateKey, tx, blockchain.getChainId());

                    blockchain.sendSignedTransaction(signedTx,
                        function (txHash) { logger.Trace('batchMint txHash:', txHash) },
                        function (error) {
                            logger.Trace(`batchMint TX Error:`, error)
                            reject(error)
                        },
                        function (receipt) {
                            response['batchMintTransaction'] = receipt.transactionHash
                            response['newSecurity'] = newSecurity
                            resolve(response);
                        });
                })
        })

    } catch (error) {
        logger.Err(error.message)
        logger.Err('Error will be sent to queue')
        throw error
    }
}

async function call(scFunction, contractAddress, scParams, contractName) {
    try {
        const blockchain = blockchainInstance.get()

        const response = {
            result: await blockchain.sendCall(scFunction, scParams, contractName, contractAddress)
        }
        logger.Debug(response)
        return response

    } catch (error) {
        logger.Err(error.message)
        throw error
    }

}

module.exports = {
    mintSecurity,
    call
}