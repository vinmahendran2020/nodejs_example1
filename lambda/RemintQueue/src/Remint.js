'use strict';
const https = require('https');
const axios =  require('axios');

module.exports = function (){
    return {
        remint: function(event, callback, lambda) {
            var message = JSON.parse(event.Records[0].body);
            var requestBody = {
                "oldAddress": message.oldAddress,
                "newAddress": message.newAddress, 
                "amount": message.tokens
            };

            var query = "SELECT contractAddress FROM contractAddressMapping where tsin='" + message.tsin + "'";
            var params = {
                FunctionName: `EthereumDBQueries${process.env.ALIAS}`, 
                InvocationType: 'RequestResponse',
                LogType: 'Tail',
                Payload: JSON.stringify({"query": query})
            };
            
            lambda.invoke(params, function(err, data) {
                if(err){
                    //AWS failure
                    callback("AWS Error: " + err);
                } else if (JSON.parse(data.Payload).errorMessage) {
                    //Function invoke returned error data
                    var res = JSON.parse(data.Payload);
                    callback("EthereumDBQueries call failed: " + res.errorMessage, null);
                } else {
                    var res = JSON.parse(data.Payload);
                    requestBody['contractAddress'] = res[0].contractAddress;
                    var path = process.env.INDIVIDUAL_REMINT_PATH;
                    const agent = new https.Agent({  
                        rejectUnauthorized: false
                    });
                    axios.post(process.env.ETH_SERVICE + path, requestBody, {httpsAgent:agent})
                    .then((res) => {
                        callback(null, res.data);
                    })
                    .catch((error) =>{
                        callback(error.response.data, null);
                    })
                }
            });
        }
    };
};
