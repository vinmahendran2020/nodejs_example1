'use strict';

const mysql = require('mysql');
const Explorer = require('./src/Explorer');
const AWS = require('aws-sdk');

exports.handler = function (event, context, callback)  {
    
    const sqs = new AWS.SQS();
    const lambda = new AWS.Lambda({region:'us-east-1'});
    var connection = new mysql.createConnection({ 
        host     : process.env.DB_HOST,  
        user     : process.env.DB_USER,  
        password : process.env.DB_PASSWORD,  
        port     : 3306,  
        database: process.env.DB_NAME, 
        debug    :  false 
    }); 
    setTimeout(function() {
        Explorer().explorer(event, callback, connection, sqs, mysql, lambda);
    }, 2000);
}; 