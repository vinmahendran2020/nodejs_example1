'use strict';

const Remint = require('./src/Remint');
const AWS = require('aws-sdk');

module.exports.handler = (event, context, callback) => {
    var lambda = new AWS.Lambda();

    Remint().remint(event, callback, lambda);
};
