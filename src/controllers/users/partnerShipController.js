let Utils = require('../../utils');
let SQL = require('../../sql');
let moment = require('moment');
let Config = require('../../config')
let validator = require('validator');

exports.partnerShipProgramBanner = async (options) => {
    return new Promise(async (resolve, rejected) => {
        let endDate = moment().format('YYYY-MM-DD 23:59:59');
        console.log(endDate);
        let userId = options.user_id;
        let lang = options.lang;
        let referrals = options.referrals;
        try {
            if (!userId) return await rejected({ Msg: __('WRONG_DATA'), title: "wrong_data" });
            console.log
            let leagues = {};
            let ppApplication = await SQL.Users.getPartnerApplicationById(userId);
            ppApplication = ppApplication[0];
            let ppApplicationStatus = false;
            if (ppApplication && ppApplication.status == 0) {
                ppApplicationStatus = true;
            }
            leagues.is_waiting = ppApplicationStatus;
            let totalLeagues = await SQL.Users.getPlayedLeagueCount(userId);
            totalLeagues = totalLeagues[0]

            if (totalLeagues && totalLeagues.count <= 0) {
                leagues.no_leagues = true
            } else {
                leagues.no_leagues = false;
            }
            let user = await SQL.Users.getUser(`where user_id = ${userId}`);
            user = user[0];
            if (!user) return await rejected({ Msg: __('WRONG_DATA'), title: "user_not_found" });
            // else if (referrals && user.is_affiliate == 0) return await rejected({ Msg: __('USER_NOT_AFFILIATE'), title: "error" });

            let type = Utils.Constants.bannerTypes.partnerShipBanner;
            let currentDateIST = moment().add(330, "minutes").format('YYYY-MM-DD h:mm:ss');
            //get partnership program banners
            let banner = await SQL.Users.getPartnerShipBanner(currentDateIST);
            let bonanaza_banners = await SQL.Users.getPartnershipBonanzaBanners(currentDateIST)
            let languages = Utils.Constants.languageTypes;
            if (!type || !languages.includes(lang)) lang = "en";
            //get text of what id partnership program
            let acknowledgeContent = await SQL.Users.get_user_acknowledge(`type = ${type} and lang_type = '${lang}' `);
            let title = await SQL.Users.get_user_acknowledge(` type = ${10} and lang_type = '${lang}'`)
            if (title.length > 0)
                acknowledgeContent[0].title = title[0].body;
            // let affiliateStats;
            // if (referrals) {
            // affiliateStats = await this.getAffiliateStats({ user_id: userId, type: 1 })
            // if (affiliateStats.Status != 200) {
            //     return affiliateStats
            // }
            // affiliateStats = affiliateStats.response;
            // }

            let wallet = {
                total_cash: user.unused_amount + user.credits + user.bonus_cash,
                current_affiliate_amount: user.current_affiliate_amount
            };
            let config = await SQL.Users.getConfig();
            console.log("Configs is >>>>", config);
            let configData = {};
            for (let k of config) {
                configData[k.name] = k.value
            }
            let myreferalsCount = await SQL.Users.getReferalsCount(userId);

            let response = {
                banners: banner.length > 0 ? banner : null,
                bonanaza_banners: bonanaza_banners.length > 0 ? bonanaza_banners : null,
                what_is_pp: acknowledgeContent.length == 1 ? acknowledgeContent[0] : acknowledgeContent,
                leagues: leagues,
                wallet: wallet,
                referal_count: myreferalsCount.length > 0 ? myreferalsCount[0].referal_count : 0,
                partnership_program_status: configData.partnership_program_status,
                user: options.user
            }
            return await resolve({ Msg: __("Success"), title: "Success", response: response });
        } catch (e) {
            console.log("Error in social login", e)
            return await rejected({ Msg: e.Msg, title: e.title });
        }
    })

}
exports.withdrawAffiliates = async (data) => {
    return new Promise(async (resolve, rejected) => {
        let minReedemLimit = Utils.Constants.MIN_AFFILIATE_WITHDRAW
        let userId = data.user_id;
        let amount = data.amount;
        console.log(userId)
        if (!userId) return await rejected({ Msg: __('WRONG_DATA'), title: "wrong_data" });
        try {
            // check if user found
            let user = await SQL.Users.getUserById(userId);
            user = user[0];

            if (!user) return await rejected({ Msg: __('WRONG_DATA'), title: "error" });
            if (user.is_affiliate != 1) return await rejected({ Msg: __('NOT_AFFILIATED'), title: "error" });
            if (!amount) {
                // for old versions also
                amount = user.current_affiliate_amount + 0;
            }
            // validate amount
            if (typeof amount == String) return await rejected({ Msg: __('ILLEGAL_AMOUNT'), title: "error" });

            // check negative
            if (amount < 0) return await rejected({ Msg: __('NEGATIVE_AMOUNT'), title: "error" })
            amount = parseInt(amount);

            // user credits must be equal or greater than withdraw amount
            let affiliateAmount = user.current_affiliate_amount + 0;
            if (amount < minReedemLimit) {
                return await rejected({ Msg: __('MIN_REDEEM_AMOUNT') + minReedemLimit, title: "error" });
            }
            if (affiliateAmount < amount) {
                return await rejected({ Msg: __('INSUFFICIENT_AFFILIATE_WALLET') + affiliateAmount, title: "error" });
            }
            let affiliateType = await SQL.Users.getAffiliateType(userId);
            affiliateType = affiliateType[0];
            console.log("affiliateType>>>", affiliateType);
            // cut user cash now

            let update;
            if (affiliateType.affiliate_type == 1 || affiliateType.affiliate_type == 0) {
                update = await SQL.Users.withdrawAffiliateAmount(userId, amount);
            } else if (affiliateType.affiliate_type == 2) {
                update = await SQL.Users.withdrawAffiliateAmountUnused(userId, amount);
            } else {
                return await rejected({ Msg: __('WRONG_DATA'), title: "wrong_data" });
            }
            if (!update) return await rejected({ Msg: __('SOME_ERROR'), title: "error" });

            let statsData = {
                user_id: userId,
                real_cash: amount,
                amount: amount,
                transaction_type: 11,
                transaction_date: 'NOW()',//moment().format('YYYY-MM-DD h:mm:ss'),
                transaction_message: "Earned for referring"
            }
            await SQL.Users.insertData2(statsData, "bb_credit_stats");
            if (affiliateType.affiliate_type == 1) {
                let charges = (amount * .05);
                statsData = {
                    user_id: userId,
                    real_cash: charges,
                    amount: charges,
                    transaction_type: 17,
                    transaction_date: moment().format('YYYY-MM-DD h:mm:ss'),
                    transaction_message: "Service Fee Deducted"
                }
                await SQL.Users.insertData2(statsData, "bb_credit_stats");
            }

            let userInfo = await SQL.Users.getUserById(userId);
            userInfo = userInfo[0];

            let totalCash = userInfo.credits + user.bonus_cash;
            let currentAmount = userInfo.current_affiliate_amount + 0;
            let response = {
                current_affiliate_amount: currentAmount,
                total_cash: totalCash
            }
            //send mail
            let mailerData = {
                user_email: user.email,
                user_name: user.name,
                link: __('WEB_LINK')
            }

            //attach mailer to send mail
            await Utils.EmailService.sendMail(Utils.Constants.emails.fundtransferPP, mailerData);
            return await resolve({ Msg: __("SUCCESS"), title: "success", response: response })
        } catch (e) {
            console.log("Error in withdrawAffiliate", e);
            return await rejected({ Msg: e.Msg, title: e.title });
        }
    })
}
exports.getAffiliateStats = async (data) => {
    return new Promise(async (resolve, rejected) => {
        let userId = data.user_id;
        let statsType = data.type;
        let limit = data.limit;
        let orderType = data.order_type;
        let referalOrder = ` t1.affiliate_id DESC`;
        let affiliateOrder = `date_added DESC, row_id desc`;
        if (orderType == 1) {
            referalOrder = ` t1.total_earnings asc`;
        } else if (orderType == 2) {
            referalOrder = ` t1.total_earnings desc`
        } else if (orderType == 3) {
            referalOrder = ` t1.affiliate_id asc`
        } else if (orderType == 4) {
            referalOrder = ` t1.affiliate_id desc`
        }

        if (!userId) return await rejected({ Msg: __('WRONG_DATA'), title: "wrong_data" });

        let user = await SQL.Users.getUser(`where user_id = ${userId}`);
        user = user[0];
        // console.log(user);
        if (!user) return await rejected({ Msg: __('WRONG_DATA'), title: "user_not_found" });

        //filters
        let startDate, endDate;
        if (data.startDate && data.endDate) {
            startDate = data.start_date;
            if (startDate) startDate = moment(start_date).format('YYYY-MM-DD h:mm:ss');
            endDate = data.end_date;
            if (endDate) endDate = moment(end_date).format('YYYY-MM-DD h:mm:ss');
        }


        let username = data.username;
        let match = data.match;
        let params = {
            start_date: startDate,
            endDate: endDate,
            username: username,
            match: match
        }
        let totalAffiliateAmount = user.total_affiliate_amount;
        if (startDate || endDate || username || match) {
            // get total affiliate amount by filter
            totalAffiliateAmount = await SQL.Users.getAffiliateStatsBySenderAmount(userId, params);
        }
        let page = data.page && data.page != 0 ? parseInt(data.page) : 1;
        if (!limit) {
            limit = 20
        }
        let offset = ((limit * page) - limit);
        // get affiliates
        if (data.page) {
            params.offset = offset;
            params.limit = parseInt(limit)
        }
        let myreferalsCount = await SQL.Users.getReferalsCount(userId);
        let affiliates, myreferral;
        if (statsType == 1) {
            affiliates = await SQL.Users.getAffiliateStatsBySender(userId, params, affiliateOrder);
            myreferral = await SQL.Users.getReferrals(` t1.sender = ${userId} and t2.username is not null `, params, referalOrder);

            // console.log("my referral>>>>", myreferral);
        } else if (statsType == 2) {
            myreferral = await SQL.Users.getReferrals(` t1.sender = ${userId} and t2.username is not null`, params, referalOrder);
            affiliates = {}
        } else if (statsType == 3) {
            affiliates = await SQL.Users.getAffiliateStatsBySender(userId, params, affiliateOrder);
            myreferral = {};
        } else {
            return await rejected({ Msg: __('WRONG_DATA'), title: "wrong_data" });
        }
        let response = {
            referral_code: user.referral_code,
            referal_count: myreferalsCount[0].referal_count,
            current_affiliate_amount: user.total_affiliates,
            total_affiliate_amount: totalAffiliateAmount,
            mimimum_withdraw: Utils.Constants.MIN_PARTNER_AFFILIATE_WITHDRAW,
            current_page: page,
            affiliates: affiliates.length > 0 ? affiliates : null,
            referals: Object.keys(myreferral).length > 0 ? myreferral : null,
            negative_txn_types: 3
        }
        return await resolve({ Msg: __('SUCCESS'), title: "Success", response: response, Status: Utils.StatusCodes.Success })
    })
}

exports.becomePartner = async (req, res, next) => {
    let userId = req.user.user_id;
    let isActive = { is_active: Config.IS_PARTNERSHIPT_ACTIVE };
    if (!userId) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('WRONG_DATA'), res, isActive)
    console.log(userId)
    let user = await SQL.Users.getUser(` where user_id = ${userId}`);
    user = user[0]
    if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "user_not_found", __('WRONG_DATA'), res, isActive);
    else if (user.is_affiliate == 1 || user.is_affiliate == 2) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "error", __('ALREADY_PARTNER'), res, isActive);

    let ppApplication = await SQL.Users.getPartnerApplicationById(userId);
    ppApplication = ppApplication[0];
    if (ppApplication) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "error", __('APPLICATION_IN_REVIEW'), res, isActive);
    /*
     * parameters need to update in users information
     * @params: is_affiliate (in user table)
     * @params: affilate_cmmission (bb_config table)
     * @param:  affilate_type =1 (in user extras table)
     * A update query in bb_affiliates table
     */
    let config = await SQL.Users.getConfig();
    // console.log("Configs is >>>>", config);

    let configData = {};
    for (let k of config) {
        configData[k.name] = k.value
    }
    let ppShutDownStatus = configData.partnership_program_status;
    if (!ppShutDownStatus) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "error", __('PP_NOT_ACTIVE'), res, isActive);

    console.log("Config data is", configData);
    let ppApprovalTime = configData.partnership_program_time
    let applicationData = {
        user_id: userId,
        approval_time: ppApprovalTime
    }
    let updateId = await SQL.Users.insertData(applicationData, "bb_partner_application");
    if (!updateId) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "some_error", __('SOME_ERROR'), res, isActive)

    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "success", __('APPLICATION_ACCEPTED'), res, isActive)
}