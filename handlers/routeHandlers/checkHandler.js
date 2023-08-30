// dependencies
const data = require('../../lib/data');
const { hash } = require('../../helpers/utilities');
const { parseJSON } = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler')

// module scaffolding
const handler = {};

handler.checkHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._check[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._check = {};

handler._check.post = (requestProperties, callback) => {
    let protocol = typeof requestProperties.body.protocol === 'string' && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;

    let url = typeof requestProperties.body.url === 'string' && requestProperties.body.url.trim() > 0 ? requestProperties.body.url : false;

    let method = typeof requestProperties.body.method === 'string' && ['get', 'post', 'put', 'delete'].indexOf(requestProperties.body.method) > -1 ? requestProperties.body.method : false;

    let successCode = typeof requestProperties.body.successCode === 'object' && requestProperties.body.successCode instanceof Array ? requestProperties.body.successCode : false;

    let timeOutSeconds = typeof requestProperties.body.timeOutSeconds === 'number' && requestProperties.body.timeOutSeconds % 1 === 0 && requestProperties.body.timeOutSeconds >= 1 && requestProperties.body.timeOutSeconds <= 5 ? requestProperties.body.timeOutSeconds : false;

    if (protocol && url && method && successCode && timeOutSeconds) {

    } else {
        callback(400, {
            error: 'There was a problem in your request!',
        });
    }
};

handler._check.get = (requestProperties, callback) => {

};

handler._check.put = (requestProperties, callback) => {

};

handler._check.delete = (requestProperties, callback) => {

};

module.exports = handler;