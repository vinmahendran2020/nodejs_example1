'use strict';
const axios =  require('axios');
const ApproveReject = require('./src/ApproveReject');

module.exports.handler = (event,context,callback) => {

    ApproveReject().approveReject(event, callback, axios);
};
