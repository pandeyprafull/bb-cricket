const Config = require('../config')
    // console.log('config=> ', Config.M91_AUTHKEY, Config.M91_SENDER, Config.M91_ROUTE);
var msg91 = require("msg91")(Config.M91_AUTHKEY, Config.M91_SENDER, Config.M91_ROUTE);
const rp = require('request-promise');

module.exports = {
    SendSMS: (numbers, msg, cb) => {
        msg91.send(numbers, msg, cb)
    },
    SendViaBulkSMS: (numbers, msg, cb) => {
        const url = `${Config.BULK_SMS_URL}&To=${numbers}&Text=${msg}`;
        // const url = `https://api.msg91.com/api/sendhttp.php?authkey=192067AskyWYtic75n5a5349f8&mobiles=9627029224&message=${msg}&sender=BALBZI&route=4`;
        console.log("====>>> ", url);
        rp(url).then(result => {
            cb(null, result)
        })
    }
}