var crypto = require('crypto');
var SQL = require('../../sql');
const Utils = require('../../utils');
const Mysql_dt = require('../../utils/mySql_dateTime');
const moment = require('moment');
const Config = require('../../config');
const { initPayment, responsePayment } = require('../../paytm');
let validator = require('validator');
const db = require('../../utils/CricketDbConfig');
const util = require('util');
let Juspay = require('../../juspay')
let Services = require('../../services')
moment().format('YYYY-MM-DD HH:mm:ss')

exports.addCashPayu = async (req, res) => {
    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
    let { userId, amount, promocode, isMobile } = req.body;
    let user = req.user;
    // if(user)
    let pg = 1;
    // userId = 780437;
    // promocode = 'EXTRABONUS';
    // amount = 100;
    // console.log('ppppp->> ', req.body);

    isMobile = 1;
    if (!userId && !amount) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __("WRONG_DATA"), res)
    }
    let userDetails = await SQL.Users.getUserById(userId);
    if (userDetails && userDetails.length == 0) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __("UNAUTHORIZE_ACCESS"), res)
    }
    userDetails = userDetails[0];
    if (!amount || amount < 0) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("Wrong_data"), __("Amount is required"), res)
    }
    if (promocode) {
        var promotion = await SQL.Users.getCodeForDeposit(`promotion_code='${promocode}'`)
        if (!promotion || !promotion.length) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("invalid"), __("PROMOTION_INVALID"), res)
        }
        promotion = promotion[0];
        let currentDate = Utils.DateTime.gmtDate //Mysql_dt;
        let promoStartDate = moment(promotion.start_date);
        let promoEndDate = moment(promotion.end_date);
        if (promoStartDate && promoStartDate > currentDate) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("not_started"), __("PROMOTION_INVALID"), res)
        } else if (promoEndDate && promoEndDate < currentDate) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("expired"), __("PROMOTION_INVALID"), res)
        }
        if (promotion.app_only && isMobile != 1) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("non_app"), __("APPLICABLE_ON_APP_ONLY"), res)
        }
        if (amount < promotion.minimum_deposit) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("min_deposit"), `Promocode applicable only above ${promotion.minimum_deposit}`, res)
        }
        // check promotionn used type
        let usedType = promotion.used_type
        console.log("Deposit promoc code use type", usedType);
        if (usedType === 2) {
            let usedStatus = await SQL.Users.getPromoStats(` user_id=${userId} and promotion_id = ${promotion.promotion_id} `);
            if (usedStatus || usedStatus.length > 0) {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("already_used"), __("PROMO_ALREADY_USED"), res)
            }
        } else if (usedType == 3) {
            //for first time user only
            let usedTxns = await SQL.Users.getTxn(` user_id=${userId} and status IN('success', 'pending') `);
            if (usedTxns || usedTxns.length > 0) {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("not_first_time"), __("PROMO_NOT_FIRST_TIME_USER"), res)
            }
        } else if (usedType == 4) {
            // max number of time can be used
            let maxUse = promotion.custom_numbers;
            let usedCount = await SQL.Users.getPromoStatsCount(` user_id=${userId} and promotion_id = ${promotion.promotion_id} `);
            if (usedCount.length >= maxUse) {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("fully_used"), __("PROMOTION_INVALID"), res)
            }
        }
    }
    let promotionId = null;
    if (promotionId) {
        promotionId = promotion.promotion_id;
    }
    var txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
    if (!txnNumber) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("error"), __("SOME_ERROR"), res)
    pg = txnNumber.pgType;
    txnNumber = txnNumber.txnNumber;
    if (pg == 1) {
        let key = Config.PAYU.PAYU_MERCHANT_KEY;
        let salt = Config.PAYU.PAYU_MERCHANT_SALT;
        var data = {
            key: key,
            txnid: txnNumber,
            amount: amount,
            productinfo: "add_cash",
            firstname: userDetails.name ? userDetails.name : userDetails.username,
            email: userDetails.email ? userDetails.email : "",
            udf1: '',
            phone: userDetails.phone ? userDetails.phone : 9999999999,
            surl: `${Config.BASE_URL}users/payum/success`,
            furl: `${Config.BASE_URL}users/payum/failure`,
            service_provider: "payu_paisa",
            action: Config.PAYU.PAYU_URL,
            gateway: pg
        }
        var cryp = crypto.createHash('sha512');
        var text = data.key + '|' + data.txnid + '|' + data.amount + '|' + data.productinfo + '|' + data.firstname + '|' + data.email + '|||||' + data.udf1 + '||||||' + salt;
        // console.log('txn=>> ', text);

        cryp.update(text);
        var hash = cryp.digest('hex');
        data.hash = hash;
        let response = {
            data: data
        };
        // console.log('payu=data=>> ', response);
        //##################### TO render view ###################################
        // return res.render("paytmRedirect.ejs", {
        //     resultData: success,
        //     paytmFinalUrl: Config.PAYTM.TXN_URL
        // });
        //##################### TO render view ###################################
        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response)
    } else if (pg == 2) {
        initPayment(userId, txnNumber, amount).then(
            async success => {
                //##################### TO render view ###################################
                // return res.render("paytmRedirect.ejs", {
                //     resultData: success,
                //     paytmFinalUrl: Config.PAYTM.TXN_URL
                // });
                //##################### TO render view ###################################
                success.URL = Config.PAYTM.TXN_URL;
                success.gateway = pg;
                success.ENVIOURMENT = Config.PAYTM.PAYTM_ENVIOURMENT
                let response = {
                    data: success
                }
                return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response)
            },
            async error => {
                console.log('error in paytm order', error);
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("error"), __("SOME_ERROR"), res, promotion)
            }
        )
    } else if (pg == 4) {
        Juspay.Orders.create({ order_id: txnNumber, amount: amount }, async (data, err) => {
            if (err) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("WRONG_DATA"), __("WRONG_DATA"), res, promotion)
            data.gateway = pg;
            let response = {
                data: data
            }
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response)

        })
    } else {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("WRONG_DATA"), __("WRONG_DATA"), res, promotion)
    }
}

exports.paytmCallbackHandlerV1 = async (req, res) => {
    console.log('response from callback => ', req.body);
    let params = req.body;
    responsePayment(params).then(async success => {
        let logData = '';
        // return res.render("response.ejs", { resultData: "true", responseData: success });
        // return res.render(`test`, { resultData: "true", responseData: success });
        // return res.redirect('/status')
        let txnId = params.ORDERID;
        let checksum = params.CHECKSUMHASH;
        if (!checksum || !txnId) {
            // return res.send({ status: false, message: "Invalid request " })
            res.redirect(`?status=fail&msg=${params.RESPMSG}`)
        }
        let txnDetails = await SQL.Users.getTxn(`txn_number=${txnId}`);
        if (!txnDetails) {
            // return res.send({ status: false, message: "Txn not found" })
            return res.redirect(`?status=fail&msg=${params.RESPMSG}`)
        }
        if (txnDetails && txnDetails < 0) {
            return res.redirect(`?status=fail&msg=${params.RESPMSG}`)
            // return res.send({ status: false, message: "Txn not found" })
        }
        txnDetails = txnDetails[0];
        if (txnDetails.txn_status != 2) {
            // return res.send({ status: false, message: "Txn already used" })
            return res.redirect(`?status=fail&msg=${params.RESPMSG}`)
        }
        let txnAmount = params.TXNAMOUNT;
        let txnUpdateData = false;
        if (params.STATUS == 'TXN_SUCCESS') {
            txnUpdateData = {
                "unmappedstatus": params.RESPCODE,
                "status": params.STATUS,
                "amount": params.TXNAMOUNT,
                "payuMoneyId": params.CURRENCY,
                "mihpayid": params.TXNID,
                "bank_ref_num": params.BANKTXNID,
                "addedon": params.TXNDATE,
                "field9": params.RESPMSG,
                "PG_TYPE": params.GATEWAYNAME,
                "mode": params.PAYMENTMODE,
                "bankcode": params.BANKNAME,
            }
            let promotionId = txnDetails.promotion_id;
            let userId = txnDetails.user_id;
            let userDetails = await SQL.Users.getUserById(userId);
            userDetails = userDetails[0];
            if (!userDetails) {
                // return res.send();
                return res.redirect(`?status=fail&msg=${params.RESPMSG}`)
            }
            let bonus = 0;
            let withdrwalBonus = 0;
            let isTicketRecived = false;
            let promoDetails = false;
            if (promotionId) {
                promoDetails = await SQL.Users.getPromotionCodeTable(`where promotion_id=${promotionId}`);
                if (promoDetails) {
                    if (promoDetails.length > 0 || txnAmount >= promoDetails.txnAmount) {
                        promoDetails = promoDetails[0];
                        let cashBackType = promoDetails.cashback_type ? promoDetails.cashback_type : promoDetails.cashback_type;
                        let usageType = promoDetails.used_type;
                        let isAlreadyUsed = false;
                        if (usageType == 2) {
                            // check already used for single usage type
                            var usedPromo = await SQL.Users.getPromoStats(`user_id=${userId} and promotion_id = ${promotionId}`)
                            if (usedPromo && usedPromo.length > 0) isAlreadyUsed = true;
                        } else if (usageType == 3) {
                            // check for first time deposit
                            let txnFounded = await SQL.Users.getTxn(`user_id=${userId} and status IN('success', 'pending')`);
                            if (txnFounded && txnFounded.length > 0) isAlreadyUsed = true;
                        } else if (usageType == 4) {
                            let maxTimeUse = promoDetails.custom_numbers;
                            if (usedPromo && usedPromo.length >= maxTimeUse) isAlreadyUsed = true;
                        }
                        if (!isAlreadyUsed) {
                            let discount = promoDetails.discount;
                            let maxDiscount = promoDetails.maximum_discount;
                            if (discount) bonus = (txnAmount * discount / 100).toFixed(2);
                            if (maxDiscount && bonus > maxDiscount) bonus = maxDiscount;
                            if (cashBackType == 2) {
                                withdrwalBonus = bonus;
                                bonus = 0;
                            }
                            if (promoDetails.promotion_type == 4) {
                                if (amount >= promoDetails.minimum_deposit) {
                                    let tickets = promoDetails.tickets;
                                    if (tickets) {
                                        /**
                                         * TODO: Allocate tickets to the users
                                         */
                                        isTicketRecived = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            let totalAmount = txnAmount + withdrwalBonus;
            // Add cash in the user wallet
            let updateResult = await SQL.Users.updateUserBalance(`unused_amount=unused_amount+${txnAmount},bonus_cash=bonus_cash+${bonus}, total_cash_added=total_cash_added+${totalAmount}`, `user_id=${userId}`);
            let balanceUpdateStats = {
                "user_id": userId,
                "real_cash": txnAmount,
                "amount": txnAmount,
                "transaction_type": Utils.Constants.txnTypes.cashDeposited,
                "txn_id": txnId,
                "transaction_message": Utils.Constants.txnMessages.cashDeposited,
                "transaction_date": 'NOW()' //moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss')
            }
            let updateStatus = await SQL.Users.insertData2(balanceUpdateStats, 'bb_credit_stats')
            let redirectUrl = txnDetails.return_url ? txnDetails.return_url : Config.BASE_URL;
            let statsData = false;
            let promoStatsData = false;
            let bonusStatsData = false;
            // if cashback
            if (bonus) {
                statsData = {
                    "user_id": userId,
                    "bonus_cash": bonus,
                    "amount": bonus,
                    "transaction_type": Utils.Constants.txnTypes.bonusCashAdded,
                    "txn_id": txnId,
                    "transaction_message": Utils.Constants.txnMessages.bonusRecived,
                    "transaction_date": moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss')
                }
                promoStatsData = {
                    promotion_id: promoDetails.promotion_id,
                    user_id: userId
                }
                if (Config.BONUS_EXPIRY) {
                    bonusStatsData = {
                        user_id: userId,
                        bonus_amount: bonus,
                        bonus_type: "cash promo"
                    }
                }
            } else if (withdrwalBonus) {
                statsData = {
                    "user_id": userId,
                    "real_cash": withdrawBonus,
                    "amount": withdrawBonus,
                    "transaction_type": Utils.Constants.txnTypes.bonusCashAdded,
                    "txn_id": txnId,
                    "transaction_message": Utils.Constants.txnMessages.bonusRecived,
                    "transaction_date": 'NOW()'//moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss')
                }
                // maintain promo stats
                promoStatsData = {
                    promotion_id: promotionId,
                    user_id: userId
                }
            } else if (isTicketRecived) {
                promoStatsData = {
                    promotion_id: promotionId,
                    user_id: userId
                }
            }
            let userRecordsDetails = await SQL.Users.getUserRecordTable(userId);
            if (userRecordsDetails) {
                userRecordsDetails = userRecordsDetails[0];
            }
            let creditStatsAdded = await SQL.Users.insertData2(statsData, 'bb_credit_stats');
            await SQL.Users.insertData(promoStatsData, 'bb_promotion_stats');
            await db.query(`update bb_txn set ? where txn_number = ?`, [txnUpdateData, txnId])
            res.redirect("?status=success&msg=Your deposit is successfull");
            // return res.send({ params: params });
            //############################### Send Email ##############
            //TODO: send email
            //############################### Send Email ##############
        } else if (params.STATUS == 'PENDING') {
            /**
             * TODO: Update the next pending check
             */
            // txnUpdateData.next_pending_check = moment().add(14, "minutes")
            return res.redirect(`?status=fail&msg=${params.RESPMSG}`)
        } else {
            return res.redirect(`?status=fail&msg=${params.RESPMSG}`)
        }
        // if (txnUpdateData) {
        //     console.log('updating txn --->>>> ', txnUpdateData);
        //     await db.query(`update bb_txn set ? where txn_number = ?`, [txnUpdateData, txnId])
        //         // db.query(`update bb_txn set unmappedstatus =? status = ? amount = ? payu = ? mihpayid = ? bank = ? addedon = ? field9 = ? PG = ? mode = ? bankcode =? where txn_number = ?`, Object.values(txnUpdateData))
        // }
    },
        error => {
            console.log('error => ', error);
            // res.send(error);
            return res.redirect(`?status=fail&msg=${params.RESPMSG}`)
        }).catch(e => {
            return res.redirect(`?status=fail&msg=${params.RESPMSG}`)
        })
}

exports.paytmCallbackHandler = async (req, res) => {
    console.log('response from callback => ', req.body);
    let params = req.body;
    responsePayment(params).then(async success => {
        params.IS_CHECKSUM_VALID = "Y";
        let txnId = params.ORDERID;
        let checksum = params.CHECKSUMHASH;
        if (!checksum || !txnId) {
            // return res.send({ status: false, message: "Invalid request " })
            console.log('response txn or checksum not found ', params);
            return res.render(`redirecthome`, { response: JSON.stringify(params) })
        }
        let txnDetails = await SQL.Users.getTxn(`txn_number=${txnId}`);
        if (!txnDetails) {
            // return res.send({ status: false, message: "Txn not found" })
            console.log('response txn details not founded ', params);
            return res.render(`redirecthome`, { response: JSON.stringify(params) })
        }
        if (txnDetails && txnDetails < 0) {
            console.log('response tx details not founded 2 ', params);
            return res.render(`redirecthome`, { response: JSON.stringify(params) })
            // return res.send({ status: false, message: "Txn not found" })
        }
        txnDetails = txnDetails[0];
        if (txnDetails.txn_status != 2) {
            // return res.send({ status: false, message: "Txn already used" })
            console.log('response txn already consumend', params);
            return res.render(`redirecthome`, { response: JSON.stringify(params) })
        }
        let txnAmount = params.TXNAMOUNT;
        let txnUpdateData = false;
        if (params.STATUS == 'TXN_SUCCESS') {
            txnUpdateData = {
                "unmappedstatus": params.RESPCODE,
                "status": params.STATUS,
                "amount": params.TXNAMOUNT,
                "payuMoneyId": params.CURRENCY,
                "mihpayid": params.TXNID,
                "bank_ref_num": params.BANKTXNID,
                "addedon": params.TXNDATE,
                "field9": params.RESPMSG,
                "PG_TYPE": params.GATEWAYNAME,
                "mode": params.PAYMENTMODE,
                "bankcode": params.BANKNAME,
            }
            let promotionId = txnDetails.promotion_id;
            let userId = txnDetails.user_id;
            let userDetails = await SQL.Users.getUserById(userId);
            userDetails = userDetails[0];
            if (!userDetails) {
                // return res.send();
                console.log('response user details not founded  ', params);
                return res.render(`redirecthome`, { response: JSON.stringify(params) })
            }
            let bonus = 0;
            let withdrwalBonus = 0;
            let isTicketRecived = false;
            let promoDetails = false;
            if (promotionId) {
                promoDetails = await SQL.Users.getPromotionCodeTable(`where promotion_id=${promotionId}`);
                if (promoDetails) {
                    if (promoDetails.length > 0 || txnAmount >= promoDetails.txnAmount) {
                        promoDetails = promoDetails[0];
                        let cashBackType = promoDetails.cashback_type ? promoDetails.cashback_type : promoDetails.cashback_type;
                        let usageType = promoDetails.used_type;
                        let isAlreadyUsed = false;
                        if (usageType == 2) {
                            // check already used for single usage type
                            var usedPromo = await SQL.Users.getPromoStats(`user_id=${userId} and promotion_id = ${promotionId}`)
                            if (usedPromo && usedPromo.length > 0) isAlreadyUsed = true;
                        } else if (usageType == 3) {
                            // check for first time deposit
                            let txnFounded = await SQL.Users.getTxn(`user_id=${userId} and status IN('success', 'pending')`);
                            if (txnFounded && txnFounded.length > 0) isAlreadyUsed = true;
                        } else if (usageType == 4) {
                            let maxTimeUse = promoDetails.custom_numbers;
                            if (usedPromo && usedPromo.length >= maxTimeUse) isAlreadyUsed = true;
                        }
                        if (!isAlreadyUsed) {
                            let discount = promoDetails.discount;
                            let maxDiscount = promoDetails.maximum_discount;
                            if (discount) bonus = (txnAmount * discount / 100).toFixed(2);
                            if (maxDiscount && bonus > maxDiscount) bonus = maxDiscount;
                            if (cashBackType == 2) {
                                withdrwalBonus = bonus;
                                bonus = 0;
                            }
                            if (promoDetails.promotion_type == 4) {
                                if (amount >= promoDetails.minimum_deposit) {
                                    let tickets = promoDetails.tickets;
                                    if (tickets) {
                                        /**
                                         * TODO: Allocate tickets to the users
                                         */
                                        isTicketRecived = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            let totalAmount = txnAmount + withdrwalBonus;
            // Add cash in the user wallet
            let updateResult = await SQL.Users.updateUserBalance(`unused_amount=unused_amount+${txnAmount},bonus_cash=bonus_cash+${bonus}, total_cash_added=total_cash_added+${totalAmount}`, `user_id=${userId}`);
            let balanceUpdateStats = {
                "user_id": userId,
                "real_cash": txnAmount,
                "amount": txnAmount,
                "transaction_type": Utils.Constants.txnTypes.cashDeposited,
                "txn_id": txnId,
                "transaction_message": Utils.Constants.txnMessages.cashDeposited,
                "transaction_date": moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss')
            }
            let updateStatus = await SQL.Users.insertData(balanceUpdateStats, 'bb_credit_stats')
            let redirectUrl = txnDetails.return_url ? txnDetails.return_url : Config.BASE_URL;
            let statsData = false;
            let promoStatsData = false;
            let bonusStatsData = false;
            // if cashback
            if (bonus) {
                statsData = {
                    "user_id": userId,
                    "bonus_cash": bonus,
                    "amount": bonus,
                    "transaction_type": Utils.Constants.txnTypes.bonusCashAdded,
                    "txn_id": txnId,
                    "transaction_message": Utils.Constants.txnMessages.bonusRecived,
                    "transaction_date": moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss')
                }
                promoStatsData = {
                    promotion_id: promoDetails.promotion_id,
                    user_id: userId
                }
                if (Config.BONUS_EXPIRY) {
                    bonusStatsData = {
                        user_id: userId,
                        bonus_amount: bonus,
                        bonus_type: "cash promo"
                    }
                }
            } else if (withdrwalBonus) {
                statsData = {
                    "user_id": userId,
                    "real_cash": withdrawBonus,
                    "amount": withdrawBonus,
                    "transaction_type": Utils.Constants.txnTypes.bonusCashAdded,
                    "txn_id": txnId,
                    "transaction_message": Utils.Constants.txnMessages.bonusRecived,
                    "transaction_date": moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss')
                }
                // maintain promo stats
                promoStatsData = {
                    promotion_id: promotionId,
                    user_id: userId
                }
            } else if (isTicketRecived) {
                promoStatsData = {
                    promotion_id: promotionId,
                    user_id: userId
                }
            }
            let userRecordsDetails = await SQL.Users.getUserRecordTable(userId);
            if (userRecordsDetails) {
                userRecordsDetails = userRecordsDetails[0];
            }
            let creditStatsAdded = await SQL.Users.insertData(statsData, 'bb_credit_stats');
            await SQL.Users.insertData(promoStatsData, 'bb_promotion_stats');
            await db.query(`update bb_txn set ? where txn_number = ?`, [txnUpdateData, txnId])
            console.log('response before succes ', params);
            delete params.CHECKSUMHASH;

            //############################### Send Email ##############
            //TODO: send email
            if (bonus || isTicketRecived) {
                let user = req.user;
                let mailData = {
                    user_email: user.email,
                    user_name: user.username,
                    link: __('WEB_LINK'),
                    is_Promo: true
                }
                await Utils.EmailService.sendMail(Utils.Constants.emails.paymentGateway, mailData);
            }
            mailData = {
                user_email: user.email,
                user_name: user.username,
                link: __('WEB_LINK'),
                is_Promo: false
            }
            await Utils.EmailService.sendMail(Utils.Constants.emails.paymentGateway, mailData);
            //############################### Send Email ##############
            return res.render(`redirecthome`, { response: JSON.stringify(params) });
            // return res.send({ params: params });

        } else if (params.STATUS == 'PENDING') {
            /**
             * TODO: Update the next pending check
             */
            // txnUpdateData.next_pending_check = moment().add(14, "minutes")
            console.log('response->>>>>>>>>>>> ', params);
            return res.render(`redirecthome`, { response: JSON.stringify(params) })
        } else {
            console.log('response->>>>>>>>>>>> ', params);
            return res.render(`redirecthome`, { response: JSON.stringify(params) })
        }
        // if (txnUpdateData) {
        //     console.log('updating txn --->>>> ', txnUpdateData);
        //     await db.query(`update bb_txn set ? where txn_number = ?`, [txnUpdateData, txnId])
        //         // db.query(`update bb_txn set unmappedstatus =? status = ? amount = ? payu = ? mihpayid = ? bank = ? addedon = ? field9 = ? PG = ? mode = ? bankcode =? where txn_number = ?`, Object.values(txnUpdateData))
        // }
    },
        error => {
            console.log('error => ', error);
            // res.send(error);
            params.IS_CHECKSUM_VALID = "N"
            console.log('response->>>>>>>>>>>> ', params);
            return res.render(`redirecthome`, { response: JSON.stringify(params) })
        }).catch(e => {
            params.IS_CHECKSUM_VALID = "N"
            console.log('response->>>>>>>>>>>> ', params);
            return res.render(`redirecthome`, { response: JSON.stringify(params) })
        })
}




exports.payuCallbackHandler = async (req, res) => {
    let params = req.body;
    params.RESPMSG = params.field9;
    if (params) {
        // return res.render("response.ejs", { resultData: "true", responseData: params });
        // return res.render(`test`, { resultData: "true", responseData: success });
        // return res.redirect('/status')
        let txnid = params.txnid;
        let checksum = params.hash;
        if (!checksum || !txnid) {
            // return res.send({ status: false, message: "Invalid request " })
            res.redirect(`/users/payu?status=fail&msg=${params.RESPMSG}`)
        }

        let key = Config.PAYU.PAYU_MERCHANT_KEY;
        let salt = Config.PAYU.PAYU_MERCHANT_SALT;
        let amount = params.amount;
        let status = params.status;
        let firstname = params.firstname;
        let posted_hash = params.hash;
        let productinfo = params.productinfo;
        let email = params.email;
        let udf1 = params.udf1;
        let mihpayid = params.mihpayid;
        let mode = params.mode;
        let unmappedstatus = params.unmappedstatus;
        let addedon = params.addedon;
        let field9 = params.field9;
        let error = params.error;
        let bankcode = params.bankcode;
        let payuMoneyId = params.payuMoneyId;
        let additionalCharges = params.additionalCharges;
        let bank_ref_num = params.bank_ref_num;
        let error_Message = params.error_Message;
        let PG_TYPE = params.PG_TYPE;
        let net_amount_debit = params.net_amount_debit;
        // let next_pending_check = params.additionalCharges;
        let txnUpdateData = {
            txn_status: 1,
            mihpayid: mihpayid,
            mode: mode,
            status: status,
            unmappedstatus: unmappedstatus,
            amount: amount,
            addedon: addedon,
            field9: field9,
            PG_TYPE: PG_TYPE,
            bank_ref_num: bank_ref_num,
            bankcode: bankcode,
            error_Message: error_Message,
            error: error,
            payuMoneyId: payuMoneyId,
            net_amount_debit: net_amount_debit
        }
        let txnDetails = false;
        return new Promise((resolve, reject) => {
            db.getConnection((err, connection) => {
                connection.beginTransaction(async (error) => {
                    try {
                        if (err) return reject("Connection intrupted")
                        txnDetails = await SQL.Users.getTxn(`txn_number='${txnid}'`);
                        if (!txnDetails) return reject("Invalid transaction")
                        if (txnDetails && txnDetails < 0) return reject("Invalid transaction")
                        txnDetails = txnDetails[0];
                        if (txnDetails.txn_status != 2) return reject("Invalid transaction")
                        var hashseq = salt + '|' + status + '|||||||||' + '|' + udf1 + '|' + email + '|' + firstname + '|' + productinfo + '|' + amount + '|' + txnid + '|' + key;
                        if (additionalCharges) {
                            hashseq = additionalCharges + '|' + hashseq;
                        }
                        var cryp = crypto.createHash('sha512');
                        cryp.update(hashseq);
                        var hash = cryp.digest('hex');
                        if (hash = posted_hash) {
                            await db.query(`update bb_txn set ? where txn_number = ?`, [txnUpdateData, txnid])
                            connection.commit()
                            return resolve({ hash: hash })
                        } else return reject("Invalid signature")
                    } catch (error) {
                        console.log('error->> ', error);
                        connection.commit()
                        return reject(err)
                    }
                })
            })
        }).then(async result => {
            console.log('processing--->>>>>>.', params);
            if (params.status == 'success') {
                let promotionId = txnDetails.promotion_id;
                let userId = txnDetails.user_id;
                let userDetails = await SQL.Users.getUserById(userId);
                userDetails = userDetails[0];
                if (!userDetails) {
                    // return res.send();
                    return res.redirect(`/users/payu?status=fail&msg=${params.RESPMSG}`)
                }
                let bonus = 0;
                let withdrwalBonus = 0;
                let isTicketRecived = false;
                let promoDetails = false;
                if (promotionId) {
                    promoDetails = await SQL.Users.getPromotionCodeTable(`where promotion_id=${promotionId}`);
                    if (promoDetails) {
                        if (promoDetails.length > 0 || amount >= promoDetails.txnAmount) {
                            promoDetails = promoDetails[0];
                            let cashBackType = promoDetails.cashback_type ? promoDetails.cashback_type : promoDetails.cashback_type;
                            let usageType = promoDetails.used_type;
                            let isAlreadyUsed = false;
                            if (usageType == 2) {
                                // check already used for single usage type
                                var usedPromo = await SQL.Users.getPromoStats(`user_id=${userId} and promotion_id = ${promotionId}`)
                                if (usedPromo && usedPromo.length > 0) isAlreadyUsed = true;
                            } else if (usageType == 3) {
                                // check for first time deposit
                                let txnFounded = await SQL.Users.getTxn(`user_id=${userId} and status IN('success', 'pending')`);
                                if (txnFounded && txnFounded.length > 0) isAlreadyUsed = true;
                            } else if (usageType == 4) {
                                let maxTimeUse = promoDetails.custom_numbers;
                                if (usedPromo && usedPromo.length >= maxTimeUse) isAlreadyUsed = true;
                            }
                            if (!isAlreadyUsed) {
                                let discount = promoDetails.discount;
                                let maxDiscount = promoDetails.maximum_discount;
                                if (discount) bonus = (amount * discount / 100).toFixed(2);
                                if (maxDiscount && bonus > maxDiscount) bonus = maxDiscount;
                                if (cashBackType == 2) {
                                    withdrwalBonus = bonus;
                                    bonus = 0;
                                }
                                if (promoDetails.promotion_type == 4) {
                                    if (amount >= promoDetails.minimum_deposit) {
                                        let tickets = promoDetails.tickets;
                                        if (tickets) {
                                            /**
                                             * TODO: Allocate tickets to the users
                                             */
                                            isTicketRecived = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                let totalAmount = amount + withdrwalBonus;
                // Add cash in the user wallet
                let updateResult = await SQL.Users.updateUserBalance(`unused_amount=unused_amount+${amount},bonus_cash=bonus_cash+${bonus}, total_cash_added=total_cash_added+${totalAmount}`, `user_id=${userId}`);
                let balanceUpdateStats = {
                    "user_id": userId,
                    "real_cash": amount,
                    "amount": amount,
                    "transaction_type": Utils.Constants.txnTypes.cashDeposited,
                    "txn_id": txnid,
                    "transaction_message": Utils.Constants.txnMessages.cashDeposited,
                    "transaction_date": 'NOW()'//moment().format('YYYY-MM-DD h:mm:ss')
                }
                let updateStatus = await SQL.Users.insertData2(balanceUpdateStats, 'bb_credit_stats')
                let redirectUrl = txnDetails.return_url ? txnDetails.return_url : Config.BASE_URL;
                let statsData = false;
                let promoStatsData = false;
                let bonusStatsData = false;
                // if cashback
                if (bonus) {
                    statsData = {
                        "user_id": userId,
                        "bonus_cash": bonus,
                        "amount": bonus,
                        "transaction_type": Utils.Constants.txnTypes.bonusCashAdded,
                        "txn_id": txnid,
                        "transaction_message": Utils.Constants.txnMessages.bonusRecived,
                        "transaction_date": 'NOW()'//moment().format('YYYY-MM-DD h:mm:ss')
                    }
                    promoStatsData = {
                        promotion_id: promoDetails.promotion_id,
                        user_id: userId
                    }
                    if (Config.BONUS_EXPIRY) {
                        bonusStatsData = {
                            user_id: userId,
                            bonus_amount: bonus,
                            bonus_type: "cash promo"
                        }
                    }
                } else if (withdrwalBonus) {
                    statsData = {
                        "user_id": userId,
                        "real_cash": withdrawBonus,
                        "amount": withdrawBonus,
                        "transaction_type": Utils.Constants.txnTypes.bonusCashAdded,
                        "txn_id": txnid,
                        "transaction_message": Utils.Constants.txnMessages.bonusRecived,
                        "transaction_date": 'NOW()'//moment().format('YYYY-MM-DD h:mm:ss')
                    }
                    // maintain promo stats
                    promoStatsData = {
                        promotion_id: promotionId,
                        user_id: userId
                    }
                } else if (isTicketRecived) {
                    promoStatsData = {
                        promotion_id: promotionId,
                        user_id: userId
                    }
                }
                let userRecordsDetails = await SQL.Users.getUserRecordTable(userId);
                if (userRecordsDetails) {
                    userRecordsDetails = userRecordsDetails[0];
                }
                let creditStatsAdded = await SQL.Users.insertData2(statsData, 'bb_credit_stats');
                await SQL.Users.insertData(promoStatsData, 'bb_promotion_stats');
                await db.query(`update bb_txn set ? where txn_number = ?`, [txnUpdateData, txnid])
                console.log('txn success=>');
                res.redirect("/users/payu?status=success&msg=Your deposit is successfull");

                // return res.send({ params: params });
                //############################### Send Email ##############
                //TODO: send email
                if (bonus || isTicketRecived) {
                    let user = req.user;
                    let mailData = {
                        user_email: user.email,
                        user_name: user.username,
                        link: __('WEB_LINK'),
                        is_Promo: true
                    }
                    await Utils.EmailService.sendMail(Utils.Constants.emails.paymentGateway, mailData);
                }
                mailData = {
                    user_email: user.email,
                    user_name: user.username,
                    link: __('WEB_LINK'),
                    is_Promo: false
                }
                await Utils.EmailService.sendMail(Utils.Constants.emails.paymentGateway, mailData);
                //############################### Send Email ##############
            } else {
                console.log('aaaaaaaaaaaaaaaaa', params);
                return res.redirect(`/users/payu?status=success&msg=${params.RESPMSG}`)
            }
            // res.send({ result: result })
        }).catch(error => {
            console.log('error-=->> ', error, params);
            return res.redirect(`/users/payu?status=success&msg=${params.RESPMSG}`)
        });
    } else {
        console.log('body not founded');
        return res.redirect(`/users/payu?status=success&msg=${params.RESPMSG}`)
    }
}

exports.juspayCallbackHandler = async (req, res) => {
    let params = req.body;
    if (!params) res.redirect(`/users/payu?status=fail&msg=invalid request`)
    let txnId = params.order_id;
    let signatureAlgorithm = params.signature_algorithm;
    let signature = params.signature;
    if (!signature || !txnId) {
        // return res.send({ status: false, message: "Invalid request " })
        res.redirect(`/users/payu?status=fail&msg=${params.RESPMSG}`)
    }
    let txnDetails = await SQL.Users.getTxn(`txn_number=${txnId}`);
    if (!txnDetails) {
        // return res.send({ status: false, message: "Txn not found" })
        return res.redirect(`/users/payu?status=fail&msg=${params.RESPMSG}`)
    }
    if (txnDetails && txnDetails < 0) {
        return res.redirect(`/users/payu?status=fail&msg=${params.RESPMSG}`)
        // return res.send({ status: false, message: "Txn not found" })
    }
    txnDetails = txnDetails[0];
    if (txnDetails.txn_status != 2) {
        // return res.send({ status: false, message: "Txn already used" })
        return res.redirect(`/users/payu?status=fail&msg=${params.RESPMSG}`)
    }
    let txnAmount = params.TXNAMOUNT;
    let txnUpdateData = false;
    if (params.STATUS == 'TXN_SUCCESS') {
        txnUpdateData = {
            "unmappedstatus": params.RESPCODE,
            "status": params.STATUS,
            "amount": params.TXNAMOUNT,
            "payuMoneyId": params.CURRENCY,
            "mihpayid": params.TXNID,
            "bank_ref_num": params.BANKTXNID,
            "addedon": params.TXNDATE,
            "field9": params.RESPMSG,
            "PG_TYPE": params.GATEWAYNAME,
            "mode": params.PAYMENTMODE,
            "bankcode": params.BANKNAME,
        }
        let promotionId = txnDetails.promotion_id;
        let userId = txnDetails.user_id;
        let userDetails = await SQL.Users.getUserById(userId);
        userDetails = userDetails[0];
        if (!userDetails) {
            // return res.send();
            return res.redirect(`/users/payu?status=fail&msg=${params.RESPMSG}`)
        }
        let bonus = 0;
        let withdrwalBonus = 0;
        let isTicketRecived = false;
        let promoDetails = false;
        if (promotionId) {
            promoDetails = await SQL.Users.getPromotionCodeTable(`where promotion_id=${promotionId}`);
            if (promoDetails) {
                if (promoDetails.length > 0 || txnAmount >= promoDetails.txnAmount) {
                    promoDetails = promoDetails[0];
                    let cashBackType = promoDetails.cashback_type ? promoDetails.cashback_type : promoDetails.cashback_type;
                    let usageType = promoDetails.used_type;
                    let isAlreadyUsed = false;
                    if (usageType == 2) {
                        // check already used for single usage type
                        var usedPromo = await SQL.Users.getPromoStats(`user_id=${userId} and promotion_id = ${promotionId}`)
                        if (usedPromo && usedPromo.length > 0) isAlreadyUsed = true;
                    } else if (usageType == 3) {
                        // check for first time deposit
                        let txnFounded = await SQL.Users.getTxn(`user_id=${userId} and status IN('success', 'pending')`);
                        if (txnFounded && txnFounded.length > 0) isAlreadyUsed = true;
                    } else if (usageType == 4) {
                        let maxTimeUse = promoDetails.custom_numbers;
                        if (usedPromo && usedPromo.length >= maxTimeUse) isAlreadyUsed = true;
                    }
                    if (!isAlreadyUsed) {
                        let discount = promoDetails.discount;
                        let maxDiscount = promoDetails.maximum_discount;
                        if (discount) bonus = (txnAmount * discount / 100).toFixed(2);
                        if (maxDiscount && bonus > maxDiscount) bonus = maxDiscount;
                        if (cashBackType == 2) {
                            withdrwalBonus = bonus;
                            bonus = 0;
                        }
                        if (promoDetails.promotion_type == 4) {
                            if (amount >= promoDetails.minimum_deposit) {
                                let tickets = promoDetails.tickets;
                                if (tickets) {
                                    /**
                                     * TODO: Allocate tickets to the users
                                     */
                                    isTicketRecived = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        let totalAmount = txnAmount + withdrwalBonus;
        // Add cash in the user wallet
        let updateResult = await SQL.Users.updateUserBalance(`unused_amount=unused_amount+${txnAmount},bonus_cash=bonus_cash+${bonus}, total_cash_added=total_cash_added+${totalAmount}`, `user_id=${userId}`);
        let balanceUpdateStats = {
            "user_id": userId,
            "real_cash": txnAmount,
            "amount": txnAmount,
            "transaction_type": Utils.Constants.txnTypes.cashDeposited,
            "txn_id": txnId,
            "transaction_message": Utils.Constants.txnMessages.cashDeposited,
            "transaction_date": 'NOW()'//moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss')
        }
        let updateStatus = await SQL.Users.insertData2(balanceUpdateStats, 'bb_credit_stats')
        let redirectUrl = txnDetails.return_url ? txnDetails.return_url : Config.BASE_URL;
        let statsData = false;
        let promoStatsData = false;
        let bonusStatsData = false;
        // if cashback
        if (bonus) {
            statsData = {
                "user_id": userId,
                "bonus_cash": bonus,
                "amount": bonus,
                "transaction_type": Utils.Constants.txnTypes.bonusCashAdded,
                "txn_id": txnId,
                "transaction_message": Utils.Constants.txnMessages.bonusRecived,
                "transaction_date": 'NOW()'//moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss')
            }
            promoStatsData = {
                promotion_id: promoDetails.promotion_id,
                user_id: userId
            }
            if (Config.BONUS_EXPIRY) {
                bonusStatsData = {
                    user_id: userId,
                    bonus_amount: bonus,
                    bonus_type: "cash promo"
                }
            }
        } else if (withdrwalBonus) {
            statsData = {
                "user_id": userId,
                "real_cash": withdrawBonus,
                "amount": withdrawBonus,
                "transaction_type": Utils.Constants.txnTypes.bonusCashAdded,
                "txn_id": txnId,
                "transaction_message": Utils.Constants.txnMessages.bonusRecived,
                "transaction_date": 'NOW()'//moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss')
            }
            // maintain promo stats
            promoStatsData = {
                promotion_id: promotionId,
                user_id: userId
            }
        } else if (isTicketRecived) {
            promoStatsData = {
                promotion_id: promotionId,
                user_id: userId
            }
        }
        let userRecordsDetails = await SQL.Users.getUserRecordTable(userId);
        if (userRecordsDetails) {
            userRecordsDetails = userRecordsDetails[0];
        }
        let creditStatsAdded = await SQL.Users.insertData2(statsData, 'bb_credit_stats');
        await SQL.Users.insertData(promoStatsData, 'bb_promotion_stats');
        await db.query(`update bb_txn set ? where txn_number = ?`, [txnUpdateData, txnId])
        res.redirect("?status=success&msg=Your deposit is successfull");
        // return res.send({ params: params });
        //############################### Send Email ##############
        //TODO: send email
        if (bonus || isTicketRecived) {
            let user = req.user;
            let mailData = {
                user_email: user.email,
                user_name: user.username,
                link: __('WEB_LINK'),
                is_Promo: true
            }
            await Utils.EmailService.sendMail(Utils.Constants.emails.paymentGateway, mailData);
        }
        mailData = {
            user_email: user.email,
            user_name: user.username,
            link: __('WEB_LINK'),
            is_Promo: false
        }
        await Utils.EmailService.sendMail(Utils.Constants.emails.paymentGateway, mailData);
        //############################### Send Email ##############
    } else if (params.STATUS == 'PENDING') {
        /**
         * TODO: Update the next pending check
         */
        // txnUpdateData.next_pending_check = moment().add(14, "minutes")
        return res.redirect(`/users/payu?status=fail&msg=${params.RESPMSG}`)
    } else {
        return res.redirect(`/users/payu?status=fail&msg=${params.RESPMSG}`)
    }
}
async function generateTxnnumber(n, gatewayType, userId, promotion, returnUrl, appOnly, amount, ipAddress) {
    var add = 1,
        max = 12 - add;
    max = Math.pow(10, n + add);
    var min = max / 10; // Math.pow(10, n) basically
    var number = Math.floor(Math.random() * (max - min + 1)) + min;
    let txnNumber = ("" + number).substring(add);
    let txnDetails = await SQL.Users.getTxn(`txn_number=${txnNumber}`)
    // console.log("ooo => ", txnDetails);
    if (txnDetails.length) {
        return false;
    }
    let data = [gatewayType, userId, txnNumber, promotion, amount, returnUrl, appOnly, ipAddress, moment().format('YYYY-MM-DD h:mm:ss')];
    let insertedTxn = await SQL.Users.insertTxnData(data);
    let pgType = gatewayType;
    let txnRowId = insertedTxn.insertId
    if (Number.isInteger(txnRowId / 2)) pgType = gatewayType;
    // console.log('inserted txn==>>>> ', insertedTxn);
    return { txnNumber: txnNumber, pgType: pgType };
}
async function submitWithdrawlRequest(userId, withdrawType, type, amount, ipAddress) {
    return new Promise(async (resolve, reject) => {
        try {
            db.getConnection(async (error, connection) => {
                if (error) {
                    console.log('error in getting connection=>> ', error);
                    connection.rollback();
                    reject(error)
                }
                connection.beginTransaction(async err => {
                    if (err) {
                        connection.rollback();
                        reject(err)
                    } else {
                        try {
                            // let user = await SQL.Users.selectUserForUpdate(userId)
                            connection.query(`SELECT * FROM bb_users WHERE user_id = ? FOR UPDATE`, userId, async (error, user) => {
                                if (error) {
                                    connection.rollback();
                                    reject(error)
                                } else {
                                    if (!user) return reject({
                                        status: Utils.StatusCodes.Error,
                                        title: "WRONG_DATA",
                                        message: __("WRONG_DATA")
                                    });
                                    if (user.length <= 0) return reject({
                                        status: Utils.StatusCodes.Error,
                                        title: "WRONG_DATA",
                                        message: __("WRONG_DATA")
                                    });
                                    user = user[0];
                                    if (user.total_cash_added < 10) return reject({
                                        status: Utils.StatusCodes.Error,
                                        title: "WRONG_DATA",
                                        message: __("REQUIRED_MIN_DEPOSIT", { amount: 10 })
                                    });
                                    // let userExtras = await SQL.Users.getUserExtras(user.user_id);
                                    console.log("users >>>>", user);

                                    connection.query(`select * from bb_user_extras where user_id = ? `, user.user_id, async (error, userExtras) => {
                                        if (error) {
                                            connection.rollback();
                                            reject(error)
                                        } else {
                                            let isPaytmLinked = false;
                                            console.log("userExtras >>", userExtras)
                                            if (userExtras.length > 0) isPaytmLinked = userExtras[0].is_paytm_linked;
                                            if (withdrawType == 1) {
                                                // for bank
                                                if (user.phone_verified != 1 || user.email_verified != 1 || user.pan_verified != 1 || user.bank_verified != 1) {
                                                    return reject({
                                                        status: Utils.StatusCodes.Error,
                                                        title: "ACCOUNT_NOT_VERIFIED",
                                                        message: __("ACCOUNT_NOT_VERIFIED")
                                                    });
                                                }
                                            } else if (withdrawType == 2) {
                                                if (user.phone_verified != 1 || user.email_verified != 1 || user.pan_verified != 1) {
                                                    return reject({
                                                        status: Utils.StatusCodes.Error,
                                                        title: "ACCOUNT_NOT_VERIFIED",
                                                        message: __("ACCOUNT_NOT_VERIFIED")
                                                    });
                                                } else if (isPaytmLinked != 1) {
                                                    return reject({
                                                        status: Utils.StatusCodes.Error,
                                                        title: "PAYTM_NOT_LINKED",
                                                        message: __("PAYTM_NOT_LINKED")
                                                    });
                                                }
                                            }
                                            let realCash = user.credits + 0;
                                            if (realCash < amount) return reject({
                                                status: Utils.StatusCodes.Error,
                                                title: "WITHDRAW_INSUFFICIENT_FUND",
                                                message: __("WITHDRAW_INSUFFICIENT_FUND", { amount: realCash })
                                            });
                                            // Cut the user balance here from credits only
                                            // let update = await db.query(`UPDATE bb_users SET credits = credits-${amount} WHERE user_id = ${userId}`);

                                            connection.query(`UPDATE bb_users SET credits = credits-${amount} WHERE user_id = ?`, userId, async (error, update) => {
                                                if (error) {
                                                    connection.rollback();
                                                    reject(error)
                                                } else {
                                                    // if (!update) return reject({
                                                    //     status: Utils.StatusCodes.Error,
                                                    //     title: "SOME_ERROR",
                                                    //     message: __("SOME_ERROR")
                                                    // });
                                                    let withdrawAmount = amount;
                                                    let withdrawTds = 0;
                                                    if (withdrawTds >= Config.WITHDRAW_TDS_START) {
                                                        let withdrawTdsPercent = Config.WITHDRAW_TDS_PERCENT;
                                                        withdrawTds = (amount * withdrawTdsPercent) / 100;
                                                        withdrawTds = Math.ceil(withdrawTds);
                                                        withdrawAmount = amount - withdrawTds;
                                                    }
                                                   
                                                    connection.query(`insert into bb_withdrawals (user_id, amount, type, amount_type, withdraw_tds, instrument_type, status, user_ip, transaction_date, date_added, modified_date) VALUES(?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`, [userId, withdrawAmount, type, 1, withdrawTds, withdrawType, 2, ipAddress], async (error, withdrawlId) => {
                                                        if (error) {
                                                            connection.rollback();
                                                            reject(error)
                                                        } else {
                                                            if (!withdrawlId) return reject({
                                                                status: Utils.StatusCodes.Error,
                                                                title: "SOME_ERROR",
                                                                message: __("SOME_ERROR")
                                                            });
                                                            // let creditStatsData = {
                                                            //     user_id: userId,
                                                            //     real_cash: amount,
                                                            //     amount: amount,
                                                            //     transaction_type: Utils.Constants.txnTypes.withdrawlRequested,
                                                            //     transaction_message: Utils.Constants.txnMessages.withdrawlRequested,
                                                            //     transaction_date: 'NOW()', //Utils.Mysql_dt,//Utils.DateTime.gmtDate,
                                                            //     modified_date: 'NOW()'//Utils.Mysql_dt     // Utils.DateTime.gmtDate// Utils.DateTime.utcDate

                                                            // };
                                                            // let txnId = await SQL.Users.insertData2(creditStatsData, 'bb_credit_stats');
                                                            connection.query(`insert into bb_credit_stats (user_id, real_cash, amount, transaction_type, transaction_message, transaction_date, modified_date)  VALUES(?, ?, ?, ?, ?, NOW(), NOW())`, [userId, amount, amount, Utils.Constants.txnTypes.withdrawlRequested, Utils.Constants.txnMessages.withdrawlRequested], async (error, txnId) => {
                                                                if (error) {
                                                                    connection.rollback();
                                                                    reject(error)
                                                                } else {
                                                                    if (!txnId) return reject({
                                                                        status: Utils.StatusCodes.Error,
                                                                        title: "SOME_ERROR",
                                                                        message: __("SOME_ERROR")
                                                                    });

                                                                    connection.commit();
                                                                    connection.release()
                                                                    return resolve({
                                                                        status: Utils.StatusCodes.Success,
                                                                        title: "success",
                                                                        message: __("success")
                                                                    })
                                                                }
                                                            })

                                                        }

                                                    })

                                                }
                                            })
                                        }
                                    })


                                }
                                // console.log('userr---->>>> ', user);

                            })


                        } catch (error) {
                            console.log('error ->>> ', error);
                            connection.rollback()
                            return reject({
                                status: Utils.StatusCodes.Error,
                                title: "SOME_ERROR",
                                message: __("SOME_ERROR")
                            });
                        }
                    }
                })
            });
        } catch (error) {
            console.log('Error in widrawl request');
            connection.rollback()
            return reject({
                status: Utils.StatusCodes.Error,
                title: "SOME_ERROR",
                message: e.message
            });
        }
    });
}
async function cancleWithdrawlRequest(userId, withdrawId) {
    return new Promise(async (resolve, reject) => {
        try {
            db.getConnection(async (error, connection) => {
                if (error) {
                    console.log('error in getting connection=>> ', error);
                    connection.rollback();
                    reject(error)
                }
                connection.beginTransaction(async err => {
                    if (err) {
                        connection.rollback();
                        reject(err)
                    } else {
                        try {
                            // let withdrawal = await SQL.Users.selectWithdrawlForUpdate(`withdraw_id=${withdrawId}`)
                            connection.query(`SELECT * FROM bb_withdrawals WHERE withdraw_id = ? FOR UPDATE`, withdrawId, async (error, withdrawal) => {
                                if (error) {
                                    connection.rollback();
                                    reject(error)
                                } else {
                                    if (!withdrawal) return reject({
                                        status: Utils.StatusCodes.Error,
                                        title: "WRONG_DATA",
                                        message: __("WRONG_DATA")
                                    });
                                    if (withdrawal.length <= 0) return reject({
                                        status: Utils.StatusCodes.Error,
                                        title: "WRONG_DATA",
                                        message: __("WRONG_DATA")
                                    });
                                    withdrawal = withdrawal[0];
                                    console.log("withDraw is >>>", withdrawal);
                                    if (withdrawal.status != 2) {
                                        if (withdrawal.status != 4) {
                                            console.log(">>>>>>>MMMM");
                                            if (withdrawal.status == 1) return reject({
                                                status: Utils.StatusCodes.Error,
                                                title: "WITHDRAWL_REQUEST_PAID",
                                                message: __("WITHDRAWL_REQUEST_PAID")
                                            });
                                            else if (withdrawal.status == 3) return reject({
                                                status: Utils.StatusCodes.Error,
                                                title: "WITHDRAWL_REQUEST_CANCELLED",
                                                message: __("WITHDRAWL_REQUEST_CANCELLED")
                                            });
                                            else if (withdrawal.status == 5) return reject({
                                                status: Utils.StatusCodes.Error,
                                                title: "WITHDRAWL_REQUEST_UNDER_REVIEW",
                                                message: __("WITHDRAWL_REQUEST_UNDER_REVIEW")
                                            });
                                            else return reject({
                                                status: Utils.StatusCodes.Error,
                                                title: "REQUEST_NOT_AVAILABLE",
                                                message: __("REQUEST_NOT_AVAILABLE")
                                            });
                                        }
                                    }
                                    let currentDaate = 'NOW()' //Utils.Mysql_dt//Utils.DateTime.gmtDate
                                    // let cancelled = await db.query(`UPDATE bb_withdrawals SET status = 3, canceled_by_user = 1, transaction_date = ${currentDaate} WHERE withdraw_id = ${withdrawId}`);

                                    connection.query(`UPDATE bb_withdrawals SET status = 3, canceled_by_user = 1, transaction_date = NOW() WHERE withdraw_id = ?`, withdrawId, async (error, cancelled) => {
                                        if (error) {
                                            connection.rollback();
                                            reject(error)
                                        } else {
                                            console.log("cancelled is >>>", cancelled);
                                            if (cancelled) {
                                                let amountType = withdrawal.amount_type;
                                                let amount = withdrawal.amount + 0;

                                                if (amountType == 1) amount = parseFloat(withdrawal.amount) + parseFloat(withdrawal.withdraw_tds) + 0;
                                                if (amountType == 2) amount = parseFloat(withdrawal.amount) + parseFloat(withdrawal.withdraw_charges) + 0;
                                                //update user credits
                                                // let update = await db.query(`UPDATE bb_users SET credits = credits+${amount} WHERE user_id = ${userId}`);

                                                connection.query(`UPDATE bb_users SET credits = credits+${amount} WHERE user_id = ?`, userId, async (error, update) => {
                                                    if (error) {
                                                        connection.rollback();
                                                        reject(error)
                                                    } else {

                                                        // let txnId = await SQL.Users.insertData2(creditStatsData, 'bb_credit_stats');
                                                        connection.query(`insert into bb_credit_stats (user_id, real_cash, amount, transaction_type, transaction_message, transaction_date, modified_date)  VALUES(?, ?, ?, ?, ?, NOW(), NOW())`, [userId, amount, amount, Utils.Constants.txnTypes.withdrawlReversed, Utils.Constants.txnMessages.withdrawlReversed], async (error, txnId) => {
                                                            if (error) {
                                                                connection.rollback();
                                                                reject(error)
                                                            } else {
                                                                if (!txnId) return reject({
                                                                    status: Utils.StatusCodes.Error,
                                                                    title: "SOME_ERROR",
                                                                    message: __("SOME_ERROR")
                                                                });
                                                                //############################# SENDING NOTIFICATION ########################################
                                                                let notifyData = {
                                                                    sender_id: 0,
                                                                    receiver_id: userId,
                                                                    notification_type: Utils.Constants.notifyType.cancelledWithdrawlRequest,
                                                                    message: Utils.Constants.notifyMsg.cancelledWithdrawlRequest,
                                                                    date_added: 'NOW()'//Utils.Mysql_dt //Utils.DateTime.gmtDate
                                                                }

                                                                //############################# SENDING NOTIFICATION #######################################
                                                                let user = await SQL.Users.getUserById(userId);
                                                                user = user[0]
                                                                let mobile = user.phone
                                                                /*
                                                                Services.Msg91.SendViaBulkSMS(mobile, notifyData.message, async (err, success) => {
                                                                    if (success) {
                                                                    console.log('message send success>>>>')
                                                                    await SQL.Users.insertData2(notifyData, 'bb_notifications');
                                                                    }
                                                                })
                                                                */
                                                                connection.commit();
                                                                connection.release()
                                                                return resolve({
                                                                    status: Utils.StatusCodes.Success,
                                                                    title: "success",
                                                                    message: __("success")
                                                                })
                                                            }
                                                        })
                                                            ;
                                                    }
                                                })

                                            } else
                                                return reject({
                                                    status: Utils.StatusCodes.Error,
                                                    title: "SOME_ERROR",
                                                    message: __("SOME_ERROR")
                                                })

                                        }
                                    })

                                }

                            })
                                ;
                        } catch (error) {
                            console.log('error ->>> ', error);
                            return reject({
                                status: Utils.StatusCodes.Error,
                                title: "SOME_ERROR",
                                message: __("SOME_ERROR")
                            });
                        }
                    }
                })
            });
        } catch (error) {
            console.log('Error in widrawl request');
            return reject({
                status: Utils.StatusCodes.Error,
                title: "SOME_ERROR",
                message: e.message
            });
        }
    });
}
exports.withdrawCash = async (req, res) => {
    return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WITHDRAW_STOP"), res);
    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
    let user = req.user;
    let gatewayType = req.body.gateway_type;
    let amount = req.body.amount;
    let type = req.body.type;
    let enableTds = req.body.enable_tds;

    if (!user || !gatewayType) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let userId = user.user_id;
    let paymentData = await SQL.Users.getPaymentMinMaxLimit(`instrument_type = ${gatewayType}`);

    console.log('paymentData>>>', paymentData);
    let minRedeemLimit = paymentData.min_amount;
    minRedeemLimit = parseInt(minRedeemLimit)
    let maxRedeemLimit = paymentData.max_amount;
    maxRedeemLimit = parseInt(maxRedeemLimit);

    let types = ["transfer", "cheque"];
    if (enableTds != 1) maxRedeemLimit = ((Config.WITHDRAW_TDS_START) - 1);
    if (!userId || !validator.isIn(type, types)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res);
    if (!validator.isNumeric(amount) || amount < minRedeemLimit) return await Utils.ResponseHandler(false, 400, "MIN_WITHDRAW_LIMIT", __("MIN_WITHDRAW_LIMIT", { limit: minRedeemLimit }), res);
    if (amount > maxRedeemLimit) return await Utils.ResponseHandler(false, 400, "MAX_WITHDRAW_LIMIT", __("MAX_WITHDRAW_LIMIT", { limit: maxRedeemLimit }), res);
    /**
     * Check for pending requests
     */
    let pending = await SQL.Users.getWithDrawlsTable(`user_id=${userId} and status IN(2,4,5)`)
    if (pending) return await Utils.ResponseHandler(false, 400, "PWNDING_REQUEST", __("PWNDING_REQUEST"), res);
    amount = parseInt(amount).toFixed(0);
    submitWithdrawlRequest(userId, gatewayType, type, amount, ip).then(async success => {
        // console.log('withdrawl request success=> ', success);
        let params = {
            user_email: user.email,
            user_name: user.username,
            link: __('WEB_LINK')
        }
        await Utils.EmailService.sendMail(Utils.Constants.emails.withdrawRequest, params);

        return await Utils.ResponseHandler(true, success.status, success.title, success.message, res);
    }, async error => {
        // console.log('withdrawl request error=> ', error);
        return await Utils.ResponseHandler(false, error.status, error.title, error.message, res);
    }).catch(async e => {
        console.log('erro->> ', e);
        return await Utils.ResponseHandler(false, 400, "SOME_ERROR", __("SOME_ERROR"), res);
    });
}
exports.cancleWithdrawlRequest = async (req, res) => {
    return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WITHDRAW_STOP"), res);
    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
    let user = req.user;
    let withdrawId = req.body.withdraw_id;
    if (!user || !withdrawId) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let userId = user.user_id;
    await cancleWithdrawlRequest(userId, withdrawId).then(async success => {

        let params = {
            user_email: user.email,
            user_name: user.username,
            link: __('WEB_LINK')
        }
        await Utils.EmailService.sendMail(Utils.Constants.emails.cancelWithdrawlRequest, params);
        user = await SQL.Users.getUser(` where user_id = ${userId} `);
        user = user[0];
        let response = {
            user: user
        }
        return await Utils.ResponseHandler(true, success.status, success.title, success.message, res, response);
    }, async error => {
        return await Utils.ResponseHandler(false, error.status, error.title, error.message, res);
    }).catch(async e => {
        console.log('erro->> ', e);
        return await Utils.ResponseHandler(false, 400, "SOME_ERROR", __("SOME_ERROR"), res);
    });
}

exports.updateTxn = async (req, res) => {
    try {
        let { userId, amount, promocode, isMobile } = req.body;
        var ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null);
        let pgType = req.body.pg;
        let txnId = req.body.txn_id;
        pg = pgType;
        if (!pgType) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res);
        if (!txnId) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res);

        let txnDetails = await SQL.Users.getTxn(`txn_number='${txnId}'`);
        console.log("ssss", req.body, txnId, pgType);
        if (!txnDetails) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res);
        if (txnDetails.length <= 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res);
        if (pgType == 2) {

            let { userId, amount, promocode, isMobile } = req.body;
            // let pg = 1;
            // userId = 780437;
            // promocode = 'EXTRABONUS';
            // amount = 100;
            isMobile = 1;
            if (!userId && !amount) {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __("WRONG_DATA"), res)
            }
            let userDetails = await SQL.Users.getUserById(userId);
            if (userDetails && userDetails.length == 0) {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __("UNAUTHORIZE_ACCESS"), res)
            }
            userDetails = userDetails[0];
            if (!amount || amount < 0) {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("Wrong_data"), __("Amount is required"), res)
            }
            if (promocode) {
                var promotion = await SQL.Users.getCodeForDeposit(`promotion_code='${promocode}'`)
                if (!promotion || !promotion.length) {
                    return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("invalid"), __("PROMOTION_INVALID"), res)
                }
                promotion = promotion[0];
                let currentDate = Mysql_dt;
                let promoStartDate = moment(promotion.start_date);
                let promoEndDate = moment(promotion.end_date);
                if (promoStartDate && promoStartDate > currentDate) {
                    return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("not_started"), __("PROMOTION_INVALID"), res)
                } else if (promoEndDate && promoEndDate < currentDate) {
                    return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("expired"), __("PROMOTION_INVALID"), res)
                }
                if (promotion.app_only && isMobile != 1) {
                    return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("non_app"), __("APPLICABLE_ON_APP_ONLY"), res)
                }
                if (amount < promotion.minimum_deposit) {
                    return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("min_deposit"), `Promocode applicable only above ${promotion.minimum_deposit}`, res)
                }
                // check promotionn used type
                let usedType = promotion.used_type
                console.log("Deposit promoc code use type", usedType);
                if (usedType === 2) {
                    let usedStatus = await SQL.Users.getPromoStats(`user_id=${userId} and promotion_id = ${promotion.promotion_id}`);
                    if (usedStatus || usedStatus.length) {
                        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("already_used"), __("PROMO_ALREADY_USED"), res)
                    }
                } else if (usedType == 3) {
                    //for first time user only
                    let usedTxns = await SQL.Users.getTxn(`user_id=${userId} and status IN('success', 'pending')`);
                    if (usedTxns || usedTxns.length) {
                        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("not_first_time"), __("PROMO_NOT_FIRST_TIME_USER"), res)
                    }
                } else if (usedType == 4) {
                    // max number of time can be used
                    let maxUse = promotion.custom_numbers;
                    let usedCount = await SQL.Users.getPromoStatsCount(`user_id=${userId} and promotion_id = ${promotion.promotion_id}`);
                    if (usedCount.length >= maxUse) {
                        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("fully_used"), __("PROMOTION_INVALID"), res)
                    }
                }
            }
            let promotionId = null;
            if (promotionId) {
                promotionId = promotion.promotion_id;
            }
            var txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) txnNumber = await generateTxnnumber(15, pg, userId, promotionId, null, isMobile, amount, ip);
            if (!txnNumber) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("error"), __("SOME_ERROR"), res)
            pg = txnNumber.pgType;
            txnNumber = txnNumber.txnNumber;
            if (pg == 1) {
                let key = Config.PAYU.PAYU_MERCHANT_KEY;
                let salt = Config.PAYU.PAYU_MERCHANT_SALT;
                var data = {
                    key: key,
                    txnid: txnNumber,
                    amount: amount,
                    productinfo: "add_cash",
                    firstname: userDetails.name ? userDetails.name : userDetails.username,
                    email: userDetails.email ? userDetails.email : "example@gmail.com",
                    udf1: '',
                    phone: userDetails.phone ? userDetails.phone : 9999999999,
                    surl: `${Config.BASE_URL}users/payum/success`,
                    furl: `${Config.BASE_URL}users/payum/failure`,
                    service_provider: "payu_paisa",
                    action: Config.PAYU_URL,
                    gateway: pg
                }
                var cryp = crypto.createHash('sha512');
                var text = data.key + '|' + data.txnid + '|' + data.amount + '|' + data.productinfo + '|' + data.firstname + '|' + data.email + '|||||' + data.udf1 + '||||||' + salt;
                // console.log('txn=>> ', text);

                cryp.update(text);
                var hash = cryp.digest('hex');
                data.hash = hash;
                let response = {
                    data: data
                };
                // console.log('payu=data=>> ', response);
                //##################### TO render view ###################################
                // return res.render("paytmRedirect.ejs", {
                //     resultData: success,
                //     paytmFinalUrl: Config.PAYTM.TXN_URL
                // });
                //##################### TO render view ###################################
                return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response)
            } else if (pg == 2) {
                initPayment(userId, txnNumber, amount).then(
                    async success => {
                        //##################### TO render view ###################################
                        // return res.render("paytmRedirect.ejs", {
                        //     resultData: success,
                        //     paytmFinalUrl: Config.PAYTM.TXN_URL
                        // });
                        //##################### TO render view ###################################
                        success.URL = Config.PAYTM.TXN_URL;
                        success.gateway = pg;
                        success.ENVIOURMENT = Config.PAYTM.PAYTM_ENVIOURMENT
                        let response = {
                            data: success
                        }

                        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response)
                    },
                    async error => {
                        console.log('error in paytm order', error);
                        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("error"), __("SOME_ERROR"), res, promotion)
                    }
                )
            } else if (pg == 4) {
                Juspay.Orders.create({ order_id: txnNumber, amount: amount }, async (data, err) => {
                    if (err) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("WRONG_DATA"), __("WRONG_DATA"), res, promotion)
                    data.gateway = pg;
                    let response = {
                        data: data
                    }
                    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response)

                })
            } else {
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, __("WRONG_DATA"), __("WRONG_DATA"), res, promotion)
            }

        } else {
            let txnUpdateData = {
                gateway_type: pgType
            }
            await db.query(`update bb_txn set ? where txn_number = ?`, [txnUpdateData, txnId])
            return await Utils.ResponseHandler(true, 200, "success", __("success"), res)
        }
    } catch (error) {
        console.log("error-> ", error);
        return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    }
}