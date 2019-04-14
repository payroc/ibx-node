# IBX SDK for NodeJS

As a quick helper for our NodeJS community to get up and running even faster in your favorite dependency manager, we have created this API / SDK wrapper specifically tailored for NodeJS and Express. 

More details at [IBX Developer API](https://www.integritypays.com/developers/apis/soap-apis/#implementation-examples)

<!-- ![EMV Teaser](images/animation-dip_0-60.gif) -->

## Features
- [NodeJS](https://nodejs.org/en/)

## Usage 
If there is a platform you would like to see in addition to `npm` for dependency management, let us know.

### NPM Install
Run the following command at the root fo your project

```bash
npm install ibx-node
```

[IBX SDK on NPM](https://www.npmjs.com/package/payroc_ibx)


### Manual Install

Download the zip, or use git submodules to pull the SDK into your project.

### Import Example

Here is an example implementation:

(see `/examples` for more)

#### DIY Example without IBX SDK
[DIY Example](examples/diy-implementation.js)

#### Post transaction with IBX SDK
```javascript
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


let myReportingCallback = function (response) {
    // Do something with response here
    console.log(util.inspect(response, false, null, true))
}

let myPaymentCallback = function (response) {
    // Do something with response here
    console.log(util.inspect(response, false, null, true))
    payload = new ibx.batchPayloadModel();
    ibx.openBatchSummary(payload, myReportingCallback);
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

```



#### Example Response
Example successful `processCard` using the example above will return the following JSON object as a response:
```json
{
    "$": {
    "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
     "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
     "xmlns": "https://gw-v1.ibxpays.com/ws"
    },
    "Result": "0",
    "RespMSG": "Approved",
    "Message": "Approval - Approved and completed",
    "Message1": "",
    "Message2": "",
    "AuthCode": "TAS105",
    "PNRef": "104296",
    "HostCode": "000000000000147",
    "HostURL": "",
    "GetAVSResult": "N",
    "GetAVSResultTXT": "No Match",
    "GetStreetMatchTXT": "No Match",
    "GetZipMatchTXT": "No Match",
    "GetGetOrigResult": "",
    "GetCommercialCard": "False",
    "ExtData": {
        "CardType": "VISA",
        "LastFour": "4242",
        "ExpDate": "1220",
        "BatchNum": "128"
    }
}

```

Check out the files in `/examples` for other ideas for implementation.

## Testing
[![Try Payroc IBX SDK on RunKit](https://badge.runkitcdn.com/payroc_ibx.svg)](https://npm.runkit.com/payroc_ibx)

Unit tests on this project are run using Mocha. You can find each test in the `/test` folder.

After doing an npm install mocha, and chai will be available to run using the following command. 


```bash
npm test
```

Alternative Methods:

```bash
npm test-report
```

```bash
npm test-check-coverage
```

```bash
./node_modules/.bin/mocha --reporter spec
```  
