let Models = require('../models');
let moment = require('moment');
let currentDateUtc = moment().subtract(330, 'minutes').format('YYYY-MM-DD HH:mm:ss');

module.exports = {
    getActiveUpcomminMatches: async () => {
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
            AND t1.active != 3
    ORDER BY t1.match_order DESC , t1.start_date_unix ASC`;
        let data = await Models.rawQuery(query);
        return data = data.results.length > 0 ? data.results : []
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
                    bb_matches AS t1
                        LEFT JOIN
                    bb_live_scores AS t1_1 ON t1.match_key = t1_1.match_key
                        LEFT JOIN
                    bb_teams AS t2 ON t1.team_a_key = t2.team_key
                        LEFT JOIN
                    bb_teams AS t3 ON t1.team_b_key = t3.team_key
                WHERE
                    t1.start_date_india >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                        AND t1.active != 3
                ORDER BY t1.start_date_unix ASC `;
        let userJoinedMatches = await Models.rawQuery(sql);

        userJoinedMatches = userJoinedMatches.results.length > 0 ? userJoinedMatches.results : [];
        return userJoinedMatches;
    },
    getTotalJoinedLeaguesMatches: async (match_key, user_id, table) => {

        let sql = `select * from ${table} where match_key = ${match_key} and user_id = ${user_id}`;

        let results = await Models.rawQuery(sql);
        return results = results.results.length > 0 ? results.results : []

    },
    getMatchByKey: async (matchKey) => {
        const sql = `select match_short_name,
        start_date_unix, start_date_india, match_format, closing_ts, match_order, team_a_season_key, team_a_key, team_a_name,t1.team_a_short_name, team_b_season_key, team_b_key, team_b_name, team_b_short_name,match_status, status_overview, show_playing22, playing22, pdf_status, show_last_11, show_prob_11, categorisation, gender_match_category, t2.team_flag AS team_a_flag, t3.team_flag AS team_b_flag from bb_matches as t1
        LEFT JOIN
        bb_teams AS t2 ON t1.team_a_key = t2.team_key
        LEFT JOIN
        bb_teams AS t3 ON t1.team_b_key = t3.team_key where match_key = ${matchKey}`;
        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : [];
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
                            0) AS seasonal_classic_points,
                        IF(t2.row_id,
                            seasonal_batting_points,
                            0) AS seasonal_batting_points,
                        IF(t2.row_id,
                            seasonal_bowling_points,
                            0) AS seasonal_bowling_points
                    FROM
                        bb_season_players AS t1
                            LEFT JOIN
                        bb_seasonal_points AS t2 ON t1.season_key = t2.season_key
                            AND t1.player_key = t2.player_key
                    WHERE
                        match_key = ${matchKey}
                        AND player_status = '1'
                    ORDER BY season_team_key DESC`;
        let players = await Models.rawQuery(sql);
        return players = players.results.length > 0 ? players.results : [];
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
    match_key = ${matchKey}`;

        let result = await Models.rawQuery(sql);
        result = result.results.length > 0 ? result.results : null;
        return result;
    },
    getUserTeamDetails: async (where) => {
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
                        t2.team_key AS team_key,
                        t2.player_photo AS player_photo,
                        t2.is_playing AS is_playing,
                        t2.player_playing_role AS seasonal_role,
                        t2.player_points AS points,
                        t2.player_credits AS credits,
                        t1.user_id AS user_id,
                        t1.match_key AS match_key
                    FROM
                        bb_user_teams AS t1
                            LEFT JOIN
                        bb_season_players AS t2 ON t1.match_key = t2.match_key
                            AND t1.player_key = t2.player_key
                    WHERE
                        ${where}
                    ORDER BY t1.fantasy_type ASC , t1.team_number ASC`;
        // console.log('sql===>>>> ', sql);

        let teams = await Models.rawQuery(sql);
        return teams = teams.results.length > 0 ? teams.results : [];
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
    match_key = ${matchKey}`;

        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : null;
    },

    checkLeagueAvailability: async (userId, leagueId, matchKey, fantasyType, leagueStatus, adminStatus, active) => {
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
                            AND t5.user_id = ${userId}
                    WHERE
                        t1.league_id = '${leagueId}'
                        AND t1.match_key = '${matchKey}'
                        AND t1.fantasy_type = '${fantasyType}'
                        AND t1.league_status = '${leagueStatus}'
                        AND t2.admin_status = '${adminStatus}'
                        AND t2.active = '${active}'
                    GROUP BY t1.league_id `;


        let result = await Models.rawQuery(query);
        //  console.log("aaaaaaaaaaaaa==>>>> ", result);
        return result = result.results.length > 0 ? result.results : [];
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
                    t1.match_key = '${matchKey}'
                        AND t1.user_id = '${user_id}'`;

        try {
            let result = await Models.rawQuery(sql);
            return result = result.results.length > 0 ? result.results : []
        } catch (e) {
            return e
        }
    },
    getUserLeaguesWithTopRank: async (userId = null, matchKey, table = "bb_user_leagues", league_id = null, fantasyType = 0) => {
        let sql
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
            and t1.user_id = ${userId}
            and t1.match_key=${matchKey}`;
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
            and t1.league_id = ${league_id}
            and t1.match_key=${matchKey} `;
        }
        if (fantasyType != 0) {
            sql = sql + ` and t1.fantasy_type = ${fantasyType}`
        }

        //  console.log("sql ------->", sql);
        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : []

    },
    getUnjoinedPrivate: async (matchKey, userId, fantasyType = false) => {
        let T1 = `bb_leagues as t1`;
        let sql;
        let where = ``
        where += ` t1.match_key = ${matchKey} and t1.created_by = ${userId} and t1.total_joined = 0 `;
        if (fantasyType) where += ` and fantasy_type = ${fantasyType} `;
        sql = `select *,0 as team_rank,0 as rank, 0 as old_team_rank from ${T1} where ${where}`
        try {
            let result = await Models.rawQuery(sql);
            return result = result.results.length > 0 ? result.results : []
        } catch (e) {
            return e
        }
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
            match_key = '${matchKey}'
            AND t1.league_id = '${leagueId}' `;
        try {
            let result = await Models.rawQuery(sql);
            return result = result.results.length > 0 ? result.results : []
        } catch (e) {
            return e
        }
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
                    bb_leagues AS t1
                        LEFT JOIN
                    bb_user_leagues AS t2 ON t1.match_key = t2.match_key
                        AND t1.league_id = t2.league_id
                        AND t2.user_id = ${userId}
                WHERE ${where}
                GROUP BY t1.league_id
                ORDER BY fantasy_type ASC , is_mega DESC , league_order ASC , confirmed_league DESC , max_players DESC , win_amount DESC`
        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : []
    },
    getMatchKey: async (matchKey, columns = false, teamFlags = false) => {
        let sql, where, On1, On2, On3, T2, T3, T4;
        T1 = `bb_matches as t1`;
        where = `where t1.match_key = ${matchKey}`
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
        console.log('qqqqqq=>>> ', sql);
        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : []

    },
    getMatchTableByKey: async (matchKey, columns = "*") => {
        let sql = `select *, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from bb_matches where match_key = ${matchKey}`
        if (columns) {
            sql = `select ${columns}, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed from bb_matches where match_key = ${matchKey}`
        }
        // console.log('wsql=> ', sql);

        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : []
    },
    getPlayersByMatchKey: async (where, columns = "*", IF = null) => {
        const sql = `SELECT ${columns} from bb_season_players where ${where}`
        // console.log('sql=>   ', sql);

        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : []
    },
    teamBulkInsert: async(data, table) => {
        if (!data || !table) {
            return false;
        }
        let bulkData = data;
        data = data[0];
        let columns = Object.keys(data);
        let sql = `insert into ${table} (${columns}) VALUES ?`;
        let result = await Models.rawQuery1(sql, [bulkData.map(item => [item.user_id, item.match_key, item.fantasy_type, item.team_number, item.player_key, item.player_type, item.player_role, item.points, item.date_added])]);
        return result = result ? result : [ ]
    },

    removeLeagueIfError: async(league_id) => {
        const sql = `DELETE FROM bb_leagues where league_id = ${league_id}`;
        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : null
    },
    removeDataLeaguesDatatable: async(league_id) => {
        const sql = `DELETE FROM bb_leagues_data where league_id = ${league_id}`;
        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : null

    },
    updateLeagueStatus: async(leagues_id, status) => {
        const sql = `UPDATE bb_leagues SET league_status = ${status} where league_id = ${leagues_id}`;
        let result = await Models.rawQuery(sql);
        return result = result.results.length > 0 ? result.results : null
    },

}