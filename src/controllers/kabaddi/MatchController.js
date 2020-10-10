const db = require('../../utils/CricketDbConfig');
const responseConfigObj = require('../../utils/configResponse');
const SQL_QUERY_MATCH = require('../../sql/cricketQuery');
const SQL_QUERY_USER = require('../../sql/userQuery');
const SQL = require('../../sql');
const complexSortArr = require('../../utils/CustomArraySort');
const checkObjProperties = require('../../utils/checkObjEqualProperty');
const Utils = require('../../utils');
const Controllers = require('../../utils/validateController');
// const bcrypt = require('bcrypt');
const Bluebird = require('bluebird')
let Validator = require('validator');
const Config = require('../../config');
//date
const dateAdded = require('../../utils/mySql_dateTime');
const Mysql_dt = require('../../utils/mySql_dateTime');
let LeaguesController = require('./LeagueController');
let moment = require('moment')
/**
 * Function will return all upcomming matches list
 * with following data
 * @Homebanners
 * @First Time banners
 * @Announcements
 * @Lineupout key for footballl cricket and kabaddi
 */


exports.getActiveMatches = async (req, res, next) => {
    try {
        // const status_code = req.params.status_code;
        let { user_id } = req.user;
        let activeMatches = await Utils.Redis.getAsync(Utils.Keys.KABADDI_ACTIVE_MATCHES);
        if (!activeMatches) {
            console.log('Cricket match list from Database');
            activeMatches = await SQL.Kabaddi.getActiveUpcomminMatches();
            Utils.Redis.set(Utils.Keys.KABADDI_ACTIVE_MATCHES, JSON.stringify(activeMatches), 'EX', Utils.RedisExpire.KABADDI_ACTIVE_MATCHES)
        } else {
            activeMatches = JSON.parse(activeMatches);
        }
        let promotionBanners = await Utils.Redis.getAsync(Utils.Keys.KABADDI_PROMOBANNERS)
        if (!promotionBanners) {
            console.log('Promotion banner list from Database');
            const promoWhere = `where play_type = ${1}`;
            promotionBanners = await SQL.Kabaddi.getHomoPromoBanners(promoWhere);
            Utils.Redis.set(Utils.Keys.KABADDI_PROMOBANNERS, JSON.stringify(promotionBanners), 'EX', Utils.RedisExpire.KABADDI_PROMOBANNERS)
        } else {
            promotionBanners = JSON.parse(promotionBanners)
        }
        let announcements = await Utils.Redis.getAsync(Utils.Keys.KABADDI_ANNOUNCEMENTS)
        if (!announcements) {
            console.log('Announcements list from Database');
            // const anouncementsWhere = `where play_type = ${1} and screen_type = 1`
            announcements = await SQL.Users.getAnnouncements(1, 1)
            Utils.Redis.set(Utils.Keys.KABADDI_ANNOUNCEMENTS, JSON.stringify(announcements), 'EX', Utils.RedisExpire.KABADDI_ANNOUNCEMENTS);
        } else {
            announcements = JSON.parse(announcements);
        }
        announcements = announcements.length ? announcements[0] : null;
        /**
         * User Specific data
         * @Active tickets of a user
         */
        let homeBanners = promotionBanners.filter(e => e.banner_type == 2)
        let firstTimeBanner = promotionBanners.filter(e => e.banner_type == 4)
        let totalRake = await SQL.Users.getUserTotalRake(user_id);
        firstTimeBanner = (totalRake.total_rakes > 0) ? firstTimeBanner : [];
        const userTickets = await SQL.Users.getUserActiveTickets(user_id);
        const response = {
            matches: activeMatches,
            banners: {
                home: homeBanners,
                first_time: firstTimeBanner
            },
            announcements: announcements,
            tickets: userTickets,
            lineups: {
                kb: 0,
                cc: 0,
                fb: 0
            },
            notifications: req.user.notifications
        };
        //release connection after
        const released = await db.on('release', (connection) => {
            // console.log(connection.threadId);
        });
        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response)
    } catch (error) {
        console.error('error==> ', error);

        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "SOME_ERROR", __("SOME_ERROR"), res)
    }
}

exports.getMatchLeagues = async (req, res, next) => {
    const { match_key } = req.params;
    const { user_id } = req.user;

    let fantasyType = req.params.fantasyType ? req.params.fantasyType : 0;
    console.log('fantsay type=====>>>>>>......... ', fantasyType);
    console.log('match_key =====>>>>>>......... ', match_key);

    if (!match_key) {
        return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('error'), __('Wrong_data_recived'), res);
    }

    //Match details
    let matchDetails = await Utils.Redis.getAsync(Utils.Keys.KABADDI_MATCH_DETAILS + "_" + match_key);
    if (!matchDetails) {
        console.log("MatchDetails From DB");
        let matchColumns = `match_key, match_format, match_short_name, read_index, admin_status, start_date_unix, team_a_short_name, team_b_short_name, match_status, season_key, season_short_name, closing_ts, team_a_key, team_b_key, active, categorisation,active,show_playing22`
        matchDetails = await SQL.Kabaddi.getMatchByKey(matchColumns, match_key)
        matchDetails = matchDetails[0];
        await Utils.Redis.set(Utils.Keys.FOOTBALL_MATCH_DETAILS + "_" + match_key, JSON.stringify(matchDetails), 'EX', Utils.RedisExpire.FOOTBALL_MATCH_DETAILS);
    } else {
        matchDetails = JSON.parse(matchDetails);
    }

    //Match Leagues
    let matchLeagues = await Utils.Redis.getAsync(Utils.Keys.FOOTBALL_LEAGUES + '_' + fantasyType + "_" + match_key);
    if (!matchLeagues) {
        console.log("Matchleagues From DB");
        matchLeagues = await SQL.Kabaddi.getEachActiveMatchesLeagues(match_key, fantasyType);
        await Utils.Redis.set(Utils.Keys.KABADDI_LEAGUES + '_' + fantasyType + "_" + match_key, JSON.stringify(matchLeagues), 'EX', Utils.RedisExpire.KABADDI_LEAGUES);
    } else {
        matchLeagues = JSON.parse(matchLeagues);
    }

    //announcement
    let announcements = await Utils.Redis.getAsync(Utils.Keys.KABADDI_ANNOUNCEMENTS)
    if (!announcements) {
        console.log('Announcements list from Database');
        const anouncementsWhere = `where play_type = ${3} and screen_type = 1`
        announcements = await SQL.Users.getAnnouncements(1, 3)
        Utils.Redis.set(Utils.Keys.KABADDI_ANNOUNCEMENTS, JSON.stringify(announcements), 'EX', Utils.RedisExpire.KABADDI_ANNOUNCEMENTS);
    } else {
        announcements = JSON.parse(announcements);
    }

    //team_count
    let teamCount = await Utils.Redis.getAsync(Utils.Keys.TEAM_COUNT + user_id + fantasyType);
    if (!teamCount) {
        teamCount = await SQL.Football.getTeamCountByMatch(user_id, match_key, fantasyType);
        await Utils.Redis.set(Utils.Keys.TEAM_COUNT + user_id + fantasyType, JSON.stringify(teamCount), 'EX', Utils.RedisExpire.TEAM_COUNT)

    } else {
        teamCount = JSON.parse(teamCount);
    }

    //joinedLeagues
    let joinedLeagues = await Utils.Redis.getAsync(Utils.Keys.JOINED_LEAGUES + user_id + match_key);
    if (!joinedLeagues) {
        joinedLeagues = await SQL.Football.getJoinedLeagues(match_key, user_id);
        await Utils.Redis.set(Utils.Keys.JOINED_LEAGUES + user_id + match_key, JSON.stringify(joinedLeagues), 'EX', Utils.RedisExpire.JOINED_LEAGUES)
    } else {
        joinedLeagues = JSON.parse(joinedLeagues)
    }

    joinedLeagues = joinedLeagues.length ? joinedLeagues : [];

    let leagueCount = 0;
    Bluebird.each(matchLeagues, (thisleague, index, length) => {
        let team_number = []
        let countFlag = true;
        joinedLeagues = joinedLeagues.map(async thisJoinedLeague => {
            if (thisleague.league_id == thisJoinedLeague.league_id) {
                let isIncludes = team_number.includes(thisJoinedLeague.team_number)
                if (!isIncludes) {
                    team_number.push(thisJoinedLeague.team_number)
                }
                thisleague.user_teams = team_number;
                if (countFlag) {
                    leagueCount++
                    countFlag = false;
                }
            } else {
                leagueCount;
            }
        })

    }).then(async _ => {
        let categorisation = matchDetails.categorisation ? JSON.parse(matchDetails.categorisation) : null
        if (fantasyType && fantasyType != 0) {
            categorisation = matchDetails.categorisation ? JSON.parse(matchDetails.categorisation)[fantasyType] : null
        }
        matchDetails.categorisation = categorisation;
        const userTickets = await SQL.Users.getUserActiveTickets(user_id);
        const active_tickets = await userTickets.filter(thisTicket => thisTicket.ticket_status == 1);
        const ticket_used = await userTickets.filter(thisTicket => thisTicket.ticket_status == 2);
        let classicTeams = teamCount.find(e => e.fantasy_type == 1);
        let battingTeams = teamCount.find(e => e.fantasy_type == 2);
        let bowlingTeams = teamCount.find(e => e.fantasy_type == 3);

        let classicJoinedLeague = joinedLeagues.filter(e => e.fantasy_type == 1).map(v => v.league_id).filter(function (elem, index, self) {
            return index == self.indexOf(elem);
        });
        let battingJoinedLeague = joinedLeagues.filter(e => e.fantasy_type == 2).map(v => v.league_id).filter(function (elem, index, self) {
            return index == self.indexOf(elem);
        });
        let bowlingJoinedLeague = joinedLeagues.filter(e => e.fantasy_type == 3).map(v => v.league_id).filter(function (elem, index, self) {
            return index == self.indexOf(elem);
        });
        const response = {
            announcements: announcements.length ? announcements[0] : null,
            active_tickets: active_tickets,
            ticket_used: ticket_used,
            leagues: matchLeagues,
            match: matchDetails,
            classic_teams: classicTeams ? classicTeams.total_teams : null,
            batting_teams: battingTeams ? battingTeams.total_teams : null,
            bowling_teams: bowlingTeams ? bowlingTeams.total_teams : null,
            classic_leagues: classicJoinedLeague.length ? classicJoinedLeague.length : null,
            batting_leagues: battingJoinedLeague.length ? battingJoinedLeague.length : null,
            bowling_leagues: bowlingJoinedLeague.length ? bowlingJoinedLeague.length : null
        }
        //   console.log("released connection......", released);
        return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('Success'), res, response)
    }).catch(e => {
        console.log('error => ', e);
        return e

    })

}

exports.getMatchDetail = async (req, res, next) => {
    let matchKey = req.query.match_key;
    let match = await SQL.Kabaddi.getMatchDetailsByMatchKey(matchKey);
    console.log("match details>", match);
    if (match.length <= 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __('MATCH_NOT_EXIST'), res);

    match = match[0]
    if (match.closed == 1) return await Utils.ResponseHandler(false, Utils.StatusCodes.Match_closed, "match_closed", __('MATCH_CLOSED'), res);

    let response = {
        match_details: {
            closing_ts: match.closing_ts,
            match_key: match.match_key,
            start_date_unix: match.start_date_unix,
            closed: match.closed
        }
    }

    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('SUCCESS'), res, response);

}

//....................GET USER JOINED LEAGUES PER MATCH.........................................///////////
exports.getUserJoinedLeaguesPermatch = async (req, res, next) => {
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'UNAUTHORIZE_ACCESS', __('UNAUTHORIZE_ACCESS'), res);
    let user_id = user.user_id;
    let { match_key, fantasy_type } = req.query;
    let fantasyType = fantasy_type ? fantasy_type : 0;

    console.log("match_key>>>", match_key)
    if (!user_id || !match_key) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRONG_DATA'), res);
    let columns = `  match_name,  match_short_name , read_index, match_related_name,start_date_unix,start_date_india, match_format, closing_ts, match_order, team_a_key,
    team_a_name, team_a_short_name, team_b_key, team_b_name, team_b_short_name,match_status, status_overview, show_playing22, show_playing22_type `;

    let match = await SQL.Kabaddi.getMatchByKey(columns, match_key);
    console.log("Match Is >>>", match)
    if (match && !match.length) {
        // console.log('Match details ==>> ',match);
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __('WRONG_DATA'), res);
    }

    match = match[0];

    console.log("match>>>", match)

    let readIndex = match.read_index;
    let teamTable = "kb_user_teams";
    let leagueTable = "kb_user_leagues";
    let readIndexArr = [];
    if (readIndex == 1) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_1";
        readIndexArr.push(readIndex)
    } else if (readIndex == 2) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_2";
        readIndexArr.push(readIndex)

    } else if (readIndex == 9) {
        teamTable = "bb_user_teams_dump";
        leagueTable = "bb_user_leagues_dump";
        readIndexArr.push(readIndex)

    }
    console.log(">>", leagueTable, readIndex);
    let leagues = await Utils.Redis.getAsync(Utils.Keys.CRIC_JOINED_LEAGUES + "_" + user_id + "_" + match_key + "_" + fantasy_type);
    console.log('league==>> ', fantasyType);
    if (!leagues || leagues.length == 0) {
        console.log("Leagues From DB.....")
        leagues = await SQL.Kabaddi.getUserLeaguesWithTopRank(user_id, match_key, leagueTable, null, fantasyType);
        await Utils.Redis.set(Utils.Keys.CRIC_JOINED_LEAGUES + "_" + user_id + "_" + match_key + "_" + fantasy_type, JSON.stringify(leagues), 'EX', Utils.RedisExpire.CRIC_JOINED_LEAGUES);
    } else {
        leagues = JSON.parse(leagues)
    }
    /**
     * Get the unjoined private leagues
     */
    let unjoinedPrivateLeagues = await SQL.Kabaddi.getUnjoinedPrivate(match_key, user_id);
    leagues = [...leagues, ...unjoinedPrivateLeagues]
    let announcements = await Utils.Redis.getAsync(Utils.Keys.CRICKET_ANNOUNCEMENTS)
    if (!announcements) {
        console.log('Announcements list from Database');
        const anouncementsWhere = `where play_type = ${1} and screen_type = 3`
        announcements = await SQL.Users.getAnnouncements(3, 1)
        Utils.Redis.set(Utils.Keys.CRICKET_ANNOUNCEMENTS, JSON.stringify(announcements), 'EX', Utils.RedisExpire.CRICKET_ANNOUNCEMENTS);
    } else {
        announcements = JSON.parse(announcements);
    }
    announcements = announcements.length ? announcements[0] : null;

    let liveScore = await Utils.Redis.getAsync(Utils.Keys.LIVE_SCORE + "_" + user_id);
    if (!liveScore) {
        liveScore = await SQL.Kabaddi.getLiveScore(match_key);
        await Utils.Redis.set(Utils.Keys.LIVE_SCORE + "_" + user_id, JSON.stringify(liveScore), 'EX', Utils.RedisExpire.LIVE_SCORE);
    } else {
        liveScore = JSON.parse(liveScore);
    }

    //user team count
    let teamCount = await Utils.Redis.getAsync(Utils.Keys.TEAM_COUNT + "_" + user_id);
    if (!teamCount) {
        console.log("Team count from Db");
        teamCount = await SQL.Kabaddi.getTeamCountByMatch(user_id, match_key)
        await Utils.Redis.set(Utils.Keys.TEAM_COUNT + "_" + user_id, JSON.stringify(teamCount), 'EX', Utils.RedisExpire.TEAM_COUNT);
    } else {
        teamCount = JSON.parse(teamCount);
    }
    let uniqueJoinedLeagues = []
    Bluebird.each(leagues, (thisLeague, index, length) => {
        let existingLeague = uniqueJoinedLeagues.find(e => {
            if (e.league_id == thisLeague.league_id) {
                // console.log('===>>>>>', e);
                e.user_team.push(thisLeague.team_number)
                return e;
            }
        });
        if (!existingLeague) {
            let userTeam = [];
            if (thisLeague.team_number)
                userTeam.push(thisLeague.team_number)
            thisLeague.user_team = userTeam;
            uniqueJoinedLeagues.push(thisLeague);
            // console.log('---->>> ', uniqueJoinedLeagues);
        }
    }).then(async (result) => {
        let classicTeams = teamCount.find(e => e.fantasy_type == 1);
        let battingTeams = teamCount.find(e => e.fantasy_type == 2);
        let bowlingTeams = teamCount.find(e => e.fantasy_type == 3);
        if (liveScore) {
            liveScore = liveScore.length > 0 ? liveScore[0] : null
        }
        let response = {
            announcements: announcements,
            live_score: liveScore,
            leageus: uniqueJoinedLeagues,
            classic_teams: classicTeams ? classicTeams.total_teams : null,
            batting_teams: battingTeams ? battingTeams.total_teams : null,
            bowling_teams: bowlingTeams ? bowlingTeams.total_teams : null,
            match: match
        }
        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('LEAGUES_FOUND_SUCCESS'), res, response);
    }).catch(async (err) => {
        // return err;
        console.log('error==>> ')
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Some Error', __('SOME_ERROR'), res);
    });
}

exports.getMatchPlayersList = async (req, res, next) => {
    const { match_key } = req.query;

    if (!match_key) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('REQUIRED_FIELDS'), res);
    let match = await SQL.Kabaddi.getMatchByKey(` match_key, match_format, match_short_name, read_index, admin_status, start_date_unix, team_a_short_name, team_b_short_name, match_status, season_key, season_short_name, show_playing22, closing_ts, active, team_a_key, team_b_key `, match_key);
    let players = await Utils.Redis.getAsync(Utils.Keys.KABADDI_PLAYERS);
    if (!players) {
        console.log("Players found From DB");
        // let wherePlayers = `where match_key = ${match_key} and is_playing = 0 order by player_playing_role`;
        players = await SQL.Kabaddi.getMatchPlayers(match_key);
        await Utils.Redis.set(Utils.Keys.KABADDI_PLAYERS, JSON.stringify(players), 'EX', Utils.RedisExpire.KABADDI_PLAYERS);
    } else {
        players = JSON.parse(players)
    }
    match = match[0] ? match[0] : null;
    const response = {
        players: players.length ? players : [],
        match: match
    }
    // const released = await db.on('release', (connection) => {
    //     console.log(connection.threadId);
    // });
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('Success'), res, response)
}

exports.userTeams = async (req, res, next) => {
    let { match_key, fantasy_type } = req.body;
    let Score = req.body.livescore;
    let liveScore = null;
    if (Score) {
        liveScore = await SQL.Kabaddi.getLiveScore(match_key);
    }
    fantasy_type = fantasy_type ? req.body.fantasy_type : 0;
    if (liveScore) liveScore = liveScore.length > 0 ? liveScore[0] : null
    let user = req.user
    if (!user || !match_key) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
    let teams = await LeaguesController.fetchUserTeams(user.user_id, match_key, fantasy_type)
    let response = { team: teams, live_score: liveScore };
    return await Utils.ResponseHandler(true, 200, "success", __('success'), res, response);
}

exports.matchScoreboard = async (options) => {
    return new Promise(async (resolve, rejected) => {
        let matchKey = options.match_key;
        let userId = options.user_id;

        if (!matchKey || userId) return  rejected({ Msg: __('WRONG_DATA'), title: "wrong_data" });
        let scoreData = await SQL.Kabaddi.getLiveScore(matchKey);
        // console.log("scoreData", scoreData);
        scoreData = scoreData[0];

        if (scoreData) scoreData.response = JSON.parse(scoreData.response);
        return await resolve({ Msg: __('Success'), title: "score", response: scoreData });
    })

}

exports.playerInfo = async (options) => {
    return new Promise(async (resolve, rejected) => {
        let { matchKey, playerKey, userId } = options;


        if (!matchKey || !playerKey) return await rejected({ Msg: __('WRONG_DATA'), title: 'Error', status: Utils.StatusCodes.Error })

        // get player info by match
        let playerInfo = await SQL.Kabaddi.getPlayerSeasonInfo(matchKey, playerKey);
        playerInfo = playerInfo[0];
        console.log("playerInfo is >>>", playerInfo);


        if (!playerInfo) return rejected({ Msg: __('PLAYER_NOT_FOUND'), title: 'not_found', status: Utils.StatusCodes.Error });

        let seasonKey = playerInfo.season_key;
        let matchInfo = await SQL.Kabaddi.getPlayerSelections(seasonKey, playerKey);
        let response;
        console.log("matchInfo is >>>", matchInfo);

        if (matchInfo.length > 0) {
            for (let k of matchInfo) {
                k.selected_by_classic = k.selected_by_classic.toString().length > 0 ? k.selected_by_classic + "%" : "0%";
                // k.selected_by_batting = k.selected_by_batting.toString().length > 0 ? k.selected_by_batting + "%" : "0%";
                // k.selected_by_bowling = k.selected_by_bowling.toString().length > 0 ? k.selected_by_bowling + "%" : "0%";
            }
            console.log("matchInfo is >>>", matchInfo);
            matchInfo = matchInfo.length == 1 ? matchInfo[0] : matchInfo
            response = { player_info: playerInfo, match_info: matchInfo };
            return await resolve({ Msg: __("SUCCESS"), title: 'Success', status: Utils.StatusCodes.Success, response: response });
        }
        response = { player_info: playerInfo, match_info: matchInfo.length > 0 ? matchInfo : null };
        console.log("response >>>", response)
        return await resolve({ Msg: __("SUCCESS"), title: 'Success', status: Utils.StatusCodes.Success, response: response });

    })
}

exports.swapTeam = async (options) => {

    return new Promise(async (resolve, rejected) => {
        let userId = options.user_id;
        // user info
        if (!userId) return await rejected({ Msg: __('USER_NOT_FOUND'), title: 'error', status: Utils.StatusCodes.Error });
        let matchKey = options.match_key;
        let leagueId = options.league_id;
        let oldTeam = options.old_team;
        let newTeam = options.new_team;
        let fantasyType = options.fantasy_type;
        let userIp = options.user_ip;
        const fantasyTypes = Utils.Constants.fantasyTypes;
        fantasyType = fantasyType ? parseInt(fantasyType) : null;
        let isIncludes = fantasyTypes.includes(fantasyType)

        console.log("isIncludes is >>>", isIncludes)
        console.log("Oldd team >>>", oldTeam)
        if (!matchKey || !leagueId || !oldTeam || !newTeam || !isIncludes) {
            return await rejected({ Msg: __('WRONG_DATA'), title: 'error', status: Utils.StatusCodes.Error });
        }
        if (isNaN(oldTeam) || isNaN(newTeam)) return await rejected({ Msg: __('WRONG_DATA'), title: 'wrong_teams', status: Utils.StatusCodes.Error });

        let league = await SQL.Kabaddi.checkLeagueAvailability(leagueId, matchKey, fantasyType, userId, false);
        league = league[0]

        console.log("checkLeagueAvailability>>>>", league);

        if (!league) return await rejected({ Msg: __('LEAGUE_NOT_EXIST'), title: 'league_not_exist', status: Utils.StatusCodes.Error });

        // check match is closed
        console.log("League closed  >>>>", league.closed);
        if (league.closed == 1) return await rejected({ Msg: __('MATCH_CLOSED'), title: 'Match is closed now.', status: Utils.StatusCodes.Error });
        let leagueTeams = league.all_teams_joined;
        if (leagueTeams) {
            leagueTeams = leagueTeams.split(",");
            // check if joined with the old team
            if (!leagueTeams.includes(oldTeam)) return await rejected({ Msg: __('WRONG_DATA'), title: 'not joined with old team', status: Utils.StatusCodes.Error });

            // check if alreeady joined with the new team
            if (leagueTeams.includes(newTeam)) return await rejected({ Msg: __('LEAGUE_JOINED_SAME_TEAM'), title: 'exist', status: Utils.StatusCodes.Error });
        } else return await rejected({ Msg: __('JOIN_LEAGUE_FIRST'), title: 'not joined', status: Utils.StatusCodes.Error })

        // check if user new team exists for the match
        let teamFound = await SQL.Kabaddi.checkTeamExists(userId, matchKey, fantasyType, newTeam)
        console.log("team found is>>>", teamFound);
        if (!teamFound.length > 0) return await rejected({ Msg: __('WRONG_DATA'), title: 'team not exist', status: Utils.StatusCodes.Error });

        // SWAP TEAM NOW
        console.log("user ip is >>>", userIp)
        let swapTeamSuccess = await SQL.Kabaddi.swapTeam(matchKey, leagueId, userId, oldTeam, newTeam, userIp)
        if (swapTeamSuccess) return await resolve({ Msg: __('TEAM_SWAP_SUCCESS'), title: 'success', status: Utils.StatusCodes.Success });

        return await rejected({ Msg: __(WROMG_DATA), title: 'error to swap team' });

    })
}

exports.createTeam = async (req, res, next) => {
    console.log('Creating a new team...');
    let userIp = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let userId = user.user_id;
    let { match_key: matchKey, players, captain, vice_captain: myViceCaptain, fantasy_type: fantasyType } = req.body;
    // console.log(userId, players, '-lo-', captain, myViceCaptain, fantasyType);
    if (!userId || !players || !captain || !myViceCaptain || !fantasyType) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    captain = parseInt(captain.trim());
    myViceCaptain = parseInt(myViceCaptain.trim());
    fantasyType = parseInt(fantasyType);
    const fantasyTypes = [1, 2, 3];
    players = players.split(',');
    // captain = captain.trim();
    // myViceCaptain = myViceCaptain.trim();
    // console.log(fantasyTypes.includes(fantasyType));
    // console.log('fantasyTypes.includes(fantasyType)', fantasyType, fantasyTypes.includes(fantasyType));
    if (!fantasyTypes.includes(fantasyType)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let MaxPlayers, defaultGoalKeeper, defaultForward, defaultDefenders, defaultAllRounders, defaultMidFielder, maxCredits, maxFromTeam;
    let selectMaxPlayerError;
    if (fantasyType == 1) {
        MaxPlayers = 7;
        defaultRaiders = { min: 1, max: 3 };
        defaultDefenders = { min: 2, max: 4 };
        defaultAllRounders = { min: 1, max: 2 };
        maxCredits = 100;
        maxFromTeam = 5;
        selectMaxPlayerError = __('SELECT_7');
    } else {
        // for now only classic team is allowed
        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Wrong fantasy", __('WRONG_DATA'), res);
    }
    // remove extra space from players
    players = players.map(i => parseInt(i.trim()));
    // console.log('total selected players ==>>', players.length, fantasyType);
    // validate total players (as provided by user)
    console.log("MAx Players", MaxPlayers, "Players length", players.length);
    if (players.length != MaxPlayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", selectMaxPlayerError, res)

    // validate captains and vice-captains
    if (!captain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SELECT_CAPTAIN'), res)
    if (!myViceCaptain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SELECT_VICE_CAPTAIN'), res)
    if (captain == myViceCaptain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SAME_CAPTAINS'), res);
    // console.log('aaa', captain, players.includes(captain));

    if (!players.includes(captain) || !players.includes(myViceCaptain)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('invalid_cp_vp'), res);

    // get match
    let matchColumns = `match_short_name, team_a_key, team_b_key, read_index`;
    let match = await SQL.Kabaddi.getMatchTableByKey(matchKey, matchColumns);
    if (!match || match.length <= 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
    match = match[0];
    //check match is closed
    // console.log('is match closed', match.closed);
    if (match.closed == 1) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('Match is closed now.'), res);
    console.log("--->>>> ", players.toString());

    //  get all players within the match
    let allplayers = await SQL.Kabaddi.getPlayersByMatchKey(`match_key = ${matchKey} AND player_key IN(${players.toString()})`);
    if (!allplayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
    // validate total players (valid players)
    if (allplayers.length != MaxPlayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", selectMaxPlayerError, res);

    // create different types of fantasy 1=Classic, 2=Batting, 3=Bowling
    if (fantasyType == 1) {
        // for classic teams
        /**
         * TEAM VALIDATION PROCEDURE
         *
         * Players = 11
         * Max players from a team = 7
         * Wicket Keeper = 1
         * All Rounder = 1-3
         * Batsman = 3-5
         * Bowler = 3-5
         * Captain = Vice Captain = 1
         * Credits <= 100
         * Team not already exists
         *
         */
        let raiders = defenders = allRounder = credits = team_1 = team_2 = 0;
        for (let i of allplayers) {
            let this_player_key = i.player_key;
            let this_team_key = i.team_key;
            this_team_key++ //increase team
            credits += i.player_credits;
            // console.log("credits for fantasy_type = 1 are..", credits)
            // if (i.player_playing_role == "goalkeeper") goalKeeper++ //increase keeper

            if (i.player_playing_role == "raider") raiders++ //increase all rounder
            else if (i.player_playing_role == "defender") defenders++ //increase defender
            else if (i.player_playing_role == "allrounder") allRounder++
        }

        // validate defaults
        let error = "";
        // if ($keeper != $defaultKeepers) $error = SELECT_KEEPER;

        if (allRounder < defaultAllRounders.min) {
            error = __('MINIMUM_ROLE') + defaultAllRounders.min + " allrounder"
        } else if (allRounder > defaultAllRounders.max) {
            error = __('MAXIMUM_ROLE') + defaultAllRounders.max + " allrounder"
        } else if (defenders < defaultDefenders.min) {
            error = __('MINIMUM ROLE') + defaultDefenders.min + " defenders"
        } else if (defenders > defaultDefenders.max) {
            error = __('MAXIMUM_ROLE') + defaultDefenders.max + " defenders"
        } else if (raiders < defaultRaiders.min) {
            error = __('MINIMUM ROLE') + defaultRaiders.min + " raiders"
        } else if (defaultRaiders > defaultRaiders.max) {
            error = __('MAXIMUM_ROLE') + defaultRaiders.max + " defaultRaiders"

        } else if (team_1 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
        else if (team_2 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
        else if (credits > maxCredits) error = __('MAX_CREDITS') + maxCredits;
        if (error.length > 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", error, res);
    } else {
        // TEAM VALIDATIONS FOR OTHER FANTASY TEAM
        // for now only classic team is allowed
        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_fantasy", __('WRONG_DATA'), res);

    }
    // check if same team alredy exists
    //fantasy type != 1 or neither != 2,3
    where_clause = `t1.user_id = ${userId} and t1.match_key = ${matchKey} and t1.fantasy_type = ${fantasyType}`
    let userTeams = await SQL.Kabaddi.getUserTeamDetails(`*`, where_clause);
    console.log(`Total teams are ${userTeams.length}`);
    let userTeamsArray = [];
    let maxTeam = 0;
    let teamNumber;
    let teamObj = { team: '', players: [], role: '' };
    // return res.send({ team: userTeams })
    Bluebird.each(userTeams, async (userTeam, index, length) => {
        if (userTeam.team_number > maxTeam) maxTeam = userTeam.team_number;
        //check same team exist or not in userTeamsArray
        let teamDetails = userTeamsArray.find(t => t.team_number == userTeam.team_number);
        if (!teamDetails) {
            let formatedTeam = {
                team_number: userTeam.team_number,
                players: []
            };
            if (userTeam.player_role == 'captain') {
                formatedTeam.captain = userTeam.player_key
            } else if (userTeam.player_role == 'vice_captain') {
                formatedTeam.vice_captain = userTeam.player_key
            }
            formatedTeam.players.push(userTeam.player_key)
            userTeamsArray.push(formatedTeam);
            console.log('if !teamDetails>> userTeamArray', userTeamsArray)
        } else {
            teamDetails.team_number = userTeam.team_number;
            if (userTeam.player_role == 'captain') {
                teamDetails.captain = userTeam.player_key
            } else if (userTeam.player_role == 'vice_captain') {
                teamDetails.vice_captain = userTeam.player_key
            }
            teamDetails.players.push(userTeam.player_key);
            console.log('if teamDetails>> userTeamArray', userTeamsArray)

        }
    }).then(_ => {
        let matchedPlayers = [];
        let matchedTeam = [];
        // let teamsCaptainAndViceCaptain = [];
        //check for duplicate teams
        Bluebird.each(userTeamsArray, (team, index, length) => {
            matchedPlayers = team.players.filter(x => players.includes(x));
            matchedTeam.push(team)
                ;

        }).then(async _ => {
            let isIncludes = matchedTeam.filter(thisTeam => thisTeam.captain == captain && thisTeam.vice_captain == myViceCaptain);
            console.log("matchedTeam>>> ", matchedTeam, isIncludes.length)
            console.log("matchedPlayers>>> ", matchedPlayers, players);

            if (matchedPlayers.length == 7 && isIncludes.length > 0) {
                // teamsCaptainAndViceCaptain = [];
                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS'), res);
            }
            if (maxTeam >= Config.MAX_TEAM) {
                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('MAX_TEAM_ERROR'), res);
            }
            let bulkInsertData = [];
            let sqsData = [];
            Bluebird.each(allplayers, (thisPlayer, index, lenght) => {
                let playerType = thisPlayer.player_playing_role;
                // if (fantasyType == 2) playerType = "batsman";
                // else if (fantasyType == 3) playerType = "bowler";

                let playerRole = null;
                if (thisPlayer.player_key == captain) playerRole = "captain";
                else if (thisPlayer.player_key == myViceCaptain) playerRole = "vice_captain";

                console.log("team Key>>>>>>>>>>>>>>>>>", thisPlayer.team_key);

                bulkInsertData.push({
                    user_id: userId,
                    match_key: matchKey,
                    fantasy_type: fantasyType,
                    team_number: maxTeam + 1,
                    player_key: thisPlayer.player_key,
                    player_type: playerType,
                    player_role: playerRole,
                    points: 0,
                    date_added: Mysql_dt
                })
                sqsData.push({
                    user_id: userId,
                    match_key: matchKey,
                    fantasy_type: fantasyType,
                    team_number: maxTeam + 1,
                    player_key: thisPlayer.player_key,
                    player_type: playerType,
                    player_role: playerRole,
                    points: 0,
                    date_added: Mysql_dt,
                    //for cache
                    player_playing_role: playerType,
                    scores: "0.000",
                    player_name: thisPlayer.player_name,
                    player_photo: thisPlayer.player_photo,
                    team_key: thisPlayer.team_key,
                    seasonal_role: thisPlayer.player_playing_role,
                    credits: thisPlayer.credits,
                    is_playing: thisPlayer.is_playing,
                    is_playing11_last: thisPlayer.is_playing11_last,
                    is_playing11_prob: thisPlayer.is_playing11_prob
                })
            }).then(async _ => {
                let ipTableData = {
                    user_id: userId,
                    match_key: matchKey,
                    fantasy_type: fantasyType,
                    team_number: maxTeam + 1,
                    user_ip: userIp,
                    action: 1, // insert
                    date_added: 'NOW()'
                }
                if (Config.ENABLE_SQS) {
                    let sqsTeamObj = {
                        delete_team: {},
                        add_team: sqsData
                    }
                    Utils.AwsUtils.sendSqsMessage(sqsData, async function (err, success) {
                        if (err) {
                            console.log("Error", err);
                            return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SQS_DATA_ERROR'), res);
                        } else {
                            // console.log("Success", success);
                            let ipInsert = await SQL.Kabaddi.insertData2(ipTableData, 'kb_user_teams_ip')
                            return await Utils.ResponseHandler(true, 200, "success", __('success'), res, success);
                        }
                    })
                } else {
                    let teamInsertStatus = await SQL.Kabaddi.teamBulkInsert(bulkInsertData, 'kb_user_teams')
                    let ipInsertStatus = await SQL.Kabaddi.insertData2(ipTableData, 'kb_user_teams_ip')
                    return await Utils.ResponseHandler(true, 200, "success", __('success'), res);
                }
            }).catch(async e => {
                console.log('Error ', e);
                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SOME_ERROR'), res);
            });

        }).catch(async e => {
            console.log('Error ', e);
            return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SOME_ERROR'), res);
        });
    }).catch(async e => {
        console.log('Error ', e);
        return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SOME_ERROR'), res);
    });
}

exports.updateTeams = async (req, res, next) => {

    try {
        let userIp = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null);
        let user = req.user;
        if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
        let userId = user.user_id;
        console.log('userId is', user.user_id);
        let { match_key: matchKey, players, captain, vice_captain: myViceCaptain, fantasy_type: fantasyType, team_number } = req.body;
        // console.log(userId, players, '-lo-', captain, myViceCaptain, fantasyType);
        if (!userId || !players || !captain || !myViceCaptain || !fantasyType || !team_number) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
        captain = parseInt(captain.trim());
        myViceCaptain = parseInt(myViceCaptain.trim());
        fantasyType = parseInt(fantasyType);
        const fantasyTypes = [1, 2, 3];
        players = players.split(',');
        // captain = captain.trim();
        // myViceCaptain = myViceCaptain.trim();
        console.log(fantasyTypes.includes(fantasyType));
        console.log('fantasyTypes.includes(fantasyType)', fantasyType, fantasyTypes.includes(fantasyType));
        if (!fantasyTypes.includes(fantasyType)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
        let MaxPlayers, defaultGoalKeeper, defaultForward, defaultDefenders, defaultAllRounders, defaultMidFielder, maxCredits, maxFromTeam;
        let selectMaxPlayerError;
        if (fantasyType == 1) {
            MaxPlayers = 7;
            defaultRaiders = { min: 1, max: 3 };
            defaultDefenders = { min: 2, max: 4 };
            defaultAllRounders = { min: 1, max: 2 };
            maxCredits = 100;
            maxFromTeam = 5;
            selectMaxPlayerError = __('SELECT_7');
        } else {
            // for now only classic team is allowed
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_fantasy", __('WRONG_DATA'), res);
        }
        // remove extra space from players
        players = players.map(i => parseInt(i.trim()));
        console.log('total selected players ==>>', players.length, fantasyType);
        // validate total players (as provided by user)
        console.log("MAx Players", MaxPlayers, "Players length", players.length);
        if (players.length != MaxPlayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", selectMaxPlayerError, res)

        // validate captains and vice-captains
        if (!captain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SELECT_CAPTAIN'), res)
        if (!myViceCaptain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SELECT_VICE_CAPTAIN'), res)
        if (captain == myViceCaptain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SAME_CAPTAINS'), res);
        console.log('aaa', captain, players.includes(captain));

        if (!players.includes(captain) || !players.includes(myViceCaptain)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('invalid_cp_vp'), res);

        // get match
        let matchColumns = ` match_short_name, team_a_key, team_b_key, read_index `;
        let match = await SQL.Kabaddi.getMatchTableByKey(matchKey, matchColumns);
        if (!match || match.length <= 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
        match = match[0];
        //check match is closed
        console.log('is match closed', match.closed);
        if (match.closed == 1) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('Match is closed now.'), res);
        console.log("--->>>> ", players.toString());

        //  get all players within the match
        let allplayers = await SQL.Kabaddi.getPlayersByMatchKey(`match_key = ${matchKey} AND player_key IN(${players.toString()})`);
        if (!allplayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
        // validate total players (valid players)
        console.log("Allplayers ....", allplayers.length)
        if (allplayers.length != MaxPlayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", selectMaxPlayerError, res);

        // create different types of fantasy 1=Classic, 2=Batting, 3=Bowling
        if (fantasyType == 1) {
            // for classic teams
            /**
             * TEAM VALIDATION PROCEDURE
             *
             * Players = 11
             * Max players from a team = 7
             * Wicket Keeper = 1
             * All Rounder = 1-3
             * Batsman = 3-5
             * Bowler = 3-5
             * Captain = Vice Captain = 1
             * Credits <= 100
             * Team not already exists
             *
             */
            let raiders = defenders = allRounder = credits = team_1 = team_2 = 0;
            for (let i of allplayers) {
                let this_player_key = i.player_key;
                let this_team_key = i.team_key;
                this_team_key++ //increase team
                credits += i.player_credits;
                // console.log("credits for fantasy_type = 1 are..", credits)
                if (i.player_playing_role == "raider") raiders++ //increase all rounder
                else if (i.player_playing_role == "defender") defenders++ //increase defender
                else if (i.player_playing_role == "allrounder") allRounder++
            }

            // validate defaults
            let error = "";
            // if ($keeper != $defaultKeepers) $error = SELECT_KEEPER;

            if (allRounder < defaultAllRounders.min) {
                error = __('MINIMUM_ROLE') + defaultAllRounders.min + " allrounder"
            } else if (allRounder > defaultAllRounders.max) {
                error = __('MAXIMUM_ROLE') + defaultAllRounders.max + " allrounder"
            } else if (defenders < defaultDefenders.min) {
                error = __('MINIMUM ROLE') + defaultDefenders.min + " defenders"
            } else if (defenders > defaultDefenders.max) {
                error = __('MAXIMUM_ROLE') + defaultDefenders.max + " defenders"
            } else if (raiders < defaultRaiders.min) {
                error = __('MINIMUM ROLE') + defaultRaiders.min + " raiders"
            } else if (defaultRaiders > defaultRaiders.max) {
                error = __('MAXIMUM_ROLE') + defaultRaiders.max + " defaultRaiders"
            } else if (team_1 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
            else if (team_2 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
            else if (credits > maxCredits) error = __('MAX_CREDITS') + maxCredits;

            if (error.length > 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", error, res);
        } else {
            // TEAM VALIDATIONS FOR OTHER FANTASY TEAM
            // for now only classic team is allowed
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong fantasy", __('WRONG_DATA'), res);
        }
        // check if same team alredy exists
        //fantasy type != 1 or neither != 2,3
        where_clause = ` t1.user_id = ${userId} and t1.match_key = ${matchKey} and t1.fantasy_type = ${fantasyType} `
        let userTeams = await SQL.Kabaddi.getUserTeamDetails(`*`, where_clause);
        console.log(`Total teams are ${userTeams.length}`);
        let userTeamsArray = [];
        let maxTeam = 0;
        let teamNumber;
        let teamObj = { team: '', players: [], role: '' };
        // return res.send({ team: userTeams })
        Bluebird.each(userTeams, async (userTeam, index, length) => {
            if (userTeam.team_number > maxTeam) maxTeam = userTeam.team_number;
            let teamDetails = userTeamsArray.find(t => t.team_number == userTeam.team_number);
            if (!teamDetails) {
                let formatedTeam = {
                    team_number: userTeam.team_number,
                    players: []
                };
                if (userTeam.player_role == 'captain') {
                    formatedTeam.captain = userTeam.player_key
                } else if (userTeam.player_role == 'vice_captain') {
                    formatedTeam.vice_captain = userTeam.player_key
                }
                formatedTeam.players.push(userTeam.player_key)
                userTeamsArray.push(formatedTeam);
            } else {
                teamDetails.team_number = userTeam.team_number;
                if (userTeam.player_role == 'captain') {
                    teamDetails.captain = userTeam.player_key
                } else if (userTeam.player_role == 'vice_captain') {
                    teamDetails.vice_captain = userTeam.player_key
                }
                teamDetails.players.push(userTeam.player_key);
            }
        }).then(_ => {
            let matchedPlayers = [];
            let matchedTeam = [];
            // let teamsCaptainAndViceCaptain = [];
            //check for duplicate teams
            Bluebird.each(userTeamsArray, (team, index, length) => {
                if (team.team_number != team_number) {
                    console.log("Inside if userTeamArray ", userTeamsArray);
                    matchedPlayers = team.players.filter(x => players.includes(x));
                }
                matchedTeam.push(team);
                // teamsCaptainAndViceCaptain.push(team.vice_captain);
                // teamsCaptainAndViceCaptain.push(team.captain);
                // console.log("teamsCaptainAndViceCaptain is Captain and vice_captain >>>>", teamsCaptainAndViceCaptain, captain, myViceCaptain);
            }).then(async _ => {
                let isIncludes = matchedTeam.filter(thisTeam => thisTeam.captain == captain && thisTeam.vice_captain == myViceCaptain);
                console.log("matchedTeam>>> ", matchedTeam, isIncludes.length)
                console.log("matchedPlayers>>> ", matchedPlayers, players);

                if (matchedPlayers.length == 11 && isIncludes.length > 0) {
                    // teamsCaptainAndViceCaptain = [];
                    return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS'), res);
                }
                let bulkInsertData = [];
                let sqsData = [];
                Bluebird.each(allplayers, (thisPlayer, index, length) => {
                    let playerType = thisPlayer.player_playing_role;
                    // if (fantasyType == 2) playerType = "batsman";
                    // else if (fantasyType == 3) playerType = "bowler";

                    let playerRole = null;
                    if (thisPlayer.player_key == captain) playerRole = "captain";
                    else if (thisPlayer.player_key == myViceCaptain) playerRole = "vice_captain";

                    bulkInsertData.push({
                        user_id: userId,
                        match_key: matchKey,
                        fantasy_type: fantasyType,
                        team_number: team_number,
                        player_key: thisPlayer.player_key,
                        player_type: playerType,
                        player_role: playerRole,
                        points: 0,
                        date_added: Mysql_dt
                    })
                    sqsData.push({
                        user_id: userId,
                        match_key: matchKey,
                        fantasy_type: fantasyType,
                        team_number: team_number,
                        player_key: thisPlayer.player_key,
                        player_type: playerType,
                        player_role: playerRole,
                        points: 0,
                        date_added: Mysql_dt,
                        //for cache
                        player_playing_role: playerType,
                        scores: "0.000",
                        player_name: thisPlayer.player_name,
                        player_photo: thisPlayer.player_photo,
                        team_key: thisPlayer.team_key,
                        seasonal_role: thisPlayer.player_playing_role,
                        credits: thisPlayer.credits,
                        is_playing: thisPlayer.is_playing,
                        is_playing11_last: thisPlayer.is_playing11_last,
                        is_playing11_prob: thisPlayer.is_playing11_prob
                    })
                }).then(async _ => {
                    let ipTableData = {
                        user_id: userId,
                        match_key: matchKey,
                        fantasy_type: fantasyType,
                        team_number: team_number,
                        user_ip: userIp,
                        action: 1, // insert
                        date_added: 'NOW()'
                    }
                    if (Config.ENABLE_SQS) {
                        let sqsTeamObj = {
                            delete_team: {},
                            add_team: sqsData
                        }
                        Utils.AwsUtils.sendSqsMessage(sqsData, async function (err, success) {
                            if (err) {
                                console.log("Error", err);
                                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SQS_DATA_ERROR'), res);
                            } else {
                                // console.log("Success", success);
                                let ipInsert = await SQL.Kabaddi.insertData2(ipTableData, 'kb_user_teams_ip')
                                return await Utils.ResponseHandler(true, 200, "success", __('success'), res, success);
                            }
                        })
                    } else {
                        await SQL.Kabaddi.removeUserTeam(`user_id=${userId} and match_key = ${matchKey} and team_number = ${team_number} and fantasy_type=${fantasyType}`)
                        let teamInsertStatus = await SQL.Kabaddi.teamBulkInsert(bulkInsertData, 'kb_user_teams')
                        let ipInsertStatus = await SQL.Kabaddi.insertData2(ipTableData, 'kb_user_teams_ip')
                        return await Utils.ResponseHandler(true, 200, "success", __('success'), res);
                    }
                }).catch(async e => {
                    console.log('Error in 1 ', e);
                    return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SOME_ERROR'), res);
                });

            }).catch(async e => {
                console.log('Error in 2 ', e);
                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SOME_ERROR'), res);
            });
        }).catch(async e => {
            console.log('Error in 3 ', e);
            return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SOME_ERROR'), res);
        });
    } catch (error) {
        console.log('Error in 4 ', error);
        return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SOME_ERROR'), res);
    }
};