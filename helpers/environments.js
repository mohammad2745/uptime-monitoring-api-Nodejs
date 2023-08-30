const environments = {};

// staging environment
environments.staging = {
    port: 3000,
    envName: 'staging',
    secret_key: 'asdfdfaasdf',
    maxChecks: 5
};

// production environment
environments.production = {
    port: 5000,
    envName: 'production',
    secret_key: 'eioruqwoieee',
    maxChecks: 5
};

// determine which environment was passed
const currentEnvironment =
    typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : 'staging';

// export corresponding environment object
const environmentToExport =
    typeof environments[currentEnvironment] === 'object' ?
    environments[currentEnvironment] :
    environments.staging;

// export module
module.exports = environmentToExport;