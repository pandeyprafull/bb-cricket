let rp = require('request-promise');
let Utils = require('../../utils');
let SQL = require('../../sql');
const jwt = require('jsonwebtoken');

async function getAccessTokenFromPhp(userId, apiKey) {
    // var userId = 780437;
    // var apiKey = 'i7enmGKm3bPltHZvxPcH';
    let url = 'http://13.235.35.207:8098/register';
    if (process.env.NODE_ENV == 'production')
        url = 'https://admin.ballebaazi.com/register';
    var options = {
        method: 'POST',
        uri: url,
        body: {
            option: 'get_access_token',
            user_id: userId,
            api_secret_key: apiKey
        },
        json: true
    };
    // console.log('body-->>> ', options);
    return await rp(options)
}
async function getuserInfoFromOldToken(userId, accessToken) {
    // var userId = 780437;
    // var apiKey = 'i7enmGKm3bPltHZvxPcH';
    // var accessToken = 'e5e6599bd21a81d990b11e75ead858d8b7c8dc2d';
    let url = 'http://13.235.35.207:8098/register';
    if (process.env.NODE_ENV == 'production')
        url = 'https://admin.ballebaazi.com/register';
    var options = {
        method: 'POST',
        uri: url,
        body: {
            option: 'get_user',
            userId: userId,
            accessToken: accessToken,
            // api_secret_key: apiKey
        },
        json: true
    };
    return await rp(options)
}


async function getUser(req, res) {
    try {
        let accessToken = req.body.access_token;
        let userId = req.body.userId;
        // accessToken = 'e5e6599bd21a81d990b11e75ead858d8b7c8dc2d';
        // userId = 780437;
        if (!accessToken || !userId) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res);
        let user = await SQL.Users.getUserById(userId)
        if (user.length <= 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res);
        user = user[0];
        let result = await getuserInfoFromOldToken(userId, accessToken);
        console.log("ssss===>>> ", req.body);

        if (result.status == 200) {
            var payload = {
                user_id: user.user_id,
                phone: user.phone,
                row_id: user.row_id
            }
            let jwtExpiry = `${Utils.Constants.tokenExpiry}d`;

            console.log("expiry is jwt>>>", jwtExpiry);
            let token = await jwt.sign(payload, process.env.SECRET, { expiresIn: jwtExpiry });
            let date = await Utils.CurrentDate.currentDate()

            await SQL.Users.rawQuery(`INSERT INTO bb_access_token (user_id, access_token, active, date_added) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), active = VALUES(active)  `, [userId, token, 1, date]);

            //set token in reddis
            Utils.Keys.ACCESS_TOKEN = `${token}`;
            console.log('Actual token >>', token);
            console.log('token set after in reddis ', Utils.Keys.ACCESS_TOKEN, '  and expire  >>', Utils.RedisExpire.ACCESS_TOKEN)
            token = token.toString()
            Utils.Redis.set(token, token, 'EX', Utils.RedisExpire.ACCESS_TOKEN)
            user.access_token = token;
            user.status = '0';
            // let oldAccessToken = await getAccessTokenFromPhp(user.user_id, user.api_secret_key);

            user.accessToken = accessToken;
            delete user.api_secret_key;
            delete user.facebook_id;
            delete user.google_id;
            delete user.password;
            result = {
                user: user
            }
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, result)

        } else {
            console.log("access token not vverified-->>> ", result.message);
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res);
        }
    } catch (error) {
        console.log("some Error ->> ", error);
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "SOME_ERROR", __("SOME_ERROR"), res);
    }
}

async function submitWithdrawlRequest(req, res) {
    let token = await req.headers['accesstoken'];
    let url = 'http://13.235.35.207:8098/user';
    if (process.env.NODE_ENV == 'production')
        url = 'https://admin.ballebaazi.com/user';
    var options = {
        method: 'POST',
        uri: url,
        body: {
            amount: req.body.amount,
            enable_tds: 1,
            gateway_type: req.body.gateway_type,
            option: 'withdraw_cash_v1',
            type: req.body.type,
            user_id: req.user.user_id
        },
        headers: {
            Connection: 'keep-alive',
            accesstoken: token,
            language: 'en',
            loginid: req.user.user_id,
            osversion: 27,
            platform: 'android',
            versioncode: 21402504,
            versionname: '2.5.4'
        },
        json: true
    };
    console.log('body-->>> ', options);
    rp(options).then(async success => {
        // return res.send(success)
        if(success.status == 200){
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res)
        }else{
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("success"), success.message, res)
        }
    }).catch(async err => {
        return await Utils.ResponseHandler(false, 400, "SOME_ERROR", __("SOME_ERROR"), res);
    })
}


async function cancleWithdrawlRequest(req, res) {
    let token = await req.headers['accesstoken'];

    let url = 'http://13.235.35.207:8098/user';
    if (process.env.NODE_ENV == 'production')
        url = 'https://admin.ballebaazi.com/user';
    var options = {
        method: 'POST',
        uri: url,
        body: { limit: 0, option: 'cancel_withdraw', page: 0, user_id: req.user.user_id , withdraw_id: req.body.withdraw_id},
        headers: {
            Connection: 'keep-alive',
            accesstoken: token,
            language: 'en',
            loginid: req.user.user_id,
            osversion: 27,
            platform: 'android',
            versioncode: 21402504,
            versionname: '2.5.4'
        },
        json: true
    };
    console.log('body-->>> ', options);
    rp(options).then(async success => {
        // return res.send(success)
        if(success.status == 200){
            let response = {
                user:success.this_user
            }
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res,response)
        }else{
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("success"), success.message, res)
        }
    }).catch(async err => {
        return await Utils.ResponseHandler(false, 400, "SOME_ERROR", __("SOME_ERROR"), res);
    })
}

// (() => {
//     getAccessTokenFromPhp(1611, '9c0b17e9063c83b7bf5d1ecd5c7f9cf69fd77363').then(success => {
//         console.log('success =--->>> ', success);
//     }, error => {
//         console.log('error cautched=--->>> ', error);
//     }).catch(e => {
//         console.log('exception catched=>> ', e);
//     })
// })()

module.exports = {
    getAccessTokenFromPhp: getAccessTokenFromPhp,
    getUser: getUser,
    submitWithdrawlRequest: submitWithdrawlRequest,
    cancleWithdrawlRequest: cancleWithdrawlRequest
}