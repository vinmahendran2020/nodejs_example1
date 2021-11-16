// const chai = require('chai')
// const sleep = require('sleep')
// const logger = require('../lib/log').getLogger('tests/errorManagementTests')
// const AWS = require('aws-sdk');
// const expect = require('chai').expect


// describe('Error treatment tests', async function () {

//     before(async function () {
//         AWS.SQS = class {
//             constructor(data) {
//                 console.log(data);
//             }
//             sendMessage(message, callback) {
//                 if(!message.substring('forceError')){
//                     callback(null, "Message successfully sent");
//                     return 'got success'
//                 }else{
//                     callback("Mocked Error", "Message successfully sent");
//                     return 'got error'
//                 }
//             }
//          }
//     })

//     describe('Sending blockchain errors to queue', function () {
       
//         it('should print the error and send it to the queue', function (done) {
//             let testSuccess = false
//             AWS.SQS = class {
//                 constructor(data) {
//                     console.log(data);
//                 }
//                 sendMessage(message, callback) {
//                     testSuccess = true
//                     if(!message.substring('forceError')){
//                         callback(null, "Message successfully sent");
//                         testSuccess = true
//                     }else{
//                         callback("Mocked Error", "Message successfully sent");
//                     }
//                 }
//              }
//             logger.BLKError({transactionHash:'notError'})
//             sleep.msleep(1000)
//             expect(testSuccess).to.be.equals(true)

//         })
//         it('should log and not crash when SQS returns an error', function (done) {
//             let result = logger.BLKError({transactionHash:'forceError'})
//             expect(result).to.be.equals('got error')

//         })
//     })
// })