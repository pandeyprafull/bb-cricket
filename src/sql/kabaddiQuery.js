const db = require('../utils/kabaddiDbConfig');
const cricket_db = require('../utils/CricketDbConfig');
const football_db = require('../utils/FootballDbConfig');

const Mysql_dt = require('../utils/mySql_dateTime');
const Utils = require('../utils');
const Bluebird = require('bluebird');
var moment = require('moment');
let currentDateTime = moment().format('YYYY-MM-DD h:mm:ss');

module.exports = {

    getActiveUpcomminMatches: async (where) => {
        let query = `
        SELECT
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
                kb_matches AS t1
                    LEFT JOIN
                kb_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
                    LEFT JOIN
                kb_teams AS t2 ON t1.team_a_key = t2.team_key
                    LEFT JOIN
                kb_teams AS t3 ON t1.team_b_key = t3.team_key
            WHERE
                (start_date_unix - UNIX_TIMESTAMP() - closing_ts) > 0
                    AND t1.active != 3
            ORDER BY t1.match_order DESC , t1.start_date_unix ASC`;
        let data = await db.query(query);
        return data
    },
    getHomoPromoBanners: async () => {
        const sql = `SELECT
                        t1.*
                    FROM
                        bb_promotions AS t1
                    WHERE
                           banner_type = 2
                            AND status = '1'
                            AND (play_type = 0 or play_type = 2)
                            AND (start_date IS NULL
                            OR start_date <= '${currentDateTime}')
                            AND (end_date IS NULL
                            OR end_date >= '${currentDateTime}')
                    ORDER BY sorting_order DESC , promotion_id DESC`;
        console.log("sq; banner ----->", sql)
        return await cricket_db.query(sql);
    },
    getMatchByKey: async (columns = "*", matchKey) => {
        const sql = `select ${columns} from kb_matches as t1
        LEFT JOIN
        kb_teams AS t2 ON t1.team_a_key = t2.team_key
        LEFT JOIN
        kb_teams AS t3 ON t1.team_b_key = t3.team_key where match_key = ${matchKey}`;
        return await db.query(sql);
    },
    getEachActiveMatchesLeagues: async (matchKey, fantasyType = false) => {
        // const sql = `select t1.*, t2.* from bb_matches as t1 left join bb_leagues as t2 on t1.match_key = t2.match_key ${where}`;

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
                    t1.is_reward as is_reward
                FROM
                    kb_leagues AS t1
                WHERE
                    t1.match_key = ${matchKey}
                    AND league_status = '1'
                    AND is_full = '0'
                    AND is_private = '0'`;
        if (fantasyType && fantasyType != 0) {
            sql = `${sql} AND fantasy_type = ${fantasyType}`
        }
        console.log('sql=====>> ', sql);
        const match_leagues = await db.query(sql);
        return match_leagues;
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
        kb_matches AS t1
            LEFT JOIN
        kb_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
            LEFT JOIN
        kb_teams AS t2 ON t1.team_a_key = t2.team_key
            LEFT JOIN
        kb_teams AS t3 ON t1.team_b_key = t3.team_key
    WHERE
        (start_date_unix - UNIX_TIMESTAMP() - closing_ts) > 0
            AND t1.active != 3 AND t1.match_key = '${matchKey}'
    ORDER BY t1.match_order DESC , t1.start_date_unix ASC`;
        let data = await db.query(query);
        return data
    },
    getUserLeaguesWithTopRank: async (userId = null, matchKey, table = "bb_user_leagues", league_id = null, fantasyType = 0, readTable) => {
        let sql;
        let joinTable = "bb_leagues";
        if (table.startsWith('k')) joinTable = "kb_leagues";
        else if (table.startsWith('f')) joinTable = "fb_leagues";

        if (userId) {
            sql = ` SELECT
            t1.match_key, t1.league_id, t1.user_id, t1.team_rank, t1.team_rank as rank, t1.old_team_rank,t1.team_number as team_number,
            t2.fantasy_type, t2.league_name, t2.league_type, t2.confirmed_league, t2.max_players, t2.team_type,
            t2.win_amount, t2.joining_amount, t2.total_joined, t2.total_winners, t2.league_code, t2.is_private, t2.user_teams_pdf,t2.is_infinity,t2.win_per_user,t2.total_winners_percent,t2.banner_image,t2.league_winner_type
            from ${table} as t1
        INNER JOIN ${joinTable} as t2
        ON t1.league_id = t2.league_id
        WHERE
            t1.total_points =
            (SELECT MAX(total_points) FROM ${table} WHERE match_key=t1.match_key and league_id = t1.league_id and user_id=t1.user_id)
            and t2.league_status=1
            and t1.user_id = ${userId}
            and t1.match_key=${matchKey}`;
        } else if (league_id) {
            sql = ` SELECT
            t1.match_key, t1.league_id, t1.user_id, t1.team_rank, t1.team_rank as rank, t1.old_team_rank,t1.team_number as team_number,
            t2.fantasy_type, t2.league_name, t2.league_type, t2.confirmed_league, t2.max_players, t2.team_type,
            t2.win_amount, t2.joining_amount, t2.total_joined, t2.total_winners, t2.league_code, t2.is_private, t2.user_teams_pdf,t2.is_infinity,t2.win_per_user,t2.total_winners_percent,t2.banner_image,t2.league_winner_type
            from ${table} as t1
        INNER JOIN ${joinTable} as t2
        ON t1.league_id = t2.league_id
        WHERE
            t1.total_points =
            (SELECT MAX(total_points) FROM ${table} WHERE match_key=t1.match_key and league_id = t1.league_id and user_id=t1.user_id)
            and t2.league_status=1
            and t1.league_id = ${league_id}
            and t1.match_key=${matchKey} `;
        }
        if (fantasyType != 0) {
            sql = sql + ` and t1.fantasy_type = ${fantasyType}`
        }
        let result;
        if (table.startsWith('k') && joinTable.startsWith('k')) {
            result = await db.query(sql);
            return result;
        } else if (table.startsWith('f') && table.startsWith('f')) {
            result = await football_db.query(sql);
            return result;
        } else {
            result = await cricket_db.query(sql);
            return result;
        }

    },
    checkTeamExists: async(userId, matchKey, fantasyType, teamNumber, table = "kb_user_teams") => {
        let query = `SELECT
    team_number
FROM
   ${table}
WHERE
    user_id = ${userId}
        AND match_key = ${matchKey}
        AND fantasy_type = ${fantasyType}
        AND team_number = '${teamNumber}'`;
        let result = db.query(query);
        return result;
    },

    swapTeam: async(matchKey, leagueId, userId, oldTeam, newTeam, userIp = false) => {
        let update = ` `;
        update += ` team_number = '${newTeam}'`;
        if (userIp) update += `, user_ip_swap = '${userIp}'`;

        let query = ` update kb_user_leagues set ${update} where user_id = ${userId} and match_key = ${matchKey} and league_id = ${leagueId} and team_number = '${oldTeam}' `;

        let result = await db.query(query);
        result = result.affectedRows ? true : false;
        // console.log('affected rows>>>', result);
        return result;

    },
    getUnjoinedPrivate: async (matchKey, userId, fantasyType = false) => {
        let T1 = `kb_leagues as t1`;
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
    getLiveScore: async (matchKey) => {
        let sql = `SELECT
    t1.*,
    t2.team_flag AS team_a_flag,
    t3.team_flag AS team_b_flag
FROM
    kb_live_scores AS t1
        LEFT JOIN
    kb_teams AS t2 ON t1.team_a_key = t2.team_key
        LEFT JOIN
    kb_teams AS t3 ON t1.team_b_key = t3.team_key
WHERE
    match_key = ${matchKey}`;

        return await db.query(sql);
    },
    getTeamCountByMatch: async (user_id, match_key, fantasyType = 0) => {
        let sql = `SELECT
                        COUNT(DISTINCT team_number) AS total_teams, fantasy_type
                    FROM
                        kb_user_teams
                    WHERE
                        user_id = ${user_id} AND match_key = ${match_key}
                    GROUP BY fantasy_type`;
        // console.log("=====>>> ", sql);
        return await db.query(sql);
    },
    getMatchPlayers: async (matchKey) => {
        let sql = `SELECT
        t1.player_key,
        t1.player_name,
        t1.player_playing_role,
        t1.player_credits,
        t1.team_key,
        t1.team_short_name,
        t1.is_playing,
        t1.player_credits,
        IF(t2.row_id,
            seasonal_classic_points,
            0) AS seasonal_classic_points
    FROM
        kb_season_players AS t1
            LEFT JOIN
        kb_seasonal_points AS t2 ON t1.season_key = t2.season_key
            AND t1.player_key = t2.player_key
    WHERE
        match_key = ${matchKey}
    ORDER BY team_key DESC;`;
        let players = await db.query(sql);
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
                        kb_user_teams AS t1
                            LEFT JOIN
                        kb_season_players AS t2 ON t1.match_key = t2.match_key
                            AND t1.player_key = t2.player_key
                    WHERE
                        ${where}
                    ORDER BY t1.fantasy_type ASC , t1.team_number ASC`;
        // console.log('sql===>>>> ', sql);

        const teams = await db.query(sql);
        return teams;
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
    getPlayerSeasonInfo: async (matchKey, playerKey) => {
        let query = `SELECT
        t1.season_key,
        t1.player_key,
        t1.player_name,
        t1.team_key,
        t1.team_name,
        t1.team_short_name,
        t1.player_playing_role,
        t1.player_credits,
        IF(t2.row_id,
            seasonal_classic_points,
            0) AS seasonal_classic_points
    FROM
        kb_season_players AS t1
            LEFT JOIN
        kb_seasonal_points AS t2 ON t1.season_key = t2.season_key
            AND t1.player_key = t2.player_key
    WHERE
        t1.match_key = ${matchKey}
            AND t1.player_key = ${playerKey}`;

        return db.query(query);
    },
    getPlayerSelections: async (seasonKey, playerKey, matchKey = false) => {
        let columns = ` t1.classic_selected AS selected_by_classic,
        t1.player_score,
        t2.match_key,
        t2.match_name,
        t2.match_short_name,
        t2.match_related_name,
        t2.start_date_india `;

        let where = ` where t1.season_key = ${seasonKey} and t1.player_key = ${playerKey} `;
        if (matchKey) where += ` ${where} and t1.match_key!=${matchKey} `

        let query = `select ${columns} from kb_player_selections as t1 left join kb_matches as t2
                 on t1.match_key = t2.match_key ${where} order by t2.start_date_india DESC `;

        try {
            return await db.query(query);
        } catch (e) {
            return e
        }
    },
    userLeagueBulkInsert: async (data) => {
        if (!data) {
            return false;
        }
        let bulkData = data;
        data = data[0];

        let columns = Object.keys(data);
        let sql = `insert into kb_user_leagues (${columns}) VALUES ?`;
        console.log("sql query ---->", sql)
        let response = await db.query(sql, [bulkData.map(item => [item.match_key, item.fantasy_type, item.league_id, item.user_id, item.user_name, item.team_number, item.unused_applied, item.cash_applied, item.bonus_applied, item.is_ticket, item.user_ip_join, item.date_added])]);

        return response;

    },
    checkLeagueAvailability: async (leagueId, matchKey, fantasyType, userId, teamFlags = true) => {

        let query = `  SELECT
        t1.league_id AS league_id,
        t1.reference_league AS reference_league,
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
        t1.is_reward AS is_reward,
        t2.match_id AS match_id,
        t2.match_name AS match_name,
        t2.match_short_name AS match_short_name,
        t2.match_related_name AS match_related_name,
        t2.start_date_unix AS start_date_unix,
        IF((start_date_unix - UNIX_TIMESTAMP() - closing_ts) <= 0,
            1,
            0) AS closed,
            GROUP_CONCAT(t5.team_number) as all_teams_joined
    FROM
        kb_leagues AS t1
            LEFT JOIN
        kb_matches AS t2 ON t1.match_key = t2.match_key
            LEFT JOIN
        kb_user_leagues AS t5 ON t1.match_key = t5.match_key
            AND t1.league_id = t5.league_id
            AND t5.user_id = ${userId}
            where t1.league_id = ${leagueId} and t1.match_key = ${matchKey} and  t1.fantasy_type = ${fantasyType} and
                t1.league_status = 1 and  t2.admin_status = 1 and  t2.active = 1
                group by t1.league_id `;

        return db.query(query);
    },
    getLeagueDetails: async (where) => {
        const sql = `select * from kb_leagues ${where}`;
        const league_details = await db.query(sql);
        //  console.log("League_Details is...", league_details);
        if (league_details.length > 0) return league_details;
        return false;
    },
    getUserTeams: async (userId, matchKey, fantasyType, teams) => {
        let query = `SELECT
        t1.team_number AS team_number
        FROM
        kb_user_teams AS t1
        WHERE
        user_id = '${userId}'
        AND match_key = '${matchKey}'
        AND fantasy_type = '${fantasyType}'
        GROUP BY team_number`;
        var result = await db.query(query);
        if (result.length > 0) return result
        return false;
    },

    getMatchTableByKey: async (matchKey, columns = "*") => {
        let sql = `select *, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from kb_matches where match_key = ${matchKey}`
        if (columns) {
            sql = `select ${columns}, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from kb_matches where match_key = ${matchKey}`
        }
        // console.log('wsql=> ', sql);

        const result = await db.query(sql);
        return result;
    },
    getPlayersByMatchKey: async (where, columns = "*", IF = null) => {
        const sql = `SELECT ${columns} from kb_season_players where ${where}`
        // console.log('sql=>   ', sql);

        const players = await db.query(sql);
        return players;
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

    removeUserTeam: async (where) => {
        const sql = `DELETE FROM kb_user_teams where ${where}`;
        const result = await db.query(sql);
        console.log(" remove result ------->>>>> ", result);

        return result;
    },
    getLeaguesDetails: async (matchKey, leagueId) => {
        let sql = `select * from kb_leagues where match_key=? and league_id=?`;
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
        let sql = `select * from kb_leagues where match_key=? and template_id=?`;
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
}