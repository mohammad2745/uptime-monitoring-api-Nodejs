// dependencies
const data = require('../../lib/data');
const { hash } = require('../../helpers/utilities');
const { createRandomString } = require('../../helpers/utilities');
const { parseJSON } = require('../../helpers/utilities');
const { token } = require('../../routes');

// module scaffolding
const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._token[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._token = {};

handler._token.post = (requestProperties, callback) => {
    const phone = typeof(requestProperties.body.phone) === 'string' && requestProperties.body.phone.trim().length === 11 ? requestProperties.body.phone : false;

    const password = typeof(requestProperties.body.password) === 'string' && requestProperties.body.password.trim().length > 0 ? requestProperties.body.password : false;

    if (phone && password) {
        data.read('users', phone, (err, userData) => {
            let hashPassword = hash(password);
            if (hashPassword === parseJSON(userData).password) {
                let tokenId = createRandomString(20);
                let expires = Date.now() + (60 * 60 * 1000);
                let tokenObject = {
                    'phone': phone,
                    'id': tokenId,
                    'expires': expires
                };

                data.create('tokens', tokenId, tokenObject, (err) => {
                    if (!err) {
                        callback(200, tokenObject);
                    } else {
                        callback(500, {
                            error: 'Server Side Error'
                        });
                    }
                })
            } else {
                callback(400, {
                    error: 'Invalid password'
                });
            }
        });
    } else {
        callback(400, {
            error: 'You have a problem in your request.'
        });
    }
};

handler._token.get = (requestProperties, callback) => {
    const id = typeof(requestProperties.queryStringObject.id) === 'string' && requestProperties.queryStringObject.id.trim().length === 20 ? requestProperties.queryStringObject.id : false;

    if (id) {
        data.read('tokens', id, (err, tokenData) => {
            const token = {...parseJSON(tokenData) };
            if (!err && token) {
                delete token.password;
                callback(200, token);
            } else {
                callback(404, {
                    'error': 'token not found',
                });
            }
        });
    } else {
        callback(404, {
            'error': 'token not found',
        });
    }
};

handler._token.put = (requestProperties, callback) => {
    const id = typeof(requestProperties.queryStringObject.id) === 'boolean' && requestProperties.queryStringObject.id.trim().length === 20 ? requestProperties.queryStringObject.id : false;
    const extend = typeof(requestProperties.queryStringObject.extend) === 'string' && requestProperties.queryStringObject.extend === true ? true : false;

    if (id && extend) {
        data.read('tokens', id, (err, tokenData) => {
            let tokenObject = parseJSON(tokenData);
            if (tokenObject.expires > Date.now()) {
                tokenObject.expires = Date.now() + (60 * 60 * 1000);

                data.update('tokens', id, tokenObject, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(400, {
                            'error': 'Server side error.',
                        });
                    }
                })
            } else {
                callback(400, {
                    'error': 'Token Expired.',
                });
            }
        });
    } else {
        callback(400, {
            'error': 'Problem in request',
        });
    }
};

handler._token.delete = (requestProperties, callback) => {
    const id =
        typeof requestProperties.queryStringObject.id === 'string' &&
        requestProperties.queryStringObject.id.trim().length === 20 ?
        requestProperties.queryStringObject.id :
        false;


    if (id) {
        // lookup the user
        data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                data.delete('tokens', id, (err) => {
                    if (!err && tokenData) {
                        callback(200, {
                            message: 'Token was successfully deleted!',
                        });
                    } else {
                        callback(500, {
                            error: 'There was a server side error!',
                        });
                    }
                });
            } else {
                callback(500, {
                    error: 'No token found!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'There was a problem in your request!',
        });
    }
};

handler._token.verify = (id, phone, callback) => {
    data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (parseJSON(tokenData).phone === phone && parseJSON(tokenData).expires > Date.now()) {
                callback(true);
            } else {
                console.log();
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};
module.exports = handler;