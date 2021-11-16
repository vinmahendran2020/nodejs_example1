const expect = require( 'chai' ).expect;
var AWS = require('aws-sdk');
var index = require('../index');
var assert = require('assert');
var axios = require('axios');
const mysql = require('mysql');

var obj1 = {
    "TSIN":"FRESH01",
	"eventType":"Transfer",
    "body":{
		"from": "0x0000000000000000000000000000000000000000",
		"to": "0x33be5519c4018D0d4ad242110A40eBAF0C695401",
		"tokens": 100
	},
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
 };

var obj1f1 = {
    "TSIN":"FRESH02",
	"eventType":"Transfer",
    "body":{
		"from": "0x0000000000000000000000000000000000000000",
		"to": "0x33be5519c4018D0d4ad242110A40eBAF0C695403",
		"tokens": 100
	},
	"eventId":"log_66a19fef",
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
 };

 var obj1f2 = {
    "TSIN":"FRESH03",
	"eventType":"Transfer",
    "body":{
		"from": "0x0000000000000000000000000000000000000000",
		"to": "0x33be5519c4018D0d4ad242110A40eBAF0C695404",
		"tokens": 100
	},
	"eventId":"log_66a19fef",
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
 };

 var obj1f3 = {
    "TSIN":"FRESH04",
	"eventType":"Transfer",
    "body":{
		"from": "0x0000000000000000000000000000000000000000",
		"to": "0x33be5519c4018D0d4ad242110A40eBAF0C695401",
		"tokens": 100
	},
	"eventId":"log_66a19fef",
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
 };

var obj2 = {
    "TSIN": 'T3351N91',
	"eventType":"Submission",
	"body": {
			"transactionId": '1'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj2f1 = {
    "TSIN": 'T3351N92',
	"eventType":"Submission",
	"body": {
			"transactionId": '2'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj2f2 = {
    "TSIN": 'T3351N93',
	"eventType":"Submission",
	"body": {
			"transactionId": '3'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj2f3 = {
    "TSIN": 'T3351N94',
	"eventType":"Submission",
	"body": {
			"transactionId": '4'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj2f4 = {
    "TSIN": 'T3351N05',
	"eventType":"Submission",
	"body": {
			"transactionId": '15'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj3 = {
    "TSIN": 'T3351N95',
	"eventType":"Confirmation",
	"body": {
			"transactionId": '5'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj3f1 = {
    "TSIN": 'T3351N96',
	"eventType":"Confirmation",
	"body": {
			"transactionId": '6'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj3f2 = {
    "TSIN": 'T3351N97',
	"eventType":"Confirmation",
	"body": {
			"transactionId": '7'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj3f3 = {
    "TSIN": 'T3351N98',
	"eventType":"Confirmation",
	"body": {
			"transactionId": '8'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj3f4 = {
    "TSIN": 'T3351N04',
	"eventType":"Confirmation",
	"body": {
			"transactionId": '14'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj4 = {
    "TSIN": 'T3351N99',
	"eventType":"Rejection",
	"body": {
			"transactionId": '9'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj4f1 = {
    "TSIN": 'T3351N00',
	"eventType":"Rejection",
	"body": {
			"transactionId": '10'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj4f2 = {
    "TSIN": 'T3351N01',
	"eventType":"Rejection",
	"body": {
			"transactionId": '11'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj4f3 = {
    "TSIN": 'T3351N02',
	"eventType":"Rejection",
	"body": {
			"transactionId": '12'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj4f4 = {
    "TSIN": 'T3351N03',
	"eventType":"Rejection",
	"body": {
			"transactionId": '13'
	}, 
	"contractAddress":"0xa3E0678231d0b31D02a566CF702801e9721D658c"
};

var obj5 = {
    "eventType":"Burned",
	"TSIN":"T3351N12"
};

var obj5f = {
    "eventType":"Burned",
    "TSIN":"T3351N13"
};

var obj5f1 = {
    "eventType":"Burned",
    "TSIN":"T3351N14"
};

var obj5f2 = {
    "eventType":"Burned",
    "TSIN":"T3351N15"
};


describe('Explorer', function() {
  beforeEach(function () {
		this.callback = (err, data) => {
			if(err){
				this.assertErr = err;
			} else {
				this.assertData = data;
			}
		}

		AWS.config.update = function(data){
			//console.log(data);
		}

		AWS.SQS = class {
			constructor(data) {
				//console.log(data);
			}
			sendMessage(message, callback) {
				if(JSON.parse(message.MessageBody) == "Error" || message.MessageDeduplicationId == "13T3351N03" || message.MessageDeduplicationId == "14T3351N04" || message.MessageDeduplicationId == "15T3351N05Submission" || message.MessageDeduplicationId == "FRESH04Minted0x33be5519c4018D0d4ad242110A40eBAF0C695401"){
					//Fail test obj5f2, obj4f4
					callback("AWS SQS Fail", null);
				} else if (JSON.parse(message.MessageBody) == "Fail" || message.MessageDeduplicationId == "9T3351N99" || message.MessageDeduplicationId == "5T3351N95" || message.MessageDeduplicationId == "1T3351N91Submission" || message.MessageDeduplicationId == "FRESH01Minted0x33be5519c4018D0d4ad242110A40eBAF0C695401"){
					//pass test obj5, obj4
					callback(null, "Message successfully sent");
				}
				
			}
		}

		AWS.Lambda = class {
			constructor (data){
				//console.log(data);
			}
			invoke (params, callback) {
				var res = JSON.parse(new String (params.Payload));
				//fail test 18
				if(res.tsin == "T3351N14"){
					callback("Function failed", null);
				} else if(res.tsin == "T3351N13"){
					//fail test 17
					callback(null, {'Payload': JSON.stringify("{\"errorMessage\": \"Fail\"}")});
				} else if(res.tsin == "T3351N15"){
					//fail test 19
					callback(null, {'Payload': JSON.stringify("{\"errorMessage\": \"Error\"}")});
				} else {
					//pass test 16
					callback(null, { 'Payload': '"{\"Success\":\"Pass\"}"' });
				}
			}
		}
		
		axios.post = (url, body)=>{
				if(body.txId == '1' || body.txId == '5' || body.txId == '9' || body.txId == '13' || body.txId == '14') { 
                    return new Promise(function(resolve, reject) { 
						resolve({'data': {
									'result': {'0': "0xa3E0678231d0b31D02a566CF702801e9721D658c", '1': '0xa3E0678231d0b31D02a566CF702801e9721D658c', '2': 100, '4': 100, '5': 100}
								}
						});
                    });  
				} else if(body.txId == '15'){
					return new Promise(function(resolve, reject) { 
						resolve({'data': {
									'result': {'0': "0xa3E0678231d0b31D02a566CF702801e9721D658c", '1': '0xa4E0678231d0b31D02a566CF702801e9721D658c', '2': 100, '4': 100, '5': 100}
								}
						});
                    });  
				} else if(body.txId == '2' || body.txId == '6' || body.txId == '10'){
					return new Promise(function(resolve, reject) { 
						resolve({'data': {
									'result': {'0': "0x4i24huo24g4hg84hg3b49b6", '1': '0x4i24huo24g4hg84hg3b49b7', '2': 100}
								}
						});
                    });
				} else if(body.txId == '3' || body.txId == '7' || body.txId == '11'){
					return new Promise(function(resolve, reject) { 
						resolve({'data': {
									'result': {'0': "0x4i24huo24g4hg84hg3b49b8", '1': '0x4i24huo24g4hg84hg3b49b9', '2': 100}
								}
						});
                    });
				} else if (body.txId == '4' || body.txId == '8' || body.txId == '12'){ 
					//fail test 7, 11, 15
                    return new Promise(function(resolve, reject) { 
						reject('fail');
                    });  
                }
			}
		

		mysql.createConnection = class { 
			constructor (data){
				//console.log(data);
			}
			query (obj, callback) {
				if (obj == "INSERT INTO contractAddressMapping (tsin, contractAddress) Values ('FRESH02','0xa3E0678231d0b31D02a566CF702801e9721D658c')" || obj == "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '0x33be5519c4018D0d4ad242110A40eBAF0C695404'"){ 
					//fail test 2 and 3
					callback({'sqlMessage':"ERROR"}, null);
				} else if(obj == "INSERT INTO contractAddressMapping (tsin, contractAddress) Values ('FRESH01','0xa3E0678231d0b31D02a566CF702801e9721D658c')" || obj == "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '0x33be5519c4018D0d4ad242110A40eBAF0C695401'" || obj == "INSERT INTO contractAddressMapping (tsin, contractAddress) Values ('FRESH04','0xa3E0678231d0b31D02a566CF702801e9721D658c')" || obj == "INSERT INTO contractAddressMapping (tsin, contractAddress) Values ('FRESH03','0xa3E0678231d0b31D02a566CF702801e9721D658c')"){
					//pass test 1, obj1f3
					callback(null, [{"address":"0x33be5519c4018D0d4ad242110A40eBAF0C695403", "addressID": "I0000001"}, {"address":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", "addressID": "I0000002"}])
				} else if(obj == "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '0x4i24huo24g4hg84hg3b49b8'" || obj == "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '0x4i24huo24g4hg84hg3b49b7'") { 
					//fail test 9, 10, 13, 14
					callback({'sqlMessage':"ERROR"}, null);
				} else if(obj == "SELECT addressID, walletProvider FROM ethereumAddresses WHERE address = '0xa3E0678231d0b31D02a566CF702801e9721D658c'"){
					//pass test 8, 12
					callback(null, [{"addressID": "I0000001"}]);
				} else if(obj == "SELECT * FROM ethereumAddresses WHERE address = '0xa3E0678231d0b31D02a566CF702801e9721D658c'"){
					//pass test 4
					callback(null, [{"addressID": "I0000001", "tradingVenue": true}]);
				} else if(obj == "SELECT * FROM ethereumAddresses WHERE address = '0xa4E0678231d0b31D02a566CF702801e9721D658c'"){
					//zero results test obj2f4
					callback(null, []);
				} else if(obj == "SELECT * FROM ethereumAddresses WHERE address = '0x4i24huo24g4hg84hg3b49b8'" || obj == "SELECT * FROM ethereumAddresses WHERE address = '0x4i24huo24g4hg84hg3b49b7'"){
					//fail test 5, 6
					callback({'sqlMessage':"ERROR"}, null);
				}
			}
			destroy (){ } 
			end () { } 
		} 
	
	}); 

	it('should pass Transfer', function () {
        index.handler(obj1, this.callback, function(err, data){
			assert(data == "Successfully handled Token Mint event");
		});
    });
	it('should fail Transfer 1st query', function () {
        index.handler(obj1f1, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
    });
	it('should fail Transfer second query', function () {
        index.handler(obj1f2, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
	});
	it('should fail Transfer sqs', function () {
        index.handler(obj1f3, this.callback, function(err, data){
			assert(err == "Error sending message to queue: AWS SQS Fail");
		});
	});
	it('should pass Submission', function () {
        index.handler(obj2, this.callback, function(err, data){
			assert(data == "Successfully handled Submission event");
		});
    });
	it('should pass Submission axios, fail 1st mysql', function () {
        index.handler(obj2f1, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
    });
	it('should pass Submission axios, fail 2nd mysql', function () {
        index.handler(obj2f2, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
    });
	it('should fail Submission axios Submission', function () {
        index.handler(obj2f3, this.callback, function(err, data){
			assert(err == "fail");
		});
	});
	it('should pass Submission, fail sqs', function(){
		index.handler(obj2f4, this.callback, function(err, data){
			assert(err == "Error sending message to queue: AWS SQS Fail")
		});
	});
	it('should pass Confirmation', function () {
        index.handler(obj3, this.callback, function(err, data){
			assert(data == "Successfully handled Confirmation event");
		});
    });
	it('should pass Confirmation axios, fail first mysql', function () {
        index.handler(obj3f1, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
    });
	it('should pass Confirmation axios, fail second mysql', function () {
        index.handler(obj3f2, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
	});
	it('should fail axios Confirmation', function () {
        index.handler(obj3f3, this.callback, function(err, data){
			assert(err == "fail");
		});
	});
	it('should fail Confirmation sqs', function(){
		index.handler(obj3f4, this.callback, function(err, data){
			assert(err == "Error sending message to queue: AWS SQS Fail");
		});
	});
	it('should pass Rejection', function () {
        index.handler(obj4, this.callback, function(err, data){
			assert(data == "Successfully handled Rejection event");
		});
    });
	it('should pass axios, fail first mysql', function () {
        index.handler(obj4f1, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
    });
	it('should pass axios, fail second mysql', function () {
        index.handler(obj4f2, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
		
    });
	it('should fail axios Rejection', function () {
        index.handler(obj4f3, this.callback, function(err, data){
			assert(err == "fail");
		});
	});
	it('should fail rejection at sqs', function(){
		index.handler(obj4f4, this.callback, function(err, data){
			assert(err == "Error sending message to queue: AWS SQS Fail");
		})
	})
	it('should pass burned', function () {
        index.handler(obj5, this.callback, function(err, data){
			assert(data == "Successfully handled Burned event");
		});
    });
	it('should fail burned', function () {
        index.handler(obj5f, this.callback, function(err, data){
			assert(data == "SecuritiesMint Service Failed: Fail");
		});
    });
	it('should fail burned invoke aws error', function () {
        index.handler(obj5f1, this.callback, function(err, data){
			assert(err == "AWS Error: Function failed");
		});
	});
	it('should fail burned at sqs', function(){
		index.handler(obj5f2, this.callback, function(err, data){
			assert(err == "Error sending message to queue: AWS SQS Fail");
		});
	});
})
