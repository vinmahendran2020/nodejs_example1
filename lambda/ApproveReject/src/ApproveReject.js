'use strict';
const https = require('https');

module.exports = function(){
	return {
		
		approveReject: function(event, callback, axios){
			//Extract contents from queue
			var message = JSON.parse(event.Records[0].body);
			var path = ""
			if (message.approved == "true"){
			    path = `/${message.contractAddress}/transaction/${message.transactionId}/confirm`
			}else{
			    path = `/${message.contractAddress}/transaction/${message.transactionId}/reject`
			}
			
            const agent = new https.Agent({  
                rejectUnauthorized: false
            });
            axios.post(process.env.ETH_SERVICE + path, {},{httpsAgent:agent})
            .then((res) => {
                console.log(res)
                callback(null, "Submitted Successfully");
            })
            .catch((error) =>{
                callback(null, error);
            })
		}	
	};
};