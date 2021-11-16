## Ethereum Mint 

This is the lambda function to call ethereum express service to deploy smart contract and mint tokens. 

The request body is as follows:

```
[
		{
			"uniqueInvestorID": "1", 
			"address": "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826"
		}, 
		{
			"uniqueInvestorID": "2",
			"address": "0x746Ac4553191cCC706097b974A3cB03fed360A69"
		}
	]
```

The response is the transaction reciept for token deployment and batchMint.
If there is an error, that error is put on an errorQueue for users to handle.
