'use strict';

const ibx = require('payroc_ibx');
const util = require('util');

// You can use your own JSON Model, or use the included models.
let cardData = new ibx.CardDataModel();
cardData.name = 'Barney Rubble';
cardData.number = '4242424242424242';
cardData.cvv = '999';
cardData.exp_month = '12';
cardData.exp_year = '20';

// Address is optional, unless using loopback /sandbox / demo account.
let addressData = new ibx.AddressDataModel();
addressData.postal_code = '84025';

let metaData = new ibx.MetaDataModel();
metaData.email = 'example@ibxpays.com';

let payload = new ibx.StoreCardPayloadModel();
payload.amount = '1000';
payload.card = cardData;
payload.address = addressData;

let myReportingCallback = function (response) {
  // Do something with response here
  console.log(util.inspect(response, false, null, true));
};

let myPaymentCallback = function (response) {
  // Do something with response here
  console.log(util.inspect(response, false, null, true));
  payload = new ibx.BatchPayloadModel();
  ibx.openBatchSummary(payload, myReportingCallback);
};

// If you want to post a card transaction
let myCallback = function (response) {
  if (response.error) {
    console.log(util.inspect(response.error, false, null, true));
    return;
  }

  // Do something with response here
  console.log(util.inspect(response, false, null, true));

  payload = new ibx.ProcessCardPayloadModel();

  payload.token = response.ExtData.CardSafeToken;
  payload.amount = (Math.random() * 100).toFixed(2).toString();
  payload.transaction_type = 'sale';
  payload.ext_data = '';

  ibx.processCard(payload, myPaymentCallback);
};

ibx.setAuth(process.env.TEST_USERNAME, process.env.TEST_PASSWORD);
ibx.setEnv(ibx.environments.SANDBOX);
ibx.storeCard(payload, myCallback); // That's it!
