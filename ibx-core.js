"use strict";

// External requirements
const request = require('request');
const xml2js = require('xml2js').Parser({explicitArray:false});
//const parseString = require('xml2js').parseString;
const util = require('util');

// Endpoints
let base_endpoint = 'sandbox.ibxpays.com';

const token_post_endpoint = '/ws/cardsafe.asmx/StoreCard';
const token_get_endpoint = '${token_post_endpoint}/';

const transactions_post_endpoint = '/ws/cardsafe.asmx/ProcessCreditCard';
const transactions_get_endpoint = '${transactions_post_endpoint}';

// Params
let _api_username;
let _api_password;
let errorObj = { error: { code: 100, message: '', obj: null} }; 

// Public models for convenience
exports.cardDataModel = require('./models/card-data');
exports.addressDataModel = require('./models/address-data');
exports.metaDataModel = require('./models/meta-data');
exports.storeCardPayloadModel = require('./models/storecard-payload');
exports.processCardPayloadModel = require('./models/processcard-payload');

function parseSync (xml) {
    let error = null;
    let json = null;

    xml2js.parseString(xml, function (innerError, innerJson) {
        error = innerError;
        json = innerJson;
    });

    if (error) {
        throw error;
    }

    if (!error && !json) {
        throw new Error('The callback has suddenly become actual async....');
    }

    return json;
}

function parseExtData(inputStr) {
    let xmlStartPos = inputStr.indexOf('<');
    let commaParams = inputStr.substring(0, xmlStartPos).split(',');

    // Now remove the last bit...
    let xmlStr = inputStr.substring(xmlStartPos);
    xmlStr = '<ExtData>' + xmlStr + '</ExtData>';

    let xmlObj = parseSync(xmlStr);

    // If it's one then it's the original string which means it's blank....
    // Don't need to do this for an "empty" array
    if (commaParams.length > 1) {
        for (let i = 0; i < commaParams.length; i++) {
            let kv = commaParams[i].split('=');
            xmlObj['ExtData'][kv[0]] = kv[1];
            //console.log(util.inspect(xmlObj, false, null, true))
        }
    }

    //console.log(util.inspect(xmlObj, false, null, true))
    return xmlObj.ExtData;
}


// Exports

exports.environments = { UAT: 'uat', SANDBOX: 'sandbox', PRODUCTION: 'production' };

exports.setEnv = function (env) {
    base_endpoint = env + '.ibxpays.com';
}

exports.setAuth = function (username, password)  {
    _api_username = username;
    _api_password = password;
}

exports.storeCard = function (payload, callback) {

    if (! _api_username || ! _api_password) {
        errorObj.error.message = 'Invalid Credentials';
        callback(errorObj);
        return;
    }

    request({
        method: 'POST',
        uri: 'https://' + base_endpoint + token_post_endpoint,
        headers: {
            'User-Agent': 'Node.js ${process.version}'
        },
        form: {
            UserName: _api_username,
            Password: _api_password,
            TokenMode: 'jstoken',
            CardNum: payload.card.number,
            ExpDate: payload.card.exp_month+payload.card.exp_year,
            CustomerKey: '',
            NameOnCard: payload.card.name,
            Street: payload.address.line1 + ', ' + payload.address.city + ', ' + payload.address.state,
            Zip: payload.address.postal_code,
            ExtData: ''
        }
    }, function (error, response, body) {
        if (error) {
            errorObj.error.message = 'Connection Error';
            errorObj.error.obj = error;
            errorObj.error.code = 500;
            callback(errorObj);
        }
        else {
            console.log(util.inspect(body, false, null, true));
            response = parseSync(body);
            response = response.Response;
            response.ExtData = parseExtData(response.ExtData);
            callback(response);
        }
    });
};

exports.processCard = function (payload, callback) {

    if (! _api_username || ! _api_password) {
        errorObj.error.message = 'Invalid Credentials';
        callback(errorObj);
        return;
    }

    request({
        method: 'POST',
        uri: 'https://' + base_endpoint + transactions_post_endpoint,
        headers: {
            'User-Agent': 'Node.js ${process.version}'
        },
        form: {
            UserName: _api_username,
            Password: _api_password,
            TransType: payload.transaction_type,
            CardToken: payload.token,
            TokenMode: 'jstoken',
            Amount: payload.amount,
            InvNum: '',
            PNRef: '',
            ExtData: ''
        }
    }, function (error, response, body) {
        if (error) {
            errorObj.error.message = 'Connection Error';
            errorObj.error.obj = error;
            errorObj.error.code = 500;
            callback(errorObj);
        }
        else {
            response = parseSync(body);
            response = response.Response;
            response.ExtData = parseExtData(response.ExtData);
            callback(response);
        }
    });
};

