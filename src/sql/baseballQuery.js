const db = require('../utils/BaseBallDbConfig');
const Mysql_dt = require('../utils/mySql_dateTime');
const Utils = require('../utils');
const Bluebird = require('bluebird');
var moment = require('moment');
let currentDateTime = moment().format('YYYY-MM-DD h:mm:ss')

module.exports = {
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
        bs_matches AS t1
            LEFT JOIN
        bs_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
            LEFT JOIN
        bs_teams AS t2 ON t1.team_a_key = t2.team_key
            LEFT JOIN
        bs_teams AS t3 ON t1.team_b_key = t3.team_key
    WHERE
        (start_date_unix - UNIX_TIMESTAMP() - closing_ts) > 0
            AND t1.active != ?
    ORDER BY t1.match_order DESC , t1.start_date_unix ASC`;
        let data = await db.query(query, [3]);
        return data
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
        t1.season_key AS season_key,
        t1.season_short_name AS season_short_name,
        t1.season_name AS season_name,
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
        bs_matches AS t1
            LEFT JOIN
        bs_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
            LEFT JOIN
        bs_teams AS t2 ON t1.team_a_key = t2.team_key
            LEFT JOIN
        bs_teams AS t3 ON t1.team_b_key = t3.team_key
    WHERE
        t1.start_date_india >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND t1.active != 3
    ORDER BY t1.start_date_unix ASC;

    `;
        const userJoinedMatches = await db.query(sql);
        return userJoinedMatches;
    },
    getTotalJoinedLeaguesMatches: async (match_key, user_id, table) => {

        let sql = `select * from ${table} where match_key = ? and user_id = ?`;
        return await db.query(sql, [match_key, user_id]);

    },
    getMatchByKey: async (columns = "*", matchKey) => {
        const sql = ` select ${columns} from bs_matches as t1
        LEFT JOIN
        bs_teams AS t2 ON t1.team_a_key = t2.team_key
        LEFT JOIN
        bs_teams AS t3 ON t1.team_b_key = t3.team_key where match_key = ? `;
        return await db.query(sql, [matchKey]);
    },
    getMatchPlayers: async (matchKey) => {
        let sql = `SELECT
        t1.player_key AS player_key,
        t1.player_name AS player_name,
        t1.player_photo AS player_photo,
        t1.player_playing_role AS player_playing_role,
        t1.player_credits AS player_credits,
        t1.team_key AS team_key,
        t1.team_short_name AS team_short_name,
        t1.is_playing AS is_playing,
        t1.is_playing11_last AS is_playing11_last,
        t1.is_playing11_prob AS is_playing11_prob,
        IF(t2.row_id,
            seasonal_classic_points,
            0) AS seasonal_classic_points
    FROM
        bs_season_players AS t1
            LEFT JOIN
        bs_seasonal_points AS t2 ON t1.season_key = t2.season_key
            AND t1.player_key = t2.player_key
    WHERE
        match_key = ?
        AND player_status = ?
    ORDER BY team_key DESC `;
        let players = await db.query(sql, [matchKey, 1]);
        return players;
    },
    getMatchfantasyScore: async (matchKey) => {
        let sql = `select t1.* , t2.team_key as team_a_key_basket, t2.team_flag as team_a_flag, t3.team_key as team_b_key_basket, t3.team_flag as team_b_flag , if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from bs_matches as t1 left join bs_teams as t2 on t1.team_a_key=t2.team_key left join bs_teams as t3 on t1.team_b_key=t3.team_key where t1.match_key = ? order by t1.start_date_unix ASC`;

        return await db.query(sql, [matchKey]);
    },
    getPlaying22ByUserTeam: async (matchKey, userId, teamNumber, fantasyType, readTable = "bs_user_teams") => {

        let sql = `SELECT
                        t1.player_key AS players_key,
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
                    bs_playing22 AS t2 ON t1.match_key = t2.match_key
                        AND t1.player_key = t2.player_key
                        LEFT JOIN
                    bs_season_players AS t4 ON t1.match_key = t4.match_key
                        AND t1.player_key = t4.player_key
                    WHERE
                        t1.match_key= ?
                        AND t1.user_id = ?
                        AND t1.team_number = ?
                        AND t1.fantasy_type = ? `
        try {
            return await db.query(sql, [matchKey, userId, teamNumber, fantasyType]);
        } catch (e) {
            // console.log("Error>>>>>>", e);
            return e;
        }
    },
    getPlaying22ByMatchkey: async (matchKey) => {
        const sql = ` SELECT
                        t1.*,
                        t4.player_photo AS player_photo,
                        t4.is_playing AS is_playing
                    FROM
                        bs_playing22 AS t1
                            LEFT JOIN
                        bs_season_players AS t4 ON t1.match_key = t4.match_key
                            AND t1.player_key = t4.player_key
                    WHERE
                        t1.match_key = ? `;
        return await db.query(sql, [matchKey]);
    },
    getCustomLeague: async (where, columnsT1 = false, matchDetails = false, columnsT2 = false) => {
        let T1 = `bs_leagues as t1`;
        let T2 = `bs_matches as t2`;
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
    getUserLeaguesForContest: async (matchKey, leagueId, table, userId = false, excludeUserId = false, from = false, limit = false, matchClose = true) => {
        let T1 = `${table} as t1`;
        let sql, column, values;

        if (matchClose) {
            column = `t1.match_key, t1.league_id, t1.user_id, t1.fantasy_type, t1.team_number, t1.team_rank,
                      t1.old_team_rank, (t1.winning_tds+t1.credits_won) as credits_won, t1.total_points, t1.user_name, t1.team_rank as rank `
        } else {
            column = `t1.match_key, t1.league_id, t1.0 as user_id t1.fantasy_type, t1.team_number,
                t1.team_rank, t1.old_team_rank, (t1.winning_tds+t1.credits_won) as credits_won, t1.total_points, t1.user_name, t1.team_rank as rank `;
        }
        let where = `t1.match_key = ? and t1.league_id = ?  `;

        values = [matchKey, leagueId]
        if (userId && excludeUserId) {
            where = `t1.match_key = ? and t1.league_id = ?  and t1.user_id != ?  `;
            values.push(userId);
        } else if (userId) {
            where = `t1.match_key = ? and t1.league_id = ?  and t1.user_id = ?  `;
        }


        if (from !== false && limit !== false) {
            limit = from + limit;
            where = `t1.match_key = ? and t1.league_id = ?  and t1.user_id = ? and t1.team_rank between 0 and 100 limit 300 `;
        }

        sql = `select ${column} from ${T1} where ${where}`;

        const result = await db.query(sql, values);
        return result;
    },
    getPlayerSeasonInfo: async (matchKey, playerKey) => {
        let query = `SELECT
        t1.player_key AS player_key,
        t1.player_name AS player_name,
        t1.player_photo AS player_photo,
        t1.player_playing_role AS player_playing_role,
        t1.player_credits AS player_credits,
        t1.team_key AS team_key,
        t1.team_short_name AS team_short_name,
        t1.is_playing AS is_playing,
        t1.is_playing11_last AS is_playing11_last,
        t1.is_playing11_prob AS is_playing11_prob,
        t1.season_key as season_key,
        IF(t2.row_id,
            seasonal_classic_points,
            0) AS seasonal_classic_points
    FROM
        bs_season_players AS t1
            LEFT JOIN
        bs_seasonal_points AS t2 ON t1.season_key = t2.season_key
            AND t1.player_key = t2.player_key
    WHERE
        t1.match_key = ?
        AND t1.player_key = ? `;

        return db.query(query, [matchKey, playerKey]);
    },
    getPlayerSelections: async (seasonKey, playerKey, matchKey = false) => {
        let values;
        let columns = ` t1.classic_selected AS selected_by_classic,
                   t1.player_score, t2.match_key, t2.match_name, t2.match_short_name, t2.match_related_name, t2.start_date_india `;

        let where = ` where t1.season_key = ? and t1.player_key = ? `;
        values = [seasonKey, playerKey]
        if (matchKey) {
            where += ` ${where} and t1.match_key!= ? `
            values = [seasonKey, playerKey, matchKey]
        }

        let query = `select ${columns} from bs_player_selections as t1 left join bs_matches as t2
                 on t1.match_key = t2.match_key ${where} order by t2.start_date_india DESC `;

        try {
            console.log("query >>>>", query, values)
            return await db.query(query, values);
        } catch (e) {
            return e
        }
    },
    getMatchTableByKey: async (matchKey, columns = "*") => {
        let sql = `select *, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from bs_matches where match_key = ${matchKey}`
        if (columns) {
            sql = `select ${columns}, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from bs_matches where match_key = ${matchKey}`
        }
        // console.log('wsql=> ', sql);

        const result = await db.query(sql);
        return result;
    },
    getPlayersByMatchKey: async (where, columns = "*", IF = null) => {
        const sql = `SELECT ${columns} from bs_season_players where ${where}`
        // console.log('sql=>   ', sql);

        const players = await db.query(sql);
        return players;
    },
    getUserTeamDetails: async (columns = `*`, where) => {
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
                        t2.team_key AS team_key,
                        t2.player_photo AS player_photo,
                        t2.is_playing AS is_playing,
                        t2.player_playing_role AS seasonal_role,
                        t2.player_points AS points,
                        t2.player_credits AS credits,
                        t1.user_id AS user_id,
                        t1.match_key AS match_key
                    FROM
                        bs_user_teams AS t1
                            LEFT JOIN
                        bs_season_players AS t2 ON t1.match_key = t2.match_key
                            AND t1.player_key = t2.player_key
                    WHERE
                        ${where}
                    ORDER BY t1.fantasy_type ASC , t1.team_number ASC`;
        // console.log('sql===>>>> ', sql);

        const teams = await db.query(sql);
        return teams;
    },
    insertData2: async (data, table) => {
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
        }).then(async (result) => {
            sql = sql.slice(0, -1)
            values = values.slice(0, -1)
            sql = sql + ") VALUES"
            sql = sql + "(" + values + ")";
            console.log('response=>>>>> r', sql);
            let response = await db.query(sql);

            return response;
        }).catch(e => {
            console.log('erro in inserting-->> ', e);

        })
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
    removeUserTeam: async (where) => {
        const sql = `DELETE FROM bs_user_teams where ${where}`;
        const result = await db.query(sql);
        console.log(" remove result ------->>>>> ", result);

        return result;
    },
    checkLeagueAvailability: async (userId, leagueId, matchKey, fantasyType, leagueStatus, adminStatus, active) => {
        let values = [userId, leagueId, matchKey, fantasyType, leagueStatus, adminStatus, active]
        let query = '';
        // console.log("fantasyType>>>", fantasyType)
        query = `SELECT
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
                        t2.match_name AS match_name,
                        t2.match_short_name AS match_short_name,
                        t2.match_related_name AS match_related_name,
                        t2.start_date_unix AS start_date_unix,
                        IF((start_date_unix - UNIX_TIMESTAMP() - closing_ts) <= 0,1,0) AS closed,
                        t3.team_flag AS team_a_flag,
                        t4.team_flag AS team_b_flag,
                        GROUP_CONCAT(t5.team_number) AS all_teams_joined
                    FROM
                        bs_leagues AS t1
                            LEFT JOIN
                        bs_matches AS t2 ON t1.match_key = t2.match_key
                            LEFT JOIN
                        bs_teams AS t3 ON t2.team_a_key = t3.team_key
                            LEFT JOIN
                        bs_teams AS t4 ON t2.team_b_key = t4.team_key
                            LEFT JOIN
                        bs_user_leagues AS t5 ON t1.match_key = t5.match_key
                            AND t1.league_id = t5.league_id
                            AND t5.user_id = ?
                    WHERE
                        t1.league_id = ?
                        AND t1.match_key = ?
                        AND t1.fantasy_type = ?
                        AND t1.league_status = ?
                        AND t2.admin_status = ?
                        AND t2.active = ?
                    GROUP BY t1.league_id `;
        //console.log("aaaaaaaaaaaaa==>>>> ", query);

        console.log("Values are >>>", values)
        const result = await db.query(query, values);
        return result;
    },

    checkTeamExists: async (userId, matchKey, fantasyType, teamNumber, table = "bs_user_teams") => {
        let values = [userId, matchKey, fantasyType, teamNumber]
        let query = `SELECT
          team_number
          FROM  ${table}
         WHERE  user_id = ?
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

        let query = ` update bs_user_leagues set ${update} where user_id = ${userId} and match_key = ${matchKey} and league_id = ${leagueId} and team_number = '${oldTeam}' `;

        let result = await db.query(query);
        result = result.affectedRows ? true : false;
        // console.log('affected rows>>>', result);
        return result;

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
                    t1.is_reward as is_reward
                FROM
                    bs_leagues AS t1
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
        console.log('sql=====>> ', sql);
        const match_leagues = await db.query(sql, values);
        return match_leagues;
    },
    getTeamCountByMatch: async (user_id, match_key, fantasyType = 0) => {
        let sql = `SELECT
                        COUNT(DISTINCT team_number) AS total_teams, fantasy_type
                    FROM
                        bs_user_teams
                    WHERE
                        user_id = ? AND match_key = ?
                    GROUP BY fantasy_type`;
        // console.log("=====>>> ", sql);
        return await db.query(sql, [user_id, match_key
        ]);
    },
    getJoinedLeagues: async (matchKey, user_id) => {
        let sql = `SELECT
                    t1.fantasy_type AS fantasy_type,
                    t1.match_key AS match_key,
                    t1.league_id AS league_id,
                    t1.team_number AS team_number,
                    t2.team_type AS team_type
                FROM
                    bs_user_leagues AS t1 left join bk_leagues AS t2 on t1.league_id = t2.league_id
                WHERE
                    t1.match_key = ?
                        AND t1.user_id = ? `;

        try {
            return await db.query(sql, [matchKey, user_id]);
        } catch (e) {
            return e
        }
    },
    getUserLeaguesWithTopRank: async (userId = null, matchKey, table = "bs_user_leagues", league_id = null, fantasyType = 0) => {
        let sql;
        let values;
        if (userId) {
            sql = ` SELECT
            t1.match_key, t1.league_id, t1.user_id, t1.team_rank, t1.team_rank as rank, t1.old_team_rank,t1.team_number as team_number,
            t2.fantasy_type, t2.league_name, t2.league_type, t2.confirmed_league, t2.max_players, t2.team_type,
            t2.win_amount, t2.joining_amount, t2.total_joined, t2.total_winners, t2.league_code, t2.is_private, t2.user_teams_pdf,t2.is_infinity,t2.win_per_user,t2.total_winners_percent,t2.banner_image,t2.league_winner_type
            from ${table} as t1
        INNER JOIN bs_leagues as t2
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
        INNER JOIN bs_leagues as t2
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

        console.log("sql ------->", sql);
        const result = await db.query(sql, values);
        return result;

    },
    getLiveScore: async (matchKey) => {
        let sql = `SELECT
    t1.*,
    t2.team_flag AS team_a_flag,
    t3.team_flag AS team_b_flag
FROM
    bs_live_scores AS t1
        LEFT JOIN
    bs_teams AS t2 ON t1.team_a_key = t2.team_key
        LEFT JOIN
    bs_teams AS t3 ON t1.team_b_key = t3.team_key
WHERE
    match_key = ?`;

        return await db.query(sql, [matchKey]);
    },
    getUserLeaguesDetails: async (matchKey, leagueId, table = "bs_user_leagues") => {
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
            AND t1.league_id = ? `;
        try {
            return await db.query(sql, [matchKey, leagueId]);
        } catch (e) {
            return e
        }
    },
    getUnjoinedPrivate: async (matchKey, userId, fantasyType = false) => {
        let T1 = `bs_leagues as t1`;
        let sql;
        let where = ``
        where += ` t1.match_key = ${matchKey} and t1.created_by = ${userId} and t1.total_joined = 0 `;
        if (fantasyType) where += ` and fantasy_type = ${fantasyType} `;
        sql = `select *,0 as team_rank,0 as rank, 0 as old_team_rank from ${T1} where ${where}`
        try {
            const result = await db.query(sql);
            return result
        } catch (e) {
            return e
        }
    },
    getLeagueDetails: async (where) => {
        const sql = `select * from bs_leagues ${where}`;
        const league_details = await db.query(sql);
        //  console.log("League_Details is...", league_details);
        if (league_details.length > 0) return league_details;
        return false;
    },
    getUserTeams: async (userId, matchKey, fantasyType, teams) => {
        let query = `SELECT
        t1.team_number AS team_number
        FROM
        bs_user_teams AS t1
        WHERE
        user_id = ?
        AND match_key = ?
        AND fantasy_type = ?
        GROUP BY team_number`;
        var result = await db.query(query, [userId, matchKey, fantasyType]);
        if (result.length > 0) return result
        return false;
    },
    userLeagueBulkInsert: async (data) => {
        if (!data) {
            return false;
        }
        let bulkData = data;
        data = data[0];
        console.log("Bulkdata is >>>", bulkData)
        let columns = Object.keys(data);
        let sql = `insert into bs_user_leagues (${columns}) VALUES ?`;
        console.log("sql query ---->", sql)
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
        let sql = `insert into bs_credit_stats (${columns}) VALUES ?`;
        let response = await db.query(sql, [bulkData.map(item => [item.user_id, item.play_type, item.unused_cash, item.real_cash, item.bonus_cash, item.amount, item.league_id, item.league_name, item.match_key, item.match_name, item.match_date, item.team_name, item.team_a_flag, item.team_b_flag, item.transaction_type, item.transaction_message, item.transaction_date])]);
        return response;
    },
    getLeaguesDetails: async (matchKey, leagueId) => {
        let sql = `select * from bs_leagues where match_key=? and league_id=?`;
        let result = await db.query(sql, [matchKey, leagueId]);
        // if(result.length < 0){
        //     sql = `select * from bb_leagues where match_key=? and template_id=?`;
        //     result = await db.query(sql, [matchKey, leagueId]);
        //     console.log("result is.....", result)
        //     return result;
        // }
        return result;

    },
    getLeaguesByTemplate: async (matchKey, leagueId) => {
        let sql = `select * from bs_leagues where match_key=? and template_id=?`;
        let result = await db.query(sql, [matchKey, leagueId]);
        console.log("Results ......", result);
        return result = result.length > 0 ? result : false
    },
    updateLeague: async (set, where, table) => {
        let query = `UPDATE ${table} SET ${set} where ${where}`
        console.log('qqqqq', query);

        const result = await db.query(query);
        return result;
    },
    getLeagueData: async (where, columns = '*') => {
        let sql = `select ${columns} from bs_leagues_data where ${where}`
        return await db.query(sql);
    },
    leagueDatabulkInsert: async (data, table) => {
        if (!data || !table || !data.length) {
            return false;
        }
        let bulkData = data;
        data = data[0];
        if (data) return false;
        let columns = Object.keys(data);
        let sql = `insert into ${table} (${columns}) VALUES ?`;
        let response = await db.query(sql, [bulkData.map(item => [item.league_id, item.win_from, item.win_to, item.win_amount, item.bbcoins])]);
        return response;
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
        bs_matches AS t1
            LEFT JOIN
        bs_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
            LEFT JOIN
        bs_teams AS t2 ON t1.team_a_key = t2.team_key
            LEFT JOIN
        bs_teams AS t3 ON t1.team_b_key = t3.team_key
    WHERE
        (start_date_unix - UNIX_TIMESTAMP() - closing_ts) > 0
            AND t1.active != 3 AND t1.match_key = ?
    ORDER BY t1.match_order DESC , t1.start_date_unix ASC`;
        let data = await db.query(query, [matchKey]);
        return data
    },

    removeLeagueIfError: async (league_id) => {
        const sql = ` DELETE FROM bs_leagues where league_id = ? `;
        const result = await db.query(sql, [league_id]);
        if (result) {
            return result
        }
        return false;
    },
    removeDataLeaguesDatatable: async (league_id) => {
        const sql = `DELETE FROM bs_leagues_data where league_id = ? `;
        const result = await db.query(sql, [league_id]);
        return result;
    },
    updateLeagueStatus: async (leagues_id, status) => {
        const sql = `UPDATE bs_leagues SET league_status = ? where league_id = ?`;
        const result = await db.query(sql, [status, leagues_id]);
        return result;
    },
    getMatchKey: async (matchKey, columns = false, teamFlags = false) => {
        let sql, where, On1, On2, On3, T2, T3, T4;
        T1 = `bs_matches as t1 `;
        where = ` where t1.match_key = ${matchKey} `
        if (!columns) {
            columns = `t1.*, if((t1.start_date_unix-UNIX_TIMESTAMP()-t1.closing_ts)<=0, 1, 0) as closed `;
        } else {
            columns = `t1.*, if((t1.start_date_unix-UNIX_TIMESTAMP()-t1.closing_ts)<=0, 1, 0) as closed`;
        }
        if (teamFlags) {
            T3 = `left join bs_teams as t2`;
            On2 = ` on t1.team_a_key = t2.team_key`;
            T4 = ` left join bs_teams as t3`;
            On3 = ` on t1.team_b_key = t3.team_key`
            columns = `t1.*, if((t1.start_date_unix-UNIX_TIMESTAMP()-t1.closing_ts)<=0, 1, 0) as closed, t2.team_flag as team_a_flag, t3.team_flag as team_b_flag `;
            sql = `select ${columns} from ${T1} ${T3} ${On2} ${T4} ${On3} ${where}`;
        }
        console.log('qqqqqq=>>> ', sql);
        const result = await db.query(sql);
        return result;

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
                    bs_leagues AS t1
                        LEFT JOIN
                    bs_user_leagues AS t2 ON t1.match_key = t2.match_key
                        AND t1.league_id = t2.league_id
                        AND t2.user_id = ?
                WHERE ${where}
                GROUP BY t1.league_id
                ORDER BY fantasy_type ASC , is_mega DESC , league_order ASC , confirmed_league DESC , max_players DESC , win_amount DESC`
        return await db.query(sql, [userId]);

    },
}