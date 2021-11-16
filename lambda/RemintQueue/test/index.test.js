const expect = require( 'chai' ).expect;
var AWS = require('aws-sdk');
var index = require('../index');
var assert = require('assert');
var axios = require('axios');

var obj =  { 
    "Records": [ 
        { 
        "body": "{\"tsin\":\"T12345678\", \"oldAddress\":\"0x001\", \"newAddress\":\"0x001\", \"tokens\":2 }" 
        } 
    ] 
};

var objf =  { 
    "Records": [ 
        { 
        "body": "{\"tsin\":\"T12345670\", \"oldAddress\":\"0x002\", \"newAddress\":\"0x002\", \"tokens\":2 }" 
        } 
    ] 
};

var objf2 =  { 
    "Records": [ 
        { 
        "body": "{\"tsin\":\"T12345600\", \"oldAddress\":\"0x003\", \"newAddress\":\"0x003\", \"tokens\":2 }" 
        } 
    ] 
};

var objf3 =  { 
    "Records": [ 
        { 
        "body": "{\"tsin\":\"T12345000\", \"oldAddress\":\"0x004\", \"newAddress\":\"0x004\", \"tokens\":2 }" 
        } 
    ] 
};

var objf4 =  { 
    "Records": [ 
        { 
        "body": "{\"tsin\":\"T12340000\", \"oldAddress\":\"0x005\", \"newAddress\":\"0x005\", \"tokens\":2 }" 
        } 
    ] 
};

describe('EtherRemintQueue', () => {
	beforeEach(function () {

		this.callback = (err, data) => {
			if(err){
				this.assertErr = err;
			} else {
				this.assertData = data;
			}
		}

		AWS.config.update = function(data){
			console.log(data)
		}

		AWS.Lambda = class {
			constructor (data){
				console.log(data)
			}
			invoke (params, callback){
				var res = JSON.parse(new String (params.Payload));
				if(res.query == "SELECT contractAddress FROM contractAddressMapping where tsin='T12345670'"){
					callback("Function failed", null);
				} else if(res.query == "SELECT contractAddress FROM contractAddressMapping where tsin='T12345600'"){
					callback(null, {"Payload": "{\"errorMessage\": \"Error\"}"});
				} else {
					callback(null, {"Payload": JSON.stringify([{'contractAddress': "0x001"}])});
				}

			}
		}
		axios.post = (url, body) => {
			if(body.oldAddress == "0x004") { 
				return new Promise(function(resolve, reject) { 
					reject('Fail');
				});  
			} else if(body.oldAddress == "0x005"){
				return new Promise(function(resolve, reject) { 
					resolve({'txHash': false});
				}); 
			} else {
				return new Promise(function(resolve, reject) { 
					resolve({'txHash': true});
				});
			}
		}

	});

	it('should pass', function () {
        index.handler(obj, this.callback, function(err, data){
			assert(data.txHash);
		});
	});
	it('should AWS fail invoke', function () {
        index.handler(objf, this.callback, function(err, data){
			assert(err == "AWS Error: Function failed");
		});
	});
	it('should error data fail invoke', function () {
        index.handler(objf2, this.callback, function(err, data){
			assert(err == "EthereumDBQueries call failed: Error");
		});
	});
	it('should fail axios', function () {
        index.handler(objf3, this.callback, function(err, data){
			assert(err == "Fail");
		});
	});
	it('should pass axois, return false', function () {
        index.handler(objf4, this.callback, function(err, data){
			assert(!data.txHash);
		});
    });
});
 
