'use strict';
const https = require('https');
var axios = require('axios');

module.exports = function(){
	return {
		tokenReMint: function(event, callback, connection, sqs){
			//Extract contents from queue
			var message = JSON.parse(event.Records[0].body);
			var sqlQuery = "SELECT contractAddress FROM contractAddressMapping WHERE tsin = '" + message['tsin'] + "'";
			connection.query(sqlQuery, function (error, results) {
				if (error) {
					callback(error['sqlMessage'] + ", unable to complete request to mysql", error);
					connection.destroy();
				} else {
					connection.destroy();
					const agent = new https.Agent({  
					  rejectUnauthorized: false
					});
					axios.post(process.env.ETH_SERVICE + `/${results[0].contractAddress}/destroy`, {},{ httpsAgent: agent })
					.then((res) => {
						callback(null, "Token Destroyed Successfully");
						//connection.end();
					})
					.catch((error) => {
						callback("Unable to destory token: " + error, null);
						//connection.destroy();
					});
				}
			})
		}	
	};
	
};