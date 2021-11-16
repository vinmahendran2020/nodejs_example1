'use strict';

const mysql = require('mysql');
const TokenReMint = require('./src/TokenReMint');
const AWS = require('aws-sdk');

module.exports.handler = (event, context, callback) => {
	
    const sqs = new AWS.SQS();

	var connection = new mysql.createConnection({ 
        host     : process.env.DB_HOST,  
        user     : process.env.DB_USER,  
        password : process.env.DB_PASSWORD,  
        port     : 3306,  
        database: process.env.DB_NAME, 
        debug    :  false 
    }); 
  
    TokenReMint().tokenReMint(event, callback, connection, sqs);
}; 