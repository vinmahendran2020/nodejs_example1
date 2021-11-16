'use strict';
const https = require('https');

module.exports = function(){
	return {
		
		tokenMint: function(event, callback, connection, sqs, axios){
			//Extract contents from queue
			var message = JSON.parse(event.Records[0].body);
			//Get list of investors 
			var investorList = message.stocks.map(stock => "'" + stock.addressID + "'");
			var sqlQuery = "SELECT address, walletProvider FROM ethereumAddresses WHERE addressID in (" + investorList.join() + ")";
			//Obtain and map addresses to investor then make request to ETH service
			connection.query(sqlQuery, function (error, results) {
					if (error) {
						connection.destroy();
						callback(error['sqlMessage'] + ", unable to complete request to mysql", null);
					} else {
						connection.destroy();
						//Merge query results with stockrecords
						var records = merge(message.stocks,results);
						var request = {
							"tsin" : message.tsin,
							"records" : records
						};
						
						//Make request to mint tokens aka deploy new smart contract
						const agent = new https.Agent({  
							rejectUnauthorized: false
						});
						axios.post(process.env.ETH_SERVICE + '/mintSecurity', request,{httpsAgent:agent})
						.then((res) => {
							callback(null, res.data); 
						})
						.catch((error) => {
							var queueMessage = {
								MessageBody: JSON.stringify(error.response.data), /* required */
								QueueUrl: process.env.ERROR_QUEUE_URL, /* required */
								DelaySeconds: '0', /* required */
								MessageAttributes: { /* required */
									"Title": {
									  DataType: "String",
									  StringValue: "Error"
									}
								},
								MessageGroupId: 'Error', /*required for FIFO queue */
								MessageDeduplicationId: message.tsin + "Minting" /*required for FIFO queue */
							};
							
							//send message to the queue
							sqs.sendMessage(queueMessage, function(err, data) {
								if (err) {
									callback(null,"Error sending message to queue: " + err);
								}
								else {
									callback(null, "Error message has been sent to queue");
								}
							});
						});
						
					}
			});
			//connection.end();

			//function used to merge two arrays on the uniqueInvestorID of each object
			function merge(arr1,arr2){
				for(var i=0; i<arr2.length; i++){
					for(var j=0; j<arr1.length; j++){
						if(arr2[i].walletProvider === arr1[j].walletProvider){
							Object.assign(arr1[j],arr2[i]);    // to union two objects
						}
					}
				}
				return arr1;
			}
		}	
	};
	
};