'use strict';

// External requirements
const request = require('request');
const xml2js = require('xml2js').Parser({ explicitArray: false });
// const parseString = require('xml2js').parseString;
const util = require('util');

// Endpoints
let baseEndpoint = 'sandbox.ibxpays.com';

const tokenPostEndpoint = '/ws/cardsafe.asmx/StoreCard';
// const tokenGetEndpoint = '${tokenPostEndpoint}/'

const transactionsPostEndpoint = '/ws/cardsafe.asmx/ProcessCreditCard';
// const transactionsGetEndpoint = '${transactionsPostEndpoint}'

const cardBatchSummaryPostEndpoint = '/vt/ws/trxdetail.asmx/GetOpenBatchSummary';
// const cardBatchSummaryGetEndpoint = '${cardBatchSummaryPostEndpoint}'

// Params
let apiUsername;
let apiPassword;
let errorObj = { error: { code: 100, message: '', obj: null } };

// Public models for convenience
exports.CardDataModel = require('./models/card-data');
exports.AddressDataModel = require('./models/address-data');
exports.MetaDataModel = require('./models/meta-data');
exports.StoreCardPayloadModel = require('./models/storecard-payload');
exports.ProcessCardPayloadModel = require('./models/processcard-payload');
exports.BatchPayloadModel = require('./models/batch-payload');

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

function parseExtData (inputStr) {
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
      // console.log(util.inspect(xmlObj, false, null, true))
    }
  }

  // console.log(util.inspect(xmlObj, false, null, true))
  return xmlObj.ExtData;
}

// Exports

exports.environments = { UAT: 'uat', SANDBOX: 'sandbox', PRODUCTION: 'production' };

exports.setEnv = function (env) {
  baseEndpoint = env + '.ibxpays.com';
};

exports.setAuth = function (username, password) {
  apiUsername = username;
  apiPassword = password;
};

exports.storeCard = function (payload, callback) {
  if (!apiUsername || !apiPassword) {
    errorObj.error.message = 'Invalid Credentials';
    callback(errorObj);
    return;
  }

  request({
    method: 'POST',
    uri: 'https://' + baseEndpoint + tokenPostEndpoint,
    headers: {
      'User-Agent': `Node.js ${process.version}`
    },
    form: {
      UserName: apiUsername,
      Password: apiPassword,
      TokenMode: 'jstoken',
      CardNum: payload.card.number,
      ExpDate: payload.card.exp_month + payload.card.exp_year,
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
    } else {
      console.log(util.inspect(body, false, null, true));
      response = parseSync(body);
      response = response.Response;
      response.ExtData = parseExtData(response.ExtData);
      callback(response);
    }
  });
};

exports.processCard = function (payload, callback) {
  if (!apiUsername || !apiPassword) {
    errorObj.error.message = 'Invalid Credentials';
    callback(errorObj);
    return;
  }

  request({
    method: 'POST',
    uri: 'https://' + baseEndpoint + transactionsPostEndpoint,
    headers: {
      'User-Agent': `Node.js ${process.version}`
    },
    form: {
      UserName: apiUsername,
      Password: apiPassword,
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
    } else {
      response = parseSync(body);
      response = response.Response;
      response.ExtData = parseExtData(response.ExtData);
      callback(response);
    }
  });
};

exports.openBatchSummary = function (payload, callback) {
  if (!apiUsername || !apiPassword) {
    errorObj.error.message = 'Invalid Credentials';
    callback(errorObj);
    return;
  }

  let today = new Date();
  let fromDate = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear().toString().substring(2, 4);
  let toDate = (today.getMonth() + 1) + '/' + (today.getDate() + 1) + '/' + today.getFullYear().toString().substring(2, 4);

  fromDate = (payload.beginDt) ? payload.beginDt : fromDate;
  toDate = (payload.endDt) ? payload.endDt : toDate;

  request({
    method: 'POST',
    uri: 'https://' + baseEndpoint + cardBatchSummaryPostEndpoint,
    headers: {
      'User-Agent': `Node.js ${process.version}`
    },
    form: {
      username: apiUsername,
      password: apiPassword,
      rpNum: payload.gatewayId,
      beginDt: fromDate,
      endDt: toDate,
      extData: payload.extData
    }
  }, function (error, response, body) {
    if (error) {
      errorObj.error.message = 'Connection Error';
      errorObj.error.obj = error;
      errorObj.error.code = 500;
      callback(errorObj);
    } else {
      response = parseSync(body);
      response = parseSync(response.string._);
      if (response.OpenBatchSummary.Table) {
        response.OpenBatchSummary.PaymentTypes = response.OpenBatchSummary.Table;
        delete response.OpenBatchSummary.Table;
      }
      callback(response.OpenBatchSummary);
    }
  });
};
