let validator = require('validator');
const jwt = require('jsonwebtoken');
let Utils = require('../../utils');
let SQL = require('../../sql');
let BridgeController = require('./bridgeController');
let SupportController = require('./SupportController');
exports.socialLoginAndSignup = async(req, res) => {
    let facebookId = req.body.facebook_id,
        googleId = req.body.google_id,
        email = req.body.email,
        accountType = req.body.account_type,
        device_token = req.body.device_token,
        device_type = req.body.device_type,
        app_version = req.body.app_version,
        device_id = req.body.device_id;
    current_language = req.body.language;
    // googleId = '107685889865664421736';

    console.log("social body ===>", req.body);
    //TODO: validate the facebook and google clien id here
    /**
     * @accountType 1=facebook, 2= google
     */
    if (!validator.isIn(accountType + '', Object.values(Utils.Constants.accountTypes))) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res)
    let isNewUser = false;
    /*  #########################For Google login ##############################*/

    /* New Changes add configs */
    let userId = req.user ? req.user.user_id : null
    let configData = await SupportController.getConfig2({
        user_id: userId
    })
    try {
        
    if (accountType == Utils.Constants.accountTypes.google) {
        //check if google id already registered
        if (!googleId) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res)
        let initiatUser = await SQL.Users.getUserInitiatsByGoogle(googleId, "user_id");
        let userWithGoogle;
        if(initiatUser.length >0){
            initiatUser = initiatUser[0];
            userWithGoogle = await SQL.Users.getUser(` where user_id='${initiatUser.user_id}' `);
        }else{
            userWithGoogle = await SQL.Users.getUser(`where google_id='${googleId}'`);
        }
        if (userWithGoogle.length > 0) {
            userWithGoogle = userWithGoogle[userWithGoogle.length - 1];
            console.log("userWithGoogle  >>>>", userWithGoogle)
            userId = userWithGoogle ? userWithGoogle.user_id : null
            configData = await SupportController.getConfig2({
                user_id: userId
            })
            if (userWithGoogle.status == 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "inactive_account", __("INACTIVE_ACCOUNT"), res)
            if (userWithGoogle.phone_verified == 1) {
                var payload = {
                    user_id: userWithGoogle.user_id,
                    phone: userWithGoogle.phone,
                    row_id: userWithGoogle.row_id
                }
                let jwtExpiry = `${Utils.Constants.tokenExpiry}d`;
                let token = await jwt.sign(payload, process.env.SECRET, { expiresIn: jwtExpiry });

                let date = await Utils.CurrentDate.currentDate();

                //delete token from reddis for one device login
                let userActiveAccessToken = await SQL.Users.rawQuery(`select access_token from bb_access_token where user_id= ?`, [userId]);
                console.log("userActiveAccessToken >>>", userActiveAccessToken);
                if (userActiveAccessToken.length > 0) {
                    userActiveAccessToken = userActiveAccessToken[0].access_token
                    Utils.Redis.set(userActiveAccessToken, " ", 'EX', Utils.RedisExpire.ACCESS_TOKEN)
                }

                await SQL.Users.rawQuery(`INSERT INTO bb_access_token (user_id, access_token, active, date_added) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), active = VALUES(active)  `, [userWithGoogle.user_id, token, 1, date]);

                //set token in reddis
                Utils.Keys.ACCESS_TOKEN = `${token}`;
                console.log('Actual token >>', token);
                console.log('token set after in reddis ', Utils.Keys.ACCESS_TOKEN, '  and expire  >>', Utils.RedisExpire.ACCESS_TOKEN)
                token = token.toString()
                Utils.Redis.set(token, token, 'EX', Utils.RedisExpire.ACCESS_TOKEN)
                    // let updated = await SQL.Users.updateUserTable(`set access_token = '${token}'`, ` where user_id = ${userWithGoogle.user_id}`);
                let updatedUser = await SQL.Users.getUserById(userWithGoogle.user_id)

                let oldAccessToken = await BridgeController.getAccessTokenFromPhp(userWithGoogle.user_id, userWithGoogle.api_secret_key);
                updatedUser = updatedUser[0];
                updatedUser.accessToken = oldAccessToken.access_token;
                updatedUser.access_token = token

                // console.log("oldAccessToken ----->", oldAccessToken.access_token)
                console.log("old access token ------>>>>>> ", oldAccessToken);
                let response = {
                    user: updatedUser,
                    configs: configData ? configData : null
                }

                //updated device table
                if (userWithGoogle && device_id && device_token && device_type && app_version && req.body.language) {
                    let deviceData = {
                        userId: userWithGoogle.user_id,
                        user_ip: req.connection.remoteAddress,
                        app_version: req.body.app_version,
                        device_type: req.body.device_type,
                        device_id: req.body.device_id,
                        current_language: req.body.language ? current_language : 'en',
                        device_token: req.body.device_token
                    }
                    let isTokenUpdated = await Utils.UpdateDeviceToken.updateDeviceToken(deviceData);
                    console.log("isTokenUpdated >>>>", isTokenUpdated);
                }
                return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("register_success"), res, response)
            } else {
                // TODO: send phone verification status code
                let response = {
                    facebook_id: facebookId ? facebookId : null,
                    google_id: googleId ? googleId : null
                }
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Phone_verify, "user_not_verified", __('GOOGLE_EXIST_VERIFY_USER'), res, response);
            }
        } else isNewUser = true;
        if (isNewUser) {
            let existUser = await SQL.Users.getUserSocialInitiates(` where google_id = '${googleId}' `);
            console.log("new user is>>>>", existUser);

            existUser = existUser[0];

            userId = existUser ? existUser.user_id : null
            configData = await SupportController.getConfig2({
                user_id: userId
            })
            let newUserData, existUserData, newUser, response;
            if (!existUser) {
                // console.log("existing user is>>>>", existUser);
                newUserData = {
                    google_id: googleId,
                    account_type: accountType, // 1 for fb, 2 for google
                }
                await SQL.Users.insertData(newUserData, "bb_social_initiates");
                let newUser = await SQL.Users.getUserSocialInitiates(` where google_id = '${googleId}' `);
                console.log("new users >>>", newUser)
                newUser = newUser[0];
                userId = newUser ? newUser.user_id : null
                configData = await SupportController.getConfig2({
                    user_id: userId
                })

                response = {
                    facebook_id: facebookId ? facebookId : null,
                    google_id: googleId ? googleId : null,
                    configs: configData ? configData : null
                }
                return await Utils.ResponseHandler(true, Utils.StatusCodes.Phone_verify, "Success", __('GOOGLE_LOGIN_SUCCESS'), res, response)
            } else {

                response = {
                    facebook_id: facebookId ? facebookId : null,
                    google_id: googleId ? googleId : null,
                    configs: configData ? configData : null
                }
                console.log('lll-->> ', existUser);
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Phone_verify, "exist", __('USER_EXIST'), res, response);
            }
        }

    }

    /*  #########################For Facebook login ##############################*/
    if (accountType == Utils.Constants.accountTypes.facebook) {
        //check if facebook id already registered
        console.log("Inside facebook")
        if (!facebookId) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res)
        let initiatUser = await SQL.Users.getUserInitiatsByFb(facebookId, "user_id");
        let userWithFacebook;
        if(initiatUser.length >0){
            initiatUser = initiatUser[0];
            userWithFacebook = await SQL.Users.getUser(` where user_id='${initiatUser.user_id}' `);
        }else{
            userWithFacebook = await SQL.Users.getUser(`where facebook_id='${facebookId}'`);
        }
        if (userWithFacebook.length > 0) {
            userWithFacebook = userWithFacebook[userWithFacebook.length - 1];
            userId = userWithFacebook ? userWithFacebook.user_id : null
            configData = await SupportController.getConfig2({
                user_id: userId
            })
            if (userWithFacebook.status == 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "inactive_account", __("INACTIVE_ACCOUNT"), res)
            if (userWithFacebook.phone_verified == 1) {
                var payload = {
                    user_id: userWithFacebook.user_id,
                    phone: userWithFacebook.phone,
                    row_id: userWithFacebook.row_id
                }

                let jwtExpiry = `${Utils.Constants.tokenExpiry}d`;

                let token = await jwt.sign(payload, process.env.SECRET, { expiresIn: jwtExpiry });
                let date = await Utils.CurrentDate.currentDate();

                //delete token from reddis for one device login
                let userActiveAccessToken = await SQL.Users.rawQuery(`select access_token from bb_access_token where user_id = ?`, [userId]);
                console.log("userActiveAccessToken >>>", userActiveAccessToken);
                if (userActiveAccessToken.length > 0) {
                    userActiveAccessToken = userActiveAccessToken[0].access_token
                    Utils.Redis.set(userActiveAccessToken, " ", 'EX', Utils.RedisExpire.ACCESS_TOKEN)
                }

                await SQL.Users.rawQuery(`INSERT INTO bb_access_token (user_id, access_token, active, date_added) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), active = VALUES(active)  `, [userWithFacebook.user_id, token, 1, date]);

                //set token in reddis
                Utils.Keys.ACCESS_TOKEN = `${token}`;
                console.log('Actual token >>', token);
                console.log('token set after in reddis ', Utils.Keys.ACCESS_TOKEN, '  and expire  >>', Utils.RedisExpire.ACCESS_TOKEN)
                token = token.toString()
                Utils.Redis.set(token, token, 'EX', Utils.RedisExpire.ACCESS_TOKEN)
                    // let updated = await SQL.Users.updateUserTable(`set access_token = '${token}'`, ` where user_id = ${userWithFacebook.user_id}`);
                let updatedUser = await SQL.Users.getUserById(userWithFacebook.user_id)
                let oldAccessToken = await BridgeController.getAccessTokenFromPhp(userWithFacebook.user_id, userWithFacebook.api_secret_key);
                updatedUser = updatedUser[0];
                updatedUser.accessToken = oldAccessToken.access_token;
                updatedUser.access_token = token
                    // console.log("oldAccessToken ----->", oldAccessToken.access_token);
                console.log("old access token ------>>>>>> ", oldAccessToken);

                let response = {
                        user: updatedUser,
                        configs: configData ? configData : null
                    }
                    //updated device table
                if (userWithFacebook && device_id && device_token && device_type && app_version && req.body.language) {
                    let deviceData = {
                        userId: userWithFacebook.user_id,
                        user_ip: req.connection.remoteAddress,
                        app_version: req.body.app_version,
                        device_type: req.body.device_type,
                        device_id: req.body.device_id,
                        current_language: req.body.language ? current_language : 'en',
                        device_token: req.body.device_token
                    }
                    let isTokenUpdated = await Utils.UpdateDeviceToken.updateDeviceToken(deviceData);
                    console.log("isTokenUpdated >>>>", isTokenUpdated);
                }
                return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("register_success"), res, response)
            } else {
                // TODO: send phone verification status code
                let response = {
                    facebook_id: facebookId ? facebookId : null,
                    google_id: googleId ? googleId : null,
                    configs: configData ? configData : null
                }
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Phone_verify, "user_not_verified", __('FB_EXIST_VERIFY_USER'), res, response);
            }
        } else isNewUser = true;
        if (isNewUser) {
            let existUser = await SQL.Users.getUserSocialInitiates(` where facebook_id = '${facebookId}' `);
            console.log("existUser is>>>>", existUser);

            existUser = existUser[0];
            userId = existUser ? existUser.user_id : null
            configData = await SupportController.getConfig2({
                user_id: userId
            })
            let newUserData, existUserData, newUser, response;
            if (!existUser) {
                console.log("existing user is>>>>", existUser);
                newUserData = {
                    facebook_id: facebookId,
                    account_type: accountType, // 1 for fb, 2 for google
                }
                await SQL.Users.insertData(newUserData, "bb_social_initiates");
                let newUser = await SQL.Users.getUserSocialInitiates(` where facebook_id = '${facebookId}' `);
                response = {
                    facebook_id: facebookId ? facebookId : null,
                    google_id: googleId ? googleId : null,
                    configs: configData ? configData : null
                }
                return await Utils.ResponseHandler(true, Utils.StatusCodes.Phone_verify, "Success FB", __('FB_LOGIN_SUCCESS'), res, response)
            }
            response = {
                facebook_id: facebookId ? facebookId : null,
                google_id: googleId ? googleId : null,
                configs: configData ? configData : null
            }
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Phone_verify, "exist", __('USER_EXIST'), res, response);
        }
    }
    } catch (error) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Phone_verify, "error", __('SOME_ERROR'), res);
    }
}