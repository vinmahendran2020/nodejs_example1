const expect = require( 'chai' ).expect
var axios = require('axios');
var index = require('../index');
var assert = require('assert');

var promise1 = new Promise(function(resolve, reject) {
    resolve('Success!');
});

var promise2 = new Promise(function(resolve, reject) {
    reject('fail');
});
 
var obj =  {
    "Records": [
      {
        "body": "{\"transactionId\": \"3\",\"contractAddress\": \"0x8079A1C67aaA351842Ff8BdD4aE8a05a7557DfEd\",\"approved\": \"false\", \"errorCodes\":[{\"errorCodeList\": []}]}"
      }
    ]
};

var objf =   {
    "Records": [
      {
        "body": "{\"transactionId\": \"4\",\"contractAddress\": \"0x8079A1C67aaA351842Ff8BdD4aE8a05a7557DfEd\",\"approved\": \"true\", \"errorCodes\":[{\"errorCodeList\": []}]}"
      }
    ]
};


describe('approve_reject', () => {
  beforeEach(function () {
    
    this.callback = (err, data) => {
        if(err){
          this.assertErr = err;  
        } else {
          this.assertData = data;  
        }
    }

	  axios.post = (url,body) => {
        if (body.txId == '3'){
          return promise1;
        } else {
          return promise2;
        }
    }
    
    
});

	it('should pass', function () {
		index.handler(obj, this.callback, function(err, data){
      assert(data == "Success!");
    });
	});
	it('should fail axios', function () {
		index.handler(objf, this.callback, function(err, data){
      assert(err == "fail");
    });
	});

});