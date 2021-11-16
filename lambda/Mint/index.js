'use strict';

const mysql = require('mysql');
const AWS = require('aws-sdk');
const TokenMint = require('./src/TokenMint');
const axios = require('axios');

module.exports.handler = (event, context, callback) => { 
    
    var sqs = new AWS.SQS();
	var connection = new mysql.createConnection({ 
        host     : process.env.DB_HOST,  
        user     : process.env.DB_USER,  
        password : process.env.DB_PASSWORD,  
        port     : 3306,  
        database: process.env.DB_NAME, 
        debug    :  false 
    }); 

    TokenMint().tokenMint(event, callback, connection, sqs, axios);
}; 