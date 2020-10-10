// const UserSchema = require('../models/bb_users_Schema');
// const MobileSchema = require('../models/bb_mobile_otp_Schema');
const { usernameStr, passwordStr } = require('../../utils').RandomString;
const otp = require('../../utils').RandomNumbber;
const responseConfigObj = require('../../utils/configResponse');
const db = require('../../utils/CricketDbConfig');
const jwt = require('jsonwebtoken');
const Utils = require('../../utils');
const Services = require('../../services')
var randomstring = require("randomstring");
var SQL = require('../../sql');
let config = require('../../config');
let moment = require('moment');
let validator = require('validator');
let rp = require('request-promise');
let bycrypt = require('bcrypt');

const Mysql_dt = require('../../utils/mySql_dateTime');
const SQL_QUERY_USER = require('../../sql/userQuery');
let BridgeController = require('./bridgeController');
let SupportController = require('./SupportController');

function updateUsername(userId, username) {
    return new Promise((resolve, reject) => {
        try {
            console.log("UserId is ", userId, username)
            db.getConnection((error, connection) => {
                if (error) {
                    connection.rollback();
                    reject(error)
                }
                connection.beginTransaction(async (err) => {
                    if (err) {
                        // return await connection.rollback(() => {
                        //     connection.release()
                        //     throw err;
                        // });
                        connection.rollback();
                        reject(error)
                    }
                    // let user = await SQL.Users.selectUserForUpdate(userId, ` username, username_edited, phone_verified `);
                    connection.query(` SELECT username, username_edited, phone_verified   FROM bb_users WHERE user_id = ? `, userId, async (error, user) => {
                        if (error) {
                            connection.rollback();
                            reject(error)
                        } else {

                            // if (!user) throw __('WRONG_DATA');
                            // if (user[0].username_edited) throw "Username not editable";
                            console.log("User is >>>>", user);
                            if (!user.length > 0) reject(new Error(__('WRONG_DATA')));
                            if (user[0].username_edited == 1) reject(new Error(__('Username not editable')));
                            // let updateColumn = ` set username = '${username}', username_edited = ${1}, signup_bonus = ${Utils.Constants.SIGNUP_BONUS}, bonus_cash = ${Utils.Constants.SIGNUP_BONUS}`
                            // where = `where user_id = ${userId}`;
                            //  var updatedResult = await SQL.Users.updateUserTable(updateColumn, where);
                            connection.query(`UPDATE bb_users set username = ? , username_edited = ?, signup_bonus = ?, bonus_cash = ? where user_id = ? `, [username, 0, Utils.Constants.SIGNUP_BONUS, Utils.Constants.SIGNUP_BONUS, userId], async (error, updatedUser) => {
                                if (error) {
                                    connection.rollback();
                                    reject(error)
                                } else {
                                    connection.commit();
                                    connection.release()
                                    resolve('updatedResult')
                                }
                            })
                        }
                    })

                })
            })
        } catch (error) {
            console.log('errprprprpr== ', error);
            throw error;
        }
    })
}

exports.signup = async (options) => {
    return new Promise(async (resolve, rejected) => {
        // let deviceData = {
        //     device_type: options.device_type,
        //     device_id: options.device_id,
        //     device_token: options.device_token,
        //     device_ip: options.device_ip
        // }
        console.log("accountype>>>", options.account_type);
        try {
            // validate account_type, validateAccountType(accountType)
            let validateAccountType = Utils.ValidatorController.validateAccountType(options.account_type);
            let accountType, required;
            if (validateAccountType && validateAccountType.status == 200) accountType = validateAccountType.response;

            // data requires for different types of account: signup=1, facebook=2, google=3

            if (options.account_type == 1) {
                // for app signup
                required = {
                    username: true,
                    email: false,
                    facebookId: false,
                    googleId: false,
                    password: true,
                    phone: true
                }
            } else if (options.account_type == 2) {
                // for facebook signup
                required = {
                    username: false,
                    email: false,
                    facebookId: true,
                    googleId: false,
                    password: false,
                    phone: false
                }
            } else if (options.account_type == 3) {
                // for google signup
                required = {
                    username: false,
                    email: true,
                    facebookId: false,
                    googleId: true,
                    password: false,
                    phone: false
                }
            }
            let emailVerified = 0,
                verifiedUser = 0;
            let validEmail = await Utils.ValidatorController.validateEmail(options.email, required.email, false);
            console.log('===>>> ', validEmail);
            let uniqueEmail
            if (validEmail.status == 200 && validEmail.response) {
                // check email existance (show errors only if app signup);
                uniqueEmail = await SQL.Users.getUnique(`where email = '${validEmail.response}'`);
                uniqueEmail = uniqueEmail ? false : true
                // console.log("Unique email>>",uniqueEmail);
                if (!uniqueEmail && options.account_type == 1) return await rejected({ Msg: __('EMAIL_EXISTS'), title: 'exists' })
            }

            /*
                For FACEBOOK
            */

            // validate facebookId validateText(value, field, required=false, min=2, max=false)
            let validFacebook = await Utils.ValidatorController.validateTextNew(options.facebook_id, "facebook id", required.facebookId, false);
            console.log("====> valid facebook", validFacebook);
            let uniqueFacebook;
            if (options.account_type == 2) {
                // check if email or facebook_id exist to login automatically
                uniqueFacebook = await SQL.Users.getUnique(` where facebook_id = '${validFacebook.response}'`);
                uniqueFacebook = uniqueFacebook ? false : true;
                let loginDetails;
                if (!uniqueFacebook) {
                    loginDetails = {
                        type: 'facebook_id',
                        facebook_id: validFacebook.response,
                        email: validEmail.response
                    }
                    let loginResponse = await this.socialLogin(loginDetails, options);
                    console.log("Unique loginResponse>>", loginResponse);

                    return await resolve({ Msg: loginResponse.Msg, title: loginResponse.title, response: loginResponse.response })
                } else if (validEmail.response && !uniqueEmail) {
                    loginDetails = {
                        type: 'facebook_email',
                        facebook_id: validFacebook.response,
                        email: validEmail.response
                    }
                    console.log("loginDetails is >>>", loginDetails)
                    let loginResponse = await this.socialLogin(loginDetails, options);
                    return await resolve({ Msg: loginResponse.Msg, title: loginResponse.title, response: loginResponse.response })


                }
            }
            /*
            FOR G PLUS
            */
        } catch (e) {
            console.log("error in signup => ", e);

            return await rejected({ Msg: e.Msg, title: e.title });
        }
    })
}

exports.socialLogin = async (data, options) => {
    return new Promise(async (resolve, rejected) => {
        let type = data.type;
        let email = data.email;
        let facebook_id = data.facebook_id;
        let google_id = data.google_id;
        console.log("loginDetail is", data);
        try {
            let userWithEmail = false;
            let userWithFacebook = false;
            let userWithGoogle = false;
            if (email) userWithEmail = await SQL.Users.getUser(` where email = '${email}'`);

            if (facebook_id) userWithFacebook = await SQL.Users.getUser(`where facebook_id = '${facebook_id}'`);


            if (google_id) userWithGoogle = await SQL.Users.getUser(`where google_id = '${google_id}'`);

            console.log('userWithGoogle >>', userWithGoogle);


            // CHECK ACCOUNT INACTIVITY
            let accountInactive = false;
            if (userWithEmail[0] && userWithEmail[0].status == 0) accountInactive = true;
            if (userWithFacebook[0] && userWithFacebook[0].status == 0) accountInactive = true;
            if (userWithGoogle[0] && userWithGoogle[0].status == 0) accountInactive = true;
            if (accountInactive) return await rejected({ Msg: __('INACTIVE_ACCOUNT'), title: 'inactive_account', status: Utils.StatusCodes.Error })

            console.log("type, email, userwithemail, userwith facebook", type, email, userWithEmail, userWithFacebook)
            // ACCOUNT FLEXIBILITY ON ALL LOGINS
            let loginDetails;
            if (type == "facebook_id" || type == "facebook_email") {
                if (type == "facebook_id" && email && !userWithEmail[0] && !userWithFacebook[0].email) {
                    // Email not registerd, register email to the user
                    await SQL.Users.updateProfile(userWithFacebook[0].user_id, { 'email': email });
                } else if (type == "facebook_email" && userWithEmail[0].user_id) {
                    // facebook id is not registered, register facebook id to the user
                    await SQL.Users.updateProfile(userWithEmail[0].user_id, { 'facebook_id': facebook_id })
                }

                // Login with facebook now
                if (type == "facebook_id") {
                    loginDetails = await this.loginMain("facebook_id", facebook_id, options);
                    console.log("loginDetails in Social Login", loginDetails);
                    return await resolve({ Msg: loginDetails.Msg, title: loginDetails.title, response: loginDetails.response });
                } else if (type == "facebook_email") {
                    loginDetails = await this.loginMain("email", email, options);
                    return await resolve({ Msg: loginDetails.Msg, title: loginDetails.title, response: loginDetails.response });
                }

            } else if (type == "google_id" || type == "google_email") {
                if (type == "google_email" || userWithEmail.user_id) {
                    // google id not registered, register google id to the user
                    await SQL.Users.updateProfile(userWithEmail.user_id, { 'google_id': google_id })
                }
                // Login with google now
                if (type == "google_id") {
                    loginDetails = await this.loginMain("google_id", google_id, options);
                    return await resolve({ Msg: loginDetails.Msg, title: loginDetails.title, response: loginDetails.response });

                } else if (type == "google_email") {
                    loginDetails = await this.loginMain("email", email, options);
                    return await resolve({ Msg: loginDetails.Msg, title: loginDetails.title, response: loginDetails.response });
                }
            }
        } catch (e) {
            console.log("Error in social login", e)
            return await rejected({ Msg: e.Msg, title: e.title });
        }
    })
}

exports.loginMain = async (loginType, user, options) => {
    return new Promise(async (resolve, rejected) => {
        /*
         * $loginType=facebook_id, google_id, social_email
         * $data=$facebookId for facebook_id
         * $data=$googleId for google_id
         * $data=$email for social_email
         */

        try {
            let where = ` ${loginType} = '${user}'`;
            console.log("where is >>", where)
            let loginDetails = await SQL.Users.getUserLoginDetails(where, true);
            console.log('loginDetails >>>>', loginDetails)
            loginDetails = loginDetails[0];
            if (loginDetails) {
                // check status
                if (loginDetails.status == 0) return await rejected({ Msg: __('INACTIVE_ACCOUNT'), title: 'inactive_account', status: Utils.StatusCodes.Error });
                // update device info
                console.log("optioins is >>>", options);
                let userId = loginDetails.user_id;
                let deviceType = options.device_type;
                let deviceId = options.device_id;
                let deviceToken = options.device_token;
                let deviceIp = options.device_ip

                let deviceDataObj = {
                    'user_id': userId,
                    'device_type': deviceType,
                    'device_id': deviceId,
                    'device_token': deviceToken,
                    'is_login': 1,
                    'user_ip': deviceIp
                }
                if (deviceType && deviceId && deviceToken) await SQL.Users.UserDeviceTableInsertOrIgnore(deviceDataObj, userId)

                //get Token
                var payload = {
                    user_id: loginDetails.user_id,
                    phone: loginDetails.phone,
                    row_id: loginDetails.row_id
                }
                const userToken = await jwt.sign(payload, process.env.SECRET, { expiresIn: '50d' });
                // req.token = token;
                const tokenDoc = await SQL.Users.updateProfile(userId, { access_token: userToken })
                console.log(userToken);

                if (!userToken) return await rejected({ title: 'error', Msg: __('SOME_ERROR'), status: Utils.StatusCodes.Error });

                loginDetails.access_token = userToken;
                loginDetails.status = '0'
                // check if verified user

                if (loginDetails.verified_user != 1) return await resolve({ Msg: __('LOGIN_SUCCESS'), title: 'login_success', response: loginDetails })
                let currentLanguage = await SQL.Users.getUserDevices(`current_language`, userId);
                loginDetails.current_language = currentLanguage
                return await resolve({ Msg: __("LOGIN_SUCCESS"), title: 'login_success', response: loginDetails });

            }
            return await rejected({ Msg: __('UNCAUGHT_ERROR'), title: 'uncaught_error', status: Utils.StatusCodes.Unauthorized_user });
        } catch (e) {
            console.log("error in loginMain", e)
            return await rejected({ Msg: e.Msg, title: e.title });
        }
    })
}

exports.generateToken = async (req, res, next) => {
    const payload = req.body
    const token = await jwt.sign(payload, process.env.GUEST_SECRET, { expiresIn: '50d' });
    var response = {
        access_token: token
    }
    return await Utils.ResponseHandler(true, 200, __("success"), __("GUEST_TOKEN_SUCCESS"), res, response)
}

exports.getUser = async (req, res, next) => {
    let user = req.user;
    let userId = req.params.id;
    if(user.username_edited<2){
        user.username_edited = 0
    }
    if (!user) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Unauthorized_user, __("UNAUTHORIZE_ACCESS"), __("UNAUTHORIZE_ACCESS"), res)
    }
    if (user.user_id != userId) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Unauthorized_user, __("UNAUTHORIZE_ACCESS"), __("UNAUTHORIZE_ACCESS"), res)
    }
    delete user.password;
    delete user.facebook_id;
    delete user.google_id;
    delete user.access_token;
    delete user.api_secret_key;
    delete user.customer_id;
    delete user.web_token;
    user.total_cash = (user.unused_amount+user.credits+user.bonus_cash);
    let response = {
        user: user
    }
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response)
},

    exports.logOut = async (req, res, next) => {
        let { user_id } = req.user;

        // let logout = await SQL.Users.updateUserTable(`set access_token = ${null}`, ` where user_id = ${user_id}`);
        let token = req.token;
        console.log("token is >>>>", req.token);

        token = token.toString()

        Utils.Redis.set(token, ' ', 'EX', Utils.RedisExpire.ACCESS_TOKEN)
        console.log("token is >>>>", req.token);
        let logout = await SQL.Users.rawQuery(` UPDATE bb_access_token set active = ? where user_id = ? order by row_id desc `, [0, user_id])
        console.log(logout);
        if (logout.affectedRows) {
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('LOGOUT_SUCCESS'), "logout success", res);
        } else {
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("LOGOUT_ERROR"), 'logout error', res)
        }
    }

exports.editProfile = async (options) => {
    return new Promise(async (resolve, rejected) => {
        let userId = options.user_id;
        // console.log("USerI is >>>",userId);

        if (!userId) return await rejected({ Msg: __('USER_NOT_FOUND'), title: 'user not found' });

        // check if user found
        let user = await SQL.Users.getUser(`where user_id = ${userId}`);
        user = user[0];
        //  console.log("USer is >>>", user);
        if (!user) return await rejected({ Msg: __('USER_NOT_FOUND'), title: 'Error' });
        // console.log("USer is  >>>", user);
        let name = user.name;
        let email = user.email;
        let emailVerified = user.email_verified;
        let phone = user.phone;

        let username = user.username;
        let nameBool = false,
            emailBool = false,
            phoneBool = false,
            usernameBool = false;

        let isGenderUpdate = false;
        let updateGender;


        if (user.username_edited == 2) {
            if (name) updateGender = { gender: options.gender };
            else updateGender = { gender: options.gender, name: options.name };
            let updatedProfileGender = await SQL.Users.updateProfile(userId, updateGender);
            console.log(updatedProfileGender);

            if (!updatedProfileGender) return await rejected({ Msg: __('UPDATE_USER_ERROR'), title: 'error' });
            else isGenderUpdate = true;

            console.log("isGenderUpdate >>>", isGenderUpdate)
            let loginDetailsGender = await SQL.Users.getUser(`where user_id = ${userId}`);
            loginDetailsGender = loginDetailsGender[0];
            return await resolve({ Msg: __('PROFILE_UPDATE_SUCCESS'), title: 'success', response: loginDetailsGender })
        }
        if (options.username && options.username != user.username && user.username_edited != 2) usernameBool = true;

        if (!name) nameBool = true;
        if (!email && !emailVerified) emailBool = true;
        if (!phone) phoneBool = true;

        // if (user.email || user.name || user.gender || user.dob) return await rejected({ Msg: __('FIELD_UPDATE_AT_ONCE'), title: 'fields update at once' });

        console.log("Name bool , emailBool, phoneBool usernameBool>>>", nameBool, emailBool, phoneBool, emailVerified, email, usernameBool);
        let required = {
            "dob": true,
            "gender": true,
            "address": false,
            "city": false,
            "state": false,
            "zipcode": false,
            "country": false,
            "image": false
        }
        try {
            if (nameBool) {
                // validate name, validateName(name, field, required=false, min=2, max=30)
                let validName = await Utils.ValidatorController.validateNameNew(options.name, "name", true, 2, 16);
                name = validName.response;
            } else name = " ";

            if (emailBool) {
                // validate email, validateEmail(email,required=false,unique=false);
                validEmail = await Utils.ValidatorController.validateEmail(options.email, true, false);
                if (validEmail.response) {
                    // check email existance (show errors only if app signup)
                    let emailExist = await SQL.Users.getUnique(`where email = '${validEmail.response}'`);
                    if (emailExist) return await rejected({ Msg: __('EMAIL_EXIST'), title: 'exist' })
                }
                email = validEmail.response
            } else email = " ";
            if (phoneBool) {
                // validate phone, validatePhone(phone, required=fasle, min=10, max=10);
                let validPhone = await Utils.ValidatorController.validatePhone(options.phone, true, 9, 11);
                if (validPhone.response) {
                    let phoneExist = await SQL.Users.getUnique(`where phone = ${validPhone.response}`);
                    if (phoneExist) return await rejected({ Msg: __('MOBILE_EXISTS'), title: "exist" });
                }
                phone = validPhone.response;
            } else phone = " ";
            if (usernameBool) {
                // validate username, validateUsername(value, required=false, min=8, max=16)
                validUsername = await Utils.ValidatorController.validateUsername(options.username, true);

                let usernameExist = await SQL.Users.getUnique(`where username = '${validUsername.response}'`);
                if (usernameExist) return await rejected({ Msg: __('USERNAME_EXIST'), title: 'exists' })
                username = validUsername.response
            } else username = " ";

            if (!nameBool && !emailBool && !usernameBool && !phoneBool) return await rejected({ Msg: __('NAME_EMAIL_USERNAME_PHONE_UPDATED_ONE_TIME'), title: 'update at once' })

            // validate dob, validateBirth(dob, required=false, minAge=18, maxAge=99)
            let validBirth = await Utils.ValidatorController.validateBirth(options.dob, required.dob, 18, 100);

            // validate gender, validateGender(gender, required=false)
            let validGender = await Utils.ValidatorController.validateGender(options.gender, required.gender);
            console.log("validGender and validBirth", validGender, validBirth);

            //update Now
            let update = {
                username: username,
                name: name,
                email: email,
                phone: phone,
                dob: validBirth.response,
                gender: validGender.response,
                username_edited: user.username_edited + 1
            }
            console.log("update >>>", update)
            let updatedProfile = await SQL.Users.updateProfile(userId, update);
            console.log(updatedProfile)
            if (!updatedProfile) return await rejected({ Msg: __('UPDATE_USER_ERROR'), title: 'error' })

            let loginDetails = await SQL.Users.getUser(`where user_id = ${userId}`);
            loginDetails = loginDetails[0];

            // return await resolve({Msg: __('PROFILE_UPDATE_SUCCESS') , title: 'Success', response: loginDetails})
            return await resolve({ Msg: __('PROFILE_UPDATE_SUCCESS'), title: 'success', response: loginDetails })

        } catch (e) {
            console.log("error is >>>", e);
            return await rejected({ Msg: e.Msg, title: e.title, response: e.response });
        }
    })
}

exports.editProfileV1 = async (options) => {
    return new Promise(async (resolve, rejected) => {
        let userId = options.user_id;
        // console.log("USerI is >>>",userId);

        if (!userId) return await rejected({ Msg: __('USER_NOT_FOUND'), title: 'user_id required' });

        // check if user found
        let user = await SQL.Users.getUser(`where user_id = ${userId}`);
        user = user[0];
        //  console.log("USer is >>>", user);
        if (!user) return await rejected({ Msg: __('USER_NOT_FOUND'), title: 'user required' });
        // console.log("USer is  >>>", user);
        let name = user.name;
        let email = user.email;
        let emailVerified = user.email_verified;
        let phone = user.phone;

        let username = user.username;
        let nameBool = false,
            emailBool = false,
            phoneBool = false,
            usernameBool = false;
        if (options.username && options.username != user.username && !user.username_edited) usernameBool = true;

        if (!name) nameBool = true;
        if (!email && !emailVerified) emailBool = true;
        if (!phone) phoneBool = true;

        if (user.email || user.name || user.gender || user.dob) return await rejected({ Msg: __('FIELD_UPDATE_AT_ONCE'), title: 'fields update at once' });

        console.log("Name bool , emailBool, phoneBool usernameBool>>>", nameBool, emailBool, phoneBool, emailVerified, email, usernameBool);
        let required = {
            "dob": true,
            "gender": true,
            "address": false,
            "city": false,
            "state": false,
            "zipcode": false,
            "country": false,
            "image": false
        }
        try {
            if (nameBool) {
                // validate name, validateName(name, field, required=false, min=2, max=30)
                let validName = await Utils.ValidatorController.validateNameNew(options.name, "name", true, 2, 30);
                name = validName.response;
            } else name = " ";

            if (emailBool) {
                // validate email, validateEmail(email,required=false,unique=false);
                validEmail = await Utils.ValidatorController.validateEmail(options.email, true, false);
                if (validEmail.response) {
                    // check email existance (show errors only if app signup)
                    let emailExist = await SQL.Users.getUnique(`where email = '${validEmail.response}'`);
                    if (emailExist) return await rejected({ Msg: __('EMAIL_EXIST'), title: 'exist' })
                }
                email = validEmail.response
            } else email = " ";
            if (phoneBool) {
                // validate phone, validatePhone(phone, required=fasle, min=10, max=10);
                let validPhone = await Utils.ValidatorController.validatePhone(options.phone, true, 9, 11);
                if (validPhone.response) {
                    let phoneExist = await SQL.Users.getUnique(`where phone = ${validPhone.response}`);
                    if (phoneExist) return await rejected({ Msg: __('MOBILE_EXISTS'), title: "exist" });
                }
                phone = validPhone.response;
            } else phone = " ";
            if (usernameBool) {
                // validate username, validateUsername(value, required=false, min=8, max=16)
                validUsername = await Utils.ValidatorController.validateUsername(options.username, true);

                let usernameExist = await SQL.Users.getUnique(`where username = '${validUsername.response}'`);
                if (usernameExist) return await rejected({ Msg: __('USERNAME_EXIST'), title: 'exists' })
                username = validUsername.response
            } else username = " ";

            if (!nameBool && !emailBool && !usernameBool && !phoneBool) return await rejected({ Msg: __('NAME_EMAIL_USERNAME_PHONE_UPDATED_ONE_TIME'), title: 'update at once' })

            // validate dob, validateBirth(dob, required=false, minAge=18, maxAge=99)
            let validBirth = await Utils.ValidatorController.validateBirth(options.dob, required.dob, 18, 100);

            // validate gender, validateGender(gender, required=false)
            let validGender = await Utils.ValidatorController.validateGender(options.gender, required.gender);
            console.log("validGender and validBirth", validGender, validBirth);

            //update Now
            let update = {
                username: username,
                name: name,
                email: email,
                phone: phone,
                dob: validBirth.response,
                gender: validGender.response
            }
            let updatedProfile = await SQL.Users.updateProfile(userId, update);
            console.log(updatedProfile)
            if (!updatedProfile) return await rejected({ Msg: __('UPDATE_USER_ERROR'), title: 'error' })

            let loginDetails = await SQL.Users.getUser(`where user_id = ${userId}`);
            loginDetails = loginDetails[0];

            // return await resolve({Msg: __('PROFILE_UPDATE_SUCCESS') , title: 'Success', response: loginDetails})
            return await resolve({ Msg: __('PROFILE_UPDATE_SUCCESS'), title: 'success', response: loginDetails })

        } catch (e) {
            console.log("error is >>>", e);
            return await rejected({ Msg: e.Msg, title: e.title, response: e.response });
        }
    })
}



////////,........How to Play...........////
exports.getHowToPlay = async (req, res, next) => {

    const how_to_data = await SQL.Users.getHowToPlay();
    const response = {
        how_to_play: how_to_data
    }
    //release connection after response
    const released = await db.on('release', (connection) => {
        console.log(connection.threadId);
    });

    //   console.log("released connection......", released);
    return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('HOW_TO_PLAY'), res, response);

}

//..........................get USer ..........................////
exports.getUserWalletDetails = async (req, res, next) => {
    let user_id = req.user.user_id;
    console.log("USer_id is >> ", user_id);

    if (!user_id) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('REQUIRED_FIELDS', { fields: `user_id, page` }), res);
    const where_clause = `where user_id = ${user_id}`;
    let walletDetails = await Utils.Redis.getAsync(Utils.Keys.CRIC_WALLET_DETAILS + user_id);
    console.log("walletDetails>>>", walletDetails)

    if (!walletDetails) {
        console.log("wallet details From DB");
        walletDetails = await SQL_QUERY_USER.getWalletDetails(where_clause);
        await Utils.Redis.set(Utils.Keys.CRIC_WALLET_DETAILS + user_id, JSON.stringify(walletDetails), 'EX', Utils.RedisExpire.CRIC_WALLET_DETAILS)

    } else {
        walletDetails = JSON.parse(walletDetails);
    }
    const response = {
        wallet: walletDetails.length ? walletDetails[0] : null
    }
    //   console.log("released connection......", released);
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("WALLET_DETAILS_SUCCESS"), res, response);
}

/////////////...................Get User Transaction history ....................////////////
exports.getUserTxnHistory = async (req, res, next) => {
    let { page, payment, txnType } = req.query;
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let user_id = user.user_id;

    // console.log("user_id >>", user_id);
    if (!user_id) return await Utils.ResponseHandler(false, Utils.StatusCodes.Success, 'Error', __('REQUIRED_FIELDS', { fields: `user_id` }), res);
    page = page ? page : 1;
    //paginate
    let perPage = 30;
    page = req.query.page ? req.query.page : 1;
    page = page == 0 || page < 0 ? 1 : page;
    let offset = ((perPage * page) - perPage);
    let bankDetails;
    let txnWithDrawHistory;
    let txnHistory;
    if (payment == 2) {
        // txnWithDrawHistory = await Utils.Redis.getAsync(Utils.Keys.USER_TXN_WIHDRAW + user_id + page);
        bankDetails = await SQL.Users.getBankDetails(user_id);
        // console.log("bankdetails>>>", bankDetails)
        if (!txnWithDrawHistory) {
            txnWithDrawHistory = await SQL.Users.getTxnHistory(user_id, perPage, offset, '4,7');
            // console.log("transaction withdraw history >>>", txnWithDrawHistory)
            await Utils.Redis.set(Utils.Keys.USER_TXN_WIHDRAW + user_id + page, JSON.stringify(txnWithDrawHistory), 'EX', Utils.RedisExpire.USER_TXN_WIHDRAW);
        } else {
            txnWithDrawHistory = JSON.parse(txnWithDrawHistory);
        }
    } else if (payment == 0) {
        txnHistory = await Utils.Redis.getAsync(Utils.Keys.CRIC_TXN_HISTORY + user_id + page);
        if (!txnHistory) {
            console.log("TXnHistory, txnWithDrawHistory From DB")
            txnHistory = await SQL.Users.getTxnHistory(user_id, perPage, offset);
            await Utils.Redis.set(Utils.Keys.CRIC_TXN_HISTORY + user_id + page, JSON.stringify(txnHistory), 'EX', Utils.RedisExpire.CRIC_TXN_HISTORY);
        } else {
            txnHistory = JSON.parse(txnHistory);
        }
    } else {
        txnHistory = await Utils.Redis.getAsync(Utils.Keys.CRIC_TXN_HISTORY + user_id + page);
        if (!txnHistory) {
            console.log("TXnHistory, txnWithDrawHistory From DB")
            txnHistory = await SQL.Users.getTxnHistory(user_id, perPage, offset);
            await Utils.Redis.set(Utils.Keys.CRIC_TXN_HISTORY + user_id + page, JSON.stringify(txnHistory), 'EX', Utils.RedisExpire.CRIC_TXN_HISTORY);
        } else {
            txnHistory = JSON.parse(txnHistory);
        }

        txnWithDrawHistory = await Utils.Redis.getAsync(Utils.Keys.USER_TXN_WIHDRAW + user_id + page);
        bankDetails = await SQL_QUERY_USER.getBankDetails(user_id);
        // console.log("bankdetails>>>", bankDetails)
        if (!txnWithDrawHistory) {
            txnWithDrawHistory = await SQL.Users.getTxnHistory(user_id, perPage, offset, txnType);
            // console.log("transaction withdraw history >>>", txnWithDrawHistory)
            await Utils.Redis.set(Utils.Keys.USER_TXN_WIHDRAW + user_id + page, JSON.stringify(txnWithDrawHistory), 'EX', Utils.RedisExpire.USER_TXN_WIHDRAW);
        } else {
            txnWithDrawHistory = JSON.parse(txnWithDrawHistory);
        }
    }
    let payment_config = await SQL.Users.getPaymentConfig();
    // console.log("userid", user_id)
    let pending = await SQL.Users.getWithDrawlsTable(`user_id=${user_id} and status IN(2,4,5)`);
    // console.log("Pending Request is>>>", pending);
    let userExtras = await SQL.Users.getUserExtras(user_id);
    let response = {
        txnHistory: txnHistory ? txnHistory : [],
        txnWithdrawHistory: txnWithDrawHistory ? txnWithDrawHistory : [],
        pending: pending ? pending : null,
        isPaytm_Linked: userExtras ? userExtras.is_paytm_linked : 0,
        bankDetails: bankDetails,
        negative_txn_types: "2,15,17,19,24,25,26",
        payment_config: payment_config
    }
    //     //release connection after response
    // const released = await db.on('release', (connection) => {
    //     console.log(connection.threadId);
    // });
    //   console.log("released connection......", released);
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __("TXN_HISTORY_SUCCESS"), res, response)
}
exports.changeLanguage = async (req, res, next) => {
    let userId = req.user.user_id;
    let lang = req.query.lang;
    if (!userId && !lang) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('WRONG_DATA'), res);
    if (!Utils.Constants.languageTypes.includes(lang)) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "invalid_language", __('WRONG_DATA'), res);
    let updateResult = await SQL.Users.updateUserDeviceTable(` current_language = '${lang}'`, ` user_id = ${userId}`);
    console.log(">>>>>>", updateResult)
    if (!updateResult) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "exist", __("LANGUAGE_UPDATE_ERROR"), res)
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('LANGUAGE_UPDATE_SUCCESS'), res)
}

exports.uploadUserImage = async (req, res, next) => {
    let userId = req.user.user_id;
    let fileName = req.myfilename;
    let fileFormat = ` png, jpg , jpeg ` //need to change as Constants

    console.log("req >>>>", req.files);
    console.log(">>>>>>", fileName);
    if (!fileName) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Wrong_data", __('WRONG_DATA'), res);

    if (req.mimetypeError) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "invalid file type", __('USER_IMAGE_ERROR') + fileFormat + ` format `, res)
    let uploadedImage = await SQL.Users.updateProfile(userId, { image: fileName });
    if (!uploadedImage) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Error", __('IMAGE_UPLOAD_ERROR'), res);
    let user = await SQL.Users.getUser(`where user_id = ${userId}`);
    user = user[0];
    let response = {
        user: user
    }
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('SUCCESS'), res, response);
}


//........................get User notifications last 7 days...........................////
exports.getUserNotification = async (req, res, next) => {
    let { page } = req.query;
    let user_id = req.user.user_id;
    //paginate
    let perPage = 30;
    page = req.query.page ? req.query.page : 1;
    page = page == 0 || page < 0 ? 1 : page;
    let offset = ((perPage * page) - perPage);

    if (!user_id || !page) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'ERROR', __('WRONG_DATA'));

    let user = await SQL.Users.getUser(`where user_id = ${user_id}`);
    user = user[0];
    console.log("users >>>>", user);


    let notifications = []
    console.log("Notifications Is ", user.notifications);
    if (!user.notifications == 0) {
        notifications = await Utils.Redis.getAsync(Utils.Keys.USER_NOTIFICATION + user_id + page);
        if (!notifications) {
            console.log("Notifications from DB");
            notifications = await SQL.Users.get_notification(user_id, perPage, offset);
            await Utils.Redis.set(Utils.Keys.USER_NOTIFICATION + user_id + page, JSON.stringify(notifications), 'EX', Utils.RedisExpire.USER_NOTIFICATION);
        } else {
            notifications = JSON.parse(notifications);
            console.log("Notifications from Reddis");

        }
        await SQL.Users.updateUserTable(`set notifications = 0`, `where user_id = ${user_id}`);

    } else {
        // notifications = await SQL.Users.get_notification(user_id, perPage, offset);
        notifications = await Utils.Redis.getAsync(Utils.Keys.USER_NOTIFICATION + user_id + page);
        if (!notifications) {
            console.log("Notifications from DB");
            notifications = await SQL.Users.get_notification(user_id, perPage, offset);
            await Utils.Redis.set(Utils.Keys.USER_NOTIFICATION + user_id + page, JSON.stringify(notifications), 'EX', Utils.RedisExpire.USER_NOTIFICATION);
        } else {
            notifications = JSON.parse(notifications);
            console.log("Notifications from Reddis");

        }
    }

    let response = {
        notifications: notifications,
        notification_count: notifications.length ? notifications.length : null
    }
    //release connection after response
    // const released = await db.on('release', (connection) => {
    //     console.log(connection.threadId);
    // });

    //   console.log("released connection......", released);
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'success', __("NOTIFICATION_SUCCESS"), res, response)
}

exports.getUserValidTickets = async (req, res, next) => {
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __('WRONG_DATA'), res);
    // let { user_id } = req.query;
    // if (!user_id) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __('WRONG_DATA'), res);
    let user_id = user.user_id;
    let forMatchTicket, anyMatchTicket;
    let activeTickets = await Utils.Redis.getAsync(Utils.Keys.USER_TICKETS + user_id);
    console.log("---->activeTickets >>>", activeTickets);
    if (!activeTickets) {
        console.log("ActiveTickets From Db..");
        activeTickets = await SQL.Users.getUserActiveTickets(user_id);
        await Utils.Redis.set(Utils.Keys.USER_TICKETS + user_id, JSON.stringify(activeTickets), 'EX', Utils.RedisExpire.USER_TICKETS);
    } else {
        activeTickets = JSON.parse(activeTickets);
        console.log("ActiveTickets From Reddis");
    }
    forMatchTicket = await activeTickets.filter(thisTicket => thisTicket.ticket_type == 1);
    anyMatchTicket = await activeTickets.filter(thisTicket => thisTicket.ticket_type == 2);

    let response = {
        forMatchTicket,
        anyMatchTicket
    }
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('TICKET_SUCCESS'), res, response);
};

exports.updateUserPanDetails = async (req, res, next) => {
    let user = req.user;
    console.log(user.user_id);
    if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    const { pan_no, dob, state } = req.body;
    let user_id = user.user_id;
    if (user.pan_verified == 1 || user.pan_verified == 2) return await Utils.ResponseHandler(false, 400, "PAN_EXISTS", __("PAN_EXISTS_SUBMITED"), res);
    let panRegex = /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/;
    if (!panRegex.test(pan_no)) {
        return await Utils.ResponseHandler(false, 400, "INVALID_PAN", __("INVALID_PAN"), res)
    };
    const userPanDetails = await SQL.Users.getUserPanDetails(`user_id = ${user_id}`);
    console.log('Exist_user....', userPanDetails);
    if (userPanDetails) {
        await SQL.Users.removeUserPanDetails(user_id)
    }
    let existingPan = await SQL.Users.getUserPanDetails(`pan_number = '${pan_no}'`);
    if (existingPan) {
        return await Utils.ResponseHandler(false, 400, "PAN_EXISTS", __("PAN_EXISTS"), res)
    }
    Utils.ValidatorController.validateBirth(dob, true, 18, 100).then(async success => {
        let taskData = {
            task_type: 2,
            user_id: user_id
        }
        let taskId = await SQL.Users.insertData(taskData, "bb_task_id");
        // console.log('taskId>>>', taskId);
        if (!taskId) return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
        let panData = {
            user_id: user_id,
            pan_number: pan_no,
            dob: dob,
            state: state,
            task_id: taskId.insertId,
            date_added: 'NOW()' //Mysql_dt
        }
        let panId = await SQL.Users.insertData2(panData, "bb_pan_details");
        // console.log('pandId>>>', panId);
        if (!panId) return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res);
        await SQL_QUERY_USER.updateUserTable(`set pan_verified = 2`, `where user_id = ${user_id}`);
        let attempts = await SQL.Users.getKyc(` user_id= ${user_id} and kyc_type = 1 `);
        // console.log('attempts>>',attempts);
        if (!attempts) attempts = 0;
        let totalAttempts = attempts.attempts;
        // console.log('totalAttempts', attempts);
        if (totalAttempts <= 4) {
            let taskData = {
                tasks: [{
                    type: "pan_verification",
                    task_id: taskId.insertId,
                    data: {
                        pan_number: pan_no,
                        pan_name: ''
                    }
                }]
            }
            rp({
                method: 'POST',
                uri: 'https://api.idfy.com/v2/tasks',
                body: taskData,
                headers: {
                    apikey: config.IDFY_KEY
                },
                json: true // Automatically stringifies the body to JSON
            }).then(async idfyResponse => {
                if (idfyResponse.status == 202) {
                    await SQL.Users.updateTableByField(`set request_id = '${idfyResponse.request_id}'`, `task_id = ${taskId.insertId}`, 'bb_task_id');
                    return await Utils.ResponseHandler(true, 200, __("success"), __("PAN_SUCCESS"), res)
                } else {
                    // console.log("inside else>>>>>")
                    await SQL.Users.updateUserTable(`set pan_verified = 3`, `where user_id = ${user_id}`);
                    //decrease kyc attempts
                    await SQL.Users.decreaseKycAttempts(user_id, 1);
                    return await Utils.ResponseHandler(true, 200, __("error"), __("SOME_ERROR"), res)
                }
            }, error => {
                return res.send({ error: error })
            }).catch(async e => {
                console.log('error in idfy call==>>> ', e);
                return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res, response)
            })
        } else {
            return await Utils.ResponseHandler(true, 200, __("success"), __("PAN_SUCCESS"), res)
        }
    }, async error => {
        return await Utils.ResponseHandler(false, 400, __("error"), error.Msg, res)
    }).catch(async e => {
        console.log('error in pan deatils update==>>> ', e);
        return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res, response)
    });
}
exports.getPanDetails = async (req, res) => {
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let panDetails = await SQL.Users.getPanDetails(user.user_id);
    let response = {
        phone_verified: user.phone_verified,
        pan: panDetails.length > 0 ? panDetails[0] : null,
    }
    return await Utils.ResponseHandler(true, 200, __("success"), __("success"), res, response)
}
exports.getAadharDetails = async (req, res) => {
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let aadharDetails = await SQL.Users.getAadharDetails(user.user_id);
    let response = {
        aadhaar_verified: user.aadhaar_verified,
        aadhar: aadharDetails.length > 0 ? aadharDetails[0] : null
    }
    return await Utils.ResponseHandler(true, 200, __("success"), __("success"), res, response)
}

exports.linkPaytmWallet = async (req, res) => {
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let userExtras = await SQL.Users.getUserExtras(user.user_id);
    let isPaytmLinked = false;
    if (userExtras) isPaytmLinked = userExtras.is_paytm_linked;
    if (!isPaytmLinked) {
        let linked = await SQL.Users.updatePaytmLinkedStatus(user.user_id);
        userExtras = await SQL.Users.getUserExtras(user.user_id);
        isPaytmLinked = userExtras.is_paytm_linked;
    }
    let response = {
        is_paytm_linked: isPaytmLinked
    }
    return await Utils.ResponseHandler(true, 200, __("success"), __("success"), res, response)
}

exports.acknowledgement = async (req, res, next) => {
    const { type, lang } = req.query;
    const where_clause = `type = ${type} and lang_type='${lang}'`
    let content = await SQL_QUERY_USER.get_user_acknowledge(where_clause);
    content = content[0];
    var response = { data: content }
    //release connection after response
    const released = await db.on('release', (connection) => {
        console.log(connection.threadId);
    });
    //   console.log("released connection......", released);
    return await Utils.ResponseHandler(true, 200, __("success"), __("success"), res, response)
}

/**
 * Api to apply the promo code
 */
exports.SignUpBonus = async (req, res, next) => {
    const user_id = req.user.user_id;
    let channel = req.body.channel;
    if (!channel) {
        channel = 'default'
    }
    let username = req.body.username;
    let promocode = req.body.promocode;
    username = username.trim().toLowerCase();
    let plateform = req.headers['platform'];
    let signUpVersionCode = req.headers['version'];
    if (!user_id) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Wrong data", __('WRONG_DATA'), res);
    if (!username && username == "undefined") return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Required", __('USERNAME_REQUIRED'), res);
    // check username existance (show errors only if app signup)
    let userWhere = `where username = '${username}' and user_id != ${user_id}`;
    const uniqueUsername = await SQL_QUERY_USER.getUser(userWhere);
    if (uniqueUsername.length > 0 && uniqueUsername != 'undefined') return await Utils.ResponseHandler(true, Utils.StatusCodes.Error, "exists", __('USERNAME_EXIST'), res);
    if (!signUpVersionCode) {
        signUpVersionCode = '1.0';
    }
    //Update user signup from
    let updateWhere = `where user_id = ${user_id} `;
    let updateColumn = `set signup_from = '${plateform}', signup_channel = '${channel}', signup_from_version = '${signUpVersionCode}'`;
    const updatedRecord = await SQL_QUERY_USER.updateUserRecordTable(updateWhere, updateColumn);
    if (updatedRecord) console.log('record update success');

    //promocode flow
    let bonus = signupBonusBenefits = 0;
    let promotionApplied = referralApplied = signupBonus = false;
    let redeemCode = false;
    let updateName = true;
    if (promocode) {
        console.log("Inside promocode......")
        let where = `where user_id = ${user_id} and transaction_type = ${10}`;
        // check if signup bonus already applied
        const creditData = await SQL_QUERY_USER.creditStateTable(where);
        if (!creditData || !creditData.length > 0) {
            where = `where promotion_code = '${promocode}' and promotion_type = ${2}`;
            var promotion = await SQL_QUERY_USER.getPromotionCodeTable(where);
            where = `where referral_code = '${promocode}'`
            var referralUser = await SQL.Users.getUser(where)
            // console.log('promotion----------------------->> ', promotion, referralUser);
            if (promotion && promotion.length > 0) {
                console.log('promotion-->> ', promotion, referralUser);

                let currentDateTime = Mysql_dt
                let promoStart = promotion[0].start_date;
                let promoEnd = promotion[0].end_date;
                if (promotion[0].status != 1) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'inactive', __('PROMOCODE_NOT_VALID'), res)
                else if (promoStart && promoStart > currentDateTime) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'not_started', __('PROMOCODE_NOT_VALID'), res);
                else if (promoEnd && promoEnd < currentDateTime) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'expired', __('PROMOCODE_NOT_VALID'), res)
                else promotionApplied = true;
                updateName = false;
            } else if (referralUser && referralUser.length > 0) {
                referralApplied = true;
                updateName = true;
                console.log("apply referal code =>>>");
            } else {
                console.log("apply redeem code =>>>");
                redeemCode = true
                updateName = false;
            }
        }
    } else if (Utils.AppConstraint.SIGNUP_BONUS) {
        // check if signup bonus already applied
        console.log("inside signUp Bonus")
        let where = `where user_id = ${user_id} and transaction_type = ${10}`;
        const creditData = await SQL.Users.creditStateTable(where);
        if (!creditData || !creditData.length > 0) {
            signupBonus = true;
            signupBonusBenefits = Utils.AppConstraint.REFER_TO
        }
    }
    /*
    redeem_code Logic
    capmpaign code logic
    */
    let redeemCodeBenifits = null;
    if (redeemCode) {
        await this.applyRedeemCode({
            code: promocode,
            user: user_id
        }).then(codeBenifts => {
            // console.log('benifits==>> ', codeBenifts);
            if (codeBenifts && codeBenifts.response)
                redeemCodeBenifits = codeBenifts.response
        }).catch(async e => {
            console.log('redeem update username error =', e);
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, e.title, e.Msg, res)
        })
    }

    if (updateName) {
        updateUsername(user_id, username).then(async (result) => {
            console.log('username updated ==>>  ', referralApplied);
            if (promotionApplied) {
                //store in table until (phone is vrified)
                let promoData = [user_id, promotion[0].promotion_id, 1, Mysql_dt, Mysql_dt];
                await SQL.Users.signUpPromoTable(promoData);

                let userRecords = await SQL.Users.getUserRecordTable(user_id);
                if (!userRecords[0].signup_promo_id) {
                    let updateRecords = `set signup_promo_id = ${promotion[0].promotion_id},  signup_promo_code = ${promotion[0].promotion_code} `;
                    await SQL.Users.updateUserRecordTable(updateRecords);
                }
            } else if (referralApplied) {
                let referralCode = referralUser[0].referral_code;
                let invitedBy = referralUser[0].user_id;
                let invitedTo = user_id;
                let bonus1 = Utils.AppConstraint.REFER_BY;
                let bonus2 = Utils.AppConstraint.REFER_TO;
                // configurable refer bonus to signup user if the referrer is affiliate (21 March 2019)
                if (referralUser[0].is_affiliate == 1) {
                    let affiliateReferBonus = referralUser[0].affiliate_refer_bonus;
                    bonus2 = affiliateReferBonus ? affiliateReferBonus : bonus2;
                }
                let referData = [referralCode, invitedBy, invitedTo, bonus1, bonus2, Utils.Mysql_dt];
                await SQL.Users.referralStatTable(referData);
                //update records
                let userRecords = await SQL_QUERY_USER.getUserRecordTable(user_id);
                // return res.send({ data: userRecords[0].referred_by });
                if (userRecords.length > 0 && !userRecords[0].referred_by) {
                    let updateRecords = `set referred_by = ${referralUser[0].user_id}, referred_code = '${referralUser[0].referral_code}'`;
                    let where = `where user_id = ${user_id}`;
                    await SQL.Users.updateUserRecordTable(where, updateRecords);
                }
            } else if (signupBonus) {
                //not here
            }
            //update data
            let where = `t1.user_id = ${user_id}`;
            const user = await SQL.Users.getUserLoginDetails(where, true);
            console.log("promotionApplied >>>>>>", promotionApplied);
            if (promotionApplied && user[0].phone_verified) {
                // check if promotion applied during signup
                if (user[0].signup_promo_id) {
                    let signUpPromoSuccess = await this.signupPromos(user_id) // still pending
                    // signUpPromoSuccess;
                }
            } else if (referralApplied && user[0].phone_verified) {
                // check if referred and referrals
                console.log("Inside Referral bonus  and Phone>>>>");
                if (user[0].referred_by) await this.giftReferrals(user_id)
            } else if (signupBonus && signupBonusBenefits && user[0].phone_verified) {
                console.log("Inside this.signupbonus");
                await this.signupBonus(user_id, signupBonusBenefits);
            }
            // get updated user
            where = `t1.user_id = ${user_id}`;
            let loginDetails = await SQL.Users.getUserLoginDetails(where);
            loginDetails = loginDetails[0];
            console.log("user_id----, api_secret>", loginDetails.user_id, loginDetails.api_secret_key)


            let oldAccessToken = await BridgeController.getAccessTokenFromPhp(loginDetails.user_id, loginDetails.api_secret_key);
            // console.log("accessToken>>>", oldAccessToken)
            loginDetails.accessToken = oldAccessToken.access_token;
            // console.log("loginDetails>>>", loginDetails.accessToken);


            const response = {
                user: loginDetails,
                code_benifits: redeemCodeBenifits
            }
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('USERNAME_UPDATE_SUCCESS'), res, response);

        }).catch(async e => {
            console.log('errorrrrr==>>. ', e);
            let message = e.message
            if (!message) {
                message = __('SOME_ERROR')
            }
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', message, res)
        })
    }
}

exports.signupWithPromocode = async (req, res) => {

}

exports.getPromotions = async (req, res, next) => {
    let { user_id } = req.user;
    let currentDate = Mysql_dt;
    if (!user_id) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('USER_NOT_FOUND'), res);
    let where = ` status = 1 and start_date <= '${currentDate}' and end_date>= '${currentDate}'`;
    let promotions = await Utils.Redis.getAsync(Utils.Keys.USER_PROMOTIONS);
    if (!promotions) {
        console.log("promo from Db")
        promotions = await SQL_QUERY_USER.getPromoContents(where);
        await Utils.Redis.set(Utils.Keys.USER_PROMOTIONS, JSON.stringify(promotions), 'EX', Utils.RedisExpire.USER_PROMOTIONS);
    } else {
        promotions = JSON.parse(promotions);
    }
    let response = {
        contents: promotions
    }
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('PROMOTION_SUCCESS'), res, response);
}
exports.checkPomocode = async (req, res) => {
    let user = req.user;
    let promoCode = req.body.code;
    let amount = req.body.amount;
    let isMobile = req.body.is_mobile;
    if (!user || !promoCode) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let promotionDetails = await SQL.Users.getPromotionCodeTable(`where promotion_code='${promoCode}' and (promotion_type = 1 or promotion_type=4)`)
    if (!promotionDetails || promotionDetails.length <= 0) return await Utils.ResponseHandler(false, 400, "PROMOTION_INVALID", __("PROMOTION_INVALID"), res)
    promotionDetails = promotionDetails[0];
    let currentDateTime = moment().format('YYYY-MM-DD h:mm:ss')
    let promotionStartDate = moment(promotionDetails.start_date).format('YYYY-MM-DD h:mm:ss');
    let promotionEndDate = moment(promotionDetails.end_date).format('YYYY-MM-DD h:mm:ss');
    if (promotionDetails.status != 1) return await Utils.ResponseHandler(false, 400, "inactive", __("PROMOTION_INVALID"), res);
    if (promotionStartDate && validator.isAfter(promotionStartDate, currentDateTime)) return await Utils.ResponseHandler(false, 400, "not_started", __("PROMOTION_INVALID"), res);
    if (promotionEndDate && validator.isBefore(promotionEndDate, currentDateTime)) return await Utils.ResponseHandler(false, 400, "expired", __("PROMOTION_EXPIRED"), res);
    /**
     * @isMobile if promocode is applicable on mobile apps only
     */
    let isAppOnly = promotionDetails.app_only;
    if (isAppOnly && isMobile != 1) return await Utils.ResponseHandler(false, 400, "non_app", __("PROMOTION_INVALID"), res);

    /**
     * @amount Check for minimum deposit limit
     */
    amount = amount ? amount : 0
    if (amount && amount < promotionDetails.minimum_deposit) return await Utils.ResponseHandler(false, 400, "min_deposit", __("PROMOTION_MIN_DEPOSIT", { amount: promotionDetails.minimum_deposit }), res);

    let usageType = promotionDetails.used_type;
    if (usageType == Utils.Constants.promoUsagestypes.singleUse) {
        let used = await SQL.Users.getTxn(`user_id= ${user.user_id} and status IN(1, 0)`);
        if (used && used.length > 0) return await Utils.ResponseHandler(false, 400, "non_app", __("PROMOTION_MAX_USE"), res);
    } else if (usageType == Utils.Constants.promoUsagestypes.firstTimeDeposit) {
        let usedTxns = await SQL.Users.getTxn(`user_id=${user.user_id} and status IN(1, 0)`);
        if (usedTxns || usedTxns.length) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("not_first_time"), __("PROMO_NOT_FIRST_TIME_USER"), res)
    } else if (usageType == Utils.Constants.promoUsagestypes.maxTimes) {
        let maxUse = promotionDetails.custom_numbers;
        let usedCount = await SQL.Users.getPromoStatsCount(`user_id=${user.user_id} and promotion_id = ${promotionDetails.promotion_id}`);
        if (usedCount.length >= maxUse) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("fully_used"), __("PROMOTION_MAX_USE"), res)
    }
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("Promo code applied"), res, { promotion: promotionDetails })
}

exports.signupPromos = async (user_id) => {
    let where = `where user_id = ${user_id}`
    const ListSignupPromo = await SQL_QUERY_USER.getSignUpPromoTable(where);

    if (!ListSignupPromo[0]) return false

    if (ListSignupPromo[0].status != 1) return true;

    //mark it as used
    let updateData = `set status = 0`;
    where = `where user_id = ${user_id}`;
    await SQL_QUERY_USER.updateSignUpPromo(updateData, where);

    let promotionId = ListSignupPromo[0].promotion_id;

    if (promotionId) return false

    //get promocode
    where = `where user_id = ${promotionId}`;
    let promotion = await SQL_QUERY_USER.getPromotionCodeTable(where)
    if (!promotion && promotion[0].promotion_type != 2) return false;

    let currentDateTime = Mysql_dt();
    let promoStart = promotion[0].start_date;
    let promoEnd = promotion[0].end_date;

    if (promotion[0].status != 1) return false;

    else if (promoStart && promoStart > currentDateTime) return false;
    else if (promoEnd && promoEnd < currentDateTime) return false;

    let bonus = promotion[0].maximum_discount + 0;
    if (!bonus) return false;

    //add Bonus
    let userEntity = { user_id: user_id, bonus_cash: bonus };
    const userUpdated = await SQL_QUERY_USER.userAddBonusCash(userEntity);

    //apply promocode
    let statsData = [user_id, bonus_cash, amount, 5, 'Signup Bonus'];
    const statsAdded = await SQL_QUERY_USER.insertCreditStats(statsData);

    // maintain promotion stats
    let promoStatsData = [promotionId, user_id];
    const promoStatsAdded = await SQL_QUERY_USER.addPromoStats(promoStatsData);

    // add to bonus stats
    if (Utils.AppConstraint.BONUS_EXPIRY) {
        let bonusStatsData = [user_id, bonus, 'signup_promo'];
        return await SQL_QUERY_USER.addBonusStats(bonusStatsData);
    }
    return true;

}



exports.giftReferrals = async (user_id) => {
    // check if referred by someone
    console.log("Inside gift referrals");
    let where, updateData;
    let currentDate = Mysql_dt;
    where = `where invited_to = ${user_id} and status_2 = ${2}`;
    const referred = await SQL.Users.getReferralStat(where);

    if (referred && referred.length > 0) {
        let row_id = referred[0].row_id;
        let invitedBy = referred[0].invitedBy;
        let bonus1 = referred[0].bonus_1 + 0;
        let bonus2 = referred[0].bonus_2 + 0;

        //update referred status
        updateData = `set status_2 = ${1}, date_2 ='${currentDate}'`;
        where = `where row_id = ${row_id}`;
        const updated = await SQL.Users.updateReferralStats(updateData, where);

        if (updated && bonus2) {
            let userEntity = { user_id: user_id, bonus_cash: bonus };
            const userUpdated = await SQL_QUERY_USER.userAddBonusCash(userEntity);
            // add to transaction history
            let statsData = [user_id, bonus2, bonus2, 8, "You have Been referred"];

            const statsAdded = await SQL_QUERY_USER.insertCreditStats(statsData);

            // add to bonus stats
            if (Utils.AppConstraint.BONUS_EXPIRY) {
                let bonusStatsData = [user_id, bonus2, "referred"]
                return await SQL_QUERY_USER.addBonusStats(bonusStatsData);
            }

        }

        // add bonus to referral user
        where = `where user_id = ${invitedBy}`;
        let invitor = await SQL.Users.getUser(where);

        //if Affiliate
        if (invitor[0].is_affiliate == 1) {

            let affiliateData = [invitedBy, user_id];
            await SQL_QUERY_USER.getAffiliate(affiliateData);

            // update referred status
            updateData = `set bonus_1 = ${0}, status_1 = ${1}, date_1 = ${Mysql_dt()} `;
            where = `where row_id = ${row_id}`;
            const updated = await SQL_QUERY_USER.updateReferralStats(updateData, where);

        }
    }
    return true;

}
exports.signupBonus = async (user_id, bonusAmount) => {
    // check if not referred
    let updateData;
    let where = `where invited_to = ${user_id}`;
    let referred = await SQL_QUERY_USER.getReferralStat(where);

    if (referred.length > 0) return false;

    // check if signup promo applied
    where = `where user_id = ${user_id}`;
    const ListSignUpPromo = await SQL.Users.getSignUpPromoTable(where);

    if (ListSignUpPromo[0]) return false;

    bonus = bonusAmount;

    //add bonus
    let userEntity = { user_id: user_id, bonus_cash: bonus };
    const userUpdated = await SQL.Users.userAddBonusCash(userEntity, true);

    // add to transaction history
    let statsData = [user_id, bonus_cash, amount, 5, 'Signup Bonus'];
    const statsAdded = await SQL.Users.insertCreditStats(statsData);

    if (Utils.AppConstraint.BONUS_EXPIRY) {
        let bonusStatsData = [user_id, bonus, 'signup_promo'];
        return await SQL.Users.addBonusStats(bonusStatsData);
    }
    return true
}


exports.applyRedeemCode = async (options) => {
    return new Promise(async (resolve, rejected) => {
        var capmpaignCode = options.code;
        var userDetails = options.user
        console.log("userDetails>>>>", userDetails);
        if (!userDetails || !capmpaignCode) {
            return await rejected({ Msg: __("USER_AND_CAMPAIGN"), title: 'error' });
        }
        let campgainDetails = await SQL.Users.getCampaignCode(` code = '${capmpaignCode}' AND status = '1' `);
        if (!campgainDetails || !campgainDetails.length > 0) {
            return await rejected({ Msg: __('INVALID_REDEEM'), title: 'Invalid' });
        }
        campgainDetails = campgainDetails[0];

        if (campgainDetails.is_used != 0) return await rejected({ Msg: __('REDEEM_ALREADY_APPLIED'), title: 'Already Applied' });

        let usedStatus = await SQL.Users.getPromotionCodeEvents(` user_id = ${userDetails} and event_id = ${campgainDetails.event_id} `);

        let isIncludes = config.CAMPAIN_EVENTS.includes(campgainDetails.event_id);
        console.log(isIncludes)
        if (isIncludes) {
            let eventIds = config.CAMPAIN_EVENTS.join(',');
            usedStatus = await SQL.Users.getPromotionCodeEvents(` user_id = ${userDetails}`, eventIds);
            console.log("USed status is>>>", usedStatus);
        }

        if (usedStatus.length >= 2) return await rejected({ Msg: __('ALREADY_PARTICIPATED'), title: 'error' })

        let currentDateTime = Utils.DateTime.gmtDate;
        console.log("currentdate >>>", currentDateTime)
        let currentDateIST = moment().format('YYYY-MM-DD h:mm:ss');
        // console.log('current DateTime is', currentDateTime);


        let isExpired = await SQL.Users.getExpiry(capmpaignCode)
        isExpired = isExpired.expired;
        if (isExpired) return await rejected({ Msg: __("REDEEM_EXPIRED"), title: 'expired' });

        let unusedAmount = bonousAmount = winningAmount = tickets = 0;
        let bonousStatsData = unusedStatsData = winningStatsData = ticketStatsData = false;

        if (campgainDetails.unused_amount) {
            unusedAmount = campgainDetails.unused_amount;
            unusedStatsData = {
                'user_id': userDetails,
                'unused_cash': unusedAmount,
                'amount': unusedAmount,
                'transaction_date': 'NOW()', //currentDateTime,
                'transaction_type': Utils.Constants.txnTypes.unusedAmount,
                'transaction_message': Utils.Constants.txnMessages.unusedAmount
            }
        }
        if (campgainDetails.bonus_amount) {
            bonousAmount = campgainDetails.bonus_amount;
            bonousStatsData = {
                'user_id': userDetails,
                'bonus_cash': bonousAmount,
                'amount': bonousAmount,
                'transaction_date': 'NOW()', //currentDateTime,
                'transaction_type': Utils.Constants.txnTypes.bonousAmount,
                'transaction_message': Utils.Constants.txnMessages.bonousAmount
            }
        }
        if (campgainDetails.winning_amount) {
            winningAmount = campgainDetails.winning_amount;
            winningStatsData = {
                'user_id': userDetails,
                'real_cash': winningAmount,
                'amount': winningAmount,
                'transaction_date': 'NOW()', //currentDateTime,
                'transaction_type': Utils.Constants.txnTypes.winningAmount,
                'transaction_message': Utils.Constants.txnMessages.winningAmount
            }
        }
        if (campgainDetails.tickets) {
            tickets = campgainDetails.tickets;

            console.log("campaignTickets are>>>>>", tickets);

            try {
                let allotedTicketUsers = await this.allocateTicketToUser(tickets, userDetails);
                console.log("alloted tickets", allotedTicketUsers);
            } catch (e) {
                return await rejected({ Msg: e.Msg, title: e.title });
            }
        }
        let result = await SQL.Users.userAddCash(unusedAmount, bonousAmount, winningAmount, userDetails);
        if (!result) return await rejected({ Msg: __('SOME_ERROR'), title: 'error' });

        if (bonousStatsData) {
            let statsAdded = await SQL.Users.insertData2(bonousStatsData, "bb_credit_stats");
            let bonusStatsData = {
                'user_id': userDetails,
                'bonus_amount': bonousAmount,
                'bonus_type': "redeem bonous",
                'date_added': 'NOW()', //moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss'),
                'modified_date': 'NOW()', //moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss'),
                'bonus_timestamp': Math.floor(Date.now() / 1000)
            }
            let bonusStats = await SQL.Users.insertData2(bonusStatsData, "bb_bonus_stats");

        }
        if (winningStatsData) {
            let statsAdded = await SQL.Users.insertData2(winningStatsData, "bb_credit_stats");
        }
        if (unusedStatsData) {
            let statsAdded = await SQL.Users.insertData2(unusedStatsData, "bb_credit_stats");
        }
        console.log("Current date IST>>>", currentDateIST);

        let eventCodeUpdateResult = await SQL.Users.updatePromoEventCodes(`is_used = ${2}, user_id = ${userDetails}, used_at = '${currentDateIST}'`, `code = '${capmpaignCode}'`);
        console.log("Event code Updated Result,>>>", eventCodeUpdateResult);

        if (!eventCodeUpdateResult) return await rejected({ Msg: __('SOME_ERROR'), title: 'error' })
        let eventUpdateResult = await SQL.Users.updatePromoTable(campgainDetails.event_id);
        console.log("event update result>>>>", eventUpdateResult);

        if (!eventUpdateResult) return await rejected({ Msg: __('SOME_ERROR'), title: 'error' });

        let response = {
            unused_amount: campgainDetails.unused_amount,
            bonus_amount: campgainDetails.bonus_amount,
            winning_amount: campgainDetails.winning_amount,
            message: campgainDetails.message,
            message_in_hindi: campgainDetails.message_in_hindi,
            tickets: campgainDetails.tickets
        }
        return await resolve({ Msg: __('REDEEM_CODE_SUCCESS'), title: 'Success', response: response });

    })
}

exports.allocateTicketToUser = async (ticketsStr, userId) => {
    return new Promise(async (resolve, rejected) => {
        if (!userId) return await rejected({ Msg: __('WRONG_DATA'), title: 'wrong_data' });
        if (!ticketsStr) return await rejected({ Msg: __('WRONG_DATA'), title: 'wrong_data' });

        let tickets = await SQL.Users.getMultipleTickets(ticketsStr);
        console.log("Multitickets are >>>>", tickets);
        if (!tickets.length > 0) return await rejected({ Msg: 'Tickets_Not_found', title: 'wrong_data' });
        let bulkValues = [];
        for (let ticket of tickets) {
            let type = ticket.ticket_type;
            let playType = ticket.play_type;
            let currentDate = Mysql_dt;
            let ticketId = ticket.ticket_id;
            let ticketExpiry
            if (type == 1) ticketExpiry = ticket.ticket_expiry;
            else {
                let date = new Date();

                // add 30 day
                let newDate = new Date(date.setDate(date.getDate() + 30)).toISOString().slice(0, 19).replace('T', ' ');
                ticketExpiry = newDate;
            }

            console.log("ticket expiry is>>>>", ticketExpiry);

            let values = [ticketId, userId, 1, type, playType, ticketExpiry, currentDate, currentDate];

            await bulkValues.length > 0 ? bulkValues.push(values) : bulkValues.push(values);
        }
        let InsertedTickets = await SQL.Users.UserTicketInsertOrIgnore(bulkValues);
        console.log("Result is>>>>", InsertedTickets);
        if (!InsertedTickets) return await rejected({ Msg: "Error to Insert user_tickets", title: 'error' });

        else return await resolve(InsertedTickets);
    })

}

exports.verifyIFSC = async (req, res) => {
    try {
        let ifsc = req.params.ifsc;
        if (!ifsc) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __("WRONG_DATA"), res);
        rp({
            method: 'GET',
            uri: `https://ifsc.razorpay.com/${ifsc}`
        }).then(success => {
            if (success) {
                let response = {
                    data: JSON.parse(success)
                }
                return Utils.ResponseHandler(true, Utils.StatusCodes.Success, "success", __("success"), res, response)
            } else
                return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "failed", __("INVALID_IFSC"), res)
        }, error => {
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "failed", __("INVALID_IFSC"), res)
        })
    } catch (error) {
        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "error", __("SOME_ERROR"), res)
    }
}

exports.verifyBank = async (req, res) => {
    let user = req.user;
    let { account, ifsc, bank, branch } = req.body;
    if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __("WRONG_DATA"), res);
    let userId = user.user_id;

    if (!account || !ifsc || !bank || branch) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __("WRONG_DATA"), res);
    }

    if (user.bank_verified == 1 || user.bank_verified == 2) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "BANK_DETAILS_SUBMITED", __("BANK_DETAILS_SUBMITED"), res);
    let panDetails = await SQL.Users.getUserPanDetails(`user_id = ${userId}`);
    if (!panDetails || user.pan_verified == 3) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'PAN_NOT_FOUND', __("PAN_NOT_FOUND"), res);
    let bankDetails = await SQL.Users.getBankDetails(`user_id = ${userId}`);
    if (bankDetails) {
        await SQL.Users.removeBankDetails(userId);
        ///TODO: Delete bank image from s3 also
    }
}


//login User with Number.....
exports.LoginWithNumber = async (req, res, next) => {
    let usernameStr = randomstring.generate({
        length: 11,
        charset: 'alphanumeric',
        capitalization: 'lowercase',
    });
    let { mobile, promocode } = req.body;
    mobile = mobile.toString();
    let googleId = req.body.google_id;
    let keyHash = req.body.key_hash;
    let fromLink = req.body.from_link;
    let plateform = req.headers['platform'];
    let signUpVersionCode = req.headers['version'];
    if (!keyHash) keyHash = "";
    console.log(googleId)
    let facebookId = req.body.facebook_id;

    console.log("Mobile >>", mobile);
    // var isValidPhone = Utils.Validators.validatePhone(mobile);
    if (!mobile || mobile.length != 10) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("Wrong_data"), __("invalid_phone"), res)
    }
    if(!/^\d/.test(mobile) || mobile.charAt(0) == 0){
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("Wrong_data"), __("invalid_phone"), res)
    }
    let initiatUser = await SQL.Users.getUserInitiatsByPhone(mobile, "user_id");
    let userDetails;
    if(initiatUser.length >0){
        initiatUser = initiatUser[0];
        console.log('user from initiated table user_id');
        userDetails = await SQL.Users.getUser(` where user_id='${initiatUser.user_id}' `);
    }else{
        userDetails = await SQL.Users.getUser(` where phone='${mobile}' `);
    }
    userDetails = userDetails[0];

    //#########################PROMOCOE CHECK ##################################
    let bonus = signupBonusBenefits = 0;
    let promotionApplied = referralApplied = signupBonus = false;
    let redeemCode = false;
    let updateName = true;
    if (promocode) {
        console.log("Inside promocode......")
        // check if signup bonus already applied
        let where = `where promotion_code = '${promocode}' and promotion_type = ${2}`;
        var promotion = await SQL_QUERY_USER.getPromotionCodeTable(where);
        where = `where referral_code = '${promocode}'`
        var referralUser = await SQL.Users.getUser(where)
        // console.log('promotion----------------------->> ', promotion, referralUser);
        if (promotion && promotion.length > 0) {
            console.log('promotion-->> ', promotion, referralUser);

            let currentDateTime = await Utils.CurrentDate.currentDate();
            let promoStart = promotion[0].start_date;
            let promoEnd = promotion[0].end_date;
            if (promotion[0].status != 1) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'inactive', __('PROMOCODE_NOT_VALID'), res)
            else if (promoStart && promoStart > currentDateTime) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'not_started', __('PROMOCODE_NOT_VALID'), res);
            else if (promoEnd && promoEnd < currentDateTime) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'expired', __('PROMOCODE_NOT_VALID'), res)
            else promotionApplied = true;
            updateName = false;
        } else if (referralUser && referralUser.length > 0) {
            referralApplied = true;
            updateName = true;
            console.log("apply referal code =>>>");
        } else {
            console.log("apply redeem code =>>>");
            redeemCode = true
            updateName = false;
            if(fromLink ==1){
                redeemCode = false;
                promocode = false;
            }
        }

    } else if (Utils.AppConstraint.SIGNUP_BONUS) {
        // check if signup bonus already applied
        // console.log("    signUp Bonus")
        // let where = `where user_id = ${user_id} and transaction_type = ${10}`;
        // const creditData = await SQL.Users.creditStateTable(where);
        // if (!creditData || !creditData.length > 0) {
        //     signupBonus = true;
        //     signupBonusBenefits = Utils.AppConstraint.REFER_TO
        // }
    }
    let redeemCodeData = null;
    if (redeemCode) {
        let capmpaignCode = promocode.trim()
        let campgainDetails = await SQL.Users.getCampaignCode(` code = '${capmpaignCode}' AND status = '1' `);
        console.log('sssssssssss', campgainDetails, capmpaignCode);
        campgainDetails = campgainDetails[0];
        if (!campgainDetails) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'not_started', __('PROMOCODE_NOT_VALID'), res);
        }
        if (campgainDetails.is_used != 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'not_started', __('REDEEM_ALREADY_APPLIED'), res);
        let isIncludes = config.CAMPAIN_EVENTS.includes(campgainDetails.event_id);
        let isExpired = await SQL.Users.getExpiry(capmpaignCode)
        isExpired = isExpired.expired;
        if (isExpired) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'not_started', __('REDEEM_EXPIRED'), res);
        if (userDetails)
            return await Utils.ResponseHandler(false, Utils.StatusCodes.promocode_invalid, 'not_started', __('REGISTERED_PROMO'), res);
    }


    //#########################PROMOCOE CHECK ##################################

    if (userDetails) {
        if(referralApplied && req.body.from_link != 1)  return await Utils.ResponseHandler(false, Utils.StatusCodes.promocode_invalid, 'not_started', __('REGISTERED_PROMO'), res);

        console.log("Inside exist Userdetails >>", userDetails)
        // const userMobile = await SQL.Users.rawQuery(`SELECT * FROM bb_mobile_otp WHERE mobile = ? LIMIT 1`, mobile);
        // console.log('=====>>>>>   ', userMobile);
        const userOtp = otp();


        /**
         * need to template whitelist <#>
         */
        Services.Msg91.SendViaBulkSMS(mobile, ` Your one time password is ${userOtp} for request placed on Ballebaazi. ${keyHash} `, async (err, success) => {
            if (err) {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("SOME_ERROR"), __("SOME_ERROR"), res)
            }
            const sql = ` update bb_mobile_otp set invalid_attempt = ?, otp = ?, status = ?, modified_date = NOW() where user_id = ${userDetails.user_id} `;
            // let date = await Utils.CurrentDate.currentDate()
            await SQL.Users.rawQuery(sql, [0, userOtp, 1]);
            // const sql2 = 'SELECT * FROM bb_mobile_otp WHERE user_id = ?';
            // const otpDoc = await SQL.Users.rawQuery(sql2, userMobile[0].user_id);
            // const otpDoc = await SQL.Users.rawQuery(sql2, userMobile[0].user_id);
            if (googleId) await SQL.Users.updateProfile(userDetails.user_id, { 'google_id': googleId });
            if (facebookId) await SQL.Users.updateProfile(userDetails.user_id, { 'facebook_id': facebookId });
            var response = {
                user: {
                    user_id: userDetails.user_id,
                    invalid_attempt: 0,
                    phone: userDetails.phone
                }
            }
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("otp_success"), res, response)
        })
    } else {
        console.log('adding new user in db');

        let referralCode = randomstring.generate({
            length: 8,
            charset: 'alphanumeric',
            capitalization: 'uppercase'
        });
        let apiKey = await jwt.sign({
            type: 'api_secret',
            phone: mobile
        }, process.env.API_SECRET_KEY);
        apiKey = apiKey.slice(20, 60);
        const user_doc = await SQL.Users.rawQuery('INSERT INTO bb_users(username, password, last_contest_date, phone, registered_date, referral_code, modified_date, api_secret_key ) VALUES(?, ?, NOW(), ?, NOW(), ?, NOW(), ?) ', [usernameStr, passwordStr, mobile, referralCode, apiKey])
        let oauthSecret = await bycrypt.hash(apiKey, 14);
        await SQL.Users.rawQuery('INSERT INTO oauth_users(username, password, first_name, last_name) VALUES(?, ?, ?, ?)', [user_doc.insertId, oauthSecret, "", ""])
        await SQL.Users.rawQuery('INSERT INTO bb_user_initiates(user_id, facebook_id, google_id, phone, referral_code) VALUES(?, ?, ?, ?, ?)',[user_doc.insertId, facebookId, googleId, mobile, referralCode]);

        const userOtp = otp();
        Services.Msg91.SendViaBulkSMS(mobile, `Your one time password is ${userOtp} for request placed on BalleBaazi`, async (err, success) => {
            if (err) {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("SOME_ERROR"), __("SOME_ERROR"), res, otpDoc)
            }
            // console.log('====>>> success', success);
            // const sql = 'UPDATE bb_mobile_otp SET otp = ?, invalid_attempt = ? WHERE row_id = ?';
            const sql2 = 'INSERT INTO bb_mobile_otp(user_id, mobile, otp, expiry, modified_date, date_added) VALUES(?, ?, ?, NOW(), NOW(), NOW())';
            const user_mobile_saved = await SQL.Users.rawQuery(sql2, [user_doc.insertId, mobile, userOtp]).catch(err => console.log(err))
            // const otpDoc = await SQL.Users.rawQuery(`SELECT * FROM bb_mobile_otp WHERE mobile = ?`, mobile);
            if (googleId) await SQL.Users.updateProfile(user_doc.insertId, { 'google_id': googleId });
            if (facebookId) await SQL.Users.updateProfile(user_doc.insertId, { 'facebook_id': facebookId });
            var response = {
                user_id: user_doc.insertId,
                invalid_attempt: 0,
                phone: mobile
            }
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("otp_success"), res, response)
        })
    }
}

//Verify user with OTP
exports.postVerifyOtp = async (req, res, next) => {
    let maxAttempt = config.MAX_INVALID_OTP_ATTEMPTS;
    const { phone, otp, user_id } = req.body;
    let promocode = req.body.promocode;
    let current_language = req.body.language;
    let fromLink = req.body.from_link;
    // console.log(otp, userId)
    let mobileOTP;
    if(user_id){
        mobileOTP = await SQL.Users.getMobileByUserId(user_id);
    }else{
        mobileOTP = await SQL.Users.getMobileOtp(phone);
    }
    console.log("mobile otp >>>", mobileOTP);
    if (!mobileOTP) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("Wrong_data"), __("Wrong_data_recived"), res)
    if (mobileOTP.status != 1) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("Wrong_data"), __("Wrong_data_recived"), res)
    }
    if (mobileOTP.invalid_attempt < maxAttempt) {
        /* New Changes add configs */
        let userId = mobileOTP ? mobileOTP.user_id : null
        let configData = await SupportController.getConfig2({
            user_id: userId
        })
        // console.log("configData >>>", configData)
        console.log("Inside attempt")
        if (parseInt(mobileOTP.otp) === parseInt(otp)) {

            let user = await SQL.Users.getUserDetails(mobileOTP.user_id)
            if (!user) {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("error"), __("ACCESS_DENIED"), res)
            }

            //##################PROMOCODE CHECK ###################################
            //promocode flow
            let bonus = signupBonusBenefits = 0;
            let promotionApplied = referralApplied = signupBonus = false;
            let redeemCode = false;
            let updateName = true;
            let promoBonusStats = false;
            let redeemBonusStats = false;
            let referralBonusStats = false;
            if (promocode) {
                console.log("Inside promocode......")
                let where = `where user_id = ${userId} and transaction_type = ${10}`;
                // check if signup bonus already applied
                const creditData = await SQL_QUERY_USER.creditStateTable(where);
                if (!creditData || !creditData.length > 0) {
                    where = `where promotion_code = '${promocode}' and promotion_type = ${2}`;
                    var promotion = await SQL_QUERY_USER.getPromotionCodeTable(where);
                    where = `where referral_code = '${promocode}'`
                    var referralUser = await SQL.Users.getUser(where)
                    // console.log('promotion----------------------->> ', promotion, referralUser);
                    if (promotion && promotion.length > 0) {
                        console.log('promotion-->> ', promotion, referralUser);

                        let currentDateTime = await Utils.CurrentDate.currentDate();
                        let promoStart = promotion[0].start_date;
                        let promoEnd = promotion[0].end_date;
                        if (promotion[0].status != 1) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'inactive', __('PROMOCODE_NOT_VALID'), res)
                        else if (promoStart && promoStart > currentDateTime) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'not_started', __('PROMOCODE_NOT_VALID'), res);
                        else if (promoEnd && promoEnd < currentDateTime) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'expired', __('PROMOCODE_NOT_VALID'), res)
                        else promotionApplied = true;
                        updateName = false;
                    } else if (referralUser && referralUser.length > 0) {
                        referralApplied = true;
                        updateName = true;
                        console.log("apply referal code =>>>");
                    } else {
                        console.log("apply redeem code =>>>");
                        redeemCode = true
                        updateName = false;
                        if(fromLink ==1){
                            redeemCode = false;
                            promocode = false;
                        }
                    }
                }
            } else if (Utils.AppConstraint.SIGNUP_BONUS) {
                // check if signup bonus already applied
                console.log("inside signUp Bonus")
                let where = `where user_id = ${userId} and transaction_type = ${10}`;
                const creditData = await SQL.Users.creditStateTable(where);
                if (!creditData || !creditData.length > 0) {
                    signupBonus = true;
                    signupBonusBenefits = Utils.AppConstraint.REFER_TO
                }
            }
            /*
            redeem_code Logic
            capmpaign code logic
            */
            let redeemCodeBenifits = null;
            if (redeemCode) {
                await this.applyRedeemCode({
                    code: promocode,
                    user: userId
                }).then(codeBenifts => {
                    // console.log('benifits==>> ', codeBenifts);
                    redeemBonusStats = true
                    if (codeBenifts && codeBenifts.response)
                        redeemCodeBenifits = codeBenifts.response
                }).catch(async e => {
                    console.log('redeem update username error =', e);
                    return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, e.title, e.Msg, res)
                })
            }
            //##################PROMOCODE CHECK ###################################

            //apply referral here
            let bonusStatsAmount = Utils.Constants.SIGNUP_BONUS;
            let isRefered = false;
            let bonusStatsMsg = `Signup bonus`
            if (promocode) {
                let where = `where referral_code = '${promocode}'`
                var referralUser = await SQL.Users.getUser(where);
                let referralApplied = referralUser.length > 0 ? true : false;

                if (referralApplied && user.username_edited == 0) {
                    referralBonusStats = true;
                    console.log("inside refferal Applied >>>", referralBonusStats)
                    let referralCode = referralUser[0].referral_code;
                    let invitedBy = referralUser[0].user_id;
                    let invitedTo = user.user_id;
                    let bonus1 = Utils.AppConstraint.REFER_BY;
                    let bonus2 = Utils.AppConstraint.REFER_TO;
                    // configurable refer bonus to signup user if the referrer is affiliate (21 March 2019)
                    let Date = await Utils.CurrentDate.currentDate();
                    if (referralUser[0].is_affiliate != 0) {
                        let affiliateReferBonus = referralUser[0].affiliate_refer_bonus;
                        bonus2 = affiliateReferBonus ? affiliateReferBonus : bonus2;
                    }
                    let referData = [referralCode, invitedBy, invitedTo, bonus1, bonus2, Date];
                    await SQL.Users.referralStatTable(referData);
                    //update records
                    let userRecords = await SQL.Users.getUserRecordTable(user.user_id);
                    // return res.send({ data: userRecords[0].referred_by });
                    if (userRecords.length > 0 && !userRecords[0].referred_by) {
                        let updateRecords = `set referred_by = ${referralUser[0].user_id}, referred_code = '${referralUser[0].referral_code}'`;
                        let where = `where user_id = ${user.user_id}`;
                        await SQL.Users.updateUserRecordTable(where, updateRecords);
                    }

                    console.log("Inside gift referrals");
                    let where, updateData;
                    // let currentDate = Mysql_dt;
                    where = `where invited_to = ${user.user_id} and status_2 = ${2}`;
                    const referred = await SQL.Users.getReferralStat(where);

                    if (referred && referred.length > 0) {
                        let row_id = referred[0].row_id;
                        let invitedBy = referred[0].invited_by;
                        let bonus1 = referred[0].bonus_1 + 0;
                        let bonus2 = referred[0].bonus_2 + 0;

                        //update referred status
                        updateData = ` set status_2 = ${1}, date_2  = NOW() `;
                        where = `where row_id = ${row_id}`;
                        const updated = await SQL.Users.updateReferralStats(updateData, where);

                        if (updated && bonus2) {
                            let userEntity = { user_id: user.user_id, bonus_cash: bonus };
                            const userUpdated = await SQL.Users.userAddBonusCash(userEntity);
                            // add to transaction history
                            let statsData = [user.user_id, bonus2, bonus2, 8, "You have Been referred"];
                            isRefered = true;
                            const statsAdded = await SQL.Users.insertCreditStats(statsData);

                            // add to bonus stats
                            if (Utils.AppConstraint.BONUS_EXPIRY) {
                                bonusStatsAmount = bonus2;
                                bonusStatsMsg = `referred`;
                            }
                        }

                        // add bonus to referral user
                        where = `where user_id = ${invitedBy}`;
                        let invitor = await SQL.Users.getUser(where);

                        //if Affiliate
                        let isAffiliate = invitor.length > 0 ? invitor[0].is_affiliate : 0;
                        if (isAffiliate != 0) {

                            let affiliateData = [invitedBy, user.user_id];
                            await SQL.Users.getAffiliate(affiliateData);

                            // update referred status
                            updateData = `set bonus_1 = 0, status_1 = 1, date_1 = NOW() `;
                            where = `where row_id = ${row_id}`;
                            const updated = await SQL.Users.updateReferralStats(updateData, where);

                        }
                    }
                }
            }


            var payload = {
                user_id: user.user_id,
                phone: user.phone,
                row_id: user.row_id
            }
            let jwtExpiry = `${Utils.Constants.tokenExpiry}d`;
            let token = await jwt.sign(payload, process.env.SECRET, { expiresIn: jwtExpiry });
            let date = await Utils.CurrentDate.currentDate()
            let userActiveAccessToken = await SQL.Users.rawQuery(`select access_token from bb_access_token where user_id= ?`, [userId]);
            console.log("userActiveAccessToken >>>", userActiveAccessToken);
            if (userActiveAccessToken.length > 0) {
                userActiveAccessToken = userActiveAccessToken[0].access_token
                Utils.Redis.set(userActiveAccessToken, " ", 'EX', Utils.RedisExpire.ACCESS_TOKEN)
            }
            await SQL.Users.rawQuery(`INSERT INTO bb_access_token (user_id, access_token, active, date_added) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), active = VALUES(active)  `, [mobileOTP.user_id, token, 1, date]);
            await SQL.Users.rawQuery(`UPDATE bb_users SET phone_verified = ? WHERE user_id = ?`, ["1", mobileOTP.user_id])

            //set token in reddis
            Utils.Keys.ACCESS_TOKEN = `${token}`;
            console.log('Actual token >>', token);
            console.log('token set after in reddis ', Utils.Keys.ACCESS_TOKEN, '  and expire  >>', Utils.RedisExpire.ACCESS_TOKEN)
            token = token.toString()
            Utils.Redis.set(token, token, 'EX', Utils.RedisExpire.ACCESS_TOKEN)

            user.access_token = `${token}`;
            user.status = '0';
            let oldAccessToken = await BridgeController.getAccessTokenFromPhp(user.user_id, user.api_secret_key);
            user.accessToken = oldAccessToken.access_token;
            delete user.api_secret_key;
            var response = {
                user: user,
                configs: configData ? configData : null,
                redeem_code_benifits: redeemCodeBenifits
            }
            await SQL.Users.rawQuery(`UPDATE bb_mobile_otp SET status = ? WHERE user_id = ?`, [2, user.user_id])
            if (user.facebook_id || user.google_id) {
                console.log("Inside social")
                //update bb_social_initiates
                if (user.google_id) await SQL.Users.updateTable(` where google_id = '${user.google_id}' `, { status: 1, phone: phone, user_id: user.user_id }, "bb_social_initiates");
                if (user.facebook_id) await SQL.Users.updateTable(` where facebook_id = '${user.facebook_id}' `, { status: 1, phone: phone, user_id: user.user_id }, "bb_social_initiates");
            }

            //updated device table
            if (user && req.body.device_id && req.body.device_token && req.body.device_type && req.body.app_version && req.body.language) {
                let deviceData = {
                    userId: user.user_id,
                    user_ip: req.connection.remoteAddress,
                    app_version: req.body.app_version,
                    device_type: req.body.device_type,
                    device_id: req.body.device_id,
                    current_language: req.body.language ? current_language : 'en',
                    device_token: req.body.device_token
                }
                let isTokenUpdated = await Utils.UpdateDeviceToken.updateDeviceToken(deviceData);
                console.log("isTokenUpdated >>>>", isTokenUpdated);
            } else if (req.body.device_token) {

                let deviceData = {
                    userId: user.user_id,
                    device_token: req.body.device_token,
                    user_ip: req.connection.remoteAddress
                }
                await SQL.Users.rawQuery(`INSERT INTO bb_user_devices (user_id, device_token, is_login, user_ip) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE device_token = VALUES(device_token), is_login = VALUES(is_login), user_ip = VALUES(user_ip)  `, [deviceData.userId, deviceData.device_token, 1, deviceData.user_ip]);
            }
            let myreferalsCount = await SQL.Users.getReferalsCount(userId);
            response.user.no_of_referals = myreferalsCount.length > 0 ? myreferalsCount[0].referal_count : 0;
            response.user.register = false;
            if (!user.username_edited) {
                console.log("user Inside otpVerify", user);
                response.user.register = true;
                // updateUsername(user.user_id, user.username).then(async result => {
                //     console.log("result in updateUsername", result);
                let userData = [1, Utils.Constants.SIGNUP_BONUS, Utils.Constants.SIGNUP_BONUS, userId];
                if(promotionApplied) userData = [1, promotion[0].maximum_discount, promotion[0].maximum_discount, userId]
                await SQL.Cricket.rawQuery(`UPDATE bb_users set username_edited = ?, signup_bonus = ?, bonus_cash = ? where user_id = ? `, userData)
                let signup_from_version = req.headers['versioncode'];
                let signup_from = req.headers['platform'];
                let signup_channel = req.headers['channel'];
                promocode = req.body.promocode ? req.body.promocode : false;
                signup_from_version = (typeof signup_from_version != 'undefined' || typeof signup_from_version != null || signup_from_version != '') ? signup_from_version : false;
                signup_channel = req.body.channel ? req.body.channel : 'Direct';
                signup_from = (typeof signup_from != 'undefined' || typeof signup_from != null || signup_from != '') ? signup_from : false;

                if (signup_from == 'ios') signup_from = 1;
                if (signup_from == 'android') signup_from = 2;
                if (signup_from == 'web') signup_from = 3;

                if (promotionApplied) {
                    bonusStatsAmount = promotion[0].maximum_discount
                    bonusStatsMsg = `Signup promo`

                }
                console.log("bonusStatsAmount ------>", bonusStatsAmount)
                let bonusStatsData = [user.user_id, bonusStatsAmount, bonusStatsMsg]
                await SQL.Users.addBonusStats(bonusStatsData);
                console.log("promotion else if", promotionApplied, isRefered)
                if (!isRefered && !promotionApplied) {
                    const statsData = [user.user_id, Utils.Constants.SIGNUP_BONUS, Utils.Constants.SIGNUP_BONUS, 10, bonusStatsMsg];
                    console.log("-------->statsData", statsData)

                    const statsAdded = await SQL.Users.insertCreditStats(statsData);
                }
                 if(promotionApplied) {

                    let promotionId = promotion[0].promotion_id;
                    // let date = await Utils.CurrentDate.currentDate()

                    await SQL.Users.signUpPromoTable([userId, promotionId, 0])
                    console.log("promotion Signup .....---->", promotion);
                    bonusStatsMsg = `Signup Bonus`
                    const statsData = [user.user_id, promotion[0].maximum_discount, promotion[0].maximum_discount, 5, bonusStatsMsg];

                    const statsAdded = await SQL.Users.insertCreditStats(statsData);

                    //maintain promotion stats
                    await SQL.Users.insertData2({promotion_id:  promotionId,
                    user_id: userId, date_added: 'Now()', modified_date: 'Now()' }, "bb_promotion_stats")

                }
                await SQL.Users.insertOrUpdateUserRecords(user.user_id, promocode, signup_from, signup_from_version, signup_channel)
                // return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("register_success"), res, response);
                // }).catch(async err => {
                //     console.log("err in updateUsername", err);
                //     // return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res);
                // })
                return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("register_success"), res, response);
            }else
                return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("register_success"), res, response)
        } else {
            const sql = `update bb_mobile_otp set invalid_attempt = ? where user_id = ${mobileOTP.user_id} `;
            if (mobileOTP.invalid_attempt == 0) await SQL.Users.rawQuery(sql, [1]);
            if (mobileOTP.invalid_attempt == 1) await SQL.Users.rawQuery(sql, [2]);
            if (mobileOTP.invalid_attempt == 2) await SQL.Users.rawQuery(sql, [3]);
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("Wrong_data"), __("WRONG_OTP"), res)
        }
    } else {

        return await Utils.ResponseHandler(false, Utils.StatusCodes.Max_attempts, __("Fail"), __("Max_limit"), res);
    }


}