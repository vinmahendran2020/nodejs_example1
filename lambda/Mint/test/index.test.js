const expect = require( 'chai' ).expect
var AWS = require('aws-sdk');
var lambda = new AWS.Lambda();  
var sqs = new AWS.SQS();
var index = require('../index');
var assert = require('assert');
var axios = require('axios');
const mysql = require('mysql');

var obj = {
	"Records": [
		{
		"body": "{\"tsin\":\"T12345678\", \"stocks\": [{\"walletProvider\":\"10000001\", \"addressID\":\"10000001\", \"tsin\":\"T12345678\", \"tokens\":1000, \"status\":\"pending\"},{\"walletProvider\":\"10000001\", \"addressID\":\"10000001\", \"tsin\":\"T12345678\",\"tokens\":1000,\"status\":\"pending\"}] }"
		}
	]
};

var objf = {
	"Records": [
		{
		"body": "{\"tsin\":\"T12345678\", \"stocks\": [{\"walletProvider\":\"10000002\", \"addressID\":\"10000002\", \"tsin\":\"T12345678\", \"tokens\":1000, \"status\":\"pending\"}] }"
		}
	]
};

var objf2 = {
	"Records": [
		{
		"body": "{\"tsin\":\"T22345678\", \"stocks\": [{\"walletProvider\":\"10000001\", \"addressID\":\"10000001\", \"tsin\":\"T22345678\", \"tokens\":1000, \"status\":\"pending\"}] }"
		}
	]
};

var objf3 = {
	"Records": [
		{
		"body": "{\"tsin\":\"T23345678\", \"stocks\": [{\"walletProvider\":\"10000001\", \"addressID\":\"10000001\", \"tsin\":\"T23345678\", \"tokens\":1000, \"status\":\"pending\"}] }"
		}
	]
};

describe('TokenMint', () => {
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

		AWS.SQS = class {
			constructor(data) {
				console.log(data)
			}
			sendMessage(message, callback) {
				if (message.MessageDeduplicationId == "T23345678Minting"){
					callback("AWS SQS Fail", null);
				} else {
					callback(null, "Message successfully sent");
				}
			}
		} 
		axios.post = (url, body) =>{
				if(body.tsin == 'T12345678') { 
                    return new Promise(function(resolve, reject) { 
						resolve("Tokens Minted");
                    });  
                } else { 
                    return new Promise(function(resolve, reject) { 
						reject({'response': {"data": "fail"}});
                    });  
                }
			}
		

		mysql.createConnection = class { 
			constructor (data){
				console.log(data)
			}
			query (obj, callback) {
				if (obj.toString() == "SELECT address, walletProvider FROM ethereumAddresses WHERE addressID in ('10000002')"){ 
					callback({'sqlMessage': 'ERROR'}, null);
				} else { 
					callback(null, [{"walletProvider":"10000001"}]); 
				}
			}
			destroy (){ console.log('destroyed');} 
			end () { console.log('ended');} 
		} 
 
	});

	it('should pass', function () {
        index.handler(obj, this.callback, function(err, data){
			assert(data == "Tokens Minted");
		});
    });
	it('should fail mysql query', function () {
        index.handler(objf, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
    });
	it('should fail axios', function () {
        index.handler(objf2, this.callback, function(err, data){
			assert(err == "Failed Token Mint, Error message has been sent to queue");
		});
	});
	it('should fail sqs', function () {
        index.handler(objf3, this.callback, function(err, data){
			assert(err == "Error sending message to queue: AWS SQS Fail");
		});
    });

});
 
