[![npm version](https://badge.fury.io/js/akamai-nginx.svg)](https://badge.fury.io/js/akamai-nginx)
[![Build Status](https://travis-ci.org/wyvern8/akamai-nginx.svg?branch=master)](https://travis-ci.org/wyvern8/akamai-nginx)
[![Code Climate](https://codeclimate.com/github/wyvern8/akamai-nginx/badges/gpa.svg)](https://codeclimate.com/github/wyvern8/akamai-nginx)
[![Test Coverage](https://codeclimate.com/github/wyvern8/akamai-nginx/badges/coverage.svg)](https://codeclimate.com/github/wyvern8/akamai-nginx/coverage)
[![Greenkeeper badge](https://badges.greenkeeper.io/wyvern8/akamai-nginx.svg)](https://greenkeeper.io/)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

# akamai-nginx
Configure an nginx reverse proxy/simulator based on Akamai property rules (Unofficial)

This project takes an Akamai property api json response, and generates lua code integrated with nginx in order to 
simulate an akamai property.  

This can be useful for: 
- local development on apps that rely on akamai property rules
- non prod environments that cannot be granted ingress from Akamai due to organization policy
- on-demand temporarily provisioned environments to run CI tests against in pipelines
- learning the basic concepts of how Akamai works

## Install
`npm install akamai-nginx`
    
..or clone this repository.

## Setup papi
1. After npm install, follow the instructions here to setup your .edgerc and test api calls are working. https://github.com/akamai/AkamaiOPEN-edgegrid-node 


2. Execute `npm run configure` in an interactive shell, and follow the prompts to retrieve your property json, or environment property values.  Select 'save json' to run offline - your property json will be placed in ./papiJson dir - refer to start.js .  Alternatively, add output values to your .env file or environment variables.

OR

2b. Use httpie to obtain your contractId, groupId and 
a propertyId via api calls yourself and set env vars.
https://developer.akamai.com/api/luna/papi/resources.html

## Nginx integration
The docker-compose.yml in this repo can be used to start OpenResty containers to simulate an akamai property.
  
OpenResty ( https://openresty.org ) is a packaging of nginx with the required Lua modules built in.

The docker-compose.yml maps the local nginx-akamai.conf and lua directory into a docker container, 
and a second container to act as origin has the nginx-origin.conf mapped.  

By default the directive 'lua_code_cache off;' is set in the nginx-akamai.conf to allow generated lua 
to take effect without restarting nginx.  This directive should be disabled in a deployment as it has performance implications.

use ```docker-compose up``` to start both containers, with localhost port 80 and 443 (self-signed) mapped to the akamai container.  Setting/mapping a property origin 
hostname as 'origin' will allow the akamai container to use the second container as origin for testing.  This mapping can be done using the setValueMap function.

You can test that nginx is functioning using http://localhost/info which will output env info.

## Execution
After install, you can test without papi rest calls using the local json example using `npm run start-local`  or `npm test` to run unit tests.

To use an akamai property from your account, configure edgegrid, and set the following env var in .env or shell.  
The values can be obtained using  `npm run configure`:

    AKA_EDGERC=/path/to/.edgerc    
    AKA_CONTRACT_ID=ctr_XXXXXXXX
    AKA_GROUP_ID=grp_XXXXXXXX
    AKA_PROPERTY_ID=prp_XXXXXXXX
    AKA_PROPERTY_VERSION=XX
    
To process property rules into lua nginx config in the akamai docker container:

1. using the local sample.papi.json file  `npm run start-local`  or your own papi json file.
2. using your akamai api env to pull json at runtime, use  `npm run start`

Using the sample 'start.js' script directly after build, you can also pass parameters to control execution.

`AKA_MODE` : controls whether to run using local papiJson or papi api call. Either 'PAPI' or 'LOCAL'.

`AKA_LUA_OUTPUT_FILE` : output to a file other than lua/akamai.lua (not for local docker)

`AKA_PAPI_JSON_FILE` : path to local papiJson file to process_

examples:

`AKA_MODE=PAPI AKA_LUA_OUTPUT_FILE=property.lua node dist/start.js`

`AKA_MODE=LOCAL AKA_PAPI_JSON_FILE=papiJson/dev-www.yoursite.com-v2.papi.json node dist/start.js`

### Example usage in a node app
```javascript
require('babel-polyfill');
var akamaiNginx = require('akamai-nginx');

// example using local json. use setApiConfig for papi calls
akamaiNginx.setLocalConfig(
    'node_modules/akamai-nginx/sample.papi.json',
    './akamai.lua' // output file
);

// map values such a origin hostnames
akamaiNginx.setValueMap(
    new Map([
        ['staging-old.akamai.com', 'staging-new.akamai.com'],
        ['origin.akamaicustomer.com', 'something.com']
    ])
);

// behaviours to skip altogether
akamaiNginx.setSkipBehaviors([
    'cpCode'
]);

// do it
akamaiNginx.generateConf().then(function() {
    console.log('done.')
});

```  
..then assuing above is 'generate.js',  `node generate.js`  this will generate 'akamai.lua' in current dir.  
This in conjunction with the nginx.conf and docker-compose can be used to build your akamai simulator proxy.
    
### Example usage in ES6
```javascript
import 'babel-polyfill'
import EdgeGrid from 'edgegrid';
import dotenv from 'dotenv';
import { setApiConfig, setValueMap, setSkipBehaviors, generateConf } from 'akamai-nginx';

(async function() {

    // load .env vars
    dotenv.config();

    const edgegrid = new EdgeGrid({
        path: process.env.AKA_EDGERC,
        section: 'default'
    });

    setApiConfig(
        edgegrid,
        process.env.AKA_CONTRACT_ID,
        process.env.AKA_GROUP_ID,
        process.env.AKA_PROPERTY_ID,
        process.env.AKA_PROPERTY_VERSION,
        __dirname + '/lua/akamai.lua'
    );

    setValueMap(
        new Map([
            ['oldVal', 'replacement']
        ])
    );

    setSkipBehaviors([
        'cpCode'
    ]);

    await generateConf();
    
    console.log('done.');
    
})();
````

## Contributing - adding criteria and behaviors
Fork this repo and work on your enhancements, then send a pull request.

Use commitizen for conventional commit messages via `git cz` instead of `git commit`.  
To setup if not already installed:
```
npm install -g commitizen
npm install -g cz-conventional-changelog
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc
```
or you can just use `npm run commit` which will use local commitizen install.

Support for new criteria and behaviors is done by adding new ES6 class files in:

```
src/criteria
src/behaviors
```
each new feature should extend the corresponding base class and register itself using the name in the papi json response. 
eg. for the 'origin' behavior at a basic level:

```typescript
import { Behavior } from '../behavior.js';

export class BehaviorOrigin extends Behavior {

    constructor(options, valueMap, skipBehaviors) {
        super();
        this.options = options;
        this.valueMap = valueMap;
        this.skipBehaviors = skipBehaviors;
    }

    process() {
        return 'ngx.var.origin = "' + this.options.hostname + '"';
    }
}
Behavior.register('origin', BehaviorOrigin);
```
- notice that the 'register' function uses the name attribute from the papi json.
- the 'process' function should return the lua script to be added to the akamai.lua conf to simulate the akamai behavior in nginx.

## Unit tests
Please ensure that corresponding unit tests are created in:
```
test/criteria
test/behaviors
```
Each unit test should verify that the json options generate the correct lua script, and are a prerequisite for a pull request to be accepted.
