"use strict";
/*
* Use this example, if you would prefer to write your own implementation without needing the npm module.
*
* This allows for the greatest degree of flexibility, but also is trickier to make sure your communicate with the SOAP
* or REST APIs appropriately. This example uses SOAP
*
* */

let soap = require('soap');
let parseString = require('xml2js').parseString;

let url = 'https://sandbox.ibxpays.com/vt/ws/trxdetail.asmx';
let wsdlurl = url + '?wsdl';

let soap_client_options = {};

let CardTrxSummaryParameters = {
  'UserName': "test_username",
  'Password': "test_password",
  'RPNum': "5",
  'BeginDt': "7/11/2016",
  'EndDt': "7/11/2016",
  'ApprovalCode': "",
  'Register': "2",
  'NameOnCard': "",
  'CardNum': "",
  'CardType': "",
  'ExcludeVoid': "true",
  'User': "",
  'SettleFlag': "",
  'SettleMsg': "",
  'SettleDt': "",
  'TransformType': "",
  'Xsl': "",
  'ColDelim': "",
  'RowDelim': "",
  'IncludeHeader': "true",
  'ExtData': ""
};

// Give the createClient Method the WSDL as the first argument   
soap.createClient(wsdlurl, soap_client_options, function (err, client) {
  // We use SSL accelerator so make sure the right url is set manually if you find you're hitting non-secure site which isn't listening
  client.setEndpoint(url);

  // The Client now has all the methods of the WSDL. Use it to get cardtrxsummary feeding it the JSON Payload
  client.GetCardTrxSummary(CardTrxSummaryParameters, function (err, result, body) {

    console.log('Result:');
    console.log(result);
    console.log('\n');

    parseString(result.GetCardTrxSummaryResult, function (err, result) {
      console.log('ParsedResult:');
      console.log(result);
      console.log('\n');
      console.log('Count is:');
      console.log(result.CardTrxSummary.PaymentMethod[0].Cnt[0]);
      console.log('\n');
    });
  });
});

