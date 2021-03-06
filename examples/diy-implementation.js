'use strict';
/*
* Use this example, if you would prefer to write your own implementation without needing the npm module.
*
* This allows for the greatest degree of flexibility, but also is trickier to make sure your communicate with the SOAP
* or REST APIs appropriately. This example uses SOAP
*
* */

const Soap = require('soap');
const ParseString = require('xml2js').parseString;

const URL = 'https://sandbox.ibxpays.com/vt/ws/trxdetail.asmx';
const WSDL_URL = URL + '?wsdl';
const SOAP_CLIENT_OPTIONS = {};

let CardTrxSummaryParameters = {
  'UserName': 'test_username',
  'Password': 'test_password',
  'RPNum': '5',
  'BeginDt': '7/11/2016',
  'EndDt': '7/11/2016',
  'ApprovalCode': '',
  'Register': '2',
  'NameOnCard': '',
  'CardNum': '',
  'CardType': '',
  'ExcludeVoid': 'true',
  'User': '',
  'SettleFlag': '',
  'SettleMsg': '',
  'SettleDt': '',
  'TransformType': '',
  'Xsl': '',
  'ColDelim': '',
  'RowDelim': '',
  'IncludeHeader': 'true',
  'ExtData': ''
};

// Give the createClient Method the WSDL as the first argument
Soap.createClient(WSDL_URL, SOAP_CLIENT_OPTIONS, function (err, client) {
  // We use SSL accelerator so make sure the right url is set manually if you find you're hitting non-secure site which isn't listening
  if (err) console.log(err);
  client.setEndpoint(URL);

  // The Client now has all the methods of the WSDL. Use it to get cardtrxsummary feeding it the JSON Payload
  client.GetCardTrxSummary(CardTrxSummaryParameters, function (err, result, body) {
    if (err) console.log(err);
    console.log('Result:');
    console.log(result);
    console.log('\n');

    ParseString(result.GetCardTrxSummaryResult, function (err, result) {
      if (err) console.log(err);
      console.log('ParsedResult:');
      console.log(result);
      console.log('\n');
      console.log('Count is:');
      console.log(result.CardTrxSummary.PaymentMethod[0].Cnt[0]);
      console.log('\n');
    });
  });
});
