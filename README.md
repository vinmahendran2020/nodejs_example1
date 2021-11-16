 
# Ethereum Deployment

## 1) Ethereum Rinkeby Geth - Deployment

    A. Use CFT template "whitney-geth-rinkeby.yaml" to bring up a stack. This creates an EC2 instance with name "Geth-testnet-rinkeby-fastsync".

    B. Connect to the Rinkeby EC2 instance.

    C. Check if rinkeby service is running (sudo systemctl status geth_rinkeby.service)

    D. If up shut it down (sudo systemctl stop geth_rinkeby.service)

    E. cat /pot/geth/geth_config.toml and check geth_config.toml to make sure networkid is 4

    E. Start a new tmux session (tmux new)

    F. Then restart the service manually (sudo /opt/geth/bin/geth --rinkeby --config geth_config.toml)

    G. As we have chosen fastsync mode so it should take about 24 hours to sync up the node.

    H. 24 hours later check. Go to "https://rinkeby.etherscan.io/" to get the latest block number and if it matches the latest block number on the log on tmux session

    I. Check sync status by running below command
        curl --location --request POST 'http://localhost:8547' --header 'Content-Type: application/json' --data-raw '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'

    J. If response is "{"jsonrpc":"2.0","id":1,"result":false}" then ethereum network is completely synced and ready to serve traffic. 

    J. Move to next step only above response is received. 

## 2) Ethereum Contracts - Migration

    1. Use CFT template "whitney-ec2-ethereum-deployment.yaml" to create a stack with parameter "NodeEnv" as "rinkebyGeth". This creates an EC2 instance with tag name "EthereumExpress-Explorer".

    2. Use CFT template "whitney-ethereum-token-pipeline" from whitney-pipelines repo to create a stack. This clones whitney-ethereum-token repo to "EthereumExpress-Explorer" instance

    3. SSH to "EthereumExpress-Explorer" instance.

    4. cd /opt/whitney-ethereum-token/

    5. Modify Truffle Config js file :
        rinkebyGeth: {
            "provider: () => new PrivateKeyProvider("private key", "http://{Private IP of Rinkeby Geth ec2 instance}:8547")"...

    6. Deploy Contracts in Rinkeby Geth EC2(testnet): 
        sudo truffle migrate --network rinkebyGeth --reset

## 3) Ethereum Service - Deployment

    1. Use CFT template "whitney-ethereum-service-pipeline" from whitney-pipelines repo to create a stack. This deploys whitney-ethereum-service express app to "EthereumExpress-Explorer" instance

    2. SSH to "EthereumExpress-Explorer" instance.

    3. Run "export NODE_ENV=rinkebyGeth"

    4. Run "sudo vi /opt/whitney-ethereum-service/express/config/config.js" to modify configurations,
        rinkebyGeth: {
                rpcEndpoint: "http://{Private IP of rinkebyGeth ec2}:8547",
                wsEndpoint: "ws://{Private IP of rinkebyGeth ec2}:8548",
                testIdentity: {
                    address: "your ethereum public address for rinkeby",
                    privateKey: "your ethereum private key"
                },
                chainId: { 'chain': 'rinkeby' },
                contractsPath: '/opt/whitney-ethereum-token/build/contracts',
                contractsNames: ['Factory', 'WhitneyToken'],
            }

    5. sudo -s

    6. Run "source /opt/whitney-ethereum-service/scripts/start_service.sh"

    7. To check logs 
        cd /etc/systemd/system/
        journalctl -u whitney_ethereum.service -n 100

## 4) Ethereum Explorer - Deployment

    1. Use CFT template "whitney-explorer-pipeline" from whitney-pipelines repo to create a stack. This deploys whitney-explorer to "EthereumExpress-Explorer" instance

    2. SSH to "EthereumExpress-Explorer" instance.

    3. Run "export NODE_ENV=rinkebyGeth"

    4. Run "sudo vi /opt/whitney-explorer/config/config.js" to modify configurations based on node_env variable
        rinkebyGeth: {
                rpcEndpoint: "http://{Private IP of rinkebyGeth ec2}:8547",
                wsEndpoint: "ws://{Private IP of rinkebyGeth ec2}:8548",
                testIdentity: {
                    address: "your ethereum public address for rinkeby",
                    privateKey: "your ethereum private key"
                },
                chainId: { 'chain': 'rinkeby' },
                contractsPath: '/opt/whitney-ethereum-token/build/contracts',
                contractsNames: ['Factory', 'WhitneyToken'],
            }

    5. sudo -s

    6. Run "source /opt/whitney-explorer/scripts/start_service.sh"

    7. To check logs 
        cd /etc/systemd/system/
        journalctl -u whitney_explorer.service -n 100

----------------------------------------------------------------------------------------------------------------------------------------------------------

## Configuration files

*  **contracts.js**: Array with all the contracts to be used by the app. They have to include the smart contract ABI and bytecode

*  **config.js**: Configuration file with all the node connection posibilities, the main admin account and the Factory (smart contract in charge of deploying) address.

## Environment variables
*  **NODE_ENV**: Environment where the service is running, specific configuration is done in config.js. The default file allows you to deploy in a local node "local" (default) and "rinkleby"
* **PORT**: Port where the API is exposed (8032 by default)

## Getting started
First 3 steps are optional if running directly on rinkleby, all configuration to use that network and the deployed smart contracts is already in config.js

1. (Optional) To run and test locally use Ganache . [ganache](https://www.npmjs.com/package/ganache-cli).
`sudo npm i -g ganache-cli`
`ganache-cli -d`
2. (Optional) Deploy the smart contracts in the chain you want to use. [truffle](https://www.npmjs.com/package/truffle). **See the Smart contracts repo to learn about deployment**
`sudo npm i -g truffle`
`truffle migrate`
3. (Optional) Update the config.js file with one of the addresses and private keys shown in in ganache, and update the address to the one shown during the truffle migration
4. Start the endpoint. It will automatically download all dependencies and start the endpoint
`npm start`

  

## Endpoints
In this table we explain the 3 endpoints

 **/mintSecurity**:

  1. Creating a new security  **/mintSecurity**
  * Body:
```
{
    "tsin":"T3351N67",
    "records":[
	{ "address":"0x33be5519c4018D0d4ad242110A40eBAF0C695403","tokens":100},
	{ "address":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1","tokens":100},
	{ "address":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1","tokens":100}
    ]
}
```
* Output:

```
{
    "batchMintTransaction": "0x972d435a24b4be908bc44b60a424bcd87f947522cde951444dee31c919bad251",
    "newSecurity": {
        "deploymentAddress": "0xb6f08357a05b0ba1d51f279386ddbe1182a3554e",
        "deploymentTransaction": "0xffa56ced2b7d214e4ec289b84037c2179bce0a3a8afb16687899a3f994913fda"
    }
}
```
* Context: Minting process deploys the address deterministically based on the TSIN provided, when the transaction is confirmed a batchmint transaction is sent crediting the specified address with the amounts. As a response we provide both transactions and the address of the new security
* Possible errors: 
	1. Addresses need to be valid Eth addresses
	2. Several securities with the same TSIN can't be deployed, the transaction will revert
	3. Timeouts may occur if the fees suddenly increase, the transactions will probably still be sent
	4. Nonce can desync, you can force custom nonces by adding the nonce param to the body IE: `"nonce": 8`
	5. Out of gas error: if the gas is miscalculated or the EVM estimated a failure before reaching the node
	6. Transaction reverted might happen in edge cases best way to find the solution is to analyze the receipt

| **createTransaction**(functionName, functionParamsArray, contractName, AccountAddress, ether) |Name of the contract function; params of function; name of cotract; senderAddress; send ether(just required for payable transactions) | Object with required params to execute a transaction| Prepare the transaction to be executed

| **signTransaction**(privateKey, transaction, chainId) | PrivateKey of the sender; transaction(generated with createTransaction method); chainId(Especify network) | signed transaction |Method to signed a transaction

| **sendCall**(functionName, paramsArray, contractName) | Especify function name; params of function; name of contract | results of query |Send any type of query

# Ethereum Lambdas

## Explorer 

This is the lambda function that handles any on-chain events/activities for the TSINs generated by the Whitney system. The lambda function must be setup with an api gateway trigger with cognito user pool auth.
There is no user submitted request for this lambda.

## AddAddresses 

This is the lambda function to store investor ethereum addresses. 

The request body is as follows:

```
[
	{
		"walletProvider": "1", 
		"address": "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826"
	}, 
	{
		"walletProvider": "2",
		"address": "0x746Ac4553191cCC706097b974A3cB03fed360A69"
	}
]
```

The response is as follows:

```
[
	{
		"walletProvider": "1", 
		"address": "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826", 
		"addressID: 1
	}, 
	{
		"walletProvider": "2",
		"address": "0x746Ac4553191cCC706097b974A3cB03fed360A69"
		"addressID": 2
	}
]
```

## ReadByAddressID 

This is the lambda function to retrieve ethereum records using addressID(s). 

The request body is as follows:

```
{
	"addresses": [
		{
			"addressID": "1"
		},
		{
			"addressID": "2"
		}
	]
}
```

The response is as follows:

```
[
	{
		"walletProvider": "Owner Name",
		"address": "0x0000",
		"tradingVenue": false,
		"addressID": "1" 
	},
	{
		"walletProvider": "Owner 2 Name",
		"address": "0x0001",
		"tradingVenue": true,
		"addressID": "2" 
	}
]
```

## Ethereum Mint 

This is the lambda function to call ethereum express service to deploy smart contract and mint tokens. 

The request body is as follows:

```
[
	{
		"walletProvider": "1", 
		"address": "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826"
	}, 
	{
		"walletProvider": "2",
		"address": "0x746Ac4553191cCC706097b974A3cB03fed360A69"
	}
]
```

The response is the transaction reciept for token deployment and batchMint.
If there is an error, that error is put on an errorQueue for users to handle.

## Ethereum Remint 

This is the lambda function to trigger token reminting on chain. It is itself triggered by SQS messages.
There is no user submitted request for this lambda.

## Approve Reject 

This is the lambda function to Approve or Reject an Ethereum transaction. It is itself triggered by SQS messages.
There is no user submitted request for this lambda.

## Ethereum Remint Queue

This is the lambda function to trigger token reminting on chain to an investors new address. It is itself triggered by SQS messages. There is no user submitted request for this lambda.

## Ethereum DB Queries

This is the lambda function that allows a user to execute any given query.

The request body is as follows:

```
{
    "query": "SELECT * FROM EthereumAddresses"
}
```

The response is as follows:

```
[
    {
        "walletProvider": "example",
        "addressID": "1",
        "address": "0x000",
        "tradingVenue": false
    }
]
```

## buildspec.yaml
This is the codepipeline script to build and update the lambda functions