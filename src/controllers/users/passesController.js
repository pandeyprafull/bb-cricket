const PaymentController = require('../../controllers/users/PaymentController');
const Utils = require('../../utils');
const SQL = require('../../sql');
const Mysql_dt = require('../../utils/mySql_dateTime');
const moment = require('moment');
const Config = require('../../config');
const Validator = require('validator');
const cryptoRandomString = require('crypto-random-string');
exports.getPassses = async (req, res, next) => {

    let userId = req.user.user_id;
    let purchasedPass;
    if (userId) {
        purchasedPass = await SQL.Users.fetchAllWithPassAndSeason(userId)
    } else {
        let userData = req.user;
        if (userData) {
            purchasedPass = await SQL.Users.fetchAllWithPassAndSeason(userData.user_id);
        }
    }
    let passList = await SQL.Users.fetchAllWithSeason()
    if (!purchasedPass.length > 0) purchasedPass = null;
    if (passList.length < 0) passList = null;

    let finalPassesList = [];
    for (let thisPass of passList) {
        let totalEntries = 0;
        let isPurchased = false;

        for (let thisPurchasedPass of purchasedPass) {
            if (thisPass.season_key == thisPurchasedPass.season_key && thisPass.league_category_id == thisPurchasedPass.league_category_id && thisPass.league_buy_in_amount == thisPurchasedPass.league_buy_in_amount) {

                totalEntries += thisPurchasedPass.total_league_entries;
                isPurchased = true;
            }
        }

        let remaning = Config.MAX_TEAM - totalEntries;

        if (isPurchased) {
            if (remaning >= thisPass.total_league_entries) {

                console.log("Inside ifPurchased and remaining");
                finalPassesList.push(thisPass);
            }
        } else {
            finalPassesList.push(thisPass);
        }

    }
    let totalPass = purchasedPass.length;
    let Msg = __('PASS_STORE_HEADER_MESSAGE', { totalPass: totalPass })
    let finalMessage;
    if (totalPass > 1) {
        finalMessage = Msg.replace('pass', 'passes');
    } else {
        finalMessage = Msg
    }

    console.log("finlPAssesList >>>", finalPassesList);
    let response = {
        pass_list: finalPassesList,
        user_pass: purchasedPass,
        passStoreHeaderMessage: finalMessage
    }

    Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('SUCCESS'), res, response);

}

exports.purchasePass = async (req, res, next) => {
    let userId = req.user.user_id;
    let passId = req.body.pass_id;

    if (userId && passId) {
        let passData = await SQL.Users.getPassDetailWithPassId(passId);
        passData = passData[0];

        let wherePass = {
            season_key: passData.season_key,
            league_category_id: passData.league_category_id,
            league_buy_in_amount: passData.league_buy_in_amount
        }
        /** ==Start==Prevent User to purchase more than 9 pass in same season,category and buying amount== */

        let userPurchasedData = await SQL.Users.fetchTotalPurchaseEntriesByUser(userId, wherePass);
        userPurchasedData = userPurchasedData[0];

        let stopToBuy = false;
        let remaining = Config.MAX_TEAM - userPurchasedData.totalPurchaseEntries

        if (remaining < passData.total_league_entries) {
            stopToBuy = true;
        }

        if (stopToBuy) {
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('PASS_OVER_PURCHASE'), res)
        }

        /** ==End==Prevent User to purchase more than 9 pass in same season,category and buying amount== */
        let userUnusedData = await SQL.Users.getCustomByUser(userId, ` unused_amount `)
        userUnusedData = userUnusedData[0];

        console.log("userUnusedData >>>>>", userUnusedData)
        let userIp = req.connection.remoteAddress
        if (userUnusedData.unused_amount >= passData.pass_price) {

            //need to implement
            let result = await this.purchaseWithUnsed(passData, userId, userIp);
            console.log('Result of purchaseWithUnsed', result);
            if (result) {
                let userDetail = await SQL.Users.getCustomByUser(userId);
                userDetail = userDetail[0];
                let response = null;

                req.user = userDetail

                return Utils.ResponseHandler(true, Utils.StatusCodes.Success, "success", __('PURCHASE_PASS_MESSAGE'), res, response);
            } else {
                return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('WRONG_DATA'), res)
            }

        } else {
            //need to implement
            req.body.amount = passData.pass_price;
            req.body.isMobile = 1;
            req.body.userId = userId
            let formresp = await PaymentController.addCashPayu(req, res);

            // console.log('formeresp of purchaseWithoutUnsed', formresp)
            // return Utils.ResponseHandler(true, Utils.StatusCodes.reset_content, "success", __('SUCCESS'), res);
        }
    } else {
        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wring_data", __("WRONG_DATA"), res);
    }

}

exports.purchaseWithUnsed = async (passData, userId) => {
    return new Promise(async(resolve, rejected) => {
        let purchaseObj = {
            pass_id: passData.pass_id,
            user_id: userId,
            purchased_amount: passData.pass_price,
            status: 1,
            date_added: 'Now()'
        }

        let dbStatus = await SQL.Users.insertData2(purchaseObj, " bb_user_passes_purchased ");
        console.log("dbStatus >>>>>", dbStatus);
        if (dbStatus.affectedRows) {
            let updateData = {
                unused_amount: ` (unused_amount - ${passData.pass_price})`
            }
            let userUnusedUpdate = await SQL.Users.updateTable(` where user_id = ${userId} `, updateData, " bb_users");

            console.log("userUnusedUpdate >>>>>", userUnusedUpdate);
            if (userUnusedUpdate) {
                let unusedStatsData = {
                    user_id: userId,
                    unused_cash: userId,
                    amount: passData.pass_price,
                    transaction_type: 24,
                    transaction_message: __('PASS_PURCHASED'),
                    transaction_date: 'Now()',
                    modified_data: 'Now()'
                }

                let statsAdded = await SQL.Users.insertData2(unusedStatsData, "bb_credit_stats");
                console.log("Stats Added >>>>", statsAdded);

            }
            resolve(true);
        } else {
            rejected(false);
        }
    })
}




// exports.purchaseWithoutUnsed = async (passData, userId, userIp) => {
//     return new Promise((resolve, rejected) => {
//         let userId = userId;
//         let amount = passData.pass_price;
//         let returnPage = null;
//         let returnParams = null;
//         if (!returnPage) returnPage = "home"
//         let returnUrl = __('WEB_LINK') + "/" + returnPage;
//         let mobileApp = 1;

//         if (returnParams) {
//             returnParams = JSON.parse(returnParams);
//             if (returnParams) returnUrl = returnUrl + "?" + Utils.Http_query_build(returnParams)
//         }
//         let pgType = 1;
//         if (!pgType || ![1, 2].includes(pgType)) pgType = 1;

//         if (!userId || !amount) rejected({ status: 400, title: "wrong_data", Msg: __('WRONG_DATA') })

//         let user = await SQL.Users.getUserById(userId);
//         user = user[0];
//         if (!user) rejected({ status: 400, title: "error", Msg: __('WRONG_DATA') });
//         if (!Validator.isNumeric(amount)) rejected({ status: 400, title: "error", Msg: __('ILLEGAL_AMOUNT') });

//         if (amount < 0) rejected({ status: 400, title: "error", Msg: __('NEGATIVE_AMOUNT') });
//         // generate txn_number, 10 times attempt
//         let txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)

//         if (!txnNumber) txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)
//         if (!txnNumber) txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)
//         if (!txnNumber) txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)
//         if (!txnNumber) txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)
//         if (!txnNumber) txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)
//         if (!txnNumber) txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)
//         if (!txnNumber) txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)
//         if (!txnNumber) txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)
//         if (!txnNumber) txnNumber = await this.generateTxnNum(userId, pgType, returnUrl, mobileApp, amount, userIp)

//         if (!txnNumber) rejected({ status: 400, title: "error", Msg: __('SOME_ERROR') })


//     })
// }

// exports.generateTxnNum = async (userId, pgType, returnUrl, mobileApp, amount, userIp) => {
//     let txnNumber = await cryptoRandomString({ length: 20 });
//     // check txn_number
//     let found = await SQL.Users.getByTxn(txnNumber);
//     if (found.length > 0) return false;

//     // insert txn_number
//     let txnData = {
//         gateway_type: pgType,
//         user_id: userId,
//         txn_number: txnNumber,
//         amount: amount,
//         return_url: returnUrl,
//         is_mobile_app: mobileApp,
//         user_ip: userIp
//     }

//     let inserted = await SQL.Users.insertData2(txnData, "bb_txn");
//     console.log("inserted in bb_txn", inserted)
//     if (!inserted.affectedRows) return false;
//     return txnNumber;

// }