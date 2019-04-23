'use strict';

// External requirements
const request = require('request');
const xml2js = require('xml2js').Parser({ explicitArray: false });
const util = require('util');

// Endpoints
let BASE_ENDPOINT = 'sandbox.ibxpays.com';
const TOKEN_POST_ENDPOINT = '/ws/cardsafe.asmx/StoreCard';
const TRANSACTIONS_POST_ENDPOINT = '/ws/cardsafe.asmx/ProcessCreditCard';
const CARD_BATCH_POST_SUMMARY_ENDPOINT = '/vt/ws/trxdetail.asmx/GetOpenBatchSummary';

// Params
let _API_USERNAME;
let _API_PASSWORD;
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
  BASE_ENDPOINT = env + '.ibxpays.com';
};

exports.setAuth = function (username, password) {
  _API_USERNAME = username;
  _API_PASSWORD = password;
};

exports.storeCard = function (payload, callback) {
  if (!_API_USERNAME || !_API_PASSWORD) {
    errorObj.error.message = 'Invalid Credentials';
    callback(errorObj);
    return;
  }

  request({
    method: 'POST',
    uri: `https://${BASE_ENDPOINT}${TOKEN_POST_ENDPOINT}`,
    headers: {
      'User-Agent': `Node.js ${process.version}`
    },
    form: {
      UserName: _API_USERNAME,
      Password: _API_PASSWORD,
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
  if (!_API_USERNAME || !_API_PASSWORD) {
    errorObj.error.message = 'Invalid Credentials';
    callback(errorObj);
    return;
  }

  request({
    method: 'POST',
    uri: 'https://' + BASE_ENDPOINT + TRANSACTIONS_POST_ENDPOINT,
    headers: {
      'User-Agent': `Node.js ${process.version}`
    },
    form: {
      UserName: _API_USERNAME,
      Password: _API_PASSWORD,
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
  if (!_API_USERNAME || !_API_PASSWORD) {
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
    uri: `https://${BASE_ENDPOINT}${CARD_BATCH_POST_SUMMARY_ENDPOINT}`,
    headers: {
      'User-Agent': `Node.js ${process.version}`
    },
    form: {
      username: _API_USERNAME,
      password: _API_PASSWORD,
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
