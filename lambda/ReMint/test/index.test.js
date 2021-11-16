const expect = require( 'chai' ).expect;
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
		"body": "{\"tsin\":\"pass\", \"stocks\": [{\"uniqueInvestorID\":\"10000001\",\"tsin\":\"T12345678\",\"tokens\":1000,\"status\":\"pending\"},{\"uniqueInvestorID\":\"10000001\",\"tsin\":\"T12345678\",\"tokens\":1000,\"status\":\"pending\"}] }"
		}
	]
};

var objf = {
	"Records": [
		{
		"body": "{\"tsin\":\"fail\", \"stocks\": [{\"uniqueInvestorID\":\"10000002\",\"tsin\":\"T12345678\",\"tokens\":1000,\"status\":\"pending\"}] }"
		}
	]
};

var objf2 = {
	"Records": [
		{
		"body": "{\"tsin\":\"fail2\", \"stocks\": [{\"uniqueInvestorID\":\"10000001\",\"tsin\":\"T22345678\",\"tokens\":1000,\"status\":\"pending\"}] }"
		}
	]
};

describe('TokenReMint', () => {
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

		axios.post = (url, body) => {
				if(body.contractAddress == 'passme') {
					return new Promise(function(resolve, reject) {
						resolve('Token Destroyed Successfully');
					}); 
				 }else {
					return new Promise(function(resolve, reject) {
						reject('error');
					}); 
				}
		}

		mysql.createConnection = class { 
			constructor (data){
				console.log(data)
			}
			query (obj, callback) {
				if (obj == "SELECT contractAddress FROM contractAddressMapping WHERE tsin = 'fail'"){ 
					callback({'sqlMessage':"ERROR"}, null);
				}else if (obj == "SELECT contractAddress FROM contractAddressMapping WHERE tsin = 'fail2'"){ 
					callback(null, [{"contractAddress":"failme"}]) 
				}else {
					callback(null, [{"contractAddress":"passme"}]) 
				}
			}
			destroy (){ console.log('destroyed');} 
			end () { console.log('ended');} 
		} 

	});

	it('should pass', function () {
        index.handler(obj, this.callback, function(err, data){
			assert(data == "Token Destroyed Successfully");
		});
    });
	it('should fail mysql query', function () {
        index.handler(objf, this.callback, function(err, data){
			assert(err == "ERROR, unable to complete request to mysql");
		});
    });
	it('should fail axios', function () {
        index.handler(objf2, this.callback, function(err, data){
			assert(err == "Unable to destory token");
		});
    });
});
 
