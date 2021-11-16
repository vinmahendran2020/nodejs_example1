const util = require('util')
const AWS = require('aws-sdk');
const sqs = new AWS.SQS({ region:'us-east-1'});
const ethErrors = 'https://sqs.us-east-1.amazonaws.com/517553746427/EthereumErrors.fifo'

// require("util").inspect.defaultOptions.depth = 3;
/* istanbul ignore next */
const level = process.env.LOG || 'debug'
const RESET = '\x1b[0m'
const COLOR = {
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
}


function getLogger(loggerName) {

    function printLog(fgColor, name, condition, ...log) {
        /* istanbul ignore next */ // One the the branches is never taken
        if (condition) return
        const timestamp = getTimestamp()
        process.stdout.write(`${fgColor}[${timestamp}] [${name}] @ ${loggerName} - ${RESET}`);

        log.forEach((elem) => {
            if (typeof elem === 'object') {
                console.log(util.inspect(elem, false, 3 /* depth */, true /* enable colors */))
            } else {
                process.stdout.write(`${elem} `);
            }
        })
        process.stdout.write(RESET + '\n');
    }

    return {
        Info: function (...log) { printLog(COLOR.green, 'INFO', level === 'error' || level === 'fatal', ...log) },

        Debug: function (...log) { printLog(COLOR.cyan, 'DEBUG', level === 'info' || level === 'error' || level === 'fatal', ...log) },

        Trace: function (...log) { printLog(COLOR.blue, 'TRACE', level === 'info' || level === 'debug' || level === 'error' || level === 'fatal', ...log) },

        TraceHeadder: function (method, params, file) {
            if (level === 'info' || level === 'debug' || level === 'error' || level === 'fatal') return

            const timestamp = getTimestamp()
            process.stdout.write(`${COLOR.blue}[${timestamp}] [TRACE] @ ${loggerName} - ${RESET}`);

            if (file !== undefined) {
                console.log(`[[ENTERING ${method} ${file} WITH PARAMS`, params, ']]');
            } else {
                console.log(`[[ENTERING ${method} WITH PARAMS`, params, ']]');
            }
            process.stdout.write(RESET + '\n');

        },

        BLKError: function (receipt, error) {
            /* istanbul ignore next */ // One the the branches is never taken
            if (level === 'fatal') return
            const timestamp = getTimestamp()
            process.stdout.write(`${COLOR.Red}[${timestamp}] [BLKError] @ ${loggerName} - ${RESET}`);

            console.log(`[[Error with transaction ${receipt.transactionHash} reason ... Sending to queue ]]`);
            
            process.stdout.write(RESET + '\n');

            var message = {
                MessageBody: JSON.stringify(receipt.transactionHash), 
                QueueUrl: ethErrors, 
                DelaySeconds: '0', 
                MessageAttributes: { 
                    "Title": {
                      DataType: "String",
                      StringValue: "EthereumError"
                      }
                 },
                 MessageGroupId: "EthereumError" ,
                 MessageDeduplicationId: receipt.transactionHash
             };
             //send message to the queue
             sqs.sendMessage(message, function(err, data) {
                if (err) {
                    process.stdout.write(`${COLOR.red}[${timestamp}] [QueueError] @ ${loggerName} - ${RESET}`);

                    console.log(`[[Error sending ${message.MessageDeduplicationId} message to queue: ${err.message}]]`);
                    
                    process.stdout.write(RESET + '\n');
                }
                 else {
                    process.stdout.write(`${COLOR.blue}[${timestamp}] [QueueSuccess] @ ${loggerName} - ${RESET}`);
                    console.log(data);
                    process.stdout.write(RESET + '\n');
                }
             });
        },

        Warn: function (...log) { printLog(COLOR.yellow, 'WARNING', level === 'error' || level === 'fatal', ...log) },

        Err: function (...log) { printLog(COLOR.red, 'ERROR', level === 'fatal', ...log) },
        Fatal:
            /* istanbul ignore next */ // The same as error but exiting: if executed the test would stop
            function (...log) {
                /* istanbul ignore next */ // The same as error but exiting: if executed the test would stop
                printLog(COLOR.red, 'FATAL', false, ...log)
            },
    }
}

function getTimestamp() {
    return new Date()
        .toISOString()
        .replace(/T/, ' ')
        .replace(/\..+/, '')
}

module.exports = {
    getLogger
}