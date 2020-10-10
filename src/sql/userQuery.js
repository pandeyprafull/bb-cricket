const db = require('../utils/CricketDbConfig');
const Mysql_dt = require('../utils/mySql_dateTime');
const Bluebird = require('bluebird');
let moment = require('moment');
let Utils = require('../utils');


async function updateUserTable(column, where) {
    const sql = `update bb_users ${column} ${where} `;
    let updatedColumn = await db.query(sql);
    return updatedColumn;
}

module.exports = {
    getAccessToken: async(token, active) => {
        let sql = ` select * from bb_access_token where access_token = ? and active = ?   order by row_id desc `;
        console.log('sql ===>', sql);
        let result = await db.query(sql, [token, active]);
        result = result[0];
        return result;
    },
    getWalletDetails: async(where) => {
        const sql = `select * from bb_users ${where}`;
        const User_details = await db.query(sql);
        return User_details;
    },
    getTxnHistory: async(where) => {
        const sql = `select real_cash,bonus_cash,amount,league_name,match_name,match_date,
        transaction_type,
        transaction_message,
        transaction_date,
        modified_date,
        unused_cash,
        play_type,
        match_key,
        league_id from bb_credit_stats ${where}`;
        const user_transaction_history = await db.query(sql);
        return user_transaction_history;
    },
    getHowToPlay: async() => {
        const sql = `select status, video, lang_type, description, row_id, title, icon, image from bb_how_to_play`;
        const how_to_data = await db.query(sql);
        return how_to_data;
    },
    getPaymentConfig: async() => {
        let query = `select * from bb_payment_config`;
        return db.query(query);
    },
    getUserLoginDetails: async(where, record = false) => {
        let sql, result;
        sql = `select t1.*, (t1.unused_amount+t1.credits+t1.bonus_cash) as total_Cash from bb_users as t1 where ${where}`;
        result = await db.query(sql);

        if (record) {
            sql = `select t1.*, t2.*, t3.total_rakes, (t1.unused_amount+t1.credits+t1.bonus_cash) as total_Cash
      from bb_users as t1 left join bb_user_records as t2
     on t1.user_id = t2.user_id left join bb_user_rakes as t3 on t1.user_id = t3.user_id where ${where};`;
            result = await db.query(sql);
            return result
        }
        return result

    },

    getWalletDetails: async(where) => {
        const sql = `select user_id, unused_amount, credits as winning_amount, bonus_cash, (credits + unused_amount + bonus_cash) as balance_amount  from bb_users ${where}`;
        const User_details = await db.query(sql);
        return User_details;
    },
    getLeaderboards: async(filter, offset, limit) => {
        let sql = `select `;
        if (filter.fetch_type == 1) {
            sql += ` t1.* from bb_leaderboards as t1 where leaderboard_status = '1' order by t1.leaderboard_order DESC, t1.leaderboard_id DESC `;
        } else if (filter.fetch_type == 2) {
            sql += ` t1.* from bb_leaderboards as t1 where leaderboard_status = '2' order by t1.leaderboard_order DESC, t1.leaderboard_id DESC `;
        } else if (filter.fetch_type == 3) {
            sql += ` t1.* from bb_leaderboards as t1 where leaderboard_status = '3' order by t1.leaderboard_order DESC, t1.leaderboard_id DESC `;
        } else {
            sql += ` t1.*, t2.* from bb_leaders as t1 left join bb_leaderboards as t2 on t1.leaderboard_id=t2.leaderboard_id where t1.user_id = ${filter.user_id} order by t2.leaderboard_status ASC, t2.leaderboard_id DESC `

        }

        if (limit) {
            sql += ` limit ${limit} offset ${offset} `
        }
        // console.log("Sql is leaderBoard >>>", sql);
        return await db.query(sql);
    },

    getAnnouncements: async(screenType, playType = false, matchKey = false, date) => {
        let values = [screenType]

        let query = ` SELECT
            t1.title AS title,
            t1.match_key AS match_key,
            t1.match_name AS match_name,
            t1.message AS message
        FROM
            bb_announcements AS t1
        WHERE
            t1.screen_type = ? AND t1.status = '1' `;

        if (playType) {
            query += ` AND play_type = ? `;
            values.push(playType)
        }

        if (matchKey) {
            query += ` AND match_key = ? `
            values.push(matchKey)
        }

        query += `  AND t1.expiry_date > ? IS NOT NULL
        ORDER BY row_id DESC
        LIMIT 1  `
        values.push(date)
            //  console.log('===>> ', query);
        console.log("VALUES ==>>>", values)
        return await db.query(query, values);
    },
    getLeaders: async(lid, userId, offset = false, limit = false, self = false, table) => {

        let sql = ` select t1.*, t2.name, t2.image from ${table} as t1 left join bb_users as t2 on t1.user_id=t2.user_id where `

        if (self) {
            sql += ` leaderboard_id = ${lid} and t1.user_id = ${userId} `

        } else {
            sql += ` leaderboard_id = ${lid} order by  rank ASC, leader_id ASC `;
            if (limit) {
                sql += ` limit ${limit} offset ${offset} `
            }

        }
        // console.log("query .....", sql);
        return await db.query(sql);

    },
    getPromoContents: async(where) => {
        let table, columns, order;
        table = ` bb_promo_contents as t1`;
        columns = `row_id, promocode, heading, sub_heading, start_date, end_date`;
        order = ` row_id desc `;
        let sql = `select ${columns} from ${table} where ${where} order by ${order} `;

        return await db.query(sql);
    },

    getTxnHistory: async(userId, limit, offset, txnType = false) => {
        let sql;
        // console.log("txnType", txnType);
        if (txnType) {
            sql = `select row_id, user_id, real_cash,bonus_cash,amount,league_name,match_name,match_date,
            transaction_type,
            transaction_message,
            convert_tz(transaction_date,'+00:00','+05:30') as transaction_date,
            modified_date,
            unused_cash,
            play_type,
            match_key,
            league_id from bb_credit_stats where user_id = ${userId} and transaction_type IN(${txnType}) order by row_id desc limit ${limit} offset ${offset}`;
        } else {
            sql = `select row_id, user_id, real_cash,bonus_cash,amount,league_name,match_name,match_date,
            transaction_type,
            transaction_message,
            convert_tz(transaction_date,'+00:00','+05:30') as transaction_date,
            modified_date,
            unused_cash,
            play_type,
            match_key,
            league_id from bb_credit_stats where user_id = ${userId} order by row_id desc limit ${limit} offset ${offset}`;
        }

        const user_transaction_history = await db.query(sql);
        return user_transaction_history;

    },

    getBankDetails: async(userId, where) => {
        let sql = `select * from bb_bank_details where user_id = ${userId}`;
        if (where) {
            sql = `select * from bb_bank_details where ${where}`
        }
        return await db.query(sql);

    },

    removeBankDetails: async(userId) => {
        let sql = `delete  from bb_bank_details where user_id = ${userId}`;

        try {
            let result = await db.query(sql);
            result = result.affectedRows ? true : false
            return result
        } catch (e) {
            return e;
        }
    },

    get_notification: async(user_id, limit, offset) => {
        const sql = `select * from bb_notifications where receiver_id = ${user_id} order by date_added desc limit ${limit} offset ${offset}`;
        const notifications = await db.query(sql);
        return notifications;
    },
    post_insert_user_pan: async(values) => {
        const sql = `insert into bb_pan_details (user_id, pan_number, dob, state, date_added) ${values}`;
        const inserted_pan_details = await db.query(sql);
        return inserted_pan_details;
    },
    get_user_acknowledge: async(where) => {
        const sql = `select * from bb_acknowledge where ${where}`;
        const content = await db.query(sql);
        return content;
    },
    getPartnerApplicationById: async(userId) => {
        let query = ` select * from bb_partner_application where user_id = ${userId}`;
        return await db.query(query);
    },
    getPartnershipBonanzaBanners: async(currentDateIST) => {
        let query = `select * from  bb_promotions where  banner_type = '5' AND
        status= '1' AND
        (start_date IS NULL OR start_date<='${currentDateIST}')
        AND
        (end_date IS NULL OR end_date>='${currentDateIST}')
        order by sorting_order DESC, promotion_id DESC`;

        try {
            return await db.query(query);
        } catch (e) {
            return e;
        }
    },
    getPlayedLeagueCount: async(userId) => {
        let query = `select (total_bowling+total_batting+total_classic +total_classic_kb+total_classic_fb) as count from bb_user_records where user_id= ${userId}`;

        return db.query(query);
    },
    getUser: async(where) => {
        const sql = `select * from bb_users ${where}`;
        try {
            const user = await db.query(sql);
            return user;
        } catch (e) {
            return e
        }
    },
    getUserDetails: async(userId) => {
        const sql = `select * from bb_users where user_id = ?`;
        const user = await db.query(sql, userId);
        if (user.length > 0) return user[0];
        return false;
    },
    getUserSocialInitiates: async(where, columns = `*`) => {
        let query = ` select ${columns} from bb_social_initiates ${where}`;
        return await db.query(query);

    },
    getPartnerShipBanner: async(currentDateIST) => {
        let query = `select * from  bb_promotions where  banner_type = '3' AND
    status= '1' AND
    (start_date IS NULL OR start_date<='${currentDateIST}')
    AND
    (end_date IS NULL OR end_date>='${currentDateIST}')
    order by sorting_order DESC, promotion_id DESC`;

        try {
            return await db.query(query);
        } catch (e) {
            return e;
        }
    },

    updateProfile: async(userId, update) => {
        console.log("userid and data>>>>>", userId, update);
        let query = `update bb_users set `;
        for (const key in update) {
            if (update.hasOwnProperty(key)) {
                const element = update[key];
                if (element != "" && element != " " && element && element != null && element != undefined) {
                    query = `${query} ${key}= '${element}',`
                }
            }
        }
        query = query.slice(0, -1)
        query = `${query} where user_id = ${userId}`;
        // console.log('==>>', query);
        let result = await db.query(query);
        result = result.affectedRows ? true : false;

        console.log("queryresult >>>", result);
        return result;

    },

    updateTable: async(where, update, table) => {
        let query = `update ${table} set `;
        for (const key in update) {
            if (update.hasOwnProperty(key)) {
                const element = update[key];
                if (element != "" && element != " " && element && element != null && element != undefined) {
                    query = `${query} ${key} = '${element}',`
                }
            }
        }
        query = query.slice(0, -1)
        query = `${query} ${where} `;
        // console.log('==>>', query);
        let result = await db.query(query);
        result = result.affectedRows ? true : false;

        console.log("queryresult >>>", result);
        return result;

    },
    getUnique: async(where) => {
        let query = `select * from bb_users ${where} `
        let result = await db.query(query);
        result = result[0]
        return result;
    },
    selectUserForUpdate: async(userId, columns = "*") => {
        const sql = `SELECT ${columns} FROM bb_users WHERE user_id = ${userId} FOR UPDATE`;
        const user = await db.query(sql);
        return user;
    },
    selectWithdrawlForUpdate: async(where, columns = "*") => {
        const sql = `SELECT ${columns} FROM bb_withdrawals WHERE ${where} FOR UPDATE`;
        const user = await db.query(sql);
        return user;
    },
    updateUserRecordTable: async(where, column) => {
        const sql = `update bb_user_records ${column} ${where} `;
        const updatedUser = await db.query(sql);
        return updatedUser;
    },
    creditStateTable: async(where) => {
        const sql = `select * from bb_credit_stats ${where} `;
        const creditStats = await db.query(sql);
        return creditStats;
    },
    getUpdateList: async(deviceType = false, versionCode) => {
        let query;
        if (deviceType == 1) { //for iOS
            query = `SELECT * FROM bb_app_update WHERE device_type = 1 AND INET_ATON(version_number) > INET_ATON('${versionCode}') ORDER BY update_id DESC`
        } else if (deviceType = 2) { // for android
            query = `SELECT * FROM bb_app_update WHERE device_type = 2 AND version_code > '${versionCode}' ORDER BY update_id DESC`
        } else {
            query = `SELECT * FROM bb_app_update ORDER BY update_id DESC`
        }
        var result = await db.query(query);
        return result;
    },
    getUserLoginDetails: async(where, record = false) => {
        try {
            let sql, result;
            sql = `select t1.*, (t1.unused_amount + t1.credits + t1.bonus_cash) as total_Cash from bb_users as t1 where ${where} `;
            result = await db.query(sql);

            if (record) {
                sql = `select t1.*, t2.*, t3.total_rakes, (t1.unused_amount + t1.credits + t1.bonus_cash) as total_Cash
        from bb_users as t1 left join bb_user_records as t2
        on t1.user_id = t2.user_id left join bb_user_rakes as t3 on t1.user_id = t3.user_id where ${where}; `;
                result = await db.query(sql);
            }
            return result;
        } catch (e) {
            return e;
        }

    },
    insertOrUpdate: async(deviceData) => {
        let query = ` INSERT INTO bb_user_devices (user_id, device_type, device_id, device_token, is_login, app_version, user_ip)
        VALUES (${deviceData.userId}, ${deviceData.device_type}, '${deviceData.device_id}', '${deviceData.device_token}', 1, '${deviceData.app_version}', '${deviceData.user_ip}')
        ON DUPLICATE KEY UPDATE device_type='${deviceData.device_type}', device_id='${deviceData.device_id}', device_token='${deviceData.device_token}', is_login= 1,app_version='${deviceData.app_version}', user_ip='${deviceData.user_ip}' `;
        try {
            let result = await db.query(query);
            result = result.affectedRows ? true : false;
            return result;
        } catch (e) {
            return e
        }
    },

    insertOrUpdateUserRecords: async (userId, promocode = false, signup_from = false, signup_from_version = false, signup_channel = false) => {
        console.log("ssssssssssssssssssssssssssssssssss", userId, promocode , signup_from , signup_from_version , signup_channel);
        let Values = [];
        let sql = ` `;
        if (promocode && signup_from && signup_from_version && signup_channel) {
            sql = ` INSERT INTO bb_user_records (user_id, signup_promo_code, signup_from, signup_from_version, signup_channel) VALUES(?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE signup_promo_code = VALUES(signup_promo_code), signup_from = VALUES(signup_from), signup_from_version = VALUES(signup_from_version), signup_channel = VALUES(signup_channel) `;

            Values = [userId, promocode, signup_from, signup_from_version, signup_channel];
        } else if (signup_from && signup_from_version && signup_channel) {

            sql = ` INSERT INTO bb_user_records (user_id, signup_from, signup_from_version, signup_channel) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE  signup_from = VALUES(signup_from), signup_from_version = VALUES(signup_from_version), signup_channel = VALUES(signup_channel) `;

            Values = [userId, signup_from, signup_from_version, signup_channel];

        } else if (signup_from && signup_from_version) {
            sql = ` INSERT INTO bb_user_records (user_id, signup_from, signup_from_version) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE signup_from = VALUES(signup_from), signup_from_version = VALUES(signup_from_version) `;

            Values = [userId, signup_from, signup_from_version]
        }else{
            sql = ` INSERT INTO bb_user_records (user_id, signup_channel) VALUES(?, ?) ON DUPLICATE KEY UPDATE signup_channel = VALUES(signup_channel)`;
        }

        console.log("sql ---->", sql, Values)
        if(sql.length>0)
        return await db.query(sql, Values)
        else return ;

    },

    UserDeviceTableInsertOrIgnore: async (deviceDataObj, userId) => {
        let deviceType = deviceDataObj.device_type;
        let deviceId = deviceDataObj.device_id;
        let deviceToken = deviceDataObj.device_token;
        let isLogin = deviceDataObj.is_login;
        let userIp = deviceDataObj.user_ip

        let appVersion = '2.22';

        let query = `
    INSERT INTO bb_user_devices (user_id, device_type, device_id, device_token, is_login, app_version, user_ip)
    VALUES ('${userId}', '${deviceType}', '${deviceId}', '${deviceToken}', '${isLogin}', '${appVersion}', '${userIp}')
    ON DUPLICATE KEY UPDATE device_type='${deviceType}', device_id='${deviceId}', device_token='${deviceToken}', is_login='${isLogin}', app_version='${appVersion}', user_ip='${userIp}'`;

        return await db.query(query);
    },

    getUserDevices: async(columns = false, userId) => {
        let query = ` select ${columns} from bb_user_devices where user_id  = ${userId}`;

        return await db.query(query);
    },
    getPanDetails: async(userId) => {
        let query = `select * from bb_pan_details where user_id = ${userId} `;
        try {
            return db.query(query);
        } catch (e) {
            return e;
        }
    },
    getAadharDetails: async(userId) => {
        let query = `select * from bb_aadhaar_details where user_id = ${userId} `;
        try {
            return db.query(query);
        } catch (e) {
            return e;
        }
    },
    getAadharDetails: async(userId) => {
        let query = `select * from bb_aadhaar_details where user_id = ${userId} `;
        try {
            return db.query(query);
        } catch (e) {
            return e;
        }
    },
    getUserExtras: async(userId) => {
        let query = `select * from bb_user_extras where user_id = ${userId} `;
        // console.log('query-->>> ', query);

        let result = await db.query(query);
        if (result.length >= 0) return result[0];
        else false
    },
    updatePaytmLinkedStatus: async(userId) => {
        let query = `INSERT INTO bb_user_extras (is_paytm_linked,user_id) VALUES (1,${userId}) ON DUPLICATE KEY UPDATE is_paytm_linked = 1`;
        return db.query(query);
    },
    getConfig: async() => {
        let query = `select * from bb_configs where type IN(1, 5, 6, 7, 9, 10, 11)`;
        var result = await db.query(query);
        return result;
    },
    getAffiliateType: async(userId) => {
        let query = `select affiliate_type from bb_user_extras where user_id = ${userId}`;
        return await db.query(query);
    },
    withdrawAffiliateAmount: async(userId, amount) => {
        let creditAmount = (amount - (amount * 0.05));
        let query = ` update bb_users set credits = credits + ${creditAmount} , current_affiliate_amount = current_affiliate_amount - ${amount}, modified_date = '${moment().format('YYYY-MM-DD hh:mm:ss')}' where user_id = ${userId} `;

        let result = await db.query(query);
        result = result.affectedRows ? true : false;
        return result;
    },
    withdrawAffiliateAmountUnused: async(userId, amount) => {
        let query = ` update bb_users set unused_amount = unused_amount + ${amount}, current_affiliate_amount = current_affiliate_amount - ${amount}, modified_date = '${moment().format('YYYY-MM-DD hh:mm:ss')}' where user_id = ${userId} `;
        let result = await db.query(query);
        result = result.affectedRows ? true : false;
        return result
    },
    getUserById: async(userId, columns = false) => {
        let query = '';
        if (columns) {
            query = `select ${columns} from bb_users where user_id = ? `
        } else {
            query = `select * from bb_users where user_id = ? `
        }
        var result = await db.query(query, [userId]);
        return result;
    },
    getUserActiveTickets: async(userId, matchKey, leagueCatagory, joiningAmount = 0, playType = 1) => {
        let values;
        let query = `SELECT
            t1.row_id AS row_id,
            t2.match_name AS match_short_name,
            t1.ticket_id AS ticket_id,
            t1.ticket_type AS ticket_type,
            CONVERT_TZ(t1.ticket_expiry, '+00:00', '+05:30') AS ticket_expiry,
            t1.date_added AS date_added,
            t2.ticket_title AS ticket_title,
            t2.match_key AS match_key,
            t2.ticket_status as ticket_status,
            t2.league_id AS league_id,
            t2.league_name AS league_name,
            t2.fantasy_type AS fantasy_type,
            t2.joining_amount AS joining_amount,
            t2.match_name AS match_name,
            t2.play_type AS play_type,
            t2.league_category AS league_category,
            t3.match_name AS match_name,
            t3.match_short_name AS match_short_name,
            t3.match_related_name AS match_related_name
        FROM
            bb_ticket_users AS t1
        INNER JOIN bb_tickets AS t2 ON
            t1.ticket_id = t2.ticket_id
        LEFT JOIN bb_matches AS t3 ON
            t2.match_key = t3.match_key
        WHERE`;
        if (matchKey && leagueCatagory) {
            query = `${query} t1.user_id = ?
                    AND t1.used_status = '1'
                    AND t2.play_type = 1
                    AND ticket_status = '1'
                    AND t1.ticket_expiry > '${Mysql_dt}'
                    AND t2.match_key = ?
                    AND t2.league_category = ?
                    AND t2.joining_amount = ?
                    ORDER BY t1.ticket_expiry ASC, t1.date_added ASC`
            values = [userId, matchKey, leagueCatagory, joiningAmount]
        } else if (leagueCatagory) {
            query = `${query} t1.user_id = ?
                    AND t1.used_status = '1'
                    AND ticket_status = '1'
                    AND t1.ticket_expiry > '${Mysql_dt}'
                    AND t2.league_category = ?
                    AND t2.joining_amount = ?
                    AND t2.ticket_type in (2,3)
                    ORDER BY t1.ticket_expiry ASC, t1.date_added ASC`
            values = [userId, leagueCatagory, joiningAmount]
        } else {
            query = `${query} t1.user_id = ?
                    AND t1.used_status = '1'
                    AND ticket_status = '1'
                    AND t1.ticket_expiry > '${Mysql_dt}'
                    ORDER BY t1.ticket_expiry ASC, t1.date_added ASC`;
            values = [userId]
        }
        // console.log("query-->> ", query, values);
        var result = await db.query(query, values);
        return result;
    },
    ticketUsedForMatch: async(userId, matchKey) => {

        let sql = ` SELECT
        t1.league_used AS league_used,
        t1.date_used AS date_used,
        t2.ticket_id AS ticket_id,
        t2.ticket_title AS ticket_title,
        t2.ticket_type AS ticket_type,
        t2.league_id AS league_id,
        t2.ticket_status AS ticket_status,
        t2.league_category AS league_category
    FROM
        bb_ticket_users AS t1
            LEFT JOIN
        bb_tickets AS t2 ON t1.ticket_id = t2.ticket_id
    WHERE
        user_id = ? AND match_used = ?
            AND used_status = 2 `

        return db.query(sql, [userId, matchKey])
    },
    checkUsedTicket: async(userId, matchKey, templateId) => {
        let query = `SELECT
        t1.row_id AS row_id,
        t2.ticket_title AS ticket_title,
        t2.match_key AS match_key,
        t2.league_id AS league_id,
        t2.league_name AS league_name,
        t2.fantasy_type AS fantasy_type
        FROM
        bb_ticket_users AS t1
        LEFT JOIN
        bb_tickets AS t2 ON t1.ticket_id = t2.ticket_id
        WHERE
        t1.user_id = ?
        AND t1.match_used = ?
        AND t2.league_id = ? `;
        var result = await db.query(query, [userId, matchKey, templateId]);
        return result;
    },
    getUserTeams: async(userId, matchKey, fantasyType, teams) => {
        let query = `SELECT
        t1.team_number AS team_number
        FROM
        bb_user_teams AS t1
        WHERE
        user_id = ?
        AND match_key = ?
        AND fantasy_type = ?
        GROUP BY team_number`;
        var result = await db.query(query, [userId, matchKey, fantasyType]);
        if (result.length > 0) return result
        return false;
    },
    getUserRecordTable: async(user_id, columns = "*") => {
        const sql = ` select ${columns} from bb_user_records where user_id = ? `;
        console.log("query is >>>>", sql, user_id);
        const record = await db.query(sql, [user_id]);
        console.log(" records are >> ", record);
        return record;
    },


    getTotalInvitedByUser: async(userId) => {

        let sql = ` SELECT
        COUNT(1) as totalContact
    FROM
        bb_phonebook AS t1
    WHERE
        user_id = ? AND is_invited = 1
            AND status = 1  `;

        return await db.query(sql, [userId])
    },
    getPromotionCodeTable: async(where) => {
        const sql = `select * from bb_promotion_codes ${where} `
        try {
            const promotionCodes = await db.query(sql);
            return promotionCodes;
        } catch (e) {
            return e
        }
    },
    updateVerifyEmailTable: async(column, where) => {
        const sql = `update bb_verify_email ${column} ${where} `;
        try {
            const updatedColumn = await db.query(sql);
            return updatedColumn;
        } catch (e) {
            return e
        }
    },

    updateUserTable: async(column, where) => {
        const sql = `update bb_users ${column} ${where} `;
        let updatedColumn = await db.query(sql);
        return updatedColumn;
    },
    updateUserDeviceTable: async(column, where) => {
        const sql = `update bb_user_devices set ${column} where ${where} `;
        let updatedColumn = await db.query(sql);
        return updatedColumn;
    },
    signUpPromoTable: async(Arr) => {
        const sql = `INSERT IGNORE INTO bb_signup_promos(user_id, promotion_id, status, date_added, modified_date)
        VALUES(?, ?, ?, Now(), Now())`;
        // const sql = `INSERT IGNORE INTO bb_signup_promos(user_id, promotion_id, status)
        // VALUES (?, ?, ?)`;
        const insertedData = await db.query(sql, Arr);
        return insertedData;
    },
    getSignUpPromoTable: async(where) => {
        const sql = `select * from bb_signup_promos ${where}`;
        const promos = await db.query(sql);
        return promos;
    },
    referralStatTable: async(Arr) => {
        const sql = `INSERT IGNORE INTO bb_referral_stats (referral_code, invited_by, invited_to, bonus_1, bonus_2, date_added) VALUES(?, ?, ?, ?, ?, ?)`;
        const stats = await db.query(sql, Arr);
        return stats;
    },
    updateSignUpPromo: async(update, where) => {
        const sql = `update bb_signup_promos ${update} ${where}`;
        const updated = await db.query(sql);
        return updated;
    },
    userAddBonusCash: async(User, signupBonus = false) => {
        let userId = User.user_id;
        let bonusCash = User.bonus_cash;
        let update = `set bonus_cash = (bonus_cash + ${bonusCash}), modified_date = NOW()`;
        if (signupBonus) update = `set bonus_cash = (bonus_cash +${bonusCash}), modified_date = NOW(), signup_bonus = ${bonusCash}`
        let where = `where user_id = ${userId}`;

        if (updateUserTable(update, where) !== false) return true;
        return false;

    },
    insertCreditStats: async(Arr) => {
        let sql = `INSERT IGNORE INTO bb_credit_stats
  (user_id, bonus_cash, amount, transaction_type, transaction_message, transaction_date) VALUES(?, ?, ?, ?, ?, CONVERT_TZ(now(),'+00:00','+05:30'))`;
        const result = await db.query(sql, Arr);
        return result
    },
    addPromoStats: async(Arr) => {
        let sql = `INSERT IGNORE INTO bb_promotion_stats (promotion_id, user_id) VALUES (?, ?)`
        const result = await db.query(sql, Arr);
        return result
    },
    addBonusStats: async(Arr) => {

        let sql = `INSERT IGNORE INTO bb_bonus_stats (user_id, bonus_amount, bonus_type,
            bonus_timestamp, date_added, modified_date) VALUES(?, ?, ?, unix_timestamp(), NOW(), NOW())`;
        console.log("Bonus stats >>>", sql, Arr);
        const result = await db.query(sql, Arr);
        return result;
    },
    getReferralStat: async(where) => {
        let sql = `select * from bb_referral_stats ${where}`;
        const result = await db.query(sql);
        return result;
    },
    updateReferralStats: async(update, where) => {
        let sql = `update bb_referral_stats ${update} ${where}`;

        console.log("referral stats >>>", sql)
        const result = await db.query(sql);
        return result;
    },
    getAffiliate: async(Arr) => {
        // let date = Mysql_dt;
        // Arr.push(date);
        let sql = `INSERT IGNORE INTO bb_affiliates (sender, receiver, date_added)
    VALUES (?, ?, NOW())`;
        const result = await db.query(sql,Arr);
        return result;
    },
    getAffiliateStatsBySenderAmount: async(affiliateId, search = {}) => {
        let where = ` where t1.affiliate_id = ${affiliateId} `
        let query = ` select SUM(t1.affiliate_amount) as total from bb_affiliate_stats left join bb_users as t2 on t1.joiner = t2.user_id `;
        let startDate, endDate
        if (search.match != "" && search.match != undefined) where += ` and t1.match_name like '%${search.match}%' `;
        if (search.username != " " && search.username != undefined) where += ` and t2.username = ${search.username} `;
        //  if(search.start_date != " " && search.end_date != " " && search.start_date != undefined && search.end_date != undefined){
        //      startDate = moment().format('YYYY-MM-DD 00:00:00');
        //      endDate = moment().format('YYYY-MM-DD 23:59:59');
        //      where += ` and t1.date_added between '${startDate}' AND '${endDate}' `
        //  }else if(search.start_date != "" && search.start_date != undefined){
        //      startDate = moment().format('YYYY-MM-DD 00:00:00');
        //      where += ` and t1.date_added >= '${startDate}' `
        //  }else if(search.end_date !=""  &&  search.end_date != undefined){
        //  endDate = moment().format('YYYY-MM-DD 23:59:59');
        //  where += ` and t1.date_added <= '${endDate}' `
        //  }

        query = ` ${query} ${where}`;
        try {
            let result = await db.query(query);
            console.log("Query result is >>>", result)
            let total = result[0].total;
            total = total ? total : 0
            return total
        } catch (e) {
            return e;
        }

    },

    getAffiliateStatsBySender: async(affiliateId, search) => {
        let where = ` where t1.affiliate_id = ${affiliateId} `
        let columns = ` t2.name as receiver_name,
        t2.username  as receiver_username,
        t1.date_added as date_added ,
        t2.user_id as user_id ,
        t1.transaction_type as transaction_date ,
        t1.affiliate_amount as  affiliate_amount `;

        let query = ` select ${columns} from bb_affiliate_stats as t1 left join bb_users as t2 on t1.joiner = t2.user_id `;
        let startDate, endDate
        if (search.match != " " && search.match != undefined) where += ` and t1.match_name like '%${search.match}%' `;
        if (search.username != " " && search.username != undefined) where += ` and t2.username = '${search.username}' `;
        //  if(search.start_date != " " && search.end_date != ""){
        //      startDate = moment().format('YYYY-MM-DD 00:00:00');
        //      endDate = moment().format('YYYY-MM-DD 23:59:59');
        //      where += ` and t1.date_added between '${startDate}' AND '${endDate}' `;
        //  }else if(search.start_date != " " && search.start_date != undefined){
        //      startDate = moment().format('YYYY-MM-DD 00:00:00');
        //      where += ` and t1.date_added >= '${startDate}' `
        //  }else if(search.end_date != " " && search.endDate != undefined){
        //  endDate = moment().format('YYYY-MM-DD 23:59:59');
        //  where += ` and t1.date_added <= '${endDate}' `
        //  }

        let order = ` order by t1.date_added DESC, t1.row_id desc `;
        let limit, offset;
        query = ` ${query} ${where} ${order}`;
        // console.log(query);
        if (search.limit) {
            query = ` ${query}  limit ${search.limit} offset ${search.offset} `;
        }

        try {
            let result = await db.query(query);
            // console.log("Query result is >>>", result)
            return result;
        } catch (e) {
            return e;
        }
    },
    getReferrals: async(where = false, search, order = ` affiliate_id DESC `) => {
        let query = ` select t1.receiver, t1.affiliate_id, t1.total_earnings, t1.date_added,
    t2.user_id, t2.username, t2.referral_code, t2.name, t2.email, t2.phone, t2.is_affiliate,
    t2.last_contest_date from bb_affiliates as t1 left join bb_users as t2 on t1.receiver=t2.user_id`;

        if (where) {
            query = ` ${query} where ${where}`
        }
        if (order) query = ` ${query} order by ${order} `
        if (search.limit) query = ` ${query} limit ${search.limit} offset ${search.offset}`;
        try {
            // console.log(query)
            let result = await db.query(query);
            return result;
        } catch (e) {
            return e;
        }

    },
    getReferalsCount: async(userId) => {
        let query = ` select count(1) as referal_count from bb_affiliates where sender = ${userId}`
        return db.query(query);
    },
    getMobileOtp: async(phone) => {
        let query = `SELECT * FROM bb_mobile_otp WHERE mobile = ? and status = 1 order by row_id desc`;
        const result = await db.query(query, phone);
        // console.log("results are >>>",result)
        if (result.length > 0) return result[0];
        return false;
    },
    getMobileByUserId: async(phone) => {
        let query = `SELECT * FROM bb_mobile_otp WHERE user_id = ?`;
        const result = await db.query(query, phone);
        // console.log("results are >>>",result)
        if (result.length > 0) return result[0];
        return false;
    },
    getCampaignCode: async(where) => {
        let query = `SELECT t1.*, t2.* FROM bb_campaign_codes AS t1 LEFT JOIN bb_campaign AS t2 ON t1.event_id=t2.id WHERE ${where}`
        const result = await db.query(query);
        return result;
    },
    getExpiry: async(code) => {
        let query = `SELECT *, if(expiry_date > NOW(), 0, 1) as expired  FROM bb_campaign_codes where code = '${code}'`;
        let result = await db.query(query);
        result = result[0];
        return result;
    },
    getPromotionCodeEvents: async(where, eventId = false) => {
        let sql
        if (eventId) {
            where = `${where} and event_id IN('${eventId}')`;
            sql = `select t1.*, t2.* from bb_campaign_codes as t1 left join bb_campaign as t2 on t1.event_id=t2.id where ${where}`;
        }
        sql = `select t1.*, t2.* from bb_campaign_codes as t1 left join bb_campaign as t2 on t1.event_id=t2.id where ${where}`;

        try {
            return await db.query(sql);
        } catch (e) {
            return e
        }
    },
    userAddCash: async(unusedAmount, bonusAmount, winningAmount, userId) => {
        let sql = `update bb_users set unused_amount = unused_amount + ${unusedAmount}, bonus_cash =  bonus_cash+${bonusAmount}, credits = credits+${winningAmount}  where user_id = ${userId} `;

        try {
            let result = await db.query(sql);
            return result = result.affectedRows ? true : false;
        } catch (e) {
            return e;
        }

    },

    updatePromoEventCodes: async(update, where) => {
        let sql = ` update bb_campaign_codes set ${update} where ${where}`;

        try {
            let result = await db.query(sql);
            result = result.affectedRows ? true : false
            return result;
        } catch (e) {
            return e
        }
    },

    UserTicketInsertOrIgnore: async(values) => {

        let sql = `INSERT IGNORE INTO bb_ticket_users (ticket_id, user_id, used_status, ticket_type, play_type, ticket_expiry, date_added, modified_date) VALUES ?`;

        try {
            let result = await db.query(sql, [values]);
            result = result.affectedRows ? true : false;
            return result

        } catch (e) {
            return e;
        }
    },

    getMultipleTickets: async(ticketIds) => {
        let sql = `select * from bb_tickets where ticket_id  in(${ticketIds}) and ticket_status=1`;

        try {
            return await db.query(sql);
        } catch (e) {
            return e;
        }
    },

    updatePromoTable: async(id) => {
        let sql = `update bb_campaign set total_used = total_used + 1 where id = ${id}`;
        try {
            let result = await db.query(sql);
            result = result.affectedRows ? true : false;
            return result
        } catch (e) {
            return e;
        }

    },

    getCodeForDeposit: async(where, columns) => {
        let query = `select * from bb_promotion_codes where ${where} and (promotion_type = 1 or promotion_type=4) and status = 1`;
        const result = await db.query(query);
        return result;
    },
    getPromoStats: async(where) => {
        let query = `select * from bb_promotion_stats where ${where}`;
        const result = await db.query(query);
        return result;
    },
    getPromoStatsCount: async(where) => {
        let query = `select count(promotion_id) from bb_promotion_stats where ${where}`;
        const result = await db.query(query);
        return result;
    },
    getTxn: async(where) => {
        let query = `select * from bb_txn where ${where} for update`;
        const result = await db.query(query);
        return result;
    },
    getTxnDepositAmount: async(userId, daysLimit = false) => {
        let sql = ` select SUM(t1.amount) as cash_deposited from bb_txn as t1 where user_id = ? and status IN (1) `;

        let values = [userId]

        if (daysLimit) {
            sql += ` and  t1.date_added >= '${daysLimit}' `
            values.push(daysLimit)
        }

        console.log("sql >>>", sql, values);
        return await db.query(sql, values);
    },
    insertTxnData: async(values) => {
        const sql = `insert into bb_txn (gateway_type, user_id, txn_number, promotion_id, amount,return_url,is_mobile_app,user_ip,date_added) VALUES(?, ?, ?,?,?,?,?,?,?)`;
        const result = await db.query(sql, values);
        return result;
    },
    updateUserBalance: async(updateData, where) => {
        const sql = `UPDATE bb_users SET ${updateData} WHERE ${where};`;
        const result = await db.query(sql);
        return result;
    },
    insertData: async(data, table) => {
        if (!data || !table) {
            return false;
        }
        let columns = Object.keys(data);
        let values = Object.values(data);
        let sql = `insert into ${table} (`;
        values = '';
        return await Bluebird.each(columns, (key, index, length) => {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                sql = sql + key + ","
                if (typeof element === 'string' || element instanceof String) {
                    values = values + "'" + element + "'" + ","
                } else {
                    values = values + element + ","
                }
            }
        }).then(async(result) => {
            sql = sql.slice(0, -1)
            values = values.slice(0, -1)
            sql = sql + ") VALUES"
            sql = sql + "(" + values + ")";
            // console.log('response=>>>>> r', sql);
            let response = await db.query(sql);

            return response;
        }).catch(e => {
            console.log('erro in inserting-->> ', e);

        })
    },
    insertData2: async(data, table) => {
        if (!data || !table) {
            return false;
        }
        let columns = Object.keys(data);
        let values = Object.values(data);
        let sql = `insert into ${table} (`;
        values = '';
        return await Bluebird.each(columns, (key, index, length) => {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                sql = sql + key + ",";
                if (element == 'now()' || element == 'Now()' || element == 'NOW()') {
                    values = values + element + ","
                } else if (typeof element === 'string' || element instanceof String) {
                    values = values + "'" + element + "'" + ","
                } else {
                    values = values + element + ","
                }
            }
        }).then(async(result) => {
            sql = sql.slice(0, -1)
            values = values.slice(0, -1)
            sql = sql + ") VALUES"
            sql = sql + "(" + values + ")";
            // console.log('response=>>>>> r', sql);
            let response = await db.query(sql);

            return response;
        }).catch(e => {
            console.log('erro in inserting-->> ', e);

        })
    },
    getUserTotalRake: async(userId) => {
        let sql = `select total_rakes from bb_user_rakes where user_id = ?`;
        let result = await db.query(sql, [userId]);
        if (result.length > 0) return result[0];
        else return false;
    },
    getUserPanDetails: async(where, columns = "*") => {
        let query = `select ${columns} from bb_pan_details where ${where}`
        let result = await db.query(query);
        if (result.length > 0) return result[0];
        else return false;
    },
    removeUserPanDetails: async(userId) => {
        let query = `DELETE FROM bb_pan_details WHERE user_id=${userId}`
        let result = await db.query(query);
        if (result.length > 0) return result[0];
        else return false;
    },
    kycAttamptsInsertOrIgnore: async(userId, type) => {
        let query = `INSERT INTO bb_kyc_attempts (user_id, kyc_type, attempts) VALUES (${userId}, ${type}, 1)
        ON DUPLICATE KEY UPDATE attempts=attempts+1`
        let result = await db.query(query);
        return result;
    },
    getKyc: async(where) => {
        let query = `select * from bb_kyc_attempts where ${where}`;
        let result = await db.query(query);
        // console.log('result>>>', result);
        if (result.length > 0) return result[0];
        else return false;
    },
    updateTableByField: async(update, where, table) => {
        let query = `UPDATE ${table} ${update} WHERE ${where}`;
        let result = await db.query(query);
        return result;
    },
    decreaseKycAttempts: async(userId, type) => {
        let query = `INSERT INTO bb_kyc_attempts (user_id, kyc_type, attempts) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE attempts = VALUES(attempts)-1`;
        let result = await db.query(query, [userId, type, 1]);
        console.log('decrease query >>>>', result)
        result = result.length > 0 ? true : false;
        return result;
    },
    getUserBankDetails: async(where, columns = "*") => {
        let query = `select ${columns} from bb_bank_details where ${where}`
        let result = await db.query(query);
        if (result.length > 0) return result[0];
        else return false;
    },
    removeUserBankDetails: async(userId) => {
        let query = `DELETE FROM bb_pan_details WHERE user_id=${userId}`
        let result = await db.query(query);
        if (result.length > 0) return result[0];
        else return false;
    },
    getVerifyEmailTable: async(where, columns = "*") => {
        let query = `select ${columns} from bb_verify_email where ${where}`;
        let result = await db.query(query);
        if (result.length > 0) return result[0];
        else return false;
    },
    getPaymentMinMaxLimit: async(where) => {
        let query = `SELECT
                        t1.id AS id,
                        t1.instrument_type AS instrument_type,
                        t1.min_amount AS min_amount,
                        t1.max_amount AS max_amount
                    FROM
                        bb_payment_config AS t1
                    WHERE
                        ${where}`;
        let result = await db.query(query);
        if (result.length > 0) return result[0];
        else return false;
    },
    getWithDrawlsTable: async(where) => {
        let query = `select * from bb_withdrawals WHERE ${where}`;
        let result = await db.query(query);
        if (result.length > 0) return result[0];
        else return false;
    },
    rawQuery: async(query, statement) => {
        console.log("query >>>>>", query, "------->", statement);
        let result = await db.query(query, statement);
        return result;

    },
    getAddressByUserId: async(userId) => {
        let query = `SELECT
      user_id, address, add_line2, state, city, pincode
  FROM
      bb_reward_claim AS t1
          LEFT JOIN
      bb_reward_product AS t2 ON t1.reward_product_id = t2.reward_prod_id
  WHERE
      t1.user_id = ${userId} AND t2.reward_id = 1
  ORDER BY t1.reward_claim_id DESC
  LIMIT 1`;
        return db.query(query)
    },

    getLastClaimedProductsByUserId: async(userId) => {
        let days = 1
        console.log("days >>>>", days);
        let query = ` SELECT
        user_id,
        reward_product_id,
        (${days} - (DATEDIFF(NOW(), MAX(t1.created_at)))) AS days_remaining
    FROM
        bb_reward_claim AS t1 where t1.user_id = ${userId} group by t1.reward_product_id
        having days_remaining >= 1
        order by reward_claim_id DESC `

        return db.query(query);
    },

    getAllWithCategory: async() => {
        let query = ` SELECT
        *
    FROM
        bb_reward_product AS t1
            LEFT JOIN
        bb_reward_category AS t2 ON t1.reward_category_id = t2.category_id
    WHERE
        t1.left_items != 0 AND t1.status = 1
    ORDER BY t1.sorting_order ASC , t1.reward_prod_id DESC `;

        return db.query(query);

    },
    getRewardBanner: async() => {
        let query = ` SELECT
        *
    FROM
        bb_promotions AS t1
    WHERE
        banner_type = 6 AND status = 1
    ORDER BY sorting_order ASC , promotion_id DESC;
     `;

        return db.query(query);
    },
    getProductWithCategory: async(productId) => {
        let query = ` SELECT
    *
FROM
    bb_reward_product AS t1
        LEFT JOIN
    bb_reward_category AS t2 ON t1.reward_category_id = t2.category_id
WHERE
    reward_prod_id = ${productId}
ORDER BY reward_prod_id DESC `;

        return db.query(query);

    },
    getClaimedList: async(userId) => {
        let query = ` SELECT
    t1.*,
    t2.reward_prod_id,
    t2.reward_id,
    t2.reward_name,
    t2.reward_name_hi,
    t2.image,
    t3.reward_type
FROM
    bb_reward_claim AS t1
        LEFT JOIN
    bb_reward_product AS t2 ON t1.reward_product_id = t2.reward_prod_id
        LEFT JOIN
    bb_reward_type AS t3 ON t2.reward_id = t3.reward_id
WHERE
    t1.user_id = ${userId}
ORDER BY reward_claim_id DESC;`

        return db.query(query);
    },

    statsListWithPagination: async(userId, offset, limit) => {
        let query;
        if (offset && limit) {
            query = ` SELECT
        t1.*, t2.reward_prod_id, t2.reward_id, t2.reward_name, t2.reward_name_hi, t2.image,
        CONVERT_TZ(transaction_date, '+00:00', '+05:30') AS transaction_date, t3.reward_type
    FROM
        bb_rewards_stats AS t1
            LEFT JOIN
        bb_reward_product AS t2 ON t1.product_id = t2.reward_prod_id
            AND t1.product_id > 0 left join bb_reward_type as t3 on t2.reward_id=t3.reward_id
            where t1.user_id = ${userId}  order by row_id DESC limit ${limit} offset ${offset}`;

        } else {
            query = `  SELECT
          t1.*, t2.reward_prod_id, t2.reward_id, t2.reward_name, t2.reward_name_hi, t2.image,
          CONVERT_TZ(transaction_date, '+00:00', '+05:30') AS transaction_date, t3.reward_type
      FROM
          bb_rewards_stats AS t1
              LEFT JOIN
          bb_reward_product AS t2 ON t1.product_id = t2.reward_prod_id
              AND t1.product_id > 0 left join bb_reward_type as t3 on t2.reward_id=t3.reward_id
              where t1.user_id = ${userId} order by row_id DESC`;
        }
        return db.query(query);
    },

    fetchAllWithPassAndSeason: async(userId) => {

        let query = ` SELECT
    t1.*,
    t2.*,
    t3.season_name AS season_name,
    t3.season_short_name AS season_short_name,
    t4.category_id AS category_id,
    t4.category_name AS category_name
FROM
    bb_user_passes_purchased AS t1
        RIGHT JOIN
    bb_passes AS t2 ON t1.pass_id = t2.pass_id
        LEFT JOIN
    bb_seasons AS t3 ON t2.season_key = t3.season_key
        LEFT JOIN
    bb_league_categories as t4 ON t2.league_category_id = t4.category_id

    where t1.user_id = ${userId} order by user_pass_id DESC `;

        return db.query(query);
    },

    fetchAllWithSeason: async() => {
        let query = ` SELECT t1.*,
    t2.season_name AS season_name,
    t2.season_short_name AS season_short_name,
    t3.category_id AS category_id,
    t3.category_name AS category_name
FROM
    bb_passes AS t1
        LEFT JOIN
    bb_seasons AS t2 ON t1.season_key = t2.season_key
        LEFT JOIN
    bb_league_categories AS t3 ON t1.league_category_id = t3.category_id
WHERE
    t1.status = 1
        AND t1.expiry_date >= NOW()
ORDER BY t1.sorting_order ASC , t1.pass_id DESC  `;

        return db.query(query);

    },
    getPassDetailWithPassId: async(passId) => {
        let query = `SELECT
    *
FROM
    bb_passes
WHERE
    pass_id = ${passId}`;

        return db.query(query);
    },

    fetchTotalPurchaseEntriesByUser: async(userId, wherePass) => {
        let query = ` SELECT
    t1.*, SUM(t2.total_league_entries) AS totalPurchaseEntries
FROM
    bb_user_passes_purchased AS t1
        RIGHT JOIN
    bb_passes AS t2 ON t1.pass_id = t2.pass_id
WHERE
    t1.user_id = ${userId}
        AND t2.league_buy_in_amount = ${wherePass.league_buy_in_amount}
        AND t2.season_key = ${wherePass.season_key}`;

        return db.query(query);
    },
    getCustomByUser: async(userId, columns = false, records = false, columns2 = ` t2.* `) => {
        let query = `
      select t1.* from bb_users as t1
    `;

        if (columns) query = ` select ${columns} from bb_users as t1 `;

        if (records) query = ` select ${columns}, ${columns2} from bb_users as t1 left join bb_user_records as t2  on t1.user_id = t2.user_id`;

        query += ` where t1.user_id = ${userId} `;

        return db.query(query);
    },
    creditstatsBulkInsert: async(data) => {
        if (!data) {
            return false;
        }
        let bulkData = data;
        data = data[0];
        let columns = Object.keys(data);
        let sql = `insert into bb_credit_stats (${columns}) VALUES ?`;
        let response = await db.query(sql, [bulkData.map(item => [item.user_id, item.play_type, item.unused_cash, item.real_cash, item.bonus_cash, item.amount, item.league_id, item.league_name, item.match_key, item.match_name, item.match_date, item.team_name, item.team_a_flag, item.team_b_flag, item.transaction_type, item.transaction_message, item.transaction_date])]);
        return response;
    },
    BulkAffiliateInsert: async(data) => {
        if (!data) {
            return false;
        }

        let bulkData = data;
        data = data[0];
        let columns = Object.keys(data);
        let sql = ` INSERT IGNORE INTO bb_affiliate_joinings (${columns}) VALUES ? `;
        let response = await db.query(sql, [bulkData.map(item => [item.joiner, item.match_key, item.affiliate_id, item.date_added])]);
        return response;
    },
    getUserInitiatsByPhone: async(phone, columns = "*") =>{
        const sql = `select ${columns} from bb_user_initiates where phone = ?`;
        const user = await db.query(sql, phone);
        return user;
    },
    getUserInitiatsByGoogle: async(googleId, columns = "*") =>{
        const sql = `select ${columns} from bb_user_initiates where google_id = ?`;
        const user = await db.query(sql, googleId);
        return user;
    },
    getUserInitiatsByFb: async(fbId, columns = "*") =>{
        const sql = `select ${columns} from bb_user_initiates where facebook_id = ?`;
        const user = await db.query(sql, fbId);
        return user;
    }
}