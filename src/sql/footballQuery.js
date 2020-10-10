const football_Db = require('../utils/FootballDbConfig');
const db = require('../utils/CricketDbConfig');
const Bluebird = require('bluebird');

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
        fb_matches AS t1
            LEFT JOIN
        fb_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
            LEFT JOIN
        fb_teams AS t2 ON t1.team_a_key = t2.team_key
            LEFT JOIN
        fb_teams AS t3 ON t1.team_b_key = t3.team_key
    WHERE
        (start_date_unix - UNIX_TIMESTAMP() - closing_ts) > 0
            AND t1.active != 3
    ORDER BY t1.match_order DESC , t1.start_date_unix ASC`;
        let data = await football_Db.query(query);
        return data
    },

    getHomoPromoBanners: async (where) => {
        const sql = `SELECT
        t1.*
    FROM
        bb_promotions AS t1
    WHERE
        (banner_type = 4 OR banner_type = 2)
            AND status = '1'
            AND play_type = '3'
            AND (start_date IS NULL
            OR start_date <= now())
            AND (end_date IS NULL
            OR end_date >= now())
    ORDER BY sorting_order DESC , promotion_id DESC;`;
        return await db.query(sql);
    },

    getMatchByKey: async (columns = "*", matchKey) => {
        // columns = `match_name, match_short_name, match_related_name, start_date_unix, start_date_india, match_format, closing_ts, match_order, team_a_season_key, team_a_key, team_a_name, team_a_short_name, team_b_season_key, team_b_key, team_b_name, team_b_short_name, match_status, status_overview, playing22, show_playing22, show_playing22_type`
        const sql = `select ${columns} from fb_matches where match_key = ${matchKey}`;
        return await football_Db.query(sql);
    },

    getTeamCountByMatch: async (user_id, match_key, fantasyType = 0) => {
        let sql = `SELECT
                        COUNT(DISTINCT team_number) AS total_teams, fantasy_type
                    FROM
                        fb_user_teams
                    WHERE
                        user_id = ${user_id} AND match_key = ${match_key}
                    GROUP BY fantasy_type`;
        // console.log("=====>>> ", sql);
        return await football_Db.query(sql);
    },
    getJoinedLeagues: async (matchKey, user_id) => {
        let sql = `SELECT
                    t1.fantasy_type AS fantasy_type,
                    t1.match_key AS match_key,
                    t1.league_id AS league_id,
                    t1.team_number AS team_number
                FROM
                    fb_user_leagues AS t1
                WHERE
                    match_key = ${matchKey}
                        AND user_id = ${user_id}`;

        try {
            return await db.query(sql);
        } catch (e) {
            return e
        }
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
                    t1.time_based_bonus AS time_based_bonus,
                    t1.is_reward as is_reward
                FROM
                    fb_leagues AS t1
                WHERE
                    t1.match_key = ${matchKey}
                    AND league_status = '1'
                    AND is_full = '0'
                    AND is_private = '0'`;
        if (fantasyType && fantasyType != 0) {
            sql = `${sql} AND fantasy_type = ${fantasyType}`
        }
        // console.log('sql=====>> ', sql);
        const match_leagues = await football_Db.query(sql);
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
        fb_matches AS t1
            LEFT JOIN
        fb_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
            LEFT JOIN
        fb_teams AS t2 ON t1.team_a_key = t2.team_key
            LEFT JOIN
        fb_teams AS t3 ON t1.team_b_key = t3.team_key
    WHERE
        (start_date_unix - UNIX_TIMESTAMP() - closing_ts) > 0
            AND t1.active != 3 AND t1.match_key = ?
    ORDER BY t1.match_order DESC , t1.start_date_unix ASC`;
        let data = await football_Db.query(query, [matchKey]);
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
                    fb_matches AS t1
                        LEFT JOIN
                    fb_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
                        LEFT JOIN
                    fb_teams AS t2 ON t1.team_a_key = t2.team_key
                        LEFT JOIN
                    fb_teams AS t3 ON t1.team_b_key = t3.team_key
                WHERE
                    t1.start_date_india >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                        AND t1.active != 3
                ORDER BY t1.start_date_unix ASC`;
        const userJoinedMatches = await football_Db.query(sql);
        return userJoinedMatches;
    },
    getTotalJoinedLeaguesMatches: async (match_key, user_id, table) => {

        let sql = `select * from ${table} where match_key = ? and user_id = ? `;
        return await football_Db.query(sql, [match_key, user_id]);

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
        fb_season_players AS t1
            LEFT JOIN
        fb_seasonal_points AS t2 ON t1.season_key = t2.season_key
            AND t1.player_key = t2.player_key
    WHERE
        match_key = ?
    ORDER BY team_key DESC;`;
        let players = await football_Db.query(sql, [matchKey]);
        return players;
    },
    getMatchByKey: async (columns = "*", matchKey) => {
        const sql = `select ${columns} from fb_matches as t1
        LEFT JOIN
        fb_teams AS t2 ON t1.team_a_key = t2.team_key
        LEFT JOIN
        fb_teams AS t3 ON t1.team_b_key = t3.team_key where match_key = ?`;
        return await football_Db.query(sql, [matchKey]);
    },

    getLiveScore: async (matchKey) => {
        let sql = `SELECT
    t1.*,
    t2.team_flag AS team_a_flag,
    t3.team_flag AS team_b_flag
FROM
    fb_live_scores AS t1
        LEFT JOIN
    fb_teams AS t2 ON t1.team_a_key = t2.team_key
        LEFT JOIN
    fb_teams AS t3 ON t1.team_b_key = t3.team_key
WHERE
    match_key = ?`;

        return await football_Db.query(sql, [matchKey]);
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
        t2.player_name AS player_full_name,
        t2.team_key AS team_key,
        t2.player_photo AS player_photo,
        t2.is_playing AS is_playing,
        t2.player_playing_role AS seasonal_role,
        t2.player_points AS points,
        t2.player_credits AS credits,
        t1.user_id AS user_id,
        t1.match_key AS match_key
    FROM
        fb_user_teams AS t1
            LEFT JOIN
        fb_season_players AS t2 ON t1.match_key = t2.match_key
            AND t1.player_key = t2.player_key
    WHERE
       ${where}
    ORDER BY t1.fantasy_type ASC , t1.team_number ASC;
                        `;
        // console.log('sql===>>>> ', sql);

        const teams = await football_Db.query(sql);
        return teams;
    },

    getPromoBanner: async (where) => {
        const sql = `select * from bb_promotions ${where} order by promotion_id DESC `
        try {
            console.log('query is >>>', sql)
            const promotionCodes = await db.query(sql);
            return promotionCodes;
        } catch (e) {
            return e
        }
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
        fb_season_players AS t1
            LEFT JOIN
        fb_seasonal_points AS t2 ON t1.season_key = t2.season_key
            AND t1.player_key = t2.player_key
    WHERE
        t1.match_key = ?
            AND t1.player_key = ?`;

        return football_Db.query(query, [matchKey, playerKey]);
    },
    getPlayerSelections: async (seasonKey, playerKey, matchKey = false) => {
        let values;
        let columns = `t1.classic_selected AS selected_by_classic,
        t1.player_score,
        t2.match_key,
        t2.match_name,
        t2.match_short_name,
        t2.match_related_name,
        t2.start_date_india`;

        let where = ` where t1.season_key = ${seasonKey} and t1.player_key = ${playerKey} `;
        values = [seasonKey, playerKey]
        if (matchKey) {
            where += ` ${where} and t1.match_key!=${matchKey} `
            values.push(matchKey)
        }

        let query = `select ${columns} from fb_player_selections as t1 left join fb_matches as t2
                 on t1.match_key = t2.match_key ${where} order by t2.start_date_india DESC `;

        try {
            return await football_Db.query(query);
        } catch (e) {
            return e
        }
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
        t1.time_based_bonus AS time_based_bonus,
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
        fb_leagues AS t1
            LEFT JOIN
        fb_matches AS t2 ON t1.match_key = t2.match_key
            LEFT JOIN
        fb_user_leagues AS t5 ON t1.match_key = t5.match_key
            AND t1.league_id = t5.league_id
            AND t5.user_id = ?
            where t1.league_id = ? and t1.match_key = ? and  t1.fantasy_type = ? and
                t1.league_status = 1 and  t2.admin_status = 1 and  t2.active = 1
                group by t1.league_id `;

                return football_Db.query(query, [userId, leagueId, matchKey, fantasyType]);
    },

    checkTeamExists: async(userId, matchKey, fantasyType, teamNumber, table = "fb_user_teams") => {
        let query = `SELECT
    team_number
FROM
   ${table}
WHERE
    user_id = ${userId}
        AND match_key = ${matchKey}
        AND fantasy_type = ${fantasyType}
        AND team_number = '${teamNumber}'`;
        let result = football_Db.query(query);
        return result;
    },

    swapTeam: async(matchKey, leagueId, userId, oldTeam, newTeam, userIp = false) => {
        let update = ` `;
        update += ` team_number = '${newTeam}'`;
        if (userIp) update += `, user_ip_swap = '${userIp}'`;

        let query = ` update fb_user_leagues set ${update} where user_id = ${userId} and match_key = ${matchKey} and league_id = ${leagueId} and team_number = '${oldTeam}' `;

        let result = await football_Db.query(query);
        result = result.affectedRows ? true : false;
        // console.log('affected rows>>>', result);
        return result;

    },
    getMatchTableByKey: async(matchKey, columns = "*") => {
        let sql = `select *, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from fb_matches where match_key = ${matchKey}`
        if (columns) {
            sql = `select ${columns}, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from fb_matches where match_key = ${matchKey}`
        }
        // console.log('wsql=> ', sql);

        const result = await football_Db.query(sql);
        return result;
    },
    getPlayersByMatchKey: async(where, columns = "*", IF = null) => {
        const sql = `SELECT ${columns} from fb_season_players where ${where}`
            // console.log('sql=>   ', sql);

        const players = await football_Db.query(sql);
        return players;
    },

    getUserTeamDetails: async(columns = `*`, where) => {
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
                        fb_user_teams AS t1
                            LEFT JOIN
                        fb_season_players AS t2 ON t1.match_key = t2.match_key
                            AND t1.player_key = t2.player_key
                    WHERE
                        ${where}
                    ORDER BY t1.fantasy_type ASC , t1.team_number ASC`;
        // console.log('sql===>>>> ', sql);

        const teams = await football_Db.query(sql);
        return teams;
    },
    teamBulkInsert: async(data, table) => {
        if (!data || !table) {
            return false;
        }
        let bulkData = data;
        data = data[0];
        let columns = Object.keys(data);
        let sql = `insert into ${table} (${columns}) VALUES ?`;
        let response = await football_Db.query(sql, [bulkData.map(item => [item.user_id, item.match_key, item.fantasy_type, item.team_number, item.player_key, item.player_type, item.player_role, item.points, item.date_added])]);
        return response;
    },
    removeUserTeam: async(where) => {
        const sql = `DELETE FROM fb_user_teams where ${where}`;
        const result = await football_Db.query(sql);
        console.log(" remove result ------->>>>> ", result);

        return result;
    },
    getMatchKey: async(matchKey, columns = false, teamFlags = false) => {
        let sql, where, On1, On2, On3, T2, T3, T4;
        T1 = `fb_matches as t1`;
        where = `where t1.match_key = ${matchKey}`
        if (!columns) {
            columns = `t1.*, if((t1.start_date_unix-UNIX_TIMESTAMP()-t1.closing_ts)<=0, 1, 0) as closed `;
        } else {
            columns = `t1.*, if((t1.start_date_unix-UNIX_TIMESTAMP()-t1.closing_ts)<=0, 1, 0) as closed`;
        }
        if (teamFlags) {
            T3 = `left join fb_teams as t2`;
            On2 = ` on t1.team_a_key = t2.team_key`;
            T4 = ` left join fb_teams as t3`;
            On3 = ` on t1.team_b_key = t3.team_key`
            columns = `t1.*, if((t1.start_date_unix-UNIX_TIMESTAMP()-t1.closing_ts)<=0, 1, 0) as closed, t2.team_flag as team_a_flag, t3.team_flag as team_b_flag `;
            sql = `select ${columns} from ${T1} ${T3} ${On2} ${T4} ${On3} ${where}`;
        }
        console.log('qqqqqq=>>> ', sql);
        const result = await football_Db.query(sql);
        return result;

    },
    getLeagueByCatagory: async(where, userId) => {
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
                    fb_leagues AS t1
                        LEFT JOIN
                    fb_user_leagues AS t2 ON t1.match_key = t2.match_key
                        AND t1.league_id = t2.league_id
                        AND t2.user_id = ?
                WHERE ${where}
                GROUP BY t1.league_id
                ORDER BY fantasy_type ASC , is_mega DESC , league_order ASC , confirmed_league DESC , max_players DESC , win_amount DESC`
        return await football_Db.query(sql, [userId]);

    },
    getTeamCountByMatch: async(user_id, match_key, fantasyType = 0) => {
        let sql = `SELECT
                        COUNT(DISTINCT team_number) AS total_teams, fantasy_type
                    FROM
                        fb_user_teams
                    WHERE
                        user_id = ? AND match_key = ?
                    GROUP BY fantasy_type`;
        // console.log("=====>>> ", sql);
        return await football_Db.query(sql, [user_id, match_key]);
    },
    getEachActiveMatchesLeagues: async(matchKey, fantasyType = false) => {
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
                    fb_leagues AS t1
                WHERE
                    t1.match_key = ?
                    AND league_status = '1'
                    AND is_full = '0'
                    AND is_private = '0'`;

                    values = [matchKey]
        if (fantasyType && fantasyType != 0) {
            sql = `${sql} AND fantasy_type = ?`
            values.push(fantasyType)
        }
        console.log('sql=====>> ', sql);
        const match_leagues = await football_Db.query(sql, values);
        return match_leagues;
    },

    getJoinedLeagues: async(matchKey, user_id) => {
        let sql = `SELECT
                    t1.fantasy_type AS fantasy_type,
                    t1.match_key AS match_key,
                    t1.league_id AS league_id,
                    t1.team_number AS team_number,
                    t2.team_type AS team_type
                FROM
                    fb_user_leagues AS t1 left join fb_leagues AS t2 on t1.league_id = t2.league_id
                WHERE
                    t1.match_key = ?
                        AND t1.user_id = ?`;

        try {
            return await football_Db.query(sql, [matchKey, user_id]);
        } catch (e) {
            return e
        }
    },
    getUserLeaguesWithTopRank: async(userId = null, matchKey, table = "bb_user_leagues", league_id = null, fantasyType = 0, readTable) => {
        let sql, values;
        if (userId) {
            sql = ` SELECT
            t1.match_key, t1.league_id, t1.user_id, t1.team_rank, t1.team_rank as rank, t1.old_team_rank,t1.team_number as team_number,
            t2.fantasy_type, t2.league_name, t2.league_type, t2.confirmed_league, t2.max_players, t2.team_type,
            t2.win_amount, t2.joining_amount, t2.total_joined, t2.total_winners, t2.league_code, t2.is_private, t2.user_teams_pdf,t2.is_infinity,t2.win_per_user,t2.total_winners_percent,t2.banner_image,t2.league_winner_type
            from ${table} as t1
        INNER JOIN fb_leagues as t2
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
        INNER JOIN fb_leagues as t2
        ON t1.league_id = t2.league_id
        WHERE
            t1.total_points =
            (SELECT MAX(total_points) FROM ${table} WHERE match_key=t1.match_key and league_id = t1.league_id and user_id=t1.user_id)
            and t2.league_status=1
            and t1.league_id = ${league_id}
            and t1.match_key=${matchKey} `;
            values = [league_id, matchKey]
        }
        if (fantasyType != 0) {
            sql = sql + ` and t1.fantasy_type = ${fantasyType}`
            values.push(values)
        }

        //  console.log("sql ------->", sql);
        const result = await football_Db.query(sql, values);
        return result;

    },
    getUnjoinedPrivate: async(matchKey, userId, fantasyType = false) => {
        let T1 = `fb_leagues as t1`;
        let sql, values;
        let where = ``
        where += ` t1.match_key = ? and t1.created_by = ? and t1.total_joined = 0 `;
        values = [matchKey, userId]
        if (fantasyType) {
            where += ` and fantasy_type = ${fantasyType} `;
            values.push(fantasyType)
        }
        sql = `select *,0 as team_rank,0 as rank, 0 as old_team_rank from ${T1} where ${where}`
        try {
            const result = await football_Db.query(sql, values);
            return result
        } catch (e) {
            return e
        }
    },

    getLeagueDetails: async(where) => {
        const sql = `select * from fb_leagues ${where}`;
        const league_details = await football_Db.query(sql);
        //  console.log("League_Details is...", league_details);
        if (league_details.length > 0) return league_details;
        return false;
    },
    updateLeague: async(set, where, table) => {
        let query = `UPDATE ${table} SET ${set} where ${where}`
        console.log('qqqqq', query);

        const result = await football_Db.query(query);
        return result;
    },
    userLeagueBulkInsert:   async(data) => {
        if (!data) {
            return false;
        }
        let bulkData = data;
        data = data[0];

        let columns = Object.keys(data);
        let sql = `insert into fb_user_leagues (${columns}) VALUES ?`;
        console.log("sql query ---->", sql)
        let response = await football_Db.query(sql, [bulkData.map(item => [item.match_key, item.fantasy_type, item.league_id, item.user_id, item.user_name, item.team_number, item.unused_applied, item.cash_applied, item.bonus_applied, item.is_ticket, item.user_ip_join, item.date_added])]);

        return response;

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
    getUserTeams: async (userId, matchKey, fantasyType, teams) => {
        let query = `SELECT
        t1.team_number AS team_number
        FROM
        fb_user_teams AS t1
        WHERE
        user_id = '${userId}'
        AND match_key = '${matchKey}'
        AND fantasy_type = '${fantasyType}'
        GROUP BY team_number`;
        var result = await football_Db.query(query);
        if (result.length > 0) return result
        return false;
    },
    getLeaguesDetails: async(matchKey, leagueId) => {
        let sql = `select * from fb_leagues where match_key=? and league_id=?`;
        let result = await football_Db.query(sql, [matchKey, leagueId]);
        // if(result.length < 0){
        //     sql = `select * from bb_leagues where match_key=? and template_id=?`;
        //     result = await db.query(sql, [matchKey, leagueId]);
        //     console.log("result is.....", result)
        //     return result;
        // }
        return result;

    },
    getLeaguesByTemplate: async(matchKey, leagueId) => {
        let sql = `select * from fb_leagues where match_key=? and template_id=?`;
        let result = await football_Db.query(sql, [matchKey, leagueId]);
        console.log("Results ......", result);
        return result = result.length > 0 ? result : false
    },
    getLeagueData: async(where, columns = '*') => {
        let sql = `select ${columns} from fb_leagues_data where ${where}`
        return await football_Db.query(sql);
    },
    leagueDatabulkInsert: async(data, table) => {
        if (!data || !table || !data.length) {
            return false;
        }
        let bulkData = data;
        data = data[0];
        if (data) return false;
        let columns = Object.keys(data);
        let sql = `insert into ${table} (${columns}) VALUES ?`;
        let response = await football_Db.query(sql, [bulkData.map(item => [item.league_id, item.win_from, item.win_to, item.win_amount, item.bbcoins])]);
        return response;
    },
    get_bb_matches: async(where) => {
        const if_stat = `if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed`;

        const sql = `SELECT *, ${if_stat} FROM fb_matches where ${where}`;
        const matches = await football_Db.query(sql);
        return matches;
    },
    removeLeagueIfError: async(league_id) => {
        const sql = `DELETE FROM fb_leagues where league_id = ${league_id}`;
        const result = await football_Db.query(sql);
        if (result) {
            return result
        }
        return false;
    },
    removeDataLeaguesDatatable: async(league_id) => {
        const sql = `DELETE FROM fb_leagues_data where league_id = ${league_id}`;
        const result = await football_Db.query(sql);
        return result;
    },
    updateLeagueStatus: async(leagues_id, status) => {
        const sql = `UPDATE fb_leagues SET league_status = ${status} where league_id = ${leagues_id}`;
        const result = await db.query(sql);
        return result;
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
            let response = await football_Db.query(sql);

            return response;
        }).catch(e => {
            console.log('erro in inserting-->> ', e);

        })
    },
}