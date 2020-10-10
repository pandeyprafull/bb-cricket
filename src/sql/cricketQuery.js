const db = require('../utils/CricketDbConfig');
const Mysql_dt = require('../utils/mySql_dateTime');
const Utils = require('../utils');
const Bluebird = require('bluebird');
var moment = require('moment');
let currentDateTime = moment().format('YYYY-MM-DD h:mm:ss')
module.exports = {
    getTeamDetails: async (matchKey, userId) => {
        let sql = `select t1.*, t2.* from bb_user_teams as t1 left join
        bb_season_players as t2 on t1.player_key = t2.player_key where t1.user_id = ? and t1.match_key = ? group by t1.player_key`;

        return await db.query(sql, [userId, matchKey]);
    },
    countUserLeaguesAll: async (userId, matchKey, perFantasy = true, table = "bb_user_leagues") => {
        let sql = ``,
            T1 = `${table} as t1`;
        let columns = ``
        if (perFantasy) columns += `COUNT(DISTINCT(t1.league_id)) as total, t1.fantasy_type`;
        else columns += `COUNT(DISTINCT(t1.league_id)) as total`;

        let T2 = `bb_leagues as t2`;
        let On = `t1.league_id=t2.league_id`;
        let where = ``;

        where += `t1.user_id = ${userId} and  t1.match_key = ${matchKey} and t2.league_status = ${1}`

        let groupBy = ``;

        if (perFantasy) groupBy += `t1.user_id, t1.match_key, t1.fantasy_type`;

        let result;

        sql = `select ${columns} from ${T1} left join ${T2} on ${On} where ${where} group by ${groupBy}`;
        result = await db.query(sql);

        if (!perFantasy) {
            result = result[0];
            await result['total'] ? result['total'] : "0"
        }

        return result;
    },
    countUnjoinedPrivateAll: async (matchKey, userId, perFantasy = true) => {
        let T1, T2, sql, result;
        let where = ``;
        let columns = ``;

        T1 = `bb_leagues as t1`;
        if (perFantasy) columns += `COUNT(t1.league_id) as total, t1.fantasy_type`;

        else columns += `COUNT(t1.league_id) as total`;

        where += `t1.match_key = ${matchKey} and t1.created_by = ${userId} and t1.total_joined = ${0} `;
        let groupBy = ``;

        if (perFantasy) groupBy = `t1.match_key, t1.fantasy_type`;

        sql = ` select ${columns} from ${T1} where ${where} group by ${groupBy}`;

        result = await db.query(sql);
        if (!perFantasy) {
            result = result[0];
            result = result['total'] ? result['total'] : "0";
        }

        return result;
    },

    getLeaguesByTemplate: async (matchKey, leagueId) => {
        let sql = `select * from bb_leagues where match_key=? and template_id=?`;
        let result = await db.query(sql, [matchKey, leagueId]);
        console.log("Results ......", result);
        return result = result.length > 0 ? result : false
    },
    getLeaguesDetails: async (matchKey, leagueId) => {
        let sql = `select * from bb_leagues where match_key=? and league_id=?`;
        let result = await db.query(sql, [matchKey, leagueId]);
        // if(result.length < 0){
        //     sql = `select * from bb_leagues where match_key=? and template_id=?`;
        //     result = await db.query(sql, [matchKey, leagueId]);
        //     console.log("result is.....", result)
        //     return result;
        // }
        return result;

    },
    userActiveTickets: async (userId) => {
        let sql, T1, T2, On, columns = ``,
            where;
        T1 = `bb_ticket_users as t1 `;
        columns += `t2.match_name as match_short_name , t1.ticket_id, t1.ticket_type, t2.play_type, convert_tz(t1.ticket_expiry,'+00:00','+05:30'), t1.date_added as ticket_expiry  `;

        T2 = ` bb_tickets as t2 `;
        On = `t1.ticket_id=t2.ticket_id`;

        columns += `, t2.ticket_title, t2.match_key, t2.league_id, t2.league_name, t2.fantasy_type, t2.joining_amount,t2.match_name `;

        let currentDate = Mysql_dt;

        where = ` t1.user_id = ${userId} and t1.used_status = 1 and t1.ticket_status = 1 and t1.ticket_expiry > '${currentDate}'`;

        let orderBy = ` t1.ticket_expiry ASC `;

        sql = ` select ${columns}  from ${T1} inner join ${T2} on ${On} where ${where} order by ${orderBy} `;

        // console.log('sql===>> ', sql);

        const result = await db.query(sql);
        return result;


    },


    getTicketUsersTable: async (where, columns = ``, record = false, columns2 = ``) => {
        let T1, T2, sql, On;
        T1 = ` bb_ticket_users as t1`;
        T2 = ` bb_tickets as t2 `;
        On = ` t1.ticket_id=t2.ticket_id `;

        sql = `select ${columns}, ${columns2} from ${T1} left join ${T2} on ${On} where ${where}   `;
        const result = await db.query(sql);
        return result;
    },
    getUserTeams: async (matchKey, userId, teamNumber = "", fantasyType = "", table = "bb_user_teams", match) => {
        let T1 = `${table} as t1`;
        let sql;
        let where = ` `
        let columns = ` `
        columns += ` t1.fantasy_type, t1.team_number, t1.player_key, t1.player_type as player_playing_role, t1.player_type, t1.player_role, t1.points as scores  `;

        let T2 = `bb_season_players as t2`;
        let On = ` t1.match_key=t2.match_key and t1.player_key=t2.player_key `;

        columns += ` t2.player_name, t2.team_key, t2.player_photo, t2.player_playing_role as player_name, t2.player_points as points, t2.player_credits as credits`;

        where += ` t1.user_id = ${userId} and t1.match_key = ${matchKey}  `;

        if (fantasyType) where += ` and t1.fantasy_type = ${fantasyType} `;
        if (teamNumber) where += `t1.team_number = ${teamNumber}`;

        let orderBy = ` t1.fantasy_type ASC, t1.team_number ASC `;


        sql = ` select ${columns} from ${T1} left join on ${On} where ${where} order by ${orderBy}`

        try {
            const result = await db.query(sql);
            return result;
        } catch (e) {
            return e;
        }

    },
    getUnjoinedPrivate: async (matchKey, userId, fantasyType = false) => {
        let values;
        let sql = `SELECT
        t1.*
    FROM
        bb_leagues AS t1
    WHERE
        match_key = ?
            AND created_by = ?
            AND total_joined = ?
              `
        values = [matchKey, userId, 0]

        if (fantasyType != 0) {
            sql += ` AND fantasy_type = ? `
            values.push(fantasyType)
        }

        const result = await db.query(sql, values);
        return result;
    },

    getUserLeaguesWithTopRank: async (userId = null, matchKey, table = "bb_user_leagues", league_id = null, fantasyType = 0) => {
        let sql;
        let values;
        if (userId) {
            sql = ` SELECT
            t1.match_key, t1.league_id, t1.user_id, t1.team_rank, t1.team_rank as rank, t1.old_team_rank,t1.team_number as team_number,
            t2.fantasy_type, t2.league_name, t2.league_type, t2.confirmed_league, t2.max_players, t2.team_type,
            t2.win_amount, t2.joining_amount, t2.total_joined, t2.total_winners, t2.league_code, t2.is_private, t2.user_teams_pdf,t2.is_infinity,t2.win_per_user,t2.total_winners_percent,t2.banner_image,t2.league_winner_type
            from ${table} as t1
        INNER JOIN bb_leagues as t2
        ON t1.league_id = t2.league_id
        WHERE
            t1.total_points =
            (SELECT MAX(total_points) FROM ${table} WHERE match_key=t1.match_key and league_id = t1.league_id and user_id=t1.user_id)
            and t2.league_status=1
            and t1.user_id = ?
            and t1.match_key= ?`;
            values = [userId, matchKey]
        } else if (league_id) {
            sql = ` SELECT
            t1.match_key, t1.league_id, t1.user_id, t1.team_rank, t1.team_rank as rank, t1.old_team_rank,t1.team_number as team_number,
            t2.fantasy_type, t2.league_name, t2.league_type, t2.confirmed_league, t2.max_players, t2.team_type,
            t2.win_amount, t2.joining_amount, t2.total_joined, t2.total_winners, t2.league_code, t2.is_private, t2.user_teams_pdf,t2.is_infinity,t2.win_per_user,t2.total_winners_percent,t2.banner_image,t2.league_winner_type
            from ${table} as t1
        INNER JOIN bb_leagues as t2
        ON t1.league_id = t2.league_id
        WHERE
            t1.total_points =
            (SELECT MAX(total_points) FROM ${table} WHERE match_key=t1.match_key and league_id = t1.league_id and user_id=t1.user_id)
            and t2.league_status=1
            and t1.league_id = ?
            and t1.match_key = ? `;
            values = [league_id, matchKey]

        }
        if (fantasyType != 0) {
            sql = sql + ` and t1.fantasy_type = ${fantasyType}`
            values.push(fantasyType)
        }

        //  console.log("sql ------->", sql);
        const result = await db.query(sql, values);
        return result;

    },

    getUserLeaguesWithTopRankV1: async (userId = null, matchKey, table = "bb_user_leagues", league_id = null, fantasyType = 0) => {
        let sql;
        let values;
        if (userId) {
            sql = ` SELECT
            t1.match_key, t1.league_id,group_concat(t1.team_number) as user_teams, t1.user_id,min(team_rank) as team_rank, max(total_points) as total_points, min(team_rank) as rank, t1.old_team_rank,
            t2.fantasy_type, t2.league_name, t2.league_type, t2.confirmed_league, t2.max_players,
            t2.win_amount, t2.joining_amount, t2.total_joined, t2.total_winners, t2.league_code, t2.is_private, t2.user_teams_pdf,t2.is_infinity,t2.win_per_user,t2.total_winners_percent,t2.banner_image,t2.league_winner_type,t2.team_type,t2.bonus_applicable ,t2.bonus_percent,t2.time_based_bonus
            from ${table} as t1
            INNER JOIN bb_leagues as t2
            ON t1.league_id = t2.league_id
            WHERE
            t2.league_status=1
            and t1.user_id= ? and t1.match_key = ?`;
            values = [userId, matchKey]
        } else if (league_id) {
            sql = ` SELECT
            t1.match_key, t1.league_id,group_concat(t1.team_number) as user_teams, t1.user_id,min(team_rank) as team_rank, max(total_points) as total_points, min(team_rank) as rank, t1.old_team_rank,
            t2.fantasy_type, t2.league_name, t2.league_type, t2.confirmed_league, t2.max_players,
            t2.win_amount, t2.joining_amount, t2.total_joined, t2.total_winners, t2.league_code, t2.is_private, t2.user_teams_pdf,t2.is_infinity,t2.win_per_user,t2.total_winners_percent,t2.banner_image,t2.league_winner_type,t2.team_type,t2.bonus_applicable ,t2.bonus_percent,t2.time_based_bonus
            from ${table} as t1
            INNER JOIN bb_leagues as t2
            ON t1.league_id = t2.league_id
            WHERE
            t2.league_status=1
            and t1.league_id= ? and t1.match_key = ?`;
            values = [league_id, matchKey]

        }
        if (fantasyType != 0) {
            sql = sql + ` and t1.fantasy_type = ${fantasyType}`
            values.push(fantasyType)
        }

        sql += ` group by league_id `;
        // console.log("sql ------->", sql);
        const result = await db.query(sql, values);
        return result;

    },
    getUserLeaguesDetails: async (matchKey, leagueId, table = "bb_user_leagues") => {
        // console.log("Querytable is", table);
        let sql = ` SELECT
        t1.match_key AS match_key,
        t1.league_id AS league_id,
        t1.user_id AS user_id,
        t1.fantasy_type AS fantasy_type,
        t1.team_number AS team_number,
        t1.team_rank AS team_rank,
        t1.old_team_rank AS old_team_rank,
        (winning_tds + credits_won) AS credits_won,
        t1.total_points AS total_points,
        t1.user_name AS user_name,
        t1.team_rank AS rank,
        t1.bbcoins_won AS bbcoins_won
        FROM
            ${table} AS t1
        WHERE
            match_key = ?
            AND t1.league_id = ? AND t1.team_rank BETWEEN 0 AND 200 LIMIT 500 `;
        try {
            return await db.query(sql, [matchKey, leagueId]);
        } catch (e) {
            return e
        }
    },
    getUserLeaguesDetailsForSelf: async (matchKey, leagueId, userId, table = "bb_user_leagues") => {
        // console.log("Querytable is", table);
        let sql = ` SELECT
        t1.match_key AS match_key,
        t1.league_id AS league_id,
        t1.user_id AS user_id,
        t1.fantasy_type AS fantasy_type,
        t1.team_number AS team_number,
        t1.team_rank AS team_rank,
        t1.old_team_rank AS old_team_rank,
        (winning_tds + credits_won) AS credits_won,
        t1.total_points AS total_points,
        t1.user_name AS user_name,
        t1.team_rank AS rank,
        t1.bbcoins_won AS bbcoins_won
        FROM
            ${table} AS t1
        WHERE
            match_key = ?
            AND t1.league_id = ? AND user_id = ?  `;
        try {
            return await db.query(sql, [matchKey, leagueId, userId]);
        } catch (e) {
            return e
        }
    },

    getLeaguesV1Category: async (matchKey, filters, columns = false, userTeams = false, userId = "") => {
        let whereLeague = ` `;
        let sql;
        columns = columns;
        whereLeague += ` t1.match_key = '${matchKey}' and t1.league_status = 1 and t1.is_full = 0 and t1.is_private = 0  `;
        if (filters) {
            // console.log(`Filters are >>>>`, filters);
            let winAmounts = new Array("all", "practice", "1-500", "501-1000", "1001-5000", "5001-10000", "more than 10000");

            let payAmounts = new Array("all", "0", "1-100", "101-1000", "1001-10000");
            let playerSizes = new Array("all", "2", "3", "5", "10", "above 10");

            let fantasyType = filters.fantasy_type;
            let categoryId = filters.category;
            let winAmount = filters.win_amount;
            let payAmount = filters.pay_amount;
            let playerSize = filters.team_size;

            if (fantasyType) whereLeague += `and t1.fantasy_type = ${fantasyType}`;
            if (categoryId) whereLeague += ` and t1.category = ${categoryId} `;

            if (winAmount == 0) { } else if (winAmount == 1) whereLeague += `and league_type=2 `;
            else if (winAmount == 2) whereLeague += `and win_amount>=1 and win_amount<=500 `;
            else if (winAmount == 3) whereLeague += `and win_amount>=501 and win_amount<=1000 `;
            else if (winAmount == 4) whereLeague += `and win_amount>=1001 and win_amount<=5000 `;
            else if (winAmount == 5) whereLeague += `and win_amount>=5001  and win_amount<=10000 `;
            else if (winAmount == 6) whereLeague += `and win_amount>10000`;

            if (payAmount == 0) { } else if (payAmount == 1) whereLeague += `joining_amount=0 `;
            else if (payAmount == 2) whereLeague += `and joining_amount>=1 and joining_amount<=100 `;
            else if (payAmount == 3) whereLeague += `and joining_amount>=101 and joining_amount<=1000 `;
            else if (payAmount == 4) whereLeague += `and joining_amount>=1001 and joining_amount<=10000 `;

            if (playerSize == 0) { } else if (playerSize == 1) whereLeague += `max_players=2 `;
            else if (playerSize == 2) whereLeague += ` and max_players=3 `;
            else if (playerSize == 3) whereLeague += `and max_players=5 `;
            else if (playerSize == 4) whereLeague += `and max_players=10 `;
            else if (playerSize == 5) whereLeague += `and max_players>10 `;
        }

        let T1 = `bb_leagues as t1`;
        let T2, On;
        let groupBy = `t1.league_id`;
        let orderBy = `fantasy_type ASC, is_mega DESC, league_order ASC, confirmed_league DESC, max_players DESC, win_amount DESC`;


        if (userTeams) {
            T2 = `bb_user_leagues as t2`;
            On = `t1.match_key=t2.match_key and t1.league_id=t2.league_id and t2.user_id='${userId}'`;
            columns = `${columns}, GROUP_CONCAT(t2.team_number) as user_teams`;
        }

        sql = `select ${columns} from ${T1} left join ${T2} on ${On} where ${whereLeague} group by ${groupBy} order by ${orderBy}`


        const result = await db.query(sql);
        // console.log("RESULT IS >>>>", result);
        return result;

    },

    getMatchfantasyScore: async (matchKey) => {
        let sql = ` select t1.* , t2.team_key_cricket as team_a_key_cricket, t2.team_flag as team_a_flag, t3.team_key_cricket as team_b_key_cricket, t3.team_flag as team_b_flag , if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from bb_matches as t1 left join bb_teams as t2 on t1.team_a_key=t2.team_key left join bb_teams as t3 on t1.team_b_key=t3.team_key where t1.match_key = ? order by t1.start_date_unix ASC `;

        return await db.query(sql, [matchKey]);

    },

    getMatchKey: async (matchKey, columns = false, teamFlags = false) => {
        let sql, where, On1, On2, On3, T2, T3, T4;
        T1 = `bb_matches as t1 `;
        where = ` where t1.match_key = ${matchKey} `
        if (!columns) {
            columns = `t1.*, if((t1.start_date_unix-UNIX_TIMESTAMP()-t1.closing_ts)<=0, 1, 0) as closed `;
        } else {
            columns = `t1.*, if((t1.start_date_unix-UNIX_TIMESTAMP()-t1.closing_ts)<=0, 1, 0) as closed`;
        }
        if (teamFlags) {
            T3 = `left join bb_teams as t2`;
            On2 = ` on t1.team_a_key = t2.team_key`;
            T4 = ` left join bb_teams as t3`;
            On3 = ` on t1.team_b_key = t3.team_key`
            columns = `t1.*, if((t1.start_date_unix-UNIX_TIMESTAMP()-t1.closing_ts)<=0, 1, 0) as closed, t2.team_flag as team_a_flag, t3.team_flag as team_b_flag `;
            sql = `select ${columns} from ${T1} ${T3} ${On2} ${T4} ${On3} ${where}`;
        }
        // console.log('qqqqqq=>>> ', sql);
        const result = await db.query(sql);
        return result;

    },


    getUserLeaguesForContest: async (matchKey, leagueId, table, userId = false, excludeUserId = false, from = false, limit = false, matchClose = true) => {
        let T1 = `${table} as t1`;
        let sql, column

        if (matchClose) {
            column = `t1.match_key, t1.league_id, t1.user_id, t1.fantasy_type, t1.team_number, t1.team_rank,
                      t1.old_team_rank, (t1.winning_tds+t1.credits_won) as credits_won, t1.total_points, t1.user_name, t1.team_rank as rank `
        } else {
            column = `t1.match_key, t1.league_id, t1.0 as user_id t1.fantasy_type, t1.team_number,
                t1.team_rank, t1.old_team_rank, (t1.winning_tds+t1.credits_won) as credits_won, t1.total_points, t1.user_name, t1.team_rank as rank `;
        }
        let where = `t1.match_key = ${matchKey} and t1.league_id = ${leagueId}  `;

        if (userId && excludeUserId) {
            where = `t1.match_key = ${matchKey} and t1.league_id = ${leagueId}  and t1.user_id != ${userId}  `;
        } else if (userId) {
            where = `t1.match_key = ${matchKey} and t1.league_id = ${leagueId}  and t1.user_id = ${userId}  `;
        }


        if (from !== false && limit !== false) {
            limit = from + limit;
            where = `t1.match_key = ${matchKey} and t1.league_id = ${leagueId}  and t1.user_id = ${userId} and t1.team_rank between 0 and 100 limit 300 `;
        }

        sql = `select ${column} from ${T1} where ${where}`;

        const result = await db.query(sql);
        return result;
    },


    getCustomLeague: async (where, columnsT1 = false, matchDetails = false, columnsT2 = false) => {
        let T1 = `bb_leagues as t1`;
        let T2 = `bb_matches as t2`;
        let On = `t1.match_key=t2.match_key`
        let closed;
        if (matchDetails) {
            if (!columnsT2) {
                closed = `if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed`;
            } else {
                closed = `if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed`;
            }

        }

        let sql = `select ${columnsT1}, ${closed},${columnsT2}  from ${T1} left join ${T2} on ${On} ${where}`;

        const result = await db.query(sql);
        return result;

    },
    get_bb_matches: async (where) => {
        const if_stat = `if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed`;

        const sql = `SELECT *, ${if_stat} FROM bb_matches where ${where}`;
        const matches = await db.query(sql);
        return matches;
    },
    getPlayersByMatchKey: async (where, columns = "*", IF = null) => {
        const sql = `SELECT ${columns} from bb_season_players where ${where}`
        // console.log('sql=>   ', sql);

        const players = await db.query(sql);
        return players;
    },
    getUserTeamDetails: async (columns = `*`, where, teamTable = "bb_user_teams") => {
        // const sql = `select ${columns} from bb_user_teams where ${where}`
        const sql = `SELECT
                        t1.fantasy_type AS fantasy_type,
                        t1.team_number AS team_number,
                        t1.player_key AS player_key,
                        t1.player_type AS player_playing_role,
                        t1.player_type AS player_type,
                        t1.player_role AS player_role,
                        t1.points AS scores,
                        t2.player_name AS player_name,
                        t2.player_card_name AS player_card_name,
                        t2.player_full_name AS player_full_name,
                        t2.team_short_name AS team_short_name,
                        t2.team_key AS team_key,
                        t2.player_photo AS player_photo,
                        t2.is_playing AS is_playing,
                        t2.player_playing_role AS seasonal_role,
                        t2.player_points AS points,
                        t2.player_credits AS credits,
                        t1.user_id AS user_id,
                        t1.match_key AS match_key
                    FROM
                        ${teamTable} AS t1
                            LEFT JOIN
                        bb_season_players AS t2 ON t1.match_key = t2.match_key
                            AND t1.player_key = t2.player_key
                    WHERE
                        ${where}
                    ORDER BY t1.fantasy_type ASC , t1.team_number ASC `;
        // console.log('sql===>>>> ', sql);

        const teams = await db.query(sql);
        return teams;
    },

    getJoinedLeagues: async (matchKey, user_id) => {
        let sql = `SELECT
                    t1.fantasy_type AS fantasy_type,
                    t1.match_key AS match_key,
                    t1.league_id AS league_id,
                    t1.team_number AS team_number,
                    t2.team_type AS team_type
                FROM
                    bb_user_leagues AS t1 left join bb_leagues AS t2 on t1.league_id = t2.league_id
                WHERE
                    t1.match_key = ?
                        AND t1.user_id = ? `;

        try {
            return await db.query(sql, [matchKey, user_id]);
        } catch (e) {
            return e
        }
    },
    getTeamCountByMatch: async (user_id, match_key, fantasyType = 0, teamTable = "bb_user_teams") => {
        let sql = `SELECT
                        COUNT(DISTINCT team_number) AS total_teams, fantasy_type
                    FROM
                        ${teamTable}
                    WHERE
                        user_id = ? AND match_key = ?
                    GROUP BY fantasy_type`;
        // console.log("=====>>> ", sql);
        return await db.query(sql, [user_id, match_key]);
    },
    postSaveTeam: async (VALUES) => {
        const sql = `INSERT INTO bb_user_teams (user_id, match_key, fantasy_type, team_number, player_key, player_type, player_role, points, date_added)
     VALUES (?,?,?,?,?,?,?,?,?)`;

        const saveTeam = await db.query(sql, [VALUES]);
        return saveTeam;
    },
    get_active_matches: async (where) => {
        const sql = `SELECT * FROM bb_matches ${where}`;
        const activeMatches = await db.query(sql);
        return activeMatches;
    },
    getMatchTableByKey: async (matchKey, columns = "*") => {
        let sql = `select *, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from bb_matches where match_key = ?`
        if (columns) {
            sql = `select ${columns}, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from bb_matches where match_key = ?`
        }
        // console.log('wsql=> ', sql);

        const result = await db.query(sql, [matchKey]);
        return result;
    },
    createPrivateLeague: async (column, arr) => {
        const sql = `Insert into bb_leagues (${column}) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        const result = await db.query(sql, arr);
        return result;
    },

    removeLeagueIfError: async (league_id) => {
        const sql = `DELETE FROM bb_leagues where league_id = ?`;
        const result = await db.query(sql, [league_id]);
        if (result) {
            return result
        }
        return false;
    },

    removeDataLeaguesDatatable: async (league_id) => {
        const sql = `DELETE FROM bb_leagues_data where league_id = ? `;
        const result = await db.query(sql, [league_id]);
        return result;
    },

    updateLeagueStatus: async (leagues_id, status) => {
        const sql = `UPDATE bb_leagues SET league_status = ? where league_id = ?`;
        const result = await db.query(sql, [status, leagues_id]);
        return result;
    },

    AddleaguesDataTable: async (arr) => {
        const sql = `INSERT INTO bb_leagues_data (league_id, win_from, win_to, win_amount) VALUES(?,?,?,?)`;
        const result = await db.query(sql, arr);
        return result;
    },
    getLeagueInfoById: async (league_id) => {
        const sql = `select season_name, match_name, match_short_name, match_related_name, match_format, start_date_india from bb_leagues as t1 left join bb_matches as t2 on t1.match_key = t2.match_key where t1.league_id = ?`;
        const result = await db.query(sql, [league_id]);
        return result;
    },

    getActiveMatchesLeague: async (whereLeague) => {
        const sql = `select t1.match_key AS match_key, t1.match_format AS match_format,t1.match_short_name AS match_short_name, t1.admin_status AS admin_status,
        t1.start_date_unix AS start_date_unix, t1.team_a_short_name AS team_a_short_name, t1.team_b_short_name AS team_b_short_name,t1.match_status AS match_status,
        t1.season_key AS season_key, t1.season_short_name AS season_short_name, t1.season_name AS season_name, t1.show_playing22 AS show_playing22,
        t1.closing_ts AS closing_ts, t1.active AS active,
        if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) AS closed, t2.*, t2.fantasy_type As fantasy_type from bb_matches as t1 left join bb_leagues as t2
        on t1.match_key = t2.match_key where ${whereLeague}
       `;
        const active_leagues = await db.query(sql);
        return active_leagues;
    },
    getMyTeams: async (userId, matchKey, teamNumber = false, fantasyTypes = 1, readIndex = 0) => {
        // const sql = `select * from bb_user_teams ${where}`;
        // console.log('sql=> ', sql);
        // const teams = await db.query(sql);
        let table = 'bb_user_teams';
        if (readIndex == 1) {
            table = 'bb_closed_user_teams_0'
        } else if (readIndex == 2) {
            table = 'bb_closed_user_teams_0'
        } else if (readIndex == 9) {
            table = 'bb_user_teams_dump'
        }
        let sql = `SELECT
            t1.fantasy_type AS fantasy_type,
            t1.team_number AS team_number,
            t1.player_key AS player_key,
            t1.player_type AS player_playing_role,
            t1.player_type AS player_type,
            t1.player_role AS player_role,
            t1.points AS scores,
            t2.player_name AS player_name,
            t2.team_key AS team_key,
            t2.player_photo AS player_photo,
            t2.is_playing AS is_playing,
            t2.player_playing_role AS seasonal_role,
            t2.player_points AS points,
            t2.player_credits AS credits
        FROM
            ${table} AS t1
                LEFT JOIN
            bb_season_players AS t2 ON t1.match_key = t2.match_key
                AND t1.player_key = t2.player_key
        WHERE t1.user_id = ${userId}
        AND t1.match_key = ${matchKey}
        AND fantasy_type = ${fantasyTypes} `
        if (teamNumber) {
            sql = sql + `AND team_number = ${teamNumber}
        ORDER BY t1.fantasy_type ASC , t1.team_number ASC`
        } else {
            sql = sql + `ORDER BY t1.fantasy_type ASC , t1.team_number ASC`
        }
        // console.log('sql=> ', sql);
        return await db.query(sql);
    },
    getLeagueCountOfEachMatchOfUser: async (user_id, match_key, fantasy_type) => {

        const sql2 = `select * from bb_user_leagues where user_id = ? and match_key = ? and fantasy_type = ? group by league_id `;
        const leagues = await db.query(sql2, [user_id, match_key, fantasy_type]);
        return leagues;

    },
    getMatchPlayers: async (matchKey) => {
        let sql = `SELECT
        t1.*,
        IF(t2.row_id,
            seasonal_classic_points,
            0) AS seasonal_classic_points,
        IF(t2.row_id,
            seasonal_batting_points,
            0) AS seasonal_batting_points,
        IF(t2.row_id,
            seasonal_bowling_points,
            0) AS seasonal_bowling_points,
        IF(t2.row_id,
            seasonal_reverse_points,
            0) AS seasonal_reverse_points,
        IF(t2.row_id, seasonal_wizard_points, 0) AS seasonal_wizard_points,
        IF(t3.classic_selected > 0,
            classic_selected,
            0) AS classic_selected,
        IF(t3.batting_selected > 0,
            batting_selected,
            0) AS batting_selected,
        IF(t3.bowling_selected > 0,
            bowling_selected,
            0) AS bowling_selected,
        IF(t3.wizard_selected > 0,
            wizard_selected,
            0) AS wizard_selected,
        IF(t3.reverse_selected > 0,
            reverse_selected,
            0) AS reverse_selected,
        IF(t3.captain_role_selected_classic > 0,
            captain_role_selected_classic,
            0) AS captain_role_selected_classic,
        IF(t3.captain_role_selected_batting > 0,
            captain_role_selected_batting,
            0) AS captain_role_selected_batting,
        IF(t3.captain_role_selected_bowling > 0,
            captain_role_selected_bowling,
            0) AS captain_role_selected_bowling,
        IF(t3.vice_captain_role_selected_classic > 0,
            vice_captain_role_selected_classic,
            0) AS vice_captain_role_selected_classic,
        IF(t3.vice_captain_role_selected_batting > 0,
            vice_captain_role_selected_batting,
            0) AS vice_captain_role_selected_batting,
        IF(t3.vice_captain_role_selected_bowling > 0,
            vice_captain_role_selected_bowling,
            0) AS vice_captain_role_selected_bowling,


        IF(t3.wizard_role_selected > 0,
            wizard_role_selected,
            0) AS wizard_role_selected
    FROM
        bb_season_players AS t1
            LEFT JOIN
        bb_seasonal_points AS t2 ON t1.season_key = t2.season_key
            AND t1.player_key = t2.player_key
            LEFT JOIN
        bb_player_selections AS t3 ON t1.season_key = t3.season_key
            AND t1.player_key = t3.player_key
            AND t1.match_key = t3.match_key
    WHERE
        t1.match_key = ? AND player_status = 1
    ORDER BY season_team_key DESC `;
        let players = await db.query(sql, [matchKey]);
        return players;
    },

    getUserJoinedLeaguesMatches: async () => {
        const sql = `SELECT
        t1.match_key AS match_key,
        t1.match_format AS match_format,
        t1.match_short_name AS match_short_name,
        t1.read_index AS read_index,
        t1.admin_status AS admin_status,
        t1.start_date_unix AS start_date_unix,
        t1.team_a_short_name AS team_a_short_name,
        t1.team_b_short_name AS team_b_short_name,
        t1.match_status AS match_status,
        t1.status_overview AS status_overview,
        t1.match_image AS match_image,
        t1.stadium AS stadium,
        t1.city AS city,
        t1.country AS country,
        t1.host_name AS host_name,
        t1.team_a_rank AS team_a_rank,
        t1.team_b_rank AS team_b_rank,
        t1.information AS information,
        t1.toss_winner AS toss_winner,
        t1.match_fantasy_type AS match_fantasy_type,
        t1.custom_text AS custom_text,
        t1.team_a_name AS team_a_name,
        t1.team_b_name AS team_b_name,
        t1.season_key AS season_key,
        t1.season_short_name AS season_short_name,
        t1.season_name AS season_name,
        t1.show_playing22 AS show_playing22,
        t1.closing_ts AS closing_ts,
        t1.completed_date AS completed_date,
        t1.gender_match_category AS gender_match_category,
        t1.active AS active,
        IF((start_date_unix - UNIX_TIMESTAMP() - closing_ts) <= 0,
            1,
            0) AS closed,
        t1_1.match_innings AS match_innings,
        t1_1.result AS match_result,
        t2.team_flag AS team_a_flag,
        t2.team_key AS team_a_key,
        t3.team_flag AS team_b_flag,
        t3.team_key AS team_b_key
        FROM
            bb_matches AS t1
                LEFT JOIN
            bb_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
                LEFT JOIN
            bb_teams AS t2 ON t1.team_a_key = t2.team_key
                LEFT JOIN
            bb_teams AS t3 ON t1.team_b_key = t3.team_key
        WHERE
            t1.end_date_india >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                AND t1.active != 3
        ORDER BY t1.start_date_unix ASC`;
        ///nedd to change above  query INTERVAL 7 DAY
        const userJoinedMatches = await db.query(sql);
        return userJoinedMatches;
    },
    getTotalJoinedLeaguesMatches: async (match_key, user_id, table) => {

        let sql = `select * from ${table} where match_key = ? and user_id = ?`;
        return await db.query(sql, [match_key, user_id]);

    },
    getTotalJoinedLeaguesCountMatches: async (match_key, user_id, table) => {

        let sql = `select count(1) as total_leagues from ${table} where match_key = ? and user_id = ?`;
        return await db.query(sql, [match_key, user_id]);

    },
    countUserLeagues: async (userId, matchKey, perFantasy = true, table = "bb_user_leagues") => {

        let columns = ` `;

        if (perFantasy) {
            columns += ` COUNT(DISTINCT(t1.league_id)) as total, fantasy_type   `
        } else {
            columns += ` COUNT(DISTINCT(t1.league_id)) as total `;
        }
        let sql = ` select ${columns} from ${table} as t1 `;

        sql += ` left join bb_leagues as t2 on t1.league_id=t2.league_id where t1.user_id = ? and t1.match_key = ? and t2.league_status = 1 `

        if (perFantasy) sql += ` group by t1.user_id and t1.match_key and t1.fantasy_type `

        let result = await db.query(sql, [userId, matchKey])

        if (!perFantasy) {
            result[0] = result;
            result = result[0].total ? result[0].total : "0";
        }


        return result;


    },

    userJoinedLeagues: async () => {

    },
    getJoinedLeagueUsersOfMatch: async (where) => {

        const sql = `select * from bb_user_leagues  ${where}`;

        const joined_user_including_self = await db.query(sql);
        return joined_user_including_self;

    },
    getEachActiveMatchesLeagues: async (matchKey, fantasyType = false) => {
        // const sql = `select t1.*, t2.* from bb_matches as t1 left join bb_leagues as t2 on t1.match_key = t2.match_key ${where}`;
        let values;
        let sql = `SELECT
                    t1.category AS category,
                    t1.league_id AS league_id,
                    t1.template_id AS template_id,
                    t1.reference_league AS reference_league,
                    t1.league_name AS league_name,
                    t1.fantasy_type AS fantasy_type,
                    t1.match_key AS match_key,
                    t1.win_amount AS win_amount,
                    t1.bonus_applicable AS bonus_applicable,
                    t1.is_mega AS is_mega,
                    t1.is_jackpot AS is_jackpot,
                    t1.is_private AS is_private,
                    t1.league_msg AS league_msg,
                    t1.team_type AS team_type,
                    t1.total_joined AS total_joined,
                    t1.total_winners_percent AS total_winners_percent,
                    t1.confirmed_league AS confirmed_league,
                    t1.league_type AS league_type,
                    t1.total_winners AS total_winners,
                    t1.max_players AS max_players,
                    t1.bonus_percent AS bonus_percent,
                    t1.joining_amount AS joining_amount,
                    t1.is_infinity AS is_infinity,
                    t1.win_per_user AS win_per_user,
                    t1.league_winner_type AS league_winner_type,
                    t1.banner_image AS banner_image,
                    t1.time_based_bonus AS time_based_bonus,
                    t1.is_reward as is_reward,
                    t1.jumper as jumper,
                    t1.league_code as league_code
                FROM
                    bb_leagues AS t1
                WHERE
                    t1.match_key = ?
                    AND league_status = '1'
                    AND is_full = '0'
                    AND is_private = '0'`;

        values = [matchKey]
        if (fantasyType && fantasyType != 0) {
            sql = `${sql} AND fantasy_type = ${fantasyType}`
            values = [matchKey, fantasyType]
        }
        // console.log('sql=====>> ', sql);
        const match_leagues = await db.query(sql, values);
        return match_leagues;
    },
    getViewMoreCategorizedLeagues: async (where) => {
        const sql = `select * from bb_leagues ${where}`;
        const categorized_leagues = await db.query(sql);
        return categorized_leagues;
    },
    getLeagueDetails: async (where, columns = "*") => {
        const sql = `select ${columns} from bb_leagues ${where}`;
        const league_details = await db.query(sql);
        //  console.log("League_Details is...", league_details);
        if (league_details.length > 0) return league_details;
        return false;
    },
    getPlayerStats: async (where) => {
        const sql = `select t1.*, t2.*, t3.*  from  bb_season_players as t1 inner join bb_seasonal_points as t2 on t1.player_key = t2.player_key and t1.season_key = t2.season_key
                    inner join bb_player_selections as t3 on t2.player_key = t3.player_key and t2.season_key = t3.season_key ${where} `;

        const player_stats = await db.query(sql);
        return player_stats;
    },
    getUserValidTickets: async (user_id) => {
        const sql = `select t1.*, t2.* from bb_ticket_users as t1 inner join bb_tickets as t2 on t1.ticket_id = t2.ticket_id where user_id = ?`;

        const valid_tickets = await db.query(sql, [user_id]);
        return valid_tickets;
    },
    getTeamPreviewOfMatch: async (user_id, match_key, fantasy_type, team_number) => {
        let columns = `t1.user_team_id as user_team_id,
                    t1.user_id as user_id,
                    t1.match_key as match_key,
                    t1.team_number as team_number,
                    t1.fantasy_type as fantasy_type,
                    t1.player_key as player_key,
                    t1.player_type as player_type,
                    t1.player_role as player_role,
                    t1.points as points,
                    t2.player_id as player_id,
                    t2.player_name as player_name,
                    t2.player_photo as player_photo,
                    t2.player_playing_role as player_playing_role,
                    t2.player_credits as player_credits,
                    t2.player_points as player_points`;

        let sql = `select ${columns} from bb_user_teams as t1 left join bb_players as t2
        on t1.player_key = t2.player_key  where team_number = ? and match_key = ? and user_id = ? and fantasy_type = ?`;

        return await db.query(sql, [team_number, match_key, user_id, fantasy_type]);
    },


    checkLeagueAvailability: async (userId, leagueId, matchKey, fantasyType, leagueStatus, adminStatus, active) => {
        let query = '';
        // console.log("fantasyType>>>", fantasyType)
        query = ` SELECT
                        t1.league_id AS league_id,
                        t1.reference_league AS reference_league,
                        t1.is_private AS is_private,
                        t1.template_id AS template_id,
                        t1.league_name AS league_name,
                        t1.fantasy_type AS fantasy_type,
                        t1.match_key AS match_key,
                        t1.bonus_applicable AS bonus_applicable,
                        t1.is_mega AS is_mega,
                        t1.is_infinity AS is_infinity,
                        t1.team_type AS team_type,
                        t1.total_joined AS total_joined,
                        t1.is_full AS is_full,
                        t1.league_type AS league_type,
                        t1.max_players AS max_players,
                        t1.bonus_percent AS bonus_percent,
                        t1.joining_amount AS joining_amount,
                        t1.min_deposit AS min_deposit,
                        t1.category AS category,
                        t1.rake_per_user AS rake_per_user,
                        t1.win_amount AS win_amount,
                        t1.time_based_bonus AS time_based_bonus,
                        t1.jumper AS jumper,
                        t1.free_role_days AS free_role_days,
                        t2.match_name AS match_name,
                        t2.match_short_name AS match_short_name,
                        t2.match_related_name AS match_related_name,
                        t2.start_date_unix AS start_date_unix,
                        t2.season_key AS season_key,
                        t2.season_name AS season_name,
                        t2.gender_match_category AS gender_match_category,
                        t2.match_format AS match_format,
                        t2.category_name AS category_name,
                        IF((start_date_unix - UNIX_TIMESTAMP() - closing_ts) <= 0,1,0) AS closed,
                        t3.team_flag AS team_a_flag,
                        t4.team_flag AS team_b_flag,
                        GROUP_CONCAT(t5.team_number) AS all_teams_joined
                    FROM
                        bb_leagues AS t1
                            LEFT JOIN
                        bb_matches AS t2 ON t1.match_key = t2.match_key
                            LEFT JOIN
                        bb_teams AS t3 ON t2.team_a_key = t3.team_key
                            LEFT JOIN
                        bb_teams AS t4 ON t2.team_b_key = t4.team_key
                            LEFT JOIN
                        bb_user_leagues AS t5 ON t1.match_key = t5.match_key
                            AND t1.league_id = t5.league_id
                            AND t5.user_id = ?
                    WHERE
                        t1.league_id = ?
                        AND t1.match_key = ?
                        AND t1.fantasy_type = ?
                        AND t1.league_status = ?
                        AND t2.admin_status = ?
                        AND t2.active = ?
                    GROUP BY t1.league_id   `;
        // console.log("aaaaaaaaaaaaa==>>>> ", query);

        const result = await db.query(query, [userId, leagueId, matchKey, fantasyType, leagueStatus, adminStatus, active]);
        return result;
    },
    checkTeamExists: async (userId, matchKey, fantasyType, teamNumber, table = "bb_user_teams") => {
        let values = [userId, matchKey, fantasyType, teamNumber]
        let query = `SELECT
    team_number
FROM
   ${table}
WHERE
    user_id = ?
        AND match_key = ?
        AND fantasy_type = ?
        AND team_number = ? `;
        let result = db.query(query, values);
        return result;
    },

    swapTeam: async (matchKey, leagueId, userId, oldTeam, newTeam, userIp = false) => {
        let update = ` `;
        update += ` team_number = '${newTeam}'`;
        if (userIp) update += `, user_ip_swap = '${userIp}'`;

        let query = ` update bb_user_leagues set ${update} where user_id = ${userId} and match_key = ${matchKey} and league_id = ${leagueId} and team_number = '${oldTeam}' `;
        console.log('query >>>>', query);

        let result = await db.query(query);
        result = result.affectedRows ? true : false;
        // console.log('affected rows>>>', result);
        return result;

    },
    updateLeague: async (set, where, table) => {
        let query = `UPDATE ${table} SET ${set} where ${where}`
        // console.log('qqqqq', query);

        const result = await db.query(query);
        return result;
    },
    getLiveScore: async (matchKey) => {
        let sql = `SELECT
    t1.*,
    t2.team_flag AS team_a_flag,
    t3.team_flag AS team_b_flag
FROM
    bb_live_scores AS t1
        LEFT JOIN
    bb_teams AS t2 ON t1.team_a_key = t2.team_key
        LEFT JOIN
    bb_teams AS t3 ON t1.team_b_key = t3.team_key
WHERE
    match_key = ?`;

        return await db.query(sql, [matchKey]);
    },
    getLiveScoreByMatch: async (matchKey) => {

        let sql = ` select * from bb_live_scores where match_key = ?  `;

        return await db.query(sql, [matchKey])
    },

    getScoreBoardBanner: async (matchKey) => {
        let sql = ` select * from bb_promotions as t1 where t1.banner_type = ? and t1.status = 1 and t1.match_key = ? order by sorting_order ASC, promotion_id DESC `;

        return await db.query(sql, [7, matchKey]);
    },
    getMatchDetailsByMatchKey: async (matchKey) => {
        let query = `SELECT
        t1.match_key AS match_key,
        t1.match_format AS match_format,
        t1.match_short_name AS match_short_name,
        t1.read_index AS read_index,
        t1.admin_status AS admin_status,
        t1.start_date_unix AS start_date_unix,
        t1.team_a_short_name AS team_a_short_name,
        t1.team_b_short_name AS team_b_short_name,
        t1.match_status AS match_status,
        t1.season_key AS season_key,
        t1.season_short_name AS season_short_name,
        t1.season_name AS season_name,
        t1.show_playing22 AS show_playing22,
        t1.closing_ts AS closing_ts,
        t1.gender_match_category AS gender_match_category,
        t1.active AS active,
        IF((start_date_unix - UNIX_TIMESTAMP() - closing_ts) <= 0,
            1,
            0) AS closed,
        t1_1.match_innings AS match_innings,
        t1_1.result AS match_result,
        t2.team_flag AS team_a_flag,
        t2.team_key AS team_a_key,
        t3.team_flag AS team_b_flag,
        t3.team_key AS team_b_key
    FROM
        bb_matches AS t1
            LEFT JOIN
        bb_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
            LEFT JOIN
        bb_teams AS t2 ON t1.team_a_key = t2.team_key
            LEFT JOIN
        bb_teams AS t3 ON t1.team_b_key = t3.team_key
    WHERE
        (start_date_unix - UNIX_TIMESTAMP() - closing_ts) > 0
            AND t1.active != 3 AND t1.match_key = ?
    ORDER BY t1.match_order DESC , t1.start_date_unix ASC`;
        let data = await db.query(query, [matchKey]);
        return data
    },
    getActiveUpcomminMatches: async (where) => {
        let query = `SELECT
        t1.match_key AS match_key,
        t1.match_format AS match_format,
        t1.match_short_name AS match_short_name,
        t1.read_index AS read_index,
        t1.admin_status AS admin_status,
        t1.start_date_unix AS start_date_unix,
        t1.team_a_short_name AS team_a_short_name,
        t1.team_b_short_name AS team_b_short_name,
        t1.match_status AS match_status,
        t1.match_image AS match_image,
        t1.stadium AS stadium,
        t1.city AS city,
        t1.country AS country,
        t1.host_name AS host_name,
        t1.team_a_rank AS team_a_rank,
        t1.team_b_rank AS team_b_rank,
        t1.information AS information,
        t1.toss_winner AS toss_winner,
        t1.match_fantasy_type AS match_fantasy_type,
        t1.custom_text AS custom_text,
        t1.team_a_name AS team_a_name,
        t1.team_b_name AS team_b_name,
        t1.season_key AS season_key,
        t1.season_short_name AS season_short_name,
        t1.season_name AS season_name,
        t1.show_playing22 AS show_playing22,
        t1.closing_ts AS closing_ts,
        t1.gender_match_category AS gender_match_category,
        t1.active AS active,
        IF((start_date_unix - UNIX_TIMESTAMP() - closing_ts) <= 0,
            1,
            0) AS closed,
        t1_1.match_innings AS match_innings,
        t1_1.result AS match_result,
        t2.team_flag AS team_a_flag,
        t2.team_key AS team_a_key,
        t3.team_flag AS team_b_flag,
        t3.team_key AS team_b_key
    FROM
        bb_matches AS t1
            LEFT JOIN
        bb_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
            LEFT JOIN
        bb_teams AS t2 ON t1.team_a_key = t2.team_key
            LEFT JOIN
        bb_teams AS t3 ON t1.team_b_key = t3.team_key
    WHERE
        (start_date_unix - UNIX_TIMESTAMP() - closing_ts) > 0
            AND t1.active != ?
    ORDER BY t1.match_order DESC , t1.start_date_unix ASC `;
        let data = await db.query(query, [3]);
        return data
    },
    getHomoPromoBanners: async (playType = 1, date, deviceType = 2) => {
        // let currentDate = await db.query(`select NOW() as date `);
        // console.log('currentDate is >>>', currentDate)
        // currentDate = currentDate[0].date ;
        //   let currentDate = Utils.CurrentDate.currentDate()

        const sql = `SELECT
        t1.promotion_id AS promotion_id,
        t1.banner_type AS banner_type,
        t1.redirect_type AS redirect_type,
        t1.redirect_sport_type AS redirect_sport_type,
        t1.match_key AS match_key,
        t1.leaderboard_id AS leaderboard_id,
        t1.title AS title,
        t1.play_type AS play_type,
        t1.end_date AS end_date,
        t1.website_url AS website_url,
        t1.image AS image,
        t1.button_txt AS button_txt,
        t1.description AS description,
        t1.status AS status,
        t1.device_type AS device_type,
        t1.date_added AS date_added,
        t1.modified_date AS modified_date,
        t1.start_date AS start_date,
        t1.video_url AS video_url,
        t2.play_type AS play_type,
        t2.banner_type AS banner_type,
        t2.sorting_order AS sorting_order
    FROM
        bb_promotions AS t1
            LEFT JOIN
        bb_promotion_order AS t2 ON t1.promotion_id = t2.promotion_id
    WHERE
        (t2.banner_type = 4 OR t2.banner_type = 2)
            AND t1.status = 1
            AND (t1.start_date IS NULL
            OR t1.start_date <= ?)
            AND (t1.end_date IS NULL OR t1.end_date >= ?)
            AND (t2.play_type = 0 OR t2.play_type = 1
            OR t2.play_type IS NULL)
            AND (t1.device_type like '%${deviceType}%' OR t1.device_type = 0)
            AND t2.sorting_order is not null
    ORDER BY t2.sorting_order DESC
     `;
        console.log("sq; banner ----->", sql, [date, date])
        return await db.query(sql, [date, date]);
    },
    getPromoBanner: async (where, date) => {
        const sql = `select * from bb_promotions ${where} order by promotion_id DESC `

        console.log("sql >>>>>", sql)
        const promotionCodes = await db.query(sql);
        return promotionCodes;

    },
    getHomeBanners: async (currentDateIST) => {
        let query = `select * from bb_promotions where
    banner_type = 2 and
    status = 1 and
    (start_date IS NULL OR start_date<='${currentDateIST}') and
    (end_date IS NULL OR end_date>='${currentDateIST}') order by sorting_order DESC,
     promotion_id DESC `

        try {
            return db.query(query);
        } catch (e) {
            return e;
        }
    },
    getMatchByKey: async (columns = "*", matchKey) => {
        const sql = `select ${columns},
        IF((start_date_unix - UNIX_TIMESTAMP() - closing_ts) <= 0,
        1,
        0) AS closed from bb_matches as t1
        LEFT JOIN
        bb_teams AS t2 ON t1.team_a_key = t2.team_key
        LEFT JOIN
        bb_teams AS t3 ON t1.team_b_key = t3.team_key where match_key = ?`;
        return await db.query(sql, [matchKey]);
    },
    rawQuery: async (query, statement) => {
        let result = await db.query(query, statement);
        return result;
    },
    getPlaying22ByMatchkey: async (matchKey) => {
        const sql = ` SELECT
                        t1.*,
                        t1.player_key AS players_key,
                        t4.player_photo AS player_photo,
                        t4.is_playing AS is_playing
                    FROM
                        bb_playing22 AS t1
                            LEFT JOIN
                        bb_season_players AS t4 ON t1.match_key = t4.match_key
                            AND t1.player_key = t4.player_key
                    WHERE
                        t1.player_status = 1 and
                        t1.match_key = ? `;
        // console.log("playing22 data >>>", sql, matchKey);
        return await db.query(sql, [matchKey]);
    },

    getPlayerSeasonInfo: async (matchKey, playerKey) => {
        let query = `SELECT
    t1.season_key AS season_key,
    t1.player_key AS player_key,
    t1.player_name AS player_name,
    t1.player_photo AS player_photo,
    t1.team_key AS team_key,
    t1.team_name AS team_name,
    t1.team_short_name AS team_short_name,
    t1.player_playing_role AS player_playing_role,
    t1.player_credits AS player_credits,
    t1.form_classic AS form_classic,
    t1.form_batting AS form_batting,
    t1.form_bowlling AS form_bowlling,
    IF(t2.row_id, seasonal_start_points, 0) AS seasonal_start_points,
    IF(t2.row_id,
        seasonal_classic_points,
        0) AS seasonal_classic_points,
    IF(t2.row_id,
        seasonal_batting_points,
        0) AS seasonal_batting_points,
    IF(t2.row_id,
        seasonal_bowling_points,
        0) AS seasonal_bowling_points,
    IF(t2.row_id,
        seasonal_reverse_points,
        0) AS seasonal_reverse_points,
    IF(t2.row_id,
        seasonal_wizard_points,
        0) AS seasonal_wizard_points
FROM
    bb_season_players AS t1
        LEFT JOIN
    bb_seasonal_points AS t2 ON t1.season_key = t2.season_key
        AND t1.player_key = t2.player_key
WHERE
    t1.match_key = ?
        AND t1.player_key = ? `;

        return db.query(query, [matchKey, playerKey]);
    },
    getPlayerSelections: async (seasonKey, playerKey, matchKey = false) => {
        let values;
        let columns = ` t1.classic_selected AS selected_by_classic,
                   t1.batting_selected AS selected_by_batting,
                   t1.bowling_selected AS selected_by_bowling,
                   t1.reverse_selected AS selected_by_reverse,
                   t1.wizard_selected AS selected_by_wizard,
                   t1.player_score, t1.player_score_batting,
                   t1.player_score_bowling, t2.match_key,
                   t2.match_name, t2.match_short_name, t2.match_related_name, t2.start_date_india `;

        let where = ` where t1.season_key = ? and t1.player_key = ? `;
        values = [seasonKey, playerKey]
        if (matchKey) {
            where += ` ${where} and t1.match_key!= ? `
            values = [seasonKey, playerKey, matchKey]
        }

        let query = `select ${columns} from bb_player_selections as t1 left join bb_matches as t2
                 on t1.match_key = t2.match_key ${where} order by t2.start_date_india DESC `;

        try {
            return await db.query(query, values);
        } catch (e) {
            return e
        }
    },
    getPlaying22ByUserTeam: async (matchKey, userId, teamNumber, fantasyType, readTable = "bb_user_teams") => {

        let sql = ` SELECT
                        t1.player_key AS players_key,
                        t1.player_key AS player_key,
                        t1.player_role AS players_role,
                        t1.points AS players_points,
                        t2.*,
                        t4.player_name AS name,
                        t4.player_photo AS player_photo,
                        t4.player_playing_role AS seasonal_role,
                        t4.team_key AS team_key,
                        t4.team_name AS team_name,
                        t4.team_short_name AS team_short_name,
                        t4.is_playing AS is_playing
                    FROM
                        ${readTable} AS t1
                        LEFT JOIN
                    bb_playing22 AS t2 ON t1.match_key = t2.match_key
                        AND t1.player_key = t2.player_key
                        LEFT JOIN
                    bb_season_players AS t4 ON t1.match_key = t4.match_key
                        AND t1.player_key = t4.player_key
                    WHERE
                        t1.match_key = ?
                        AND t1.user_id = ?
                        AND t1.team_number = ?
                        AND t1.fantasy_type = ?
                         `
        try {
            return await db.query(sql, [matchKey, userId, teamNumber, fantasyType]);
        } catch (e) {
            // console.log("Error>>>>>>", e);
            return e;
        }
    },
    getLeagueData: async (where, columns = '*') => {
        let sql = `select ${columns} from bb_leagues_data where ${where}`
        return await db.query(sql);
    },
    getLeagueByCatagory: async (where, userId) => {
        let sql = `SELECT
                    t1.category AS category,
                    t1.league_id AS league_id,
                    t1.template_id AS template_id,
                    t1.reference_league AS reference_league,
                    t1.league_name AS league_name,
                    t1.fantasy_type AS fantasy_type,
                    t1.match_key AS match_key,
                    t1.win_amount AS win_amount,
                    t1.bonus_applicable AS bonus_applicable,
                    t1.is_mega AS is_mega,
                    t1.is_private AS is_private,
                    t1.league_code AS league_code,
                    t1.league_msg AS league_msg,
                    t1.team_type AS team_type,
                    t1.total_joined AS total_joined,
                    t1.total_winners_percent AS total_winners_percent,
                    t1.confirmed_league AS confirmed_league,
                    t1.league_type AS league_type,
                    t1.total_winners AS total_winners,
                    t1.max_players AS max_players,
                    t1.bonus_percent AS bonus_percent,
                    t1.joining_amount AS joining_amount,
                    t1.is_infinity AS is_infinity,
                    t1.win_per_user AS win_per_user,
                    t1.banner_image AS banner_image,
                    t1.time_based_bonus AS time_based_bonus,
                    GROUP_CONCAT(t2.team_number) AS user_teams
                FROM
                    bb_leagues AS t1
                        LEFT JOIN
                    bb_user_leagues AS t2 ON t1.match_key = t2.match_key
                        AND t1.league_id = t2.league_id
                        AND t2.user_id = ?
                WHERE ${where}
                GROUP BY t1.league_id
                ORDER BY fantasy_type ASC , is_mega DESC , league_order ASC , confirmed_league DESC , max_players DESC , win_amount DESC`
        return await db.query(sql, [userId]);

    },
    teamBulkInsert: async (data, table) => {
        if (!data || !table) {
            return false;
        }
        let bulkData = data;
        data = data[0];
        let columns = Object.keys(data);
        let sql = `insert into ${table} (${columns}) VALUES ?`;
        let response = await db.query(sql, [bulkData.map(item => [item.user_id, item.match_key, item.fantasy_type, item.team_number, item.player_key, item.player_type, item.player_role, item.points, item.date_added])]);
        return response;
    },
    userLeagueBulkInsert: async (data) => {
        if (!data) {
            return false;
        }
        let bulkData = data;
        data = data[0];
        console.log("Bulkdata is >>>", bulkData)
        let columns = Object.keys(data);
        let sql = `insert into bb_user_leagues (${columns}) VALUES ?`;
        // console.log("sql query ---->", sql)
        let response = await db.query(sql, [bulkData.map(item => [item.match_key, item.fantasy_type, item.league_id, item.user_id, item.user_name, item.team_number, item.unused_applied, item.cash_applied, item.bonus_applied, item.is_ticket, item.user_ip_join, item.date_added])]);

        return response;

    },

    creditstatsBulkInsert: async (data) => {
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
    leagueDatabulkInsert: async (data, table) => {
        if (!data || !table || !data.length) {
            return false;
        }
        let bulkData = data;
        data = data[0];
        if (!data) return false;
        let columns = Object.keys(data);
        let sql = `insert into ${table} (${columns}) VALUES ?`;
        let response = await db.query(sql, [bulkData.map(item => [item.league_id, item.win_from, item.win_to, item.win_amount, item.bbcoins])]);
        return response;
    },
    removeUserTeam: async (where) => {
        const sql = `DELETE FROM bb_user_teams where ${where}`;
        const result = await db.query(sql);
        console.log(" remove result ------->>>>> ", result);

        return result;
    },
    updateLeagueOnJOining: async (totalJoined, unusedApplied, cashApplied, bonousApplied, leagueId) => {
        console.log("updattte league on joining >>>>", totalJoined, unusedApplied, cashApplied, bonousApplied, leagueId);


        let sql = `UPDATE bb_leagues AS t1
        SET
            t1.total_joined = t1.total_joined + ${totalJoined}
        WHERE league_id = ? `


        // console.log("queruuttt >>>>", sql);

        return await db.query(sql, [leagueId]);
    },
    updateUserRecordsOnJoining: async (fantasyType, totalContests, userId, dateAdded) => {
        let column = "total_classic";
        if (fantasyType == 2) {
            column = "total_batting";
        } else if (fantasyType == 3) {
            column = "total_bowling";
        } else if (fantasyType == 4) {
            column = "total_reverse";
        } else if (fantasyType == 5) {
            column = "total_wizard";
        }
        let sql = `  INSERT INTO bb_user_records (user_id, ${column}) VALUES (?, ?) ON DUPLICATE KEY UPDATE
        ${column}  = ${column}+${totalContests},
        first_contest=CASE WHEN first_contest IS NULL THEN ? ELSE first_contest END
	 `

        // console.log("qyeryy>>> bb_user_records >>>", sql, [userId, totalContests, dateAdded]);
        return await db.query(sql, [userId, totalContests, dateAdded])
    },

    getPlayerNotIn22: async (matchKey) => {
        let sql = ` SELECT
        *
    FROM
        bb_season_players AS t1
    WHERE
        match_key = ?
            AND player_key NOT IN (SELECT
                player_key
            FROM
                bb_playing22
            WHERE
                match_key = ?)
            AND player_status = ? `

        return db.query(sql, [matchKey, matchKey, 1]);
    },

    getMaxScorePlayer: async (matchKey, column_name) => {
        let sql = ` SELECT
        *
    FROM
        bb_playing22
    WHERE
        match_key = ?
    ORDER BY ${column_name} DESC
    LIMIT 1 `;

        // console.log("query is >>>>", sql)
        return db.query(sql, [matchKey]);
    }

}