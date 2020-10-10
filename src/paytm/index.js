const checksum = require('./lib/paytmchecksum');
const config = require('../config');

const initPayment = function(userId, txnId, amount) {
    return new Promise((resolve, reject) => {
        let paymentObj = {
            ORDER_ID: txnId,
            CUST_ID: userId,
            INDUSTRY_TYPE_ID: config.PAYTM.INDUSTRY_TYPE_ID,
            CHANNEL_ID: config.PAYTM.CHANNEL_ID,
            TXN_AMOUNT: amount.toString(),
            MID: config.PAYTM.MID,
            WEBSITE: config.PAYTM.WEBSITE,
            CALLBACK_URL: config.PAYTM.CALLBACK_URL
        };
        console.log('=====>>>>> ', config.PAYTM.PAYTM_MERCHANT_KEY);

        checksum.genchecksum(
            paymentObj,
            config.PAYTM.PAYTM_MERCHANT_KEY,
            (err, result) => {
                if (err) {
                    return reject('Error while generating checksum');
                } else {
                    paymentObj.CHECKSUMHASH = result;
                    return resolve(paymentObj);
                }
            }
        );
    });
};

const responsePayment = function(paymentObject) {
    let checksumStatus = checksum.verifychecksum(
        paymentObject,
        config.PAYTM.PAYTM_MERCHANT_KEY,
        paymentObject.CHECKSUMHASH
    )
    console.log('==>>>>> ', checksumStatus);
    return new Promise((resolve, reject) => {
        if (
            checksum.verifychecksum(
                paymentObject,
                config.PAYTM.PAYTM_MERCHANT_KEY,
                paymentObject.CHECKSUMHASH
            )
        ) {
            console.log("----------resolved-------");
            resolve(paymentObject);
        } else {
            console.log("----------rejected-------");
            return reject('Error while verifying checksum');
        }
    });
};

module.exports = {
    initPayment: initPayment,
    responsePayment: responsePayment
};