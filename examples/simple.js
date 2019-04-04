"use strict";
const ibx = require('payroc_ibx');
const util = require('util');
const xml2js = require('xml2js').Parser({explicitArray:false});

// You can use your own JSON Model, or use the included models.
const cardData = new ibx.cardDataModel();
cardData.name = 'Barney Rubble';
cardData.number = '4242424242424242';
cardData.cvv = '999';
cardData.exp_month = '12';
cardData.exp_year = '20';

// Address is optional, unless using loopback /sandbox / demo account.
const addressData = new ibx.addressDataModel();
addressData.postal_code = '84025';

const metaData = new ibx.metaDataModel();
metaData.email = "example@ibxpays.com";

let payload = new ibx.storeCardPayloadModel();
payload.amount = '1000';
payload.card = cardData;
payload.address = addressData;


let myPaymentCallback = function (response) {
    // Do something with response here
    console.log(util.inspect(response, false, null, true))
}

// If you want to post a card transaction
let myCallback = function (response) {

    if (response.error) {
        console.log(util.inspect(response.error, false, null, true))
        return;
    }

    // Do something with response here
    console.log(util.inspect(response, false, null, true))

    payload = new ibx.processCardPayloadModel();

    payload.token = response.ExtData.CardSafeToken;
    payload.amount = (Math.random() * 100).toFixed(2).toString();
    payload.transaction_type = 'sale';
    payload.ext_data = '';

    ibx.processCard(payload, myPaymentCallback);
};

ibx.setAuth(process.env.TEST_USERNAME, process.env.TEST_PASSWORD);
ibx.setEnv(ibx.environments.SANDBOX);
ibx.storeCard(payload, myCallback); // That's it!
