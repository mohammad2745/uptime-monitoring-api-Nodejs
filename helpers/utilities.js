const crypto = require('crypto');
const utilities = {};
const environments = require('./environments');

// parse JSON string to object
utilities.parseJSON = (jsonString) => {
    let output = {};

    try {
        output = JSON.parse(jsonString);
    } catch {
        output = [];
    }
    return output
};

utilities.hash = (str) => {
    if (typeof str === 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', environments.secret_key).update(str).digest('hex');

        return hash;
    } else {
        return false;
    }
};

// export module
module.exports = utilities;