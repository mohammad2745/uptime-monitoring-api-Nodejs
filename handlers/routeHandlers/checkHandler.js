// dependencies
const data = require('../../lib/data');
const { parseJSON, createRandomString, hash } = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler');
const { maxChecks } = require('../../helpers/environments');

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

    let url = typeof requestProperties.body.url === 'string' && requestProperties.body.url.trim().length > 0 ? requestProperties.body.url : false;

    let method = typeof requestProperties.body.method === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1 ? requestProperties.body.method : false;

    let successCode = typeof requestProperties.body.successCode === 'object' && requestProperties.body.successCode instanceof Array ? requestProperties.body.successCode : false;

    let timeOutSeconds = typeof requestProperties.body.timeOutSeconds === 'number' && requestProperties.body.timeOutSeconds % 1 === 0 && requestProperties.body.timeOutSeconds >= 1 && requestProperties.body.timeOutSeconds <= 5 ? requestProperties.body.timeOutSeconds : false;

    if (protocol && url && method && successCode && timeOutSeconds) {
        const token =
            typeof requestProperties.headersObject.token === 'string' ?
            requestProperties.headersObject.token :
            false;

        data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                let userPhone = parseJSON(tokenData).phone;
                data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        tokenHandler._token.verify(token, userPhone, (tokenValid) => {
                            if (tokenValid) {
                                let userObject = parseJSON(userData);
                                let userChecks = typeof userObject.checks === 'object' && userObject.checks instanceof Array ? userObject.checks : [];

                                if (userChecks.length < maxChecks) {
                                    let checkId = createRandomString(20);
                                    let checkObject = {
                                        'id': checkId,
                                        'userPhone': userPhone,
                                        'protocol': protocol,
                                        'url': url,
                                        'method': method,
                                        'successCodes': successCode,
                                        'timeOutSeconds': timeOutSeconds
                                    };

                                    data.create('checks', checkId, checkObject, (err) => {
                                        if (!err) {
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);

                                            data.update('users', userPhone, userObject, (err) => {
                                                if (!err) {
                                                    callback(200, checkObject)
                                                } else {
                                                    callback(500, {
                                                        error: 'Error in server side!',
                                                    });
                                                }
                                            })
                                        } else {
                                            callback(500, {
                                                error: 'Error in server side!',
                                            });
                                        }
                                    })
                                } else {
                                    callback(401, {
                                        error: 'User already reached max check limit!',
                                    });
                                }
                            } else {
                                callback(403, {
                                    error: 'Authentication problem!',
                                });
                            }
                        });
                    } else {
                        callback(403, {
                            error: 'User not found!',
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Authentication problem!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'There was a problem in your request!',
        });
    }
};

handler._check.get = (requestProperties, callback) => {
    const id = typeof(requestProperties.queryStringObject.id) === 'string' && requestProperties.queryStringObject.id.trim().length === 20 ? requestProperties.queryStringObject.id : false;

    if (id) {
        data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                const token =
                    typeof requestProperties.headersObject.token === 'string' ?
                    requestProperties.headersObject.token :
                    false;
                tokenHandler._token.verify(token, parseJSON(checkData).userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, parseJSON(checkData));
                    } else {
                        callback(403, {
                            error: 'Authentication error!',
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Server side error!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'There was a problem in your request!',
        });
    }
};

handler._check.put = (requestProperties, callback) => {
    const id = typeof(requestProperties.body.id) === 'string' && requestProperties.body.id.trim().length === 20 ? requestProperties.body.id : false;

    let protocol = typeof requestProperties.body.protocol === 'string' && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 ? requestProperties.body.protocol : false;

    let url = typeof requestProperties.body.url === 'string' && requestProperties.body.url.trim().length > 0 ? requestProperties.body.url : false;

    let method = typeof requestProperties.body.method === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1 ? requestProperties.body.method : false;

    let successCode = typeof requestProperties.body.successCode === 'object' && requestProperties.body.successCode instanceof Array ? requestProperties.body.successCode : false;

    let timeOutSeconds = typeof requestProperties.body.timeOutSeconds === 'number' && requestProperties.body.timeOutSeconds % 1 === 0 && requestProperties.body.timeOutSeconds >= 1 && requestProperties.body.timeOutSeconds <= 5 ? requestProperties.body.timeOutSeconds : false;

    if (id) {
        if (protocol || url || method || successCode || timeOutSeconds) {
            data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    let checkObject = parseJSON(checkData);
                    const token =
                        typeof requestProperties.headersObject.token === 'string' ?
                        requestProperties.headersObject.token :
                        false;
                    tokenHandler._token.verify(token, checkObject.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            if (protocol) {
                                checkObject.protocol = protocol;
                            }
                            if (url) {
                                checkObject.url = url;
                            }
                            if (method) {
                                checkObject.method = method;
                            }
                            if (successCode) {
                                checkObject.successCode = successCode;
                            }
                            if (timeOutSeconds) {
                                checkObject.timeOutSeconds = timeOutSeconds;
                            }

                            data.update('checks', id, checkObject, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, {
                                        error: 'There was a server side error!',
                                    })
                                }
                            });
                        } else {
                            callback(403, {
                                error: 'Authentication error!',
                            });
                        }
                    });
                } else {
                    callback(500, {
                        error: 'There was a problem in server side!',
                    });
                }
            });
        } else {
            callback(400, {
                error: 'Must provide one field!',
            });
        }
    } else {
        callback(400, {
            error: 'There was a problem in your request!',
        });
    }
};

handler._check.delete = (requestProperties, callback) => {
    const id =
        typeof requestProperties.queryStringObject.id === 'string' &&
        requestProperties.queryStringObject.id.trim().length === 20 ?
        requestProperties.queryStringObject.id :
        false;

    if (id) {
        // lookup the check
        data.read('checks', id, (err1, checkData) => {
            if (!err1 && checkData) {
                const token =
                    typeof requestProperties.headersObject.token === 'string' ?
                    requestProperties.headersObject.token :
                    false;

                tokenHandler._token.verify(
                    token,
                    parseJSON(checkData).userPhone,
                    (tokenIsValid) => {
                        if (tokenIsValid) {
                            // delete the check data
                            data.delete('checks', id, (err2) => {
                                if (!err2) {
                                    data.read(
                                        'users',
                                        parseJSON(checkData).userPhone,
                                        (err3, userData) => {
                                            const userObject = parseJSON(userData);
                                            if (!err3 && userData) {
                                                const userChecks =
                                                    typeof userObject.checks === 'object' &&
                                                    userObject.checks instanceof Array ?
                                                    userObject.checks : [];

                                                // remove the deleted check id from user's list of checks
                                                const checkPosition = userChecks.indexOf(id);
                                                if (checkPosition > -1) {
                                                    userChecks.splice(checkPosition, 1);
                                                    // resave the user data
                                                    userObject.checks = userChecks;
                                                    data.update(
                                                        'users',
                                                        userObject.phone,
                                                        userObject,
                                                        (err4) => {
                                                            if (!err4) {
                                                                callback(200);
                                                            } else {
                                                                callback(500, {
                                                                    error: 'There was a server side problem!',
                                                                });
                                                            }
                                                        }
                                                    );
                                                } else {
                                                    callback(500, {
                                                        error: 'The check id that you are trying to remove is not found in user!',
                                                    });
                                                }
                                            } else {
                                                callback(500, {
                                                    error: 'There was a server side problem!',
                                                });
                                            }
                                        }
                                    );
                                } else {
                                    callback(500, {
                                        error: 'There was a server side problem!',
                                    });
                                }
                            });
                        } else {
                            callback(403, {
                                error: 'Authentication failure!',
                            });
                        }
                    }
                );
            } else {
                callback(500, {
                    error: 'You have a problem in your request',
                });
            }
        });
    } else {
        callback(400, {
            error: 'You have a problem in your request',
        });
    }
};

module.exports = handler;