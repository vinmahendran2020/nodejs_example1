'use strict';
const async = require('async');
const axios = require('axios');
const https = require('https');

module.exports = function(){
	return {
		explorer: function(event, callback, connection, sqs, mysql, lambda){
			var eventType = event.eventType; //Get explorer event type
			const agent = new https.Agent({  
				rejectUnauthorized: false
			});
			//Switch between event types and act accordingly
			switch(eventType){
				case("Transfer"):
				// Token Mint Event
				// {
				// 	"TSIN":"FRESH02",
				//	"eventType":"Transfer",
				//	"body":{
				//	"from": "0x0000000000000000000000000000000000000000",
				//	"to": "0x33be5519c4018D0d4ad242110A40eBAF0C695403",
				//	"tokens": 100
				//	},
				//	"eventId":"log_66a19fef",
				//	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
				// }
					if (event.body.from == '0x0000000000000000000000000000000000000000' ){
						//Map tsin to contract address
						var insertQuery = "INSERT INTO contractAddressMapping (tsin, contractAddress) Values ('" + event['TSIN'] + "','" + event.contractAddress + "')";
						//Obtain and map addresses to investor then make request to ETH service
						connection.query(insertQuery, function (error, results) {
							if(error){
								callback(error['sqlMessage'] + ", unable to complete request to mysql", null);
								connection.destroy();
							} else {
								//success
								var sqlQuery = "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '" + event.body.to + "'";
								//Obtain investorID receiving minted tokens, then send message to MintReconQueue
								connection.query(sqlQuery, function (error, results) {
										if (error) {
											callback(error['sqlMessage'] + ", unable to complete request to mysql", null);
											connection.destroy();
										} else {
											//init message to MintReconQueue
											connection.destroy();
											var body = {
													"walletProvider":results[0].walletProvider,
													"tokens": event.body.value,
													"tsin":event['TSIN'], 
													"addressID": results[0].addressID, 
													"uniqueInvestorID": results[0].walletProvider
											}
											
											var message = {
												MessageBody: JSON.stringify(body), /* required */
												QueueUrl: process.env.CONTRACT_QUEUE, /* required */
												DelaySeconds: '0', /* required */
												MessageAttributes: { /* required */
													"Title": {
													DataType: "String",
													StringValue: eventType
													}
												},
												MessageGroupId: eventType , /* required for FIFO queue */
												MessageDeduplicationId: event.TSIN + "Minted" + event.body.to /*required for FIFO queue  */
											};
											//send message to the queue
											sqs.sendMessage(message, function(err, data) {
												if (err) {
													callback("Error sending message to queue: " + err, null);
													//failure
												}
												else {
													callback(null, "Successfully handled Token Mint event");
													//success
												}
											});
											//connection.end();
										}
								});
							}
						});
					}
					
					break;
				case('Submission'):
				// Transfer initiated/mined on chain event
				// {
				//  "TSIN": 'T3351N99',
				// 	"eventType":"Submission",
				// 	"body": {
				//		"transactionId": '16'
				// 	}
				// }
					
					axios.get(process.env.ETH_SERVICE + `/${event.contractAddress}/transaction/${event.body.transactionId}`, {},{httpsAgent:agent})
					.then((res) => {
						//Get list of investors from address
						var toQuery = "SELECT * FROM ethereumAddresses WHERE address = '" + res.data.result['1'] + "'";
						var fromQuery = "SELECT * FROM ethereumAddresses WHERE address = '" + res.data.result['0'] + "'";
						//Obtain and map addresses to investor then make request to ETH service
						async.parallel([
							function(callback){
								connection.query(toQuery, function (error, toResults) {
									if (error) {
										callback(error['sqlMessage'] + ", unable to complete request to mysql", null);
									} else {
										if(toResults.length == 0){
											//receiver doesn't exist
											callback(null, undefined);
										} else {
											callback(null, toResults[0]);
										}
										
									}
								});
							},
							function(callback){
								connection.query(fromQuery, function (error, fromResults) {
									if (error) {
										callback(error['sqlMessage'] + ", unable to complete request to mysql", null);
									} else {
										callback(null, fromResults[0]);
									}
								});
							}],
							function(err, results) {
								if(err){
									callback(err, null);
									connection.destroy();
								} else {
									connection.destroy();
									if (results[0] != undefined){
										//receiver exists
										var body = {
											"transferType":"Transfer",
											"to":results[0].addressID, //TransferOut 2931
											"receiver": results[0].walletProvider, //TransferOut 51
											"from":results[1].addressID, //TranferOut 2930
											"sender": results[1].walletProvider, //TranferOut 51
											"tokens":res.data.result["2"],
											"tsin":event.TSIN, // 91
											"transactionId": event.body.transactionId,
											"contractAddress":event.contractAddress, 
											"suspended": (results[0].suspended || results[1].suspended) //check if addresses are still valid
										};

										if(results[0].tradingVenue){ //TransferIN
											body['transferType'] = "TransferIn";
										} 
										if(results[1].tradingVenue){ //TransferOUT
											body['transferType'] = "TransferOut";
										}
										//If both are trading venues this is not a onchain event 
										if(results[1].tradingVenue && results[0].tradingVenue){
											body['suspended'] = true;
										}
									} else {
										var body = {
											"transferType":"Transfer",
											"to":undefined, 
											"receiver": undefined, 
											"from":results[1].addressID, 
											"sender": results[1].walletProvider,
											"tokens":res.data.result["2"],
											"tsin":event.TSIN, // 91
											"transactionId": event.body.transactionId,
											"contractAddress":event.contractAddress, 
											"suspended": true
										};

										if(results[1].tradingVenue){ //TransferOUT
											body.transferType = "TransferOut";
										}
									}

									var message = {
										MessageBody: JSON.stringify(body), /* required */
										QueueUrl: process.env.TRANSFER_QUEUE, /* required */
										DelaySeconds: '0', /* required */
										MessageAttributes: { /* required */
											"Title": {
											  DataType: "String",
											  StringValue: eventType
											}
										},
										MessageGroupId: eventType , /* required for FIFO queue */
										MessageDeduplicationId: event.body.transactionId + event.TSIN + "Submission"/*required for FIFO queue  */
									};
									//send message to the queue
									sqs.sendMessage(message, function(err, data) {
										if (err) {
											callback("Error sending message to queue: " + err, null);
											//failure
										}
										else {
											callback(null, "Successfully handled Submission event");
											//success
										}
									});
									//connection.end();
								}
							}
						);
					})
					.catch((error) => {
						callback(error, null);
					})
					break;
				case('Confirmation'):
				// Transfer accepted event
				//{
				//  "TSIN": 'T3351N99',
				// 	"eventType":"Confirmation",
				// 	"body": {
				//		"transactionId": '16'
				// 	}
				// }
					
					axios.get(process.env.ETH_SERVICE + `/${event.contractAddress}/transaction/${event.body.transactionId}`, {},{httpsAgent:agent})
					.then((res) => {
						//Get list of investors from address
						var toQuery = "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '" + res.data.result['1'] + "'";
						var fromQuery = "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '" + res.data.result['0'] + "'";
						//Obtain and map addresses to investor then make request to ETH service
						new async.parallel([
							function(callback){
								connection.query(fromQuery, function (error, fromResults) {
									if (error) {
										callback(error['sqlMessage'] + ", unable to complete request to mysql", null);
									} else {
										callback(null, fromResults[0]);
									}
								})
							},
							function(callback){
								connection.query(toQuery, function (error, toResults) {
									if (error) {
										callback(error['sqlMessage'] + ", unable to complete request to mysql", null);
									} else {
										callback(null, toResults[0]);
									}
								})
							}
							],
							function(err, results) {
								if(err){
									callback(err, null);
									connection.destroy();
								} else {
									connection.destroy();
									var body = {
										"tsin":event.TSIN,
										"stocks":[
											{"uniqueInvestorID": event.sender, "addressID":results[0].addressID, "walletProvider":results[0].walletProvider, "tsin":event.TSIN, "tokens":res.data.result["4"]},
											{"uniqueInvestorID": event.receiver, "addressID":results[1].addressID, "walletProvider":results[1].walletProvider, "tsin":event.TSIN, "tokens":res.data.result["5"]}
										],
										"transactionId": event.body.transactionId,
									};
									var message = {
										MessageBody: JSON.stringify(body), /* required */
										QueueUrl: process.env.TRANSFER_RECON_QUEUE, /* required */
										DelaySeconds: '0', /* required */
										MessageAttributes: { /* required */
											"Title": {
											  DataType: "String",
											  StringValue: eventType
											}
										},
										MessageGroupId: eventType , /* required for FIFO queue */
										MessageDeduplicationId: event.body.transactionId + event.TSIN /*required for FIFO queue  */
									};
									//send message to the queue
									//console.log("Sending queue message" );
									sqs.sendMessage(message, function(err, data) {
										if (err) {
											callback("Error sending message to queue: " + err, null);
											//failure
										}
										else {
											callback(null, "Successfully handled Confirmation event");
											//success
										}
									});
									//connection.end();
								}
							}
						);
					})
					.catch((error) => {
						callback(error, null);
					})
					break
				case('Rejection'):
				// Transfer rejected event
				//{
				//  "TSIN": 'T3351N99',
				// 	"eventType":"Confirmation",
				// 	"body": {
				//		"transactionId": '16'
				// 	}
				// }
					
					axios.get(process.env.ETH_SERVICE + `/${event.contractAddress}/transaction/${event.body.transactionId}`, {},{httpsAgent:agent})
					.then((res) => {
						//Get list of investors from address
						var fromQuery = "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '" + res.data.result['0'] + "'";
						var toQuery = "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '" + res.data.result['1'] + "'";
						//Obtain and map addresses to investor then make request to ETH service
						async.parallel([
							function(callback){
								connection.query(fromQuery, function (error, fromResults) {
									if (error) {
										callback(error['sqlMessage'] + ", unable to complete request to mysql", null);
									} else {
										callback(null, fromResults[0]);
									}
								})
							},
							function(callback){
								connection.query(toQuery, function (error, toResults) {
									if (error) {
										callback(error['sqlMessage'] + ", unable to complete request to mysql", null);
									} else {
										callback(null, toResults[0]);
									}
								})
							}
							],
							function(err, results) {
								if(err){
									callback(err, null);
									connection.destroy();
								} else {
									connection.destroy();
									var body = {
										"tsin":event.TSIN,
										"stocks":[
											{"addressID":results[0].addressID,"walletProvider":results[0].walletProvider,"tsin":event.TSIN,"tokens":res.data.result["4"]},
											{"addressID":results[1].addressID,"walletProvider":results[1].walletProvider,"tsin":event.TSIN,"tokens":res.data.result["5"]}
										],
										"transactionId": event.body.transactionId,
									};
									var message = {
										MessageBody: JSON.stringify(body), /* required */
										QueueUrl: process.env.TRANSFER_RECON_QUEUE, /* required */
										DelaySeconds: '0', /* required */
										MessageAttributes: { /* required */
											"Title": {
											  DataType: "String",
											  StringValue: eventType
											}
										},
										MessageGroupId: eventType , /* required for FIFO queue */
										MessageDeduplicationId: event.body.transactionId + event.TSIN /*required for FIFO queue  */
									};
									//send message to the queue
									sqs.sendMessage(message, function(err, data) {
										if (err) {
											callback("Error sending message to queue: " + err, null);
											//failure
										}
										else {
											callback(null, "Successfully handled Rejection event");
											//success
										}
									});
									//connection.end();
								}
							}
						);
					})
					.catch((error) => {
						callback(error, null);
					})
					break;
				case("Burned"):
					//Token remint event
					var tsin = event['TSIN'];

					var params= {
	                    FunctionName:`SecuritiesMint${process.env.ALIAS}`, 
	                    InvocationType:'RequestResponse',
	                    LogType:'Tail',
	                    Payload: JSON.stringify({"tsin":tsin})
        			}; 
		            // calling SecuritiestMint service
		            lambda.invoke(params, function(err, data) {
						if(err){
							//AWS failure
							callback("AWS Error: " + err);
						} else if (JSON.parse(new String(data.Payload).slice(1, -1).replace(/\\/g, '')).errorMessage){
							//function invoke returned error data
							var res = JSON.parse(new String(data.Payload).slice(1, -1).replace(/\\/g, ''));
							var randomErrorKey = (Math.floor(JSON.stringify(res.errorMessage).length + 1000 * Math.random())).toString();
		            		var message = {
								MessageBody: JSON.stringify(res.errorMessage), /* required */
								QueueUrl: process.env.ERROR_QUEUE, /* required */
								DelaySeconds: '0', /* required */
								MessageAttributes: { /* required */
									"Title": {
									  DataType: "String",
									  StringValue: eventType
									}
								},
								MessageGroupId: eventType , /* required for FIFO queue */
								MessageDeduplicationId: randomErrorKey /*required for FIFO queue  */
							};
							//send message to the queue
							sqs.sendMessage(message, function(err, data) {
								if (err) {
									callback("Error sending message to queue: " + err, null);
									//failure
								} else {
									callback(null, "SecuritiesMint Service Failed: " + res.errorMessage);
									//success
								}
							});
		            	} else {
		            		callback(null, "Successfully handled Burned event");
		            	}
		            })
				default:
					break;	
			}
		}	
	};
};