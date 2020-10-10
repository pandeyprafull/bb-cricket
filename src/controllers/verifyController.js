let Utils = require('../utils');
let SQL = require('../sql');
// let Controllers = require('.');
let config = require('../config');
let validator = require('validator');
let moment = require('moment');
let jwt = require('jsonwebtoken');
exports.verifyBank = async (options) => {
    return new Promise(async (resolve, rejected) => {
        let userId = options.userId
        console.log("user_id>>>", userId);
        let account_number = options.Account_Number
        if (!userId) return await rejected({ Msg: __('WRONG_DATA'), title: 'error' });
        let user = await SQL.Users.getUserById(userId);
        user = user[0];
        //check if user found
        if (!user) return await rejected({ Msg: __('USER_NOT_FOUND'), title: 'Not found' });
        //check Bank status
        let bankVerified = user.bankVerified;
        if (bankVerified == 1 || bankVerified == 2) return await rejected({ Msg: __('BANK_DETAILS_EXIST'), title: 'already exist' })
        // pan details
        let panDetails = await SQL.Users.getPanDetails(userId);
        panDetails = panDetails[0]
        if (!panDetails || user.pan_verified == 3) return await rejected({ Msg: __('SUBMIT_PAN_DETAILS'), title: 'pan not found' });
        let panName = panDetails.pan_name;
        /*
        s3 image upload
        */
        // get Bank details
        let bankDetails = await SQL.Users.getBankDetails(userId);
        bankDetails = bankDetails[0];
        if (bankDetails) {
            //remove bank details
            let removeBank = await SQL.Users.removeBankDetails(userId);
            console.log("remove Bank is", removeBank)
            if (bankDetails.bank_proof) {
                /*
         remove images from s3 now
           */
            }
        }
        let required = {
            account: true,
            ifsc: true,
            bank: true,
            branch: true,
            image: false
        }
        try {
            // account number, validateDigits(value, field, required=false, min=1, max=false, minValue=false, maxValue=false)
            let validAccount = await Utils.ValidatorController.validateDigitsNew(options.Account_Number, "account_number", required.account, 9, 20);
            // validate Ifsc, validateAlnum(value, field, required=false, min=2, max=30)
            let validIfsc = await Utils.ValidatorController.validateAlnum(options.ifsc_code, "ifsc code", required.ifsc, 8, 12);
            // check unique Account Number
            let accountExists = await SQL.Users.getBankDetails(null, `account_number = '${validAccount.response}' and ifsc_code = '${validIfsc.response}'`);
            accountExists = accountExists[0]
            console.log("ACCount exist", accountExists);
            if (accountExists) return await rejected({ Msg: __("ACCOUNT_ALREADY_EXIST"), title: 'exists' })
            // validate bank name, validateText(value, field, required=false, min=2, max=false)
            let validBank = await Utils.ValidatorController.validateTextNew(options.bank_name, "bank_name", required.bank, 3, 100);
            // validate bank branch, validateText(value, field, required=false, min=2, max=false)
            let validBranch = await Utils.ValidatorController.validateTextNew(options.branch_name, "bank branch", required.branch, 3, 100);
            // return resolve({ Msg: validBranch.Msg, title: validBranch.title, response: validBranch.response })
            // update now
            let validatedDataInfo = {
                'user_id': userId,
                'account_number': validAccount.response,
                'ifsc_code': validIfsc.response,
                'account_holder': panName,
                'bank_name': validBank.response,
                'bank_branch': validBranch.response,
                'date_added': 'NOW()'
            }

            let bank_id = await SQL.Users.insertData2(validatedDataInfo, "bb_bank_details");
            let bank_details = await SQL.Users.getBankDetails(userId);
            bank_details = bank_details[0];
            let verified;
            console.log("bank_details is >>>>", bank_details);
            if (bank_details) {
                // update bank status to pending or verified in user table
                let verifiedStatus = 2;
                if (user.pan_verified == 1) verifiedStatus = 1;
                verified = await SQL.Users.updateProfile(userId, { 'bank_verified': verifiedStatus });
                let returnMsg = __('BANK_DETAILS_SUCCESS');
                if (verifiedStatus == 1) {
                    returnMsg = __('BANK_DETAILS_APPROVED');
                    //send mail now
                    if (user && user.email) {
                        let mailerData = {
                            type: "bankVerified",
                            user_email: user.email,
                            user_name: user.name ? user.name : user.username,
                            link: __('WEB_LINK')
                        }
                        console.log("mailer data is >>", mailerData);
                        await Utils.EmailService.sendMail(Utils.Constants.emails.bankVerifyEmail, mailerData)
                    }
                }
                let response = {
                    bankList: bank_details,
                }
                return await resolve({ Msg: returnMsg, title: 'Success', response: response })

            }
            return await rejected({ Msg: __('SOME_ERROR'), title: 'error' })
        } catch (e) {
            console.log("error in verify bank >>>", e);
            return await rejected({ Msg: e.Msg, title: e.title, response: e.response })
        }
    })

}

exports.verifyEmail = async (req, res) => {
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res)
    let userId = req.user.user_id;
    let email = req.body.email;
    if (!email) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("EMAIL_REQUIRED"), res);
    let userEmail = user.email;
    if (!validator.isEmail(email)) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("EMAIL_INVALID"), res);
    // check email existance (show errors only if app signup)
    let emailExist = await SQL.Users.getUnique(`where email = '${email}' and user_id != ${userId}`);
    console.log("emailExist is ", emailExist);
    if (emailExist) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("EMAIL_EXIST"), res);
    userEmail = email;
    let emailVerifyRequests = await SQL.Users.getVerifyEmailTable(`user_id=${userId}`);
    console.log("emailVerifyRequests is ", emailVerifyRequests);

    let update = false;
    let insert = false;
    let generate = true;
    if (Object.keys(emailVerifyRequests).length > 0) {
        update = true;
        let foundedEmail = emailVerifyRequests.user_email;
        let securityCode = emailVerifyRequests.security_code;
        let status = emailVerifyRequests.status;
        let expiry = emailVerifyRequests.expiry;
        console.log('current time stamp momet=> ');

        if (status && userEmail == foundedEmail && (expiry >= moment().add(30, "minute").unix())) {
            // at least 30 minutes should be left to resend the same code again
            // use the same values
            generate = false;
        }
    } else {
        insert = true;
    }
    console.log("flasgs >>>", insert, generate)
    if (insert || generate) {
        let securityCode = generateSecretKey(10, '#aA');
        let expiry = moment().add(1, "day").unix()
        const token = await jwt.sign({
            user_id: user.user_id,
            phone: user.phone,
        }, config.EMAIL_TOKEN_SECRET, { expiresIn: '1d' });
        let data = {
            "user_id": userId,
            "user_email": userEmail,
            "security_code": securityCode,
            "status": 1,
            "expiry": expiry
        }
        let dbStatus = false;
        console.log("update and generate", update, generate);
        if (insert) {
            dbStatus = await SQL.Users.insertData(data, "bb_verify_email");
        } else if (update && generate) {
            dbStatus = await SQL.Users.updateVerifyEmailTable(`set user_email = '${userEmail}' , security_code= '${securityCode}', expiry=${expiry}, status=1`, `where user_id = ${user_id}`)
        } else dbStatus = true;
        if (userEmail) {
            Utils.EmailService.sendMail(Utils.Constants.emails.verifyEmail, {
                email: userEmail,
                name: user.name ? user.name : user.username,
                link: `${config.EMAIL_VERIFY}users/verify/email?qs=${token}`
            })
        }
        console.log('dbStatus....... ', dbStatus);
        if (!dbStatus) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("REQUEST_DISMISSED"), res);
        else
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "mail send", __("VERIFY_EMAIL_LINK_SENT"), res);
    }else{
        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Already submitted", __("MAIL_ALREADY_SUBMITTED"), res);

    }

}

exports.UserEmailVerify = async (req, res, next) => {
    let token = req.query.qs;

    await jwt.verify(token, config.EMAIL_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('invalid Token'), __('EXPIRED_TOKEN'), res);
        } else {
            let userId = decoded.user_id;
            console.log("Decoded is >>>", decoded);

            await SQL.Users.updateProfile(userId, { email_verified: 1 });
            let user = await SQL.Users.getUser(`where user_id = ${userId}`);
            let response = {
                userDetails: user
            }
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'email_verified', __('EMAIL_VERIFIED_SUCCESS'), res, response)

        }
    })

}

function generateSecretKey(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
}
// exports.uploadImageToVerifybank = async(options) => {
//     return new Promise(async(resolve, rejected) => {
//         console.log("filename is >>>> ", req.file);
//         let aws = require('aws-sdk');
//         let path = require('path');
//         let multer = require('multer');
//         let multerS3 = require('multer-s3');
//         aws.config.update({
//             secretAccessKey: config.AWS.AWS_S3_KEY,
//             accessKeyId: config.AWS.AWS_S3_KEY,
//             region: config.AWS.REGION
//         });
//         let s3 = new aws.S3()
//         let storage = multerS3({
//             s3: s3,
//             bucket: config.AWS.AWS_S3_BUCKET,
//             cacheControl: 'max-age=31536000',
//             acl: 'public-read',
//             metadata: (req, file, cb) => {
//                 console.log("metadata is>>", file);
//                 cb(null, { fieldName: file.fieldname });
//             },
//             key: (req, file, cb) => {
//                 console.log("key is>>", file);
//                 cb(null, file.fieldname + "_" + new Date().toISOString() + "_" + path.extname(file.fieldname))
//             }
//         })
//         try {
//             let upload = multer({ storage: storage, limits: { fieldSize: 8 * 1024 * 1024 } }).single('user_image');
//             console.log("Upload is>>>", upload);
//             resolve(upload)
//             if (upload) return await rejected({ Msg: __("IMAGE_UPLOAD_ERROR"), title: 'Image_error', response: upload })
//             return upload
//         } catch (e) {
//             return rejected({ Msg: e.message, title: 'catch_error' })
//         }
//     })
// }