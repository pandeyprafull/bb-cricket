let Models = require('../models');
let moment = require('moment');
let currentDateUtc = moment().subtract(330, 'minutes').format('YYYY-MM-DD HH:mm:ss');

module.exports = {
    userActiveTickets: async(userId) => {

        console.log("currentDate......>>>>", currentDateUtc);

        let sql = `SELECT
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
        t2.match_name AS match_name,
        t3.match_short_name AS match_short_name,
        t3.match_related_name AS match_related_name
        FROM
        bb_ticket_users AS t1
        INNER JOIN
        bb_tickets AS t2 ON t1.ticket_id = t2.ticket_id
        LEFT JOIN
        bb_matches AS t3 ON t2.match_key = t3.match_key
        WHERE t1.user_id = ${userId}
        AND t1.used_status = '1'
        AND ticket_status = '1'
        AND t1.ticket_expiry > '${currentDateUtc}'
        ORDER BY t1.ticket_expiry ASC, t1.date_added ASC`;
        let result = await Models.rawQuery(sql)
        return result = result.results.length > 0 ? result.results : []
    }
}