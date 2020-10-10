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
let moment = require('moment');
let currentDate = require('../../utils/CurrentDate')


/**
 * Function will return all upcomming matches list
 * with following data
 * @Homebanners
 * @First Time banners
 * @Announcements
 * @Lineupout key for footballl cricket and kabaddi
 */
exports.sortCompleted = (array) => {

    // if completed date is null then it should come at first
    let nullDate = []
    let completedDate = [];
    for (i = 0; i < array.length; i++) {
        if (array[i].completed_date == null) nullDate.push(array[i])
        else completedDate.push(array[i]);
    }

    // console.log("completedDate >>>>", completedDate);
    // console.log("nullDate >>>>", nullDate);


    let temp;
    // console.log("array before sort >>>", completedDate);
    for (j = 0; j < completedDate.length; j++) {
        for (i = 0; i < completedDate.length - 1; i++) {
            if (completedDate[i].completed_date < completedDate[i + 1].completed_date) {
                temp = completedDate[i + 1];
                completedDate[i + 1] = completedDate[i];
                completedDate[i] = temp;
            }
        }
    }

    // console.log("array After sort >>>", completedDate)

    let sorted = [...nullDate, ...completedDate];

    return sorted;
}

exports.getMatchDetail = async(req, res, next) => {
    let matchKey = req.query.match_key;
    let response = {}
    let match = await Utils.Redis.getAsync(Utils.Keys.CRICKET_CLOSING_MATCH_DETAILS + "_" + matchKey);
    if(!match){
        let activeMatches = await Utils.Redis.getAsync(Utils.Keys.CRICKET_ACTIVE_MATCHES);
        if(activeMatches){
            activeMatches = JSON.parse(activeMatches)
            match = activeMatches.filter(e => e.match_key == matchKey)
            if(match.length >0) match = match[0]
        }
    }
    if(!match) return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('SUCCESS'), res);
    response = {
        match_details: {
            closing_ts: match.closing_ts,
            match_key: match.match_key,
            start_date_unix: match.start_date_unix,
            closed: match.closed
        }
    }

    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('SUCCESS'), res, response);

}

exports.getActiveMatches = async(req, res, next) => {
    try {
        // const status_code = req.params.status_code;
        let { user_id } = req.user;
        let activeMatches = await Utils.Redis.getAsync(Utils.Keys.CRICKET_ACTIVE_MATCHES);
        if (!activeMatches) {
            console.log('Cricket match list from Database');
            activeMatches = await SQL.Cricket.getActiveUpcomminMatches();
            Utils.Redis.set(Utils.Keys.CRICKET_ACTIVE_MATCHES, JSON.stringify(activeMatches), 'EX', Utils.RedisExpire.CRICKET_ACTIVE_MATCHES)
        } else {
            console.log("matchList from Reddis")
            activeMatches = JSON.parse(activeMatches);
        }
        let deviceType;
        let platform = req.headers.platform;
        if (platform == 'android') {
            deviceType = 2;
        } else if (platform == 'iOS') {
            deviceType = 1;
        } else {
            deviceType = 3;
        }
        let cacheKeyPromoBanner = Utils.Keys.PROMOTION_HOME_BANNER +"_" +deviceType
        let promotionBanners = await Utils.Redis.getAsync(cacheKeyPromoBanner)
        if (!promotionBanners) {
            console.log('Promotion banner list from Database', promotionBanners, cacheKeyPromoBanner);
            // let currentDate = Utils.DateTime.gmtDate2;
            // promotionBanners = await SQL.Cricket.getHomoPromoBanners(1, currentDate, deviceType);
            // Utils.Redis.set(cacheKeyPromoBanner, JSON.stringify(promotionBanners), 'EX', Utils.RedisExpire.PROMOTION_HOME_BANNER)
            promotionBanners = [];
        } else {
            promotionBanners = JSON.parse(promotionBanners)
        }
        let screenType = 1;
        let playType = 1
        let announcements = await Utils.Redis.getAsync(Utils.Keys.CRICKET_ANNOUNCEMENTS + '_' + screenType + '_' + playType)
        if (!announcements) {
            console.log('Announcements list from Database');

            let date = await currentDate.currentDate()

            announcements = await SQL.Users.getAnnouncements(screenType, playType, null, date)
                // console.log("annouoncements are >>>", announcements);
            Utils.Redis.set(Utils.Keys.CRICKET_ANNOUNCEMENTS + '_' + screenType + '_' + playType, JSON.stringify(announcements), 'EX', Utils.RedisExpire.CRICKET_ANNOUNCEMENTS);
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

        // let quizes = await SQL.Quiz.getActiveQuizes();
        let quizes = await Utils.Redis.getAsync(Utils.Keys.QUIZ_CACHED+"_1")
        if(quizes) quizes = JSON.parse(quizes);
        // let quizes = [];

        let CC_MATCH_LINEUPS = await Utils.Redis.getAsync(Utils.Keys.CC_MATCH_LINEUPS)
        let FB_MATCH_LINEUPS = await Utils.Redis.getAsync(Utils.Keys.FB_MATCH_LINEUPS)
        let KB_MATCH_LINEUPS = await Utils.Redis.getAsync(Utils.Keys.KB_MATCH_LINEUPS)
        let BS_MATCH_LINEUPS = await Utils.Redis.getAsync(Utils.Keys.BS_MATCH_LINEUPS)
        let BK_MATCH_LINEUPS = await Utils.Redis.getAsync(Utils.Keys.BK_MATCH_LINEUPS)


        CC_MATCH_LINEUPS = JSON.parse(CC_MATCH_LINEUPS)
        FB_MATCH_LINEUPS = JSON.parse(FB_MATCH_LINEUPS)
        KB_MATCH_LINEUPS = JSON.parse(KB_MATCH_LINEUPS)
        BS_MATCH_LINEUPS = JSON.parse(BS_MATCH_LINEUPS)
        BK_MATCH_LINEUPS = JSON.parse(BK_MATCH_LINEUPS)


        CC_MATCH_LINEUPS = CC_MATCH_LINEUPS == null ? [] : CC_MATCH_LINEUPS
        FB_MATCH_LINEUPS = FB_MATCH_LINEUPS == null ? [] : FB_MATCH_LINEUPS
        KB_MATCH_LINEUPS = KB_MATCH_LINEUPS == null ? [] : KB_MATCH_LINEUPS
        BS_MATCH_LINEUPS = BS_MATCH_LINEUPS == null ? [] : BS_MATCH_LINEUPS
        BK_MATCH_LINEUPS = BK_MATCH_LINEUPS == null ? [] : BK_MATCH_LINEUPS
        const response = {
            matches: activeMatches,
            banners: {
                home: homeBanners,
                first_time: firstTimeBanner
            },
            announcements: announcements,
            tickets: userTickets,
            lineups: {
                // cc: 0,
                // fb: 0,
                // kb: 0,
                // bs: 0,
                // bk: 0


                cc: CC_MATCH_LINEUPS.length > 0 ? CC_MATCH_LINEUPS.length : 0,
                fb: FB_MATCH_LINEUPS.length > 0 ? FB_MATCH_LINEUPS.length : 0,
                kb: KB_MATCH_LINEUPS.length > 0 ? KB_MATCH_LINEUPS.length : 0,
                bs: BS_MATCH_LINEUPS.length > 0 ? BS_MATCH_LINEUPS.length : 0,
                bk: BK_MATCH_LINEUPS.length > 0 ? BK_MATCH_LINEUPS.length : 0
            },
            quizes: quizes,
            notifications: req.user.notifications
        };
        //release connection after
        // const released = await db.on('release', (connection) => {
        //     // console.log(connection.threadId);
        // });
        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response, req)
    } catch (error) {
        console.error('error==> ', error);

        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "SOME_ERROR", __("SOME_ERROR"), res, null, req)
    }
}


////////////////////...........Team Preview of a user for a match ...........................................////////////////
exports.getTeamPreviewOfMatch = async(req, res, next) => {
    let { match_key, team_number, fantasy_type } = req.query;
    let user_id = req.user.user_id;
    fantasy_type = req.query.fantasy_type ? req.query.fantasy_type : "1";
    if (!user_id || !team_number || !match_key || !fantasy_type) {
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('REQUIRED_FIELDS', { fields: 'user_id, match_key, team_number' }), res);
    }

    let Team = await Utils.Redis.getAsync(Utils.Keys.CRICKET_TEAM_PREVIEW);

    if (!Team) {
        console.log("TeamPReview From DB>>")

        Team = await SQL.Cricket.getTeamPreviewOfMatch(user_id, match_key, fantasy_type, team_number);
        await Utils.Redis.set(Utils.Keys.CRICKET_TEAM_PREVIEW, JSON.stringify(Team), 'EX', Utils.RedisExpire.CRICKET_TEAM_PREVIEW);
    } else {
        Team = JSON.parse(Team);
    }

    const response = {
        Team_Details: Team,
        Player_count: Team.length ? Team.length : 0
    }

    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('TEAM_FOUND_SUCCESS'), res, response);


}

//get all leagues of a particular match......(New)
exports.getMatchLeagues = async(req, res, next) => {
    const { match_key } = req.params;
    let { user_id } = req.user;
    let deviceType;
    let platform = req.headers.platform;
    if (platform == 'android') {
        deviceType = 2;
    } else if (platform == 'iOS') {
        deviceType = 1;
    } else {
        deviceType = 3;
    }
    // console.log("user>>>>>", user_id);

    let fantasyType = req.params.fantasyType ? req.params.fantasyType : 1;
    // if(fantasyType == 0) fantasyType = null
    console.log('fantsay type=====>>>>>>......... ', fantasyType);

    if (!match_key) {
        return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('error'), __('WRONG_DATA'), res, null, req)
    }

    let fantasyTypes = new Array(1, 2, 3, 4, 5);

    //Match details
    let matchDetails = await Utils.Redis.getAsync(Utils.Keys.CRICKET_MATCH_DETAILS + "_" + match_key);
    if (!matchDetails) {
        console.log("MatchDetails From DB");
        let matchColumns = `match_key, match_format, match_short_name, read_index, admin_status, start_date_unix, team_a_short_name, team_b_short_name, match_status, season_key, season_short_name, closing_ts, team_a_key, team_b_key, active, categorisation,gender_match_category,active,show_playing22, match_fantasy_type`
        matchDetails = await SQL.Cricket.getMatchByKey(matchColumns, match_key)
        matchDetails = matchDetails[0];
        await Utils.Redis.set(Utils.Keys.CRICKET_MATCH_DETAILS + "_" + match_key, JSON.stringify(matchDetails), 'EX', Utils.RedisExpire.CRICKET_MATCH_DETAILS);
    } else {
        matchDetails = JSON.parse(matchDetails);
    }

    //Match Leagues
    // let matchLeagues = await Utils.Redis.getAsync(Utils.Keys.CRICKET_LEAGUES + '_' + fantasyType + "_" + match_key + "_" + user_id);
    let matchLeagues = await Utils.Redis.getAsync(Utils.Keys.CRICKET_LEAGUES + "_" + match_key);
    console.log("reddis key >>>", Utils.Keys.CRICKET_LEAGUES + "_" + match_key);

    if (!matchLeagues) {
        console.log("Matchleagues From DB");
        matchLeagues = await SQL.Cricket.getEachActiveMatchesLeagues(match_key, fantasyType);
        console.log("matchLeagues>>>>", matchLeagues.length);

        // await Utils.Redis.set(Utils.Keys.CRICKET_LEAGUES + '_' + fantasyType + "_" + match_key + "_" + user_id, JSON.stringify(matchLeagues), 'EX', Utils.RedisExpire.CRICKET_LEAGUES);
        await Utils.Redis.set(Utils.Keys.CRICKET_LEAGUES + "_" + match_key, JSON.stringify(matchLeagues), 'EX', Utils.RedisExpire.CRICKET_LEAGUES);
    } else {
        console.log("Matchleagues From Reddis");
        matchLeagues = JSON.parse(matchLeagues);
    }

    //announcement
    let screenType = 2;
    let playType = 1
    let announcmentCacheKey = Utils.Keys.CRICKET_ANNOUNCEMENTS + '_' + screenType + '_' + playType + match_key;
    let announcements = await Utils.Redis.getAsync(announcmentCacheKey)
    if (!announcements) {
        console.log('Announcements list from Database');
        let date = await currentDate.currentDate();

        announcements = await SQL.Users.getAnnouncements(screenType, playType, match_key, date)
        Utils.Redis.set(announcmentCacheKey, JSON.stringify(announcements), 'EX', Utils.RedisExpire.CRICKET_ANNOUNCEMENTS);
    } else {
        announcements = JSON.parse(announcements);
    }

    //team_count
    let teamCount = await Utils.Redis.getAsync(Utils.Keys.TEAM_COUNT + user_id);
    if (!teamCount) {
        teamCount = await SQL.Cricket.getTeamCountByMatch(user_id, match_key, fantasyType);
        await Utils.Redis.set(Utils.Keys.TEAM_COUNT + user_id, JSON.stringify(teamCount), 'EX', Utils.RedisExpire.TEAM_COUNT)

    } else {
        teamCount = JSON.parse(teamCount);
    }
    //joinedLeagues
    let joinedLeagues = await Utils.Redis.getAsync(Utils.Keys.JOINED_LEAGUES + user_id + match_key + fantasyType);
    if (!joinedLeagues) {
        joinedLeagues = await SQL.Cricket.getJoinedLeagues(match_key, user_id);
        await Utils.Redis.set(Utils.Keys.JOINED_LEAGUES + user_id + match_key + fantasyType, JSON.stringify(joinedLeagues), 'EX', Utils.RedisExpire.JOINED_LEAGUES)
    } else {
        joinedLeagues = JSON.parse(joinedLeagues)
    }

    // console.log('==>', joinedLeagues);

    joinedLeagues = joinedLeagues.length ? joinedLeagues : [];

    let leagueCount = 0;
    Bluebird.each(matchLeagues, (thisleague, index, length) => {
        let team_number = []
        let countFlag = true;
        joinedLeagues.map(async thisJoinedLeague => {
            if (thisleague.league_id == thisJoinedLeague.league_id) {
                let isIncludes = team_number.includes(thisJoinedLeague.team_number)
                if (!isIncludes) {
                    team_number.push(thisJoinedLeague.team_number)
                }
                if (countFlag) {
                    leagueCount++
                    countFlag = false;
                }
            } else {
                leagueCount;
            }
        })
        thisleague.user_teams = team_number;
        if(team_number.length>0 && thisleague.total_joined == 0){
            thisleague.total_joined =1;
        }
    }).then(async _ => {
        let totalJoined = await SQL.Users.getUserRecordTable(user_id, ` SUM(total_classic + total_classic_kb + total_classic_fb + total_classic_bs + total_classic_bk + total_bowling + total_batting + total_wizard + total_reverse + total_quiz_joined) AS totalJoined `)
        totalJoined = totalJoined[0].totalJoined;

        if (parseInt(totalJoined) > 0 && totalJoined != null) {
            console.log(" played old users")
            let firstTimeCategory = Config.First_Time_League_Category;
            matchLeagues = matchLeagues.filter(thisLeague => thisLeague.category != firstTimeCategory);
        }

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
        let reverseTeams = teamCount.find(e => e.fantasy_type == 4);
        let wizardTeams = teamCount.find(e => e.fantasy_type == 5);


        let classicJoinedLeague = joinedLeagues.filter(e => e.fantasy_type == 1).map(v => v.league_id).filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        });
        let battingJoinedLeague = joinedLeagues.filter(e => e.fantasy_type == 2).map(v => v.league_id).filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        });
        let bowlingJoinedLeague = joinedLeagues.filter(e => e.fantasy_type == 3).map(v => v.league_id).filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        });
        let reverseJoinedLeague = joinedLeagues.filter(e => e.fantasy_type == 4).map(v => v.league_id).filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        });
        let wizardJoinedLeague = joinedLeagues.filter(e => e.fantasy_type == 5).map(v => v.league_id).filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        });


        let leagueRecommendation = await SQL.Users.getUserExtras(user_id);
        if (leagueRecommendation) {
            leagueRecommendation = leagueRecommendation.league_recommendation;
            leagueRecommendation = JSON.parse(leagueRecommendation)
        }

        let matchFantasyType = JSON.parse(matchDetails.match_fantasy_type)

        if (matchFantasyType) {
            matchDetails.match_fantasy_type = matchFantasyType.join()
        } else if (matchFantasyType == null) {
            matchDetails.match_fantasy_type = null
        }
        // if(deviceType == 2){
        //     let version = req.headers["versioncode"];
        //     console.log("====--------------------------------------------->>>> ", version);
        //     if(version < '21402507') {
        //         // match_fantasy_type
        //             matchDetails.match_fantasy_type = '1,2,3';
        //         }
        // }
        const response = {
                announcements: announcements.length ? announcements[0] : null,
                active_tickets: active_tickets,
                ticket_used: ticket_used,
                leagues: matchLeagues,
                match: matchDetails,
                classic_teams: classicTeams ? classicTeams.total_teams : 0,
                batting_teams: battingTeams ? battingTeams.total_teams : 0,
                bowling_teams: bowlingTeams ? bowlingTeams.total_teams : 0,
                reverse_teams: reverseTeams ? reverseTeams.total_teams : 0,
                wizard_teams: wizardTeams ? wizardTeams.total_teams : 0,
                classic_leagues: classicJoinedLeague.length ? classicJoinedLeague.length : 0,
                batting_leagues: battingJoinedLeague.length ? battingJoinedLeague.length : 0,
                bowling_leagues: bowlingJoinedLeague.length ? bowlingJoinedLeague.length : 0,
                reverse_leagues: reverseJoinedLeague.length ? reverseJoinedLeague.length : 0,
                wizard_leagues: wizardJoinedLeague.length ? wizardJoinedLeague.length : 0,
                // match_fantasy_type: matchFantasyType.length > 0 ? matchFantasyType : null,
                league_recommendation: leagueRecommendation ? leagueRecommendation : null,
                league_recommendation_category: Config.league_recommendation_category
            }
            //release connection after response
        const released = await db.on('release', (connection) => {
            console.log(connection.threadId);
        });
        //   console.log("released connection......", released);
        return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('Success'), res, response, req)
    }).catch(e => {
        console.log('error => ', e);
        return e
    })
}


//Find all players of a particular match which is_playing

exports.getMatchPlayersList = async(req, res, next) => {
    console.log('body==-------- >  ', req.query);
    let { match_key, fantasy_type } = req.query;
    if (!match_key) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('REQUIRED_FIELDS'), res);
    let match = await SQL.Cricket.getMatchByKey(` match_short_name,
    start_date_unix, start_date_india, match_format, closing_ts, match_order, team_a_season_key, team_a_key, team_a_name,t1.team_a_short_name, team_b_season_key, team_b_key, team_b_name, team_b_short_name,match_status, status_overview, show_playing22, playing22, pdf_status, show_last_11, show_prob_11, gender_match_category, t2.team_flag AS team_a_flag, t3.team_flag AS team_b_flag `, match_key);
    let players = await Utils.Redis.getAsync(Utils.Keys.CRICKET_PLAYERS + "_" + match_key);
    if (!players) {
        console.log("Players found From DB");
        // let wherePlayers = `where match_key = ${match_key} and is_playing = 0 order by player_playing_role`;
        players = await SQL.Cricket.getMatchPlayers(match_key);

        await Utils.Redis.set(Utils.Keys.CRICKET_PLAYERS + "_" + match_key, JSON.stringify(players), 'EX', Utils.RedisExpire.CRICKET_PLAYERS);
    } else {
        players = JSON.parse(players)
        console.log("Players found From Reddis");
    }
    match = match[0] ? match[0] : null;
    // if(fantasy_type == 4){
    //     players = players.map(e =>{
    //         e.player_credits = (11 + 7.5) - e.player_credits;
    //         return e;
    //     })
    // }
    const response = {
            players: players.length ? players : [],
            match: match
        }
        // const released = await db.on('release', (connection) => {
        //     console.log(connection.threadId);
        // });
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('Success'), res, response)
}


exports.createTeam = async(req, res, next) => {
    console.log('Creating a new team...');
    let userIp = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let userId = user.user_id;
    let { match_key: matchKey, players, captain, vice_captain: myViceCaptain, fantasy_type: fantasyType, wizard: myWizard } = req.body;
    // console.log(userId, players, '-lo-', captain, myViceCaptain, fantasyType);
    if (!userId || !players || !captain || !myViceCaptain || !fantasyType) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    captain = parseInt(captain.trim());
    myViceCaptain = parseInt(myViceCaptain.trim());
    fantasyType = parseInt(fantasyType);
    const fantasyTypes = [1, 2, 3, 4, 5];
    players = players.split(',');
    // captain = captain.trim();
    // myViceCaptain = myViceCaptain.trim();
    // console.log(fantasyTypes.includes(fantasyType));
    // console.log('fantasyTypes.includes(fantasyType)', fantasyType, fantasyTypes.includes(fantasyType));
    if (!fantasyTypes.includes(fantasyType)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
    let MaxPlayers, defaultKeepers, defaultAllRounders, defaultBatsman, defaultBowlers, maxCredits, maxFromTeam;
    let selectMaxPlayerError;
    if (fantasyType == 1) {
        MaxPlayers = 11;
        defaultKeepers = { min: 1, max: 4 };
        defaultAllRounders = { min: 1, max: 4 };
        defaultBatsman = { min: 3, max: 6 };
        defaultBowlers = { min: 3, max: 6 };
        maxCredits = 100;
        maxFromTeam = 7;
        selectMaxPlayerError = __('SELECT_11');
    } else if (fantasyType == 4) {
        MaxPlayers = 11;
        defaultKeepers = { min: 1, max: 4 };
        defaultAllRounders = { min: 1, max: 4 };
        defaultBatsman = { min: 3, max: 6 };
        defaultBowlers = { min: 3, max: 6 };
        maxCredits = 100;
        maxFromTeam = 7;
    } else if (fantasyType == 5) {
        MaxPlayers = 11;
        defaultKeepers = { min: 1, max: 4 };
        defaultAllRounders = { min: 1, max: 4 };
        defaultBatsman = { min: 3, max: 6 };
        defaultBowlers = { min: 3, max: 6 };
        maxCredits = 100;
        maxFromTeam = 7;
    } else {
        MaxPlayers = 5;
        maxCredits = 45;
        maxFromTeam = 3;
        selectMaxPlayerError = __('SELECT_5');
    }
    // remove extra space from players
    players = players.map(i => parseInt(i.trim()));
    // console.log('total selected players ==>>', players.length, fantasyType);
    // validate total players (as provided by user)
    // console.log("MAx Players", MaxPlayers, "Players length", players.length);
    if (players.length != MaxPlayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", selectMaxPlayerError, res)

    // validate captains and vice-captains
    if (!captain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SELECT_CAPTAIN'), res)
    if (!myViceCaptain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SELECT_VICE_CAPTAIN'), res)
    if (captain == myViceCaptain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SAME_CAPTAINS'), res);
    let wizardPlayerRole = "wizard";
    if (fantasyType == 5) {
        if (!myWizard) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('SELECT_WIZARD'), res);
        if (captain == myWizard) {
            wizardPlayerRole = "captain_wizard"
        } else if (myViceCaptain == myWizard) {
            wizardPlayerRole = "vice_captain_wizard";
        }
    }
    // console.log('aaa', captain, players.includes(captain));

    if (!players.includes(captain) || !players.includes(myViceCaptain)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('invalid_cp_vp'), res);

    // get match
    let matchColumns = `match_short_name, team_a_season_key, team_b_season_key, read_index`;
    let match = await SQL.Cricket.getMatchTableByKey(matchKey, matchColumns);
    if (!match || match.length <= 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
    match = match[0];
    //check match is closed
    // console.log('is match closed', match.closed);
    if (match.closed == 1) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('Match is closed now.'), res);
    console.log("--->>>> ", players.toString());

    //  get all players within the match
    let allplayers = await SQL.Cricket.getPlayersByMatchKey(`match_key = ${matchKey} AND player_key IN(${players.toString()})`);
    if (!allplayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
    // validate total players (valid players)
    if (allplayers.length != MaxPlayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", selectMaxPlayerError, res);

    // create different types of fantasy 1=Classic, 2=Batting, 3=Bowling
    if (fantasyType == 1 || fantasyType == 4) {
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
        let keeper = bowlers = batsman = allRounder = credits = team_1 = team_2 = 0;
        for (let i of allplayers) {
            let this_player_key = i.player_key;
            let this_team_key = i.team_season_key;
            this_team_key++ //increase team
            credits += i.player_credits;
            // console.log("credits for fantasy_type = 1 are..", credits)
            if (i.player_playing_role == "keeper") keeper++ //increase keeper
                else if (i.player_playing_role == "allrounder") allRounder++ //increase all rounder
                    else if (i.player_playing_role == "batsman") batsman++ //increase batsman
                        else if (i.player_playing_role == "bowler") bowlers++ //increase bowler
        }

        // validate defaults
        let error = "";
        // if ($keeper != $defaultKeepers) $error = SELECT_KEEPER;

        if (allRounder < defaultAllRounders.min) {
            error = __('MINIMUM_ROLE') + defaultAllRounders.min + " wicket keeper"
        } else if (allRounder > defaultAllRounders.max) {
            error = __('MINIMUM_ROLE') + defaultKeepers.max + " wicket keeper"
        } else if (allRounder < defaultAllRounders.min) {
            error = __('MINIMUM_ROLE') + defaultAllRounders.min + " all rounder"
        } else if (allRounder > defaultAllRounders.max) {
            error = __('MAXIMUM_ROLE') + defaultAllRounders.max + " all rounder";
        } else if (batsman < defaultBatsman.min) {
            error = __('MINIMUM ROLE') + defaultBatsman.min + " batsman"
        } else if (batsman > defaultBatsman.max) {
            error = __('MAXIMUM_ROLE') + defaultBatsman.max + " batsman"
        } else if (bowlers < defaultBowlers.min) {
            error = __('MINIMUM_ROLE') + defaultBowlers.min + " bowler";
        } else if (bowlers > defaultBowlers.max) {
            error = __('MAXIMUM_ROLE') + defaultBowlers.max + " bowler";
        } else if (team_1 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
        else if (team_2 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
        else if (credits > maxCredits) error = __('MAX_CREDITS') + maxCredits;
        if (error.length > 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", error, res);
    } else if (fantasyType == 2 || fantasyType == 3) {
        // for batting and bowling teams
        /**
         * TEAM VALIDATION PROCEDURE
         *
         * Players = 5
         * Max players from a team = 3
         * Captain = Vice Captain = 1
         * Credits <= 45
         * Team not already exists
         *
         */
        let keeper = credits = team_1 = team_2 = 0;
        for (let i of allplayers) {
            let this_player_key = i.player_key;
            let this_team_key = i.season_team_key;
            this_team_key++ //increase team
            credits += i.player_credits;
            // console.log("fantasy type for 2 and 3 credits are....", credits);
            if (i.player_playing_role == "keeper") keeper++ //increase keeper
        }

        // validate defaults

        error = '';
        if (fantasyType == 3 && keeper) error = "You can't select keeper in bowling fantasy.";
        else if (team_1 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
        else if (team_2 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
        else if (credits > maxCredits) error = __('MAX_CREDITS') + maxCredits + " credits";
        if (error) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", error, res);
    }
    // check if same team alredy exists
    //fantasy type != 1 or neither != 2,3
    where_clause = `t1.user_id = ${userId} and t1.match_key = ${matchKey} and t1.fantasy_type = ${fantasyType}`
    let userTeams = await SQL.Cricket.getUserTeamDetails(`*`, where_clause);
    console.log(`Total teams are ${userTeams.length}`);
    let userTeamsArray = [];
    let maxTeam = 0;
    let teamNumber;
    let teamObj = { team: '', players: [], role: '' };
    // return res.send({ team: userTeams })
    Bluebird.each(userTeams, async(userTeam, index, length) => {
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
            } else if (userTeam.player_role == 'captain_wizard') {
                formatedTeam.captain_wizard = userTeam.player_key
            } else if (userTeam.player_role == 'wizard') {
                formatedTeam.wizard = userTeam.player_key
            } else if (userTeam.player_role == 'vice_captain_wizard') {
                formatedTeam.vice_captain_wizard = userTeam.player_key
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
            } else if (userTeam.player_role == 'captain_wizard') {
                teamDetails.captain_wizard = userTeam.player_key
            } else if (userTeam.player_role == 'wizard') {
                teamDetails.wizard = userTeam.player_key
            } else if (userTeam.player_role == 'vice_captain_wizard') {
                teamDetails.vice_captain_wizard = userTeam.player_key
            }
            teamDetails.players.push(userTeam.player_key);
            console.log('if teamDetails>> userTeamArray', userTeamsArray)

        }
    }).then(async _ => {
        let matchedPlayers = [];
        let matchedTeam = [];
        // let teamsCaptainAndViceCaptain = [];
        //check for duplicate teams
        let isIncludes = [],
            matchedPlayersBool = false;
        Bluebird.each(userTeamsArray, (team, index, length) => {
            matchedPlayers = team.players.filter(x => players.includes(x));
            if (matchedPlayers.length == 11 || matchedPlayers.length == 5) {
                matchedPlayersBool = true;
                matchedTeam.push(team);
                isIncludes = matchedTeam.filter(thisTeam => thisTeam.captain == captain && thisTeam.vice_captain == myViceCaptain);
            }
        }).then(async _ => {
            if (fantasyType != 5) {
                console.log("Inside new user exist", isIncludes, "matched PLayerss", matchedPlayers, matchedPlayersBool);
                if (matchedPlayersBool && isIncludes.length > 0) {
                    return Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS'), res);
                }
            }
            let isIncludesWizard = [];
            if (fantasyType == 5) {
                console.log("inside the fantasy 5 >>>");
                // console.log("matchedTeam>>> ", matchedTeam, isIncludes.length)
                // console.log("matchedPlayers>>> ", matchedPlayers, players);
                isIncludes = matchedTeam.filter(thisTeam => thisTeam.captain == captain || thisTeam.captain_wizard == captain && thisTeam.vice_captain == myViceCaptain || thisTeam.vice_captain_wizard == myViceCaptain);

                isIncludesWizard = matchedTeam.filter(thisTeam => thisTeam.captain_wizard == myWizard || thisTeam.vice_captain_wizard == myWizard || thisTeam.wizard == myWizard)

                if (matchedPlayersBool && isIncludes.length > 0 && isIncludesWizard.length > 0) {
                    // teamsCaptainAndViceCaptain = [];
                    return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS_WIZARD'), res);
                }
            }
            // console.log("matchedTeam>>> ", matchedTeam, isIncludes.length, isIncludesWizard.length)
            console.log("matchedPlayers>>> ", matchedPlayers, players);

            // let sameFantasyLogic = [1,2,3,4]
            if ((fantasyType == 1 || fantasyType == 4) && matchedPlayersBool && isIncludes.length > 0) {
                // teamsCaptainAndViceCaptain = [];
                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS'), res);
            }

            if ((fantasyType == 2 || fantasyType == 3) && matchedPlayersBool && isIncludes.length > 0) {
                // teamsCaptainAndViceCaptain = [];
                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS'), res);
            }
            if (maxTeam >= Config.MAX_TEAM) {
                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('MAX_TEAM_ERROR'), res);
            }
            let bulkInsertData = [];
            let bulkInsertDataForReddis = []
            let sqsData = [];
            let playerObj = {};
            let currentDate = await Utils.CurrentDate.currentDate();
            Bluebird.each(allplayers, (thisPlayer, index, lenght) => {
                let playerType = thisPlayer.player_playing_role;
                if (fantasyType == 2) playerType = "batsman";
                else if (fantasyType == 3) playerType = "bowler";

                let playerRole = null;
                if (thisPlayer.player_key == captain) playerRole = "captain";
                else if (thisPlayer.player_key == myViceCaptain) playerRole = "vice_captain";

                if (fantasyType == 5) {
                    if (thisPlayer.player_key == myWizard) playerRole = wizardPlayerRole
                }

                console.log("wizardrole ----->", wizardPlayerRole)

                console.log("team Key>>>>>>>>>>>>>>>>> Role", thisPlayer.team_key, playerRole, thisPlayer.credits);
                playerObj = {
                    user_id: userId,
                    match_key: matchKey,
                    fantasy_type: fantasyType,
                    team_number: maxTeam + 1,
                    player_key: thisPlayer.player_key,
                    player_type: playerType,
                    player_role: playerRole,
                    points: 0,
                    date_added: currentDate,
                }
                bulkInsertData.push(playerObj)
                sqsData.push({
                    user_id: userId,
                    match_key: matchKey,
                    fantasy_type: fantasyType,
                    team_number: maxTeam + 1,
                    player_key: thisPlayer.player_key,
                    player_type: playerType,
                    player_role: playerRole,
                    points: 0,
                    date_added: currentDate,
                    //for cache
                    player_playing_role: playerType,
                    scores: "0.000",
                    player_name: thisPlayer.player_name,
                    player_photo: thisPlayer.player_photo,
                    team_key: thisPlayer.team_key,
                    seasonal_role: thisPlayer.player_playing_role,
                    credits: thisPlayer.player_credits,
                    is_playing: thisPlayer.is_playing,
                    is_playing11_last: thisPlayer.is_playing11_last,
                    is_playing11_prob: thisPlayer.is_playing11_prob,
                    team_short_name: thisPlayer.team_short_name
                })

                let playerObjReddis = {
                    ...playerObj,
                    player_playing_role: playerType,
                    scores: "0.000",
                    player_name: thisPlayer.player_name,
                    player_photo: thisPlayer.player_photo,
                    team_key: thisPlayer.team_key,
                    seasonal_role: thisPlayer.player_playing_role,
                    credits: thisPlayer.player_credits,
                    is_playing: thisPlayer.is_playing,
                    is_playing11_last: thisPlayer.is_playing11_last,
                    is_playing11_prob: thisPlayer.is_playing11_prob
                }
                playerObjReddis.player_playing_role = playerType;
                bulkInsertDataForReddis.push(playerObjReddis)
                    // bulkInsertData[index].player_playing_role = playerType;
                    // console.log("bulkInsertdata >>>", bulkInsertData);

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
                let teamData = {
                    fantasy_type: fantasyType,
                    team_number: maxTeam + 1,
                    players: sqsData,
                }
                if (Config.ENABLE_SQS) {
                    let sqsTeamObj = {
                        delete_team: [],
                        add_team: sqsData
                    }
                    Utils.AwsUtils.sendSqsMessage(sqsTeamObj, async function(err, success) {
                        if (err) {
                            console.log("Error", err);
                            return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SQS_DATA_ERROR'), res);
                        } else {
                            // console.log("Success", success);
                            // let ipInsert = await SQL.Users.insertData2(ipTableData, 'bb_user_teams_ip')
                            return await Utils.ResponseHandler(true, 200, "success", __('success'), res, { team: teamData });
                        }
                    })
                } else {
                    console.log("bulkInsertdataReddis  >>>", bulkInsertDataForReddis);
                    let teamInsertStatus = await SQL.Cricket.teamBulkInsert(bulkInsertData, 'bb_user_teams')
                    // let ipInsertStatus = await SQL.Users.insertData2(ipTableData, 'bb_user_teams_ip');
                    let teamNumberForRedis = bulkInsertData[0].team_number;

                    // Utils.Redis.set(Utils.Keys.USER_TEAMS_MODEL + "_" + userId + "_" + matchKey + "_" + teamNumberForRedis + "_" + fantasyType, JSON.stringify(bulkInsertDataForReddis), 'EX', Utils.RedisExpire.USER_TEAMS_MODEL)
                    // res.send({team : bulkInsertData});
                    return await Utils.ResponseHandler(true, 200, "success", __('success'), res, { team: teamData });
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

exports.updateTeams = async(req, res, next) => {
    try {
        let userIp = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null);
        let user = req.user;
        if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
        let userId = user.user_id;
        console.log('userId is', user.user_id);
        let { match_key: matchKey, players, captain, vice_captain: myViceCaptain, fantasy_type: fantasyType, team_number, wizard: myWizard } = req.body;
        // console.log(userId, players, '-lo-', captain, myViceCaptain, fantasyType);
        if (!userId || !players || !captain || !myViceCaptain || !fantasyType || !team_number) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
        captain = parseInt(captain.trim());
        myViceCaptain = parseInt(myViceCaptain.trim());
        fantasyType = parseInt(fantasyType);
        const fantasyTypes = [1, 2, 3, 4, 5];
        players = players.split(',');
        // captain = captain.trim();
        // myViceCaptain = myViceCaptain.trim();
        console.log(fantasyTypes.includes(fantasyType));
        console.log('fantasyTypes.includes(fantasyType)', fantasyType, fantasyTypes.includes(fantasyType));
        if (!fantasyTypes.includes(fantasyType)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
        let MaxPlayers, defaultKeepers, defaultAllRounders, defaultBatsman, defaultBowlers, maxCredits, maxFromTeam;
        let selectMaxPlayerError;
        if (fantasyType == 1) {
            MaxPlayers = 11;
            defaultKeepers = { min: 1, max: 4 };
            defaultAllRounders = { min: 1, max: 4 };
            defaultBatsman = { min: 3, max: 6 };
            defaultBowlers = { min: 3, max: 6 };
            maxCredits = 100;
            maxFromTeam = 7;
            selectMaxPlayerError = __('SELECT_11');
        } else if (fantasyType == 4) {
            MaxPlayers = 11;
            defaultKeepers = { min: 1, max: 4 };
            defaultAllRounders = { min: 1, max: 4 };
            defaultBatsman = { min: 3, max: 6 };
            defaultBowlers = { min: 3, max: 6 };
            maxCredits = 100;
            maxFromTeam = 7;
        } else if (fantasyType == 5) {
            MaxPlayers = 11;
            defaultKeepers = { min: 1, max: 4 };
            defaultAllRounders = { min: 1, max: 4 };
            defaultBatsman = { min: 3, max: 6 };
            defaultBowlers = { min: 3, max: 6 };
            maxCredits = 100;
            maxFromTeam = 7;
        } else {
            MaxPlayers = 5;
            maxCredits = 45;
            maxFromTeam = 3;
            selectMaxPlayerError = __('SELECT_5');
        }
        // remove extra space from players
        players = players.map(i => parseInt(i.trim()));
        console.log('total selected players ==>>', players.length, fantasyType);
        // validate total players (as provided by user)
        // console.log("MAx Players", MaxPlayers, "Players length", players.length);
        if (players.length != MaxPlayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", selectMaxPlayerError, res)

        // validate captains and vice-captains
        if (!captain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SELECT_CAPTAIN'), res)
        if (!myViceCaptain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SELECT_VICE_CAPTAIN'), res)
        if (captain == myViceCaptain) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SAME_CAPTAINS'), res);
        console.log('aaa', captain, players.includes(captain));

        let wizardPlayerRole = "wizard";
        if (fantasyType == 5) {
            if (!myWizard) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('SELECT_WIZARD'), res);
            if (captain == myWizard) {
                wizardPlayerRole = "captain_wizard"
            } else if (myViceCaptain == myWizard) {
                wizardPlayerRole = "vice_captain_wizard";
            }
        }

        if (!players.includes(captain) || !players.includes(myViceCaptain)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('invalid_cp_vp'), res);

        // get match
        let matchColumns = ` match_short_name, team_a_season_key, team_b_season_key, read_index `;
        let match = await SQL_QUERY_MATCH.getMatchTableByKey(matchKey, matchColumns);
        if (!match || match.length <= 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
        match = match[0];
        //check match is closed
        console.log('is match closed', match.closed);
        if (match.closed == 1) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('Match is closed now.'), res);
        console.log("--->>>> ", players.toString());

        //  get all players within the match
        let allplayers = await SQL.Cricket.getPlayersByMatchKey(`match_key = ${matchKey} AND player_key IN(${players.toString()})`);
        if (!allplayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
        // validate total players (valid players)
        if (allplayers.length != MaxPlayers) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", selectMaxPlayerError, res);

        // create different types of fantasy 1=Classic, 2=Batting, 3=Bowling
        if (fantasyType == 1 || fantasyType == 4) {
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
            let keeper = bowlers = batsman = allRounder = credits = team_1 = team_2 = 0;
            for (let i of allplayers) {
                let this_player_key = i.player_key;
                let this_team_key = i.team_season_key;
                this_team_key++ //increase team
                credits += i.player_credits;
                console.log("credits for fantasy_type = 1 are..", credits)
                if (i.player_playing_role == "keeper") keeper++ //increase keeper
                    else if (i.player_playing_role == "allrounder") allRounder++ //increase all rounder
                        else if (i.player_playing_role == "batsman") batsman++ //increase batsman
                            else if (i.player_playing_role == "bowler") bowlers++ //increase bowler
            }

            // validate defaults
            let error = "";
            // if ($keeper != $defaultKeepers) $error = SELECT_KEEPER;

            if (allRounder < defaultAllRounders.min) {
                error = __('MINIMUM_ROLE') + defaultAllRounders.min + " wicket keeper"
            } else if (allRounder > defaultAllRounders.max) {
                error = __('MINIMUM_ROLE') + defaultKeepers.max + " wicket keeper"
            } else if (allRounder < defaultAllRounders.min) {
                error = __('MINIMUM_ROLE') + defaultAllRounders.min + " all rounder"
            } else if (allRounder > defaultAllRounders.max) {
                error = __('MAXIMUM_ROLE') + defaultAllRounders.max + " all rounder";
            } else if (batsman < defaultBatsman.min) {
                error = __('MINIMUM ROLE') + defaultBatsman.min + " batsman"
            } else if (batsman > defaultBatsman.max) {
                error = __('MAXIMUM_ROLE') + defaultBatsman.max + " batsman"
            } else if (bowlers < defaultBowlers.min) {
                error = __('MINIMUM_ROLE') + defaultBowlers.min + " bowler";
            } else if (bowlers > defaultBowlers.max) {
                error = __('MAXIMUM_ROLE') + defaultBowlers.max + " bowler";
            } else if (team_1 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
            else if (team_2 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
            else if (credits > maxCredits) error = __('MAX_CREDITS') + maxCredits;
            if (error.length > 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", error, res);
        } else if (fantasyType == 2 || fantasyType == 3) {
            // for batting and bowling teams
            /**
             * TEAM VALIDATION PROCEDURE
             *
             * Players = 5
             * Max players from a team = 3
             * Captain = Vice Captain = 1
             * Credits <= 45
             * Team not already exists
             *
             */
            keeper = credits = team_1 = team_2 = 0;
            for (let i of allplayers) {
                let this_player_key = i.player_key;
                let this_team_key = i.season_team_key;
                this_team_key++ //increase team
                credits += i.player_credits;
                // console.log("fantasy type for 2 and 3 credits are....", credits);
                if (i.player_playing_role == "keeper") keeper++ //increase keeper
            }

            // validate defaults

            error = '';
            if (fantasyType == 3 && keeper) error = "You can't select keeper in bowling fantasy.";
            else if (team_1 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
            else if (team_2 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
            else if (credits > maxCredits) error = __('MAX_CREDITS') + maxCredits + " credits";
            if (error) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", error, res);
        }
        // check if same team alredy exists
        //fantasy type != 1 or neither != 2,3
        where_clause = `t1.user_id = ${userId} and t1.match_key = ${matchKey} and t1.fantasy_type = ${fantasyType}`
        let userTeams = await SQL.Cricket.getUserTeamDetails(`*`, where_clause);
        console.log(`Total teams are ${userTeams.length}`);
        let userTeamsArray = [];
        let maxTeam = 0;
        let teamNumber;
        let teamObj = { team: '', players: [], role: '' };
        // return res.send({ team: userTeams })
        let currentDate = await Utils.CurrentDate.currentDate();
        Bluebird.each(userTeams, async(userTeam, index, length) => {
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
                } else if (userTeam.player_role == 'captain_wizard') {
                    formatedTeam.captain_wizard = userTeam.player_key
                } else if (userTeam.player_role == 'wizard') {
                    formatedTeam.wizard = userTeam.player_key
                } else if (userTeam.player_role == 'vice_captain_wizard') {
                    formatedTeam.vice_captain_wizard = userTeam.player_key
                }
                formatedTeam.players.push(userTeam.player_key)
                userTeamsArray.push(formatedTeam);
            } else {
                teamDetails.team_number = userTeam.team_number;
                if (userTeam.player_role == 'captain') {
                    teamDetails.captain = userTeam.player_key
                } else if (userTeam.player_role == 'vice_captain') {
                    teamDetails.vice_captain = userTeam.player_key
                } else if (userTeam.player_role == 'captain_wizard') {
                    teamDetails.captain_wizard = userTeam.player_key
                } else if (userTeam.player_role == 'wizard') {
                    teamDetails.wizard = userTeam.player_key
                } else if (userTeam.player_role == 'vice_captain_wizard') {
                    teamDetails.vice_captain_wizard = userTeam.player_key
                }
                teamDetails.players.push(userTeam.player_key);
                console.log('if teamDetails>> userTeamArray', userTeamsArray)
            }
        }).then(_ => {
            let matchedPlayers = [];
            let matchedTeam = [];
            // let teamsCaptainAndViceCaptain = [];
            //check for duplicate teams
            let matchedPlayersBool = false;
            let isIncludes;
            Bluebird.each(userTeamsArray, (team, index, length) => {
                if (team.team_number != team_number) {
                    console.log("Inside if userTeamArray ", userTeamsArray);
                    matchedPlayers = team.players.filter(x => players.includes(x));

                    if (matchedPlayers.length == 11 || matchedPlayers.length == 5) {
                        matchedPlayersBool = true;
                        matchedTeam.push(team);
                    }
                }

                // teamsCaptainAndViceCaptain.push(team.vice_captain);
                // teamsCaptainAndViceCaptain.push(team.captain);
                // console.log("teamsCaptainAndViceCaptain is Captain and vice_captain >>>>", teamsCaptainAndViceCaptain, captain, myViceCaptain);
            }).then(async _ => {
                isIncludes = matchedTeam.filter(thisTeam => thisTeam.captain == captain && thisTeam.vice_captain == myViceCaptain);
                // console.log("matchedTeam>>> ", matchedTeam, isIncludes.length)
                // console.log("matchedPlayers>>> ", matchedPlayers, players, matchedPlayersBool);

                let isIncludesWizard = []
                if (fantasyType == 5) {
                    console.log("inside the fantasy 5 >>>");
                    console.log("matchedTeam>>> ", matchedTeam, isIncludes.length, isIncludesWizard.length)
                    console.log("matchedPlayers>>> ", matchedPlayers, players);
                    isIncludes = matchedTeam.filter(thisTeam => thisTeam.captain == captain || thisTeam.captain_wizard == captain && thisTeam.vice_captain == myViceCaptain || thisTeam.vice_captain_wizard == myViceCaptain);

                    isIncludesWizard = matchedTeam.filter(thisTeam => thisTeam.captain_wizard == myWizard || thisTeam.vice_captain_wizard == myWizard || thisTeam.wizard == myWizard)

                    if (matchedPlayersBool && isIncludes.length > 0 && isIncludesWizard.length > 0) {
                        // teamsCaptainAndViceCaptain = [];
                        return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS_WIZARD'), res);
                    }
                }
                console.log("matchedTeam>>> ", matchedTeam, isIncludes.length)
                console.log("matchedPlayers>>> ", matchedPlayers, players);

                // let sameFantasyLogic = [1,2,3,4]
                if ((fantasyType == 1 || fantasyType == 4) && matchedPlayersBool && isIncludes.length > 0) {
                    // teamsCaptainAndViceCaptain = [];
                    return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS'), res);
                }

                if ((fantasyType == 2 || fantasyType == 3) && matchedPlayersBool && isIncludes.length > 0) {
                    // teamsCaptainAndViceCaptain = [];
                    return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS'), res);
                }
                // if (matchedPlayers && isIncludes.length > 0) {
                //     return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('USER_TEAM_EXISTS'), res);
                // }
                let bulkInsertData = [];
                let sqsData = [];
                let bulkInsertDataForReddis = [];
                let playerObj = {};
                Bluebird.each(allplayers, (thisPlayer, index, length) => {
                    let playerType = thisPlayer.player_playing_role;
                    if (fantasyType == 2) playerType = "batsman";
                    else if (fantasyType == 3) playerType = "bowler";

                    let playerRole = null;
                    if (thisPlayer.player_key == captain) playerRole = "captain";
                    else if (thisPlayer.player_key == myViceCaptain) playerRole = "vice_captain";
                    if (fantasyType == 5) {
                        if (thisPlayer.player_key == myWizard) playerRole = wizardPlayerRole
                    }

                    playerObj = {
                        user_id: userId,
                        match_key: matchKey,
                        fantasy_type: fantasyType,
                        team_number: team_number,
                        player_key: thisPlayer.player_key,
                        player_type: playerType,
                        player_role: playerRole,
                        points: 0,
                        date_added: currentDate,

                    }

                    bulkInsertData.push(playerObj)
                    sqsData.push({
                        user_id: userId,
                        match_key: matchKey,
                        fantasy_type: fantasyType,
                        team_number: team_number,
                        player_key: thisPlayer.player_key,
                        player_type: playerType,
                        player_role: playerRole,
                        points: 0,
                        date_added: currentDate,
                        //for cache
                        player_playing_role: playerType,
                        scores: "0.000",
                        player_name: thisPlayer.player_name,
                        player_photo: thisPlayer.player_photo,
                        team_key: thisPlayer.team_key,
                        seasonal_role: thisPlayer.player_playing_role,
                        credits: thisPlayer.player_credits,
                        is_playing: thisPlayer.is_playing,
                        is_playing11_last: thisPlayer.is_playing11_last,
                        is_playing11_prob: thisPlayer.is_playing11_prob,
                        team_short_name: thisPlayer.team_short_name
                    })

                    let playerObjReddis = {
                        ...playerObj,
                        player_playing_role: playerType,
                        scores: "0.000",
                        player_name: thisPlayer.player_name,
                        player_photo: thisPlayer.player_photo,
                        team_key: thisPlayer.team_key,
                        seasonal_role: thisPlayer.player_playing_role,
                        credits: thisPlayer.player_credits,
                        is_playing: thisPlayer.is_playing,
                        is_playing11_last: thisPlayer.is_playing11_last,
                        is_playing11_prob: thisPlayer.is_playing11_prob
                    }
                    playerObjReddis.player_playing_role = playerType;
                    bulkInsertDataForReddis.push(playerObjReddis)
                        // bulkInsertData[index].player_playing_role = playerType
                        // console.log("bulkInsertdata >>>", bulkInsertData);

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
                            delete_team: {
                                "user_id": userId,
                                "match_key": matchKey,
                                "team_number": team_number,
                                "fantasy_type": fantasyType
                            },
                            add_team: sqsData
                        }
                        Utils.AwsUtils.sendSqsMessage(sqsTeamObj, async function(err, success) {
                            if (err) {
                                console.log("Error", err);
                                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('SQS_DATA_ERROR'), res);
                            } else {
                                // console.log("Success", success);
                                // let ipInsert = await SQL.Users.insertData2(ipTableData, 'bb_user_teams_ip')
                                return await Utils.ResponseHandler(true, 200, "success", __('success'), res, success);
                            }
                        })
                    } else {

                        await SQL.Cricket.removeUserTeam(`user_id=${userId} and match_key = ${matchKey} and team_number = ${team_number} and fantasy_type=${fantasyType}`)
                        console.log("bulkInsertdataforReddis >>>", bulkInsertDataForReddis);
                        let teamInsertStatus = await SQL.Cricket.teamBulkInsert(bulkInsertData, 'bb_user_teams');

                        let teamNumberForRedis = bulkInsertData[0].team_number;


                        // Utils.Redis.set(Utils.Keys.USER_TEAMS_MODEL + "_" + userId + "_" + matchKey + "_"  + teamNumberForRedis + "_" + fantasyType, JSON.stringify(bulkInsertDataForReddis), 'EX', Utils.RedisExpire.USER_TEAMS_MODEL);

                        // let ipInsertStatus = await SQL.Users.insertData2(ipTableData, 'bb_user_teams_ip')
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
// ........................get teams of a particular user..............................
exports.userTeams = async(req, res, next) => {
    let { match_key, fantasy_type } = req.body;
    let Score = req.body.livescore;
    let liveScore = null;
    if (Score) {
        liveScore = await SQL.Cricket.getLiveScore(match_key);
    }
    fantasy_type = fantasy_type ? req.body.fantasy_type : 0;
    fantasy_type = fantasy_type == 0 ? Utils.Constants.fantasyTypes : fantasy_type;
    if (liveScore) liveScore = liveScore.length > 0 ? liveScore[0] : null
    let user = req.user
    if (!user || !match_key) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __('WRONG_DATA'), res);
    let teams
    try {
        teams = await LeaguesController.fetchUserTeams(user.user_id, match_key, fantasy_type)
    } catch (e) {
        return await Utils.ResponseHandler(false, e.status, e.title, e.Msg, res);
    }
    let response = { team: teams, live_score: liveScore };
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "success", __('success'), res, response);
}

//.......................get joined_leagues of particular match of user ..............///
exports.getJoinedLeaguesOfUser = async(req, res, next) => {
    const { match_key, user_id, fantasy_type } = req.query;
    console.log("user id", user_id);
    console.log("match_key", match_key);
    console.log("fantasy_type", fantasy_type);
    //if fantasy_type provided from frontend
    if (fantasy_type) {
        const leagues = await SQL_QUERY_MATCH.getLeagueCountOfEachMatchOfUser(user_id, match_key, fantasy_type);

        const response = {
                total_leagues: leagues.length,
                Leagues: leagues
            }
            //release connection after response
        const released = await db.on('release', (connection) => {
            console.log(connection.threadId);
        });

        //   console.log("released connection......", released);
        return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('Success'), res, response);

    } else {

        const leagues = await SQL_QUERY_MATCH.getLeagueCountOfEachMatchOfUser(user_id, match_key, fantasy_type);
        const response = {
                total_leagues: leagues.length,
                Leagues: leagues
            }
            //release connection after response
        const released = await db.on('release', (connection) => {
            console.log(connection.threadId);
        });

        //   console.log("released connection......", released);
        return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('Success'), res, response);
    }

}


exports.getJoinedMatches = async(req, res, next) => {
    let user = req.user;
    let user_id = user.user_id;
    if (!user || !user_id) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRONG_DATA'), res);

    let live = [];
    let upcomings = [];
    let completed = [];
    let matchList = await Utils.Redis.getAsync(Utils.Keys.CRICKET_JOINED_LEAGUES_MATCHES);
    if (!matchList) {
        console.log("MatchList from DB");
        matchList = await SQL.Cricket.getUserJoinedLeaguesMatches();
        // console.log("MatchList .......", matchList);
        await Utils.Redis.set(Utils.Keys.CRICKET_JOINED_LEAGUES_MATCHES, JSON.stringify(matchList), 'EX', Utils.RedisExpire.CRICKET_JOINED_LEAGUES_MATCHES)
    } else {
        console.log("MatchList from Rediis");
        // console.log("MatchList .......", matchList);

        matchList = JSON.parse(matchList)
    }
    for (let k of matchList) {
        let thisMatch = k.match_key;
        let thisSeason = k.season_key;
        let thisClosed = k.closed;
        let thisStatus = k.match_status;
        let thisOverview = k.status_overview;
        let thisMatchFantasyType = k.match_fantasy_type;


        //  console.log("thisMatchFantasyType>>>>", thisMatchFantasyType, typeof thisMatchFantasyType)
        let fantasyStr, fantasyAr = [],
            fantasyStr1;
        if (thisMatchFantasyType != null) {
            // console.log("if 1>>");

            fantasyStr = thisMatchFantasyType
            fantasyAr = JSON.parse(fantasyStr)
        }

        if (fantasyAr.length > 0) {
            // console.log("if 2>>");

            fantasyStr1 = fantasyAr.join();
            thisMatchFantasyType = fantasyStr1;
        }

        // console.log("thisMatchFantasyType>>>>", thisMatchFantasyType, typeof thisMatchFantasyType)
        k.match_fantasy_type = thisMatchFantasyType;



        let readIndex = k.read_index;
        if (readIndex == 1) readTable = "bb_closed_user_leagues_1";
        else if (readIndex == 2) readTable = "bb_closed_user_leagues_2";
        else if (readIndex == 9) readTable = "bb_user_leagues_dump";
        else readTable = "bb_user_leagues";
        console.log("readTable is >>>>", readTable, thisStatus);
        let totalJoinedLeagues = await Utils.Redis.getAsync(Utils.Keys.JOINED_LEAGUES_COUNT + "_" + thisMatch + "_" + user_id );
        totalJoinedLeagues = "";
        if(!totalJoinedLeagues){
            totalJoinedLeagues = await SQL.Cricket.getTotalJoinedLeaguesCountMatches(thisMatch, user_id, readTable);
            if(totalJoinedLeagues.length > 0){
                totalJoinedLeagues = totalJoinedLeagues[0].total_leagues;
                if(totalJoinedLeagues > 0)
                    await Utils.Redis.set(Utils.Keys.JOINED_LEAGUES_COUNT + "_" + thisMatch + "_" + user_id , JSON.stringify(totalJoinedLeagues), 'EX', Utils.RedisExpire.JOINED_LEAGUES_COUNT)
            }else totalJoinedLeagues =0;
        }else{
            totalJoinedLeagues = totalJoinedLeagues.length > 0 ? totalJoinedLeagues[0].total_leagues : 0;
            // totalJoinedLeagues = totalJoinedLeagues.length > 0 ? totalJoinedLeagues[0].total_leagues : 0;
            console.log("from redis joined league count =>", totalJoinedLeagues);
        }

        // let totalJoinedLeagues = await SQL.Cricket.countUserLeagues(user_id, thisMatch, false, readTable);

        if (totalJoinedLeagues > 0) {
            // console.log("thisStatus >>>", thisStatus);
            if (thisStatus == "started") live.push(k);
            else if (thisStatus == "notstarted") upcomings.push(k);
            else completed.push(k)
        }
    }

    // sort completed
    if (completed.length > 1) {
        let completedMatches = this.sortCompleted(completed);
        completed = completedMatches;
    }



    if (!live || !upcomings || !completed) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Not Found', __('LEAGUES_NOT_FOUND'), res);

    let screenType = 1;
    let playType = 1;
    let announcements = await Utils.Redis.getAsync(Utils.Keys.CRICKET_ANNOUNCEMENTS + '_' + screenType + '_' + playType)
    if (!announcements) {
        console.log('Announcements list from Database');
        let date = await currentDate.currentDate()
        announcements = await SQL.Users.getAnnouncements(screenType, playType, null, date)
        Utils.Redis.set(Utils.Keys.CRICKET_ANNOUNCEMENTS + '_' + screenType + '_' + playType, JSON.stringify(announcements), 'EX', Utils.RedisExpire.CRICKET_ANNOUNCEMENTS);
    } else {
        announcements = JSON.parse(announcements);
    }
    announcements = announcements.length ? announcements[0] : null;
    let response = {
        announcements: announcements,
        match: {
            live: live,
            upcoming: upcomings,
            completed: completed
        },
        notifications: user.notifications
    }
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('Success'), res, response);
}

//....................GET USER JOINED LEAGUES PER MATCH.........................................///////////
exports.getUserJoinedLeaguesPermatch = async(req, res, next) => {
    let user = req.user;
    if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'UNAUTHORIZE_ACCESS', __('UNAUTHORIZE_ACCESS'), res);
    let user_id = user.user_id;
    let { match_key, fantasy_type } = req.query;
    let fantasyType = fantasy_type ? fantasy_type : 0;
    // if(fantasyType == 0) fantasyType = null

    console.log("match_key>>>", match_key)
    if (!user_id || !match_key) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('REQUIRED_FIELDS'), res);
    let columns = ` match_name, match_short_name, read_index, match_related_name, start_date_unix, start_date_india, match_format, closing_ts, match_order, team_a_season_key, team_a_key, team_a_name, team_a_short_name, team_b_season_key, team_b_key, team_b_name, team_b_short_name, match_status, status_overview, playing22, show_playing22, show_playing22_type, match_fantasy_type, IF((start_date_unix - UNIX_TIMESTAMP() - closing_ts) <= 0,
    1,
    0) AS closed `
    let match = await SQL.Cricket.getMatchByKey(columns, match_key);
    if (match && !match.length) {
        // console.log('Match details ==>> ',match);
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __('WRONG_DATA'), res);
    }

    match = match[0];

    // let matchNewdata = await SQL.Cricket.getMatchDetailsByMatchKey(match_key)
    // matchNewdata = matchNewdata[0]
    console.log("match>>>", match)

    let readIndex = match.read_index;
    let teamTable = "bb_user_teams";
    let leagueTable = "bb_user_leagues";
    if (readIndex == 1) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_1";
    } else if (readIndex == 2) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_2";
    } else if (readIndex == 9) {
        teamTable = "bb_user_teams_dump";
        leagueTable = "bb_user_leagues_dump";
    }
    console.log(">>", leagueTable, readIndex);
    let leagues = await Utils.Redis.getAsync(Utils.Keys.CRIC_JOINED_LEAGUES + "_" + user_id + "_" + match_key + "_" + fantasy_type);
    console.log('league==>> ', fantasyType);
    if (!leagues || leagues.length == 0) {
        console.log("Leagues From DB.....")
        leagues = await SQL.Cricket.getUserLeaguesWithTopRankV1(user_id, match_key, leagueTable, null, fantasyType);
        await Utils.Redis.set(Utils.Keys.CRIC_JOINED_LEAGUES + "_" + user_id + "_" + match_key + "_" + fantasy_type, JSON.stringify(leagues), 'EX', Utils.RedisExpire.CRIC_JOINED_LEAGUES);
    } else {
        leagues = JSON.parse(leagues)
    }
    /**
     * Get the unjoined private leagues
     */
    console.log("matchClosed>>>", match.closed);
    let unjoinedPrivateLeagues = [];
    if (match.closed !== 1) {
        unjoinedPrivateLeagues = await SQL.Cricket.getUnjoinedPrivate(match_key, user_id, fantasyType);

    }

    let privateUnjoined = [];


    if (unjoinedPrivateLeagues.length > 0) {
        for (let private of unjoinedPrivateLeagues) {
            let thisObj = {
                match_key: private.match_key,
                fantasy_type: private.fantasy_type,
                league_id: private.league_id,
                user_id: private.created_by,
                team_rank: 0,
                rank: 0,
                old_team_rank: 0,
                league_name: private.league_name,
                league_type: private.league_type,
                team_type: private.team_type,
                confirmed_league: private.confirmed_league,
                max_players: private.max_players,
                win_amount: private.win_amount,
                joining_amount: private.joining_amount,
                total_joined: private.total_joined,
                total_winners: private.total_winners,
                league_code: private.league_code,
                is_private: private.is_private,
                is_infinity: private.is_infinity,
                win_per_user: private.win_per_user,
                total_winners_percent: private.total_winners_percent,
                banner_image: private.banner_image,
                league_winner_type: private.league_winner_type
            }
            privateUnjoined.push(thisObj)
        }
    }

    console.log("Unjoined private  >>>", unjoinedPrivateLeagues);
    leagues = [...leagues, ...privateUnjoined]

    //
    let screenType = 4;
    let playType = 1;
    let announcements = await Utils.Redis.getAsync(Utils.Keys.CRICKET_ANNOUNCEMENTS + '_' + screenType + '_' + playType)
    if (!announcements) {
        console.log('Announcements list from Database');
        // const anouncementsWhere = `where play_type = ${1} and screen_type = 3`

        let date = await currentDate.currentDate()
        announcements = await SQL.Users.getAnnouncements(screenType, playType, match_key, date) //screen_type = 4
        Utils.Redis.set(Utils.Keys.CRICKET_ANNOUNCEMENTS + '_' + screenType + '_' + playType, JSON.stringify(announcements), 'EX', Utils.RedisExpire.CRICKET_ANNOUNCEMENTS);
    } else {
        announcements = JSON.parse(announcements);
    }
    announcements = announcements.length ? announcements[0] : null;

    let liveScore = await Utils.Redis.getAsync(Utils.Keys.LIVE_SCORE + "_" + user_id);
    if (!liveScore) {
        liveScore = await SQL.Cricket.getLiveScore(match_key);
        await Utils.Redis.set(Utils.Keys.LIVE_SCORE + "_" + user_id, JSON.stringify(liveScore), 'EX', Utils.RedisExpire.LIVE_SCORE);
    } else {
        liveScore = JSON.parse(liveScore);
    }

    //user team count
    let teamCount = await Utils.Redis.getAsync(Utils.Keys.TEAM_COUNT + "_" + user_id);
    if (!teamCount) {
        console.log("Team count from Db");
        teamCount = await SQL.Cricket.getTeamCountByMatch(user_id, match_key, fantasyType, teamTable)
        console.log("teamCount are >>>>", teamCount);

        await Utils.Redis.set(Utils.Keys.TEAM_COUNT + "_" + user_id, JSON.stringify(teamCount), 'EX', Utils.RedisExpire.TEAM_COUNT);
    } else {
        teamCount = JSON.parse(teamCount);
    }
    let uniqueJoinedLeagues = []
        // console.log("leagues are >>", leagues)
    let classicTeams = teamCount.find(e => e.fantasy_type == 1);
    let battingTeams = teamCount.find(e => e.fantasy_type == 2);
    let bowlingTeams = teamCount.find(e => e.fantasy_type == 3);
    let reverseTeams = teamCount.find(e => e.fantasy_type == 4);
    let wizardTeams = teamCount.find(e => e.fantasy_type == 5);
    if (liveScore) {
        liveScore = liveScore.length > 0 ? liveScore[0] : null
    }
    let matchFantasyType = JSON.parse(match.match_fantasy_type);
    if (matchFantasyType) {
        match.match_fantasy_type = matchFantasyType.join()
    } else if (matchFantasyType == null) {
        match.match_fantasy_type = null
    }
    console.log("uniqueJoinedLeagues >>>>", uniqueJoinedLeagues);

    let response = {
        announcements: announcements,
        live_score: liveScore,
        leagues: leagues,
        match: match,
        classic_teams: classicTeams ? classicTeams.total_teams : 0,
        batting_teams: battingTeams ? battingTeams.total_teams : 0,
        bowling_teams: bowlingTeams ? bowlingTeams.total_teams : 0,
        reverse_teams: reverseTeams ? reverseTeams.total_teams : 0,
        wizard_teams: wizardTeams ? wizardTeams.total_teams : 0,
        // match_fantasy_type: matchFantasyType.length > 0 ? matchFantasyType : null,
    }
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('LEAGUES_FOUND_SUCCESS'), res, response);

}

//.............................Get Joined User of a league in a match...................

exports.getJoinedLeagueUsersOfMatch = async(req, res, next) => {
    const { match_key, league_id } = req.query;
    let { user_id } = req.user;
    console.log(">>>", user_id);
    let page = req.query.page;
    if (!user_id || !match_key || !league_id || !page) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRONG_DATA'), res);
    let match = await SQL.Cricket.getMatchByKey("*", match_key);
    if (match && !match.length) {
        // console.log('Match details ==>> ',match);
        return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __('WRONG_DATA'), res);
    }
    let leagueTable, teamTable;
    match = match[0];
    let readIndex = match.read_index;
    if (readIndex == 1) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_1";
    } else if (readIndex == 2) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_2";
    } else if (readIndex == 9) {
        teamTable = "bb_user_teams_dump";
        leagueTable = "bb_user_leagues_dump";
    }
    console.log("leagueTable>>", leagueTable);
    //paginate
    let perPage = 50;
    page = req.query.page ? req.query.page : 1
    page = page == 0 || page < 0 ? 1 : page
    let offset = ((perPage * page) - perPage);
    // console.log("Offset is >>>", offset);
    let limit = perPage;

    let JoinedLeagueUsers = await Utils.Redis.getAsync(Utils.Keys.CRIC_LEAGUES + league_id);
    if (!JoinedLeagueUsers) {
        JoinedLeagueUsers = await SQL.Cricket.getUserLeaguesDetails(match_key, league_id, leagueTable);
        console.log("joinedLeagueUsers from DB", );

        // if (!JoinedLeagueUsers) JoinedLeagueUsers = [];
        JoinedLeagueUsers = await JoinedLeagueUsers.sort((a, b) => a.team_rank - b.team_rank);
        await Utils.Redis.set(Utils.Keys.CRIC_LEAGUES + league_id, JSON.stringify(JoinedLeagueUsers), 'EX', Utils.RedisExpire.CRIC_LEAGUES);
    } else {
        JoinedLeagueUsers = JSON.parse(JoinedLeagueUsers);
        console.log("joinedLeagueUsers from Reddis", );
    }
    let liveScore = await SQL.Cricket.getLiveScore(match_key);

    /**
     * @old method for selfUser
     * let Self = JoinedLeagueUsers.filter(i => i.user_id == user_id);
     */

    /**
     * @new method for selfuser
     */
   
    let Self = await Utils.Redis.getAsync('SELF_CRIC_LEAGUES' + league_id + user_id + match_key);
    Self = false;
    if (!Self) {
        Self = await SQL.Cricket.getUserLeaguesDetailsForSelf(match_key, league_id, user_id, leagueTable);
        // if (!JoinedLeagueUsers) JoinedLeagueUsers = [];
        await Utils.Redis.set('SELF_CRIC_LEAGUES' + league_id + user_id + match_key, JSON.stringify(Self), 'EX', Utils.RedisExpire.CRIC_LEAGUES);
    } else {
        Self = JSON.parse(Self);
    }
    Self = await Self.sort((a, b) => a.team_rank - b.team_rank);

    // JoinedLeagueUsers = JoinedLeagueUsers.slice(perPage * (page - 1), perPage * page);

    let OpponentUsers = JoinedLeagueUsers.filter(i => i.user_id != user_id);

    // let matchName = await SQL.Cricket.getMatchByKey(`match_short_name`, match_key);
    // matchName = matchName[0]
    let response = {
        opponent_users: OpponentUsers,
        self: Self,
        current_page: page,
        live_score: liveScore,

    }

    return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('Success'), res, response);
}

//matchScoreBoard

exports.postMatchScoreCard = async(options) => {
    return new Promise(async(resolve, rejected) => {
        let matchKey = options.match_key;
        let userId = options.user_id;

        if (!matchKey && !userId) return rejected({ Msg: __('WRONG_DATA'), title: "wrong_data" });

        let scoreData = await SQL.Cricket.getLiveScoreByMatch(matchKey)
        console.log("scoredata is arr >>>>", scoreData)
        scoreData = scoreData.length > 0 ? scoreData[0] : {}

        let bannerList = await SQL.Cricket.getScoreBoardBanner(matchKey)

        console.log("scoredata is >>>>", scoreData)
        if (Object.keys(scoreData).length > 0) {
            if(scoreData.response)
                scoreData.response = scoreData.response.replace(/\\/g, "");
            scoreData.response = JSON.parse(scoreData.response);
        }

        scoreData.banner = bannerList.length > 0 ? bannerList : null;

        console.log("after scoredata >>>>", scoreData);

        return await resolve({ Msg: __('Success'), title: "score", response: scoreData });
    })
}

//fullFantasyScoreBoard ------------->
exports.matchScoreboard = async(options) => {
    return new Promise(async(resolve, rejected) => {
        let matchKey = options.match_key;
        let userId = options.user_id;
        let teamNumber = options.team_number;
        let fantasyType = options.fantasy_type ? options.fantasy_type : 0;
        let scoreType = options.score_type;
        let selfUserId = options.self_user_id

        //0 --> full_fantasy , 1 --> user_team
        scoreType = scoreType ? scoreType : 1;


        if (!fantasyType) return await rejected({ Msg: __('WRONG_DATA'), title: "wrong fantasy" });
        if (userId == 0) return await rejected({ Msg: "Please refresh the leagues page to see opponent teams.", title: 'wrong_data' });

        if (!matchKey) return await rejected({ Msg: __('WRONG_DATA'), title: 'match key error' });
        let match = await SQL.Cricket.getMatchByKey(`match_name, match_short_name, read_index, match_related_name, start_date_unix, start_date_india, match_format, closing_ts, match_order, team_a_season_key, team_a_key, team_a_name, team_a_short_name, team_b_season_key, team_b_key, team_b_name, team_b_short_name, match_status, status_overview, playing22, show_playing22, show_playing22_type, match_fantasy_type, IF((start_date_unix - UNIX_TIMESTAMP() - closing_ts) <= 0,
        1,
        0) AS closed`, matchKey)
            // console.log("match Is 9999>>",match)
        match = match.length > 0 ? match[0] : null;
        console.log("match is >>", match);

        if (!match) return await rejected({ Msg: __('WRONG_DATA'), title: 'wrong data' })
        let matchClosed = match.closed;
        let scoreBoard, response;
        let notPlayerList = [];
        if (matchClosed == 1) {
            // check is request is for user team
            if (scoreType == 1) {
                // userId = selfUserId
                // console.log("self_user_id >>>", userId);

                let readTable = (match.read_index == 9) ? "bb_user_teams_dump" : "bb_user_teams";
                // get user team scorecard
                if (!userId && !teamNumber && !fantasyType) {
                    return await rejected({ Msg: __('WRONG_DATA'), title: 'Wrong data' })
                }

                scoreBoard = await SQL.Cricket.getPlaying22ByUserTeam(matchKey, userId, teamNumber, fantasyType, readTable)

            } else if (scoreType == 0) {
                scoreBoard = await SQL.Cricket.getPlaying22ByMatchkey(matchKey)
                console.log("ScoreBoard full fantasy>>", scoreBoard);

            }

            let finalPlayerList = [];
            let playerNotPlaying22 = [],
                getHighestPlayerScore = [];
            if (fantasyType && fantasyType == 4) {
                playerNotPlaying22 = await SQL.Cricket.getPlayerNotIn22(matchKey)

                getHighestPlayerScore = await SQL.Cricket.getMaxScorePlayer(matchKey, 'player_score')
                    // console.log("highest player score >>>", getHighestPlayerScore);
                getHighestPlayerScore = getHighestPlayerScore.length > 0 ? getHighestPlayerScore[0] : []

                for (let thisPlayer of playerNotPlaying22) {
                    notPlayerList.push(thisPlayer.player_key);
                }

                console.log("NotPlayer list  >>>>", notPlayerList);
                console.log('scoreBoard is >>>', scoreBoard.length);

                for (let player of scoreBoard) {
                    if (notPlayerList.includes(player.players_key)) {
                        player.points_starting = getHighestPlayerScore.points_starting;
                        player.points_batting_runs = getHighestPlayerScore.points_batting_runs;
                        player.points_batting_fours = getHighestPlayerScore.points_batting_fours;
                        player.points_batting_sixes = getHighestPlayerScore.points_batting_sixes;
                        player.points_batting_50 = getHighestPlayerScore.points_batting_50;
                        player.points_batting_100 = getHighestPlayerScore.points_batting_100;
                        player.points_batting_rate = getHighestPlayerScore.points_batting_rate;
                        player.points_batting_duck = getHighestPlayerScore.points_batting_duck;
                        player.points_bowling_maidens = getHighestPlayerScore.points_bowling_maidens;
                        player.points_bowling_wickets = getHighestPlayerScore.points_bowling_wickets;
                        player.points_bowling_wicket4 = getHighestPlayerScore.points_bowling_wicket4;
                        player.points_bowling_wicket5 = getHighestPlayerScore.points_bowling_wicket5;
                        player.points_bowling_economy = getHighestPlayerScore.points_bowling_economy;
                        player.points_fielding_catch = getHighestPlayerScore.points_fielding_catch;
                        player.points_fielding_runout = getHighestPlayerScore.points_fielding_runout;
                        player.points_fielding_stumped = getHighestPlayerScore.points_fielding_stumped;
                        player.player_score = getHighestPlayerScore.player_score;
                        player.captain_score = getHighestPlayerScore.captain_score;
                        player.vice_captain_score = getHighestPlayerScore.vice_captain_score;
                        player.player_score_batting = getHighestPlayerScore.player_score_batting;
                        player.captain_score_batting = getHighestPlayerScore.captain_score_batting;
                        player.vice_captain_score_batting = getHighestPlayerScore.vice_captain_score_batting;
                        player.player_score_bowling = getHighestPlayerScore.player_score_bowling;
                        player.captain_score_bowling = getHighestPlayerScore.captain_score_bowling;
                        player.vice_captain_score_bowling = getHighestPlayerScore.vice_captain_score_bowling;
                        player.wizard_score = getHighestPlayerScore.wizard_score;
                        player.captain_score_wizard = getHighestPlayerScore.captain_score_wizard;
                        player.vice_captain_score_wizard = getHighestPlayerScore.vice_captain_score_wizard;
                        player.captain_score_reverse = getHighestPlayerScore.captain_score_reverse;
                        player.vice_captain_score_reverse = getHighestPlayerScore.vice_captain_score_reverse;
                    }

                    finalPlayerList.push(player)
                }
            }
            console.log("finalPlayerList >>>", finalPlayerList);

            scoreBoard = finalPlayerList.length > 0 ? finalPlayerList : scoreBoard;

            response = {
                scoreboard: scoreBoard,
                highestscoreplayer: getHighestPlayerScore.length > 0 ? getHighestPlayerScore : null,
                show_playing22: match.show_playing22 ? match.show_playing22 : null
            }

            return await resolve({ Msg: __('Success'), title: "score", response: response });

        } else {
            if (scoreType == 1) {
                if (selfUserId != userId) {
                    return await rejected({ Msg: `Match is not closed yet.`, title: `match_not_closed` })
                }
                let readTable = (match.read_index == 9 ? "bb_user_teams_dump" : "bb_user_teams");
                // get user team scorecard
                if (!userId && !teamNumber && !fantasyType) return rejected({ Msg: __('WRONG_DATA'), title: 'wrong data' });

                scoreBoard = await SQL.Cricket.getPlaying22ByUserTeam(matchKey, userId, teamNumber, fantasyType, readTable);
                let finalPlayerList = [];
                let playerNotPlaying22 = [],
                    getHighestPlayerScore = []
                console.log("scoreBoard >>>>----0", scoreBoard.length);

                if (fantasyType && fantasyType == 4) {
                    playerNotPlaying22 = await SQL.Cricket.getPlayerNotIn22(matchKey)

                    getHighestPlayerScore = await SQL.Cricket.getMaxScorePlayer(matchKey, 'player_score')
                        // console.log("highest player score >>>", getHighestPlayerScore);
                    getHighestPlayerScore = getHighestPlayerScore.length > 0 ? getHighestPlayerScore[0] : []

                    for (let thisPlayer of playerNotPlaying22) {
                        notPlayerList.push(thisPlayer.player_key);
                    }

                    console.log("NotPlayer list in else >>>>", notPlayerList, scoreBoard.length);

                    for (let player of scoreBoard) {
                        if (notPlayerList.includes(player.players_key)) {
                            player.points_starting = getHighestPlayerScore.points_starting;
                            player.points_batting_runs = getHighestPlayerScore.points_batting_runs;
                            player.points_batting_fours = getHighestPlayerScore.points_batting_fours;
                            player.points_batting_sixes = getHighestPlayerScore.points_batting_sixes;
                            player.points_batting_50 = getHighestPlayerScore.points_batting_50;
                            player.points_batting_100 = getHighestPlayerScore.points_batting_100;
                            player.points_batting_rate = getHighestPlayerScore.points_batting_rate;
                            player.points_batting_duck = getHighestPlayerScore.points_batting_duck;
                            player.points_bowling_maidens = getHighestPlayerScore.points_bowling_maidens;
                            player.points_bowling_wickets = getHighestPlayerScore.points_bowling_wickets;
                            player.points_bowling_wicket4 = getHighestPlayerScore.points_bowling_wicket4;
                            player.points_bowling_wicket5 = getHighestPlayerScore.points_bowling_wicket5;
                            player.points_bowling_economy = getHighestPlayerScore.points_bowling_economy;
                            player.points_fielding_catch = getHighestPlayerScore.points_fielding_catch;
                            player.points_fielding_runout = getHighestPlayerScore.points_fielding_runout;
                            player.points_fielding_stumped = getHighestPlayerScore.points_fielding_stumped;
                            player.player_score = getHighestPlayerScore.player_score;
                            player.captain_score = getHighestPlayerScore.captain_score;
                            player.vice_captain_score = getHighestPlayerScore.vice_captain_score;
                            player.player_score_batting = getHighestPlayerScore.player_score_batting;
                            player.captain_score_batting = getHighestPlayerScore.captain_score_batting;
                            player.vice_captain_score_batting = getHighestPlayerScore.vice_captain_score_batting;
                            player.player_score_bowling = getHighestPlayerScore.player_score_bowling;
                            player.captain_score_bowling = getHighestPlayerScore.captain_score_bowling;
                            player.vice_captain_score_bowling = getHighestPlayerScore.vice_captain_score_bowling;
                            player.wizard_score = getHighestPlayerScore.wizard_score;
                            player.captain_score_wizard = getHighestPlayerScore.captain_score_wizard;
                            player.vice_captain_score_wizard = getHighestPlayerScore.vice_captain_score_wizard;
                            player.captain_score_reverse = getHighestPlayerScore.captain_score_reverse;
                            player.vice_captain_score_reverse = getHighestPlayerScore.vice_captain_score_reverse;
                        }

                        finalPlayerList.push(player)
                    }
                }
                scoreBoard = finalPlayerList.length > 0 ? finalPlayerList : scoreBoard;

                response = {
                    scoreboard: scoreBoard,
                    highestscoreplayer: getHighestPlayerScore.length > 0 ? getHighestPlayerScore : null,
                    show_playing22: match.show_playing22 ? match.show_playing22 : null
                }

                return await resolve({ Msg: __('Success'), title: "score", response: response });
            } else {

                return await rejected({ Msg: `Match is not closed yet.`, title: `match_not_closed` })
            }
        }
    })

}

/////////...................GEt Full fantasy ScoreBoard .................//////////////
exports.getFullfantasyScoreBoard = async(req, res, next) => {
    let matchKey = req.query.match_key;
    let scoreType = req.query.type;
    scoreType = parseInt(scoreType);
    let userId = req.user.user_id;
    let teamNumber = req.query.team_number;
    let fantasyType = req.query.fantasy_type;
    if (userId == 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __('OPPONENT_TEAM'), res);
    if (!matchKey) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __("WRONG_DATA"), res);
    let match = await SQL.Cricket.getMatchByKey("*", matchKey);
    if (!match.length > 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Wrong_Data', __('MATCH_NOT_FOUND'), res);
    //get match
    match = await SQL.Cricket.getMatchfantasyScore(matchKey);
    if (!match.length > 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('MATCH_NOT_FOUND'), res);
    // check match is closed
    let matchClosed = match[0].closed;
    console.log(matchClosed, "ssssssssss");
    let scoreboard
    if (matchClosed == 1) {
        // check is request is for user team
        if (scoreType) {
            console.log("MatchClosed 1 scoreType 1")
            let readTable = match.read_index == 9 ? "bb_user_teams_dump" : "bb_user_teams";
            // get user team scorecard
            if (!userId || !teamNumber || !fantasyType) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRONG_DATA'), res);
            scoreboard = await SQL.Cricket.getPlaying22ByUserTeam(matchKey, userId, teamNumber, fantasyType, readTable);
        } else {
            console.log("MatchClosed 1 scoreType 0")
                // get match Scoreboard
            scoreboard = await SQL.Cricket.getPlaying22ByMatchkey(matchKey);
        }

        let response = {
            scoreboard: scoreboard.length > 0 ? scoreboard : null
        }

        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('Success'), res, response);

    } else {
        if (scoreType) {
            console.log("MatchClosed 0 scoreType 1");
            readTable = match[0].read_index == 9 ? "bb_user_teams_dump" : "bb_user_teams";
            // get user team scorecard
            if (!userId || !teamNumber || !fantasyType) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRONG_DATA'), res);
            scoreboard = await SQL.Cricket.getPlaying22ByUserTeam(matchKey, userId, teamNumber, fantasyType, readTable);
            let response = {
                scoreboard: scoreboard.length > 0 ? scoreboard : null
            }
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('Success'), res, response);
        } else {
            console.log("MatchClosed 0 scoreType 0");
            // get match Scoreboard
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'match_not_closed', __('MATCH_NOT_CLOSED'), res)
        }
    }
}

exports.playerInfo = async(options) => {
    return new Promise(async(resolve, rejected) => {
        let { matchKey, playerKey, userId } = options;


        if (!matchKey || !playerKey) return await rejected({ Msg: __('WRONG_DATA'), title: 'Error', status: Utils.StatusCodes.Error })
            // get player info by match
        let playerInfo = await SQL.Cricket.getPlayerSeasonInfo(matchKey, playerKey);
        playerInfo = playerInfo[0];
        console.log("playerInfo is >>>", playerInfo);


        if (!playerInfo) return rejected({ Msg: __('PLAYER_NOT_FOUND'), title: 'not_found', status: Utils.StatusCodes.Error });

        let seasonKey = playerInfo.season_key;
        let matchInfo = await SQL.Cricket.getPlayerSelections(seasonKey, playerKey);
        let response;
        console.log("matchInfo is >>>", matchInfo);

        if (matchInfo.length > 0) {
            for (let k of matchInfo) {
                k.selected_by_classic = k.selected_by_classic.toString().length > 0 ? k.selected_by_classic + "%" : "0%";
                k.selected_by_batting = k.selected_by_batting.toString().length > 0 ? k.selected_by_batting + "%" : "0%";
                k.selected_by_bowling = k.selected_by_bowling.toString().length > 0 ? k.selected_by_bowling + "%" : "0%";
                k.selected_by_reverse = k.selected_by_reverse.toString().length > 0 ? k.selected_by_reverse + "%" : "0%";
                k.selected_by_wizard = k.selected_by_wizard.toString().length > 0 ? k.selected_by_wizard + "%" : "0%";
            }
            console.log("matchInfo is >>>", matchInfo);
            //  matchInfo = matchInfo.length == 1 ? matchInfo[0] : matchInfo
            response = { player_info: playerInfo, match_info: matchInfo };
            return await resolve({ Msg: __("SUCCESS"), title: 'Success', status: Utils.StatusCodes.Success, response: response });
        }
        response = { player_info: playerInfo, match_info: matchInfo.length > 0 ? matchInfo : null };
        console.log("response >>>", response)
        return await resolve({ Msg: __("SUCCESS"), title: 'Success', status: Utils.StatusCodes.Success, response: response });
    })
}

////// GEt Team And match details by which user joined ..............////////////
exports.getTeamDetailsForFullfantasyScore = async(req, res, next) => {
    let { match_key } = req.query;
    let user_id = req.user.user_id;
    if (!match_key || !user_id) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRON_DATA'), res);

    let teamDetails = await Utils.Redis.getAsync(Utils.Keys.CRIC_TEAM_DETAILS);
    if (!teamDetails) {
        console.log('team Details From DB')
        teamDetails = await SQL_QUERY_verification
        teamDetails = JSON.parse(teamDetails);
    }

    if (teamDetails.length > 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('TEAM_NOT_FOUND_FOR_MATCH_KEY'), res)

    let response = {
        teamDetails: teamDetails
    }

    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('TEAM_DETAILS_FOUND_SUCCESS'), res, response);
}



////////////..............get view more leageus category.....................//////////

exports.getViewMoreCategorizedLeagues = async(req, res, next) => {
    const { cat_id, match_key, fantasy_type } = req.query;
    const where_clause = `where category = ${cat_id} and match_key = ${match_key} and fantasy_type = ${fantasy_type}`;
    const categorized_leagues = await SQL_QUERY_MATCH.getViewMoreCategorizedLeagues(where_clause);

    const response = {
            categorized_leagues_length: categorized_leagues.length,
            categorized_leagues: categorized_leagues
        }
        //release connection after response
    const released = await db.on('release', (connection) => {
        console.log(connection.threadId);
    });

    //   console.log("released connection......", released);
    return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('Success'), res, response);
}

//........................get leagues details of a particular league....................//////////
exports.getLeagueDetails = async(req, res, next) => {
    const { league_id, fantasy_type } = req.query;
    const where_clause = `where league_id = ${league_id} and fantasy_type = ${fantasy_type}`;

    const league_details = await SQL_QUERY_MATCH.getLeagueDetails(where_clause);

    const response = {
            league_details_length: league_details.length,
            league_details: league_details
        }
        //release connection after response
    const released = await db.on('release', (connection) => {
        // console.log(connection.threadId);
    });

    //   console.log("released connection......", released);
    return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('Success'), res, response);
}

////////////////////...............................Get players Stats.......................................//////////////////
exports.getPlayerStats = async(req, res, next) => {
        let {} = req.body;

    }
    /////////////////////////////..............Get User valid tickets............................./////////////////
exports.getUserValidTickets = async(req, res, next) => {
    const { user_id } = req.query;
    // const where_clause = `where user_id = ${user_id} `;
    const valid_tickets = await SQL_QUERY_MATCH.getUserValidTickets(user_id)

    const response = {
            Valid_tickets_length: valid_tickets.length,
            Valid_tickets: valid_tickets
        }
        //release connection after response
    const released = await db.on('release', (connection) => {
        console.log(connection.threadId);
    });

    //   console.log("released connection......", released);
    return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('USER_TICKETS'), res, response);
}



// ////////////////////...........Team Preview of a user for a match ...........................................////////////////
// exports.getTeamPreviewOfMatchOfUser = async(req, res, next) => {
//     const { user_id, match_key, team_number, seasonal_key, fantasy_type } = req.query;

//     const where_clause = `where t1.user_id = ${user_id} and t1.match_key = ${match_key} and t1.team_number = ${team_number} and  t1.fantasy_type = ${fantasy_type} and t2.seasonal_key = ${seasonal_key}`

//     const preview_team = await SQL_QUERY_MATCH.getTeamPreviewOfMatchOfUser(where_clause);

//     const Api_stats = {


//     };
//     const response = {
//             team_preview_length: preview_team.length,
//             preview_team: preview_team
//         }
//         //release connection after response
//     const released = await db.on('release', (connection) => {
//         console.log(connection.threadId);
//     });

//     //   console.log("released connection......", released);
//     return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('TEAM_PREVIEW'), res, response);

// }

/////....LeaderBoards .......///////
exports.getLeaderBoard = async(req, res, next) => {
    let { fetch_type, screen_msg } = req.query;
    let user_id = req.user.user_id;
    let fetchType;
    let fetchArr = [1, 2, 3];
    console.log(">>>>", user_id);

    if (!user_id) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRONG_DATA'), res);

    fetchType = fetch_type ? parseInt(fetch_type) : 1;
    let isIncludes = fetchArr.includes(fetchType);

    console.log('isIncludes is ....', isIncludes);
    if (!isIncludes) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __('WRONG_DATA'), res);

    //paginate
    let perPage = 20;
    page = req.query.page ? req.query.page : 1;
    page = page == 0 || page < 0 ? 1 : page;
    let offset = ((perPage * page) - perPage);

    let filter = { fetch_type: fetchType, user_id: user_id };

    // fetch notifications
    let leaderBoards = await SQL.Users.getLeaderboards(filter, offset, perPage);
    console.log("Screen Msg is >>>>", screen_msg);
    let Announcements = null;
    if (screen_msg == 1) {
        // get screen announcement
        let date = await Utils.CurrentDate.currentDate()
        Announcements = await SQL.Users.getAnnouncements(5, false, false, date);
        // res.send(Announcements);
        // console.log("ANnouncements are>>>", Announcements);
        if (Announcements.length < 0) Announcements = null;
    }

    let leaderBoardFantasy = Config.LEADERBOARD_FANTASY_TYPES;
    leaderBoardFantasy = leaderBoardFantasy.toString()
    console.log("leadeerBoard fantasyType >>>", leaderBoardFantasy)
    let response = {
        Announcements: Announcements,
        current_page: page,
        limit: perPage,
        leaderboards: leaderBoards,
        fantasy_types: leaderBoardFantasy
    }
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('Success'), res, response);
}

/// GEt LeaderBoard ranking .......////
exports.getLeaderBoardRanking = async(req, res, next) => {

    let { leaderboard_id, fantasy_type } = req.query;
    let userId = req.user.user_id

    console.log(">>>>", userId);
    if (!userId) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'wrong_data', __('WRONG_DATA'), res);

    let lid = leaderboard_id;
    if (!lid) return await Utils.ResponseHandler(false, "wrong_data", __('WRONG_DATA'), res);

    let fantasyType = fantasy_type;
    let isIncludes = [1, 2, 3].includes(parseInt(fantasyType))
    console.log("ISincludes is>>>>", isIncludes);
    if (!fantasyType || !([1, 2, 3].includes(parseInt(fantasyType)))) {
        fantasyType = 0;
        req.query.page = 1;
    }
    //paginate
    let perPage = 50;
    page = req.query.page ? req.query.page : 1;
    page = page == 0 || page < 0 ? 1 : page;
    let offset = ((perPage * page) - perPage);

    if (!fantasyType) {
        console.log("Inside !fantasyType>>>", fantasyType);
        //for classic
        let selfClassic = await SQL.Users.getLeaders(lid, userId, false, false, true, "bb_leaders");
        selfClassic = selfClassic.length > 0 ? selfClassic[0] : null;

        let leadersClassic = await SQL.Users.getLeaders(lid, userId, offset, perPage, false, "bb_leaders");

        //for Batting
        let selfBatting = await SQL.Users.getLeaders(lid, userId, false, false, true, "bb_leaders_2");
        selfBatting = selfBatting.length > 0 ? selfBatting[0] : null;
        let leadersBatting = await SQL.Users.getLeaders(lid, userId, offset, perPage, false, "bb_leaders_2");

        //for bowling
        let selfBowling = await SQL.Users.getLeaders(lid, userId, false, false, true, "bb_leaders_3");
        selfBowling = selfBowling.length > 0 ? selfBowling[0] : null;
        let leadersBowling = await SQL.Users.getLeaders(lid, userId, offset, perPage, false, "bb_leaders_3");

        let response = {
            fantasy_type: parseInt(fantasyType),
            current_page: page,
            limit: perPage,
            leaders: {
                classic: { self: selfClassic, others: leadersClassic },
                Batting: { self: selfBatting, others: leadersBatting },
                Bowling: { self: selfBowling, others: leadersBowling }
            }
        }

        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Succes', __('LEADERS_SUCCESS'), res, response);
    }

    if (fantasyType == 1) {
        //for Classic
        let self = await SQL.Users.getLeaders(lid, userId, false, false, true, "bb_leaders");
        self = self.length > 0 ? self[0] : null;
        let leaders = await SQL.Users.getLeaders(lid, userId, offset, perPage, false, "bb_leaders");

        let response = {
            fantasy_type: parseInt(fantasyType),
            current_page: page,
            limit: perPage,
            leaders: {
                classic: {
                    self: self,
                    others: leaders
                }
            }

        }
        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('LEADERS_SUCCESS'), res, response);
    }
    if (fantasyType == 2) {
        //for Classic
        let self = await SQL.Users.getLeaders(lid, userId, false, false, true, "bb_leaders_2");
        self = self.length ? self[0] : null;
        let leaders = await SQL.Users.getLeaders(lid, userId, offset, perPage, false, "bb_leaders_2");

        let response = {
            fantasy_type: parseInt(fantasyType),
            current_page: page,
            limit: perPage,
            leaders: {
                Batting: {
                    self: self,
                    others: leaders
                }
            }
        }
        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('LEADERS_SUCCESS'), res, response);
    }
    if (fantasyType == 3) {
        //for classic
        self = await SQL_QUERY_USER.getLeaders(lid, userId, false, false, true, "bb_leaders_3");
        self = self.length > 0 ? self[0] : null;
        let leaders = await SQL_QUERY_USER.getLeaders(lid, userId, offset, perPage, false, "bb_leaders_3");
        let response = {
            fantasy_type: parseInt(fantasyType),
            current_page: page,
            limit: perPage,
            leaders: {
                Bowling: {
                    self: self,
                    others: leaders
                }
            }
        }
        return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('LEADERS_SUCCESS'), res, response);
    }

    return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Some Error', __('SOME_ERROR'), res);

}

//////>>>>>>> API TO CREATE PRIVATE LEAGUE<<<<<<<<<<//////////
exports.createPrivateLeague = async(req, res, next) => {
    try {
        let user = req.user;
        if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res)
        let user_id = user.user_id;
        let { match_key, fantasy_type } = req.body;
        if (!match_key || !user_id || !fantasy_type) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'wrong_data', __('WRONG_DATA'), res);
        if (!Validator.isIn(fantasy_type.toString(), Utils.Constants.fantasyTypes)) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'wrong_data', __('WRONG_DATA'), res);
        // get match
        const match = await SQL.Cricket.getMatchDetailsByMatchKey(match_key);
        if (!match.length > 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'wrong_data', __('WRONG_DATA'), res);

        // check match is closed
        let matchClosed = match[0].closed;
        if (matchClosed == 1) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Match_closed', __("MATCH_CLOSED"), res);

        // check if user and team exists for the match
        // let userTeams = await SQL.Users.getUserTeams(user_id, match_key, fantasy_type)
        // if (!userTeams) return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'NO_TEAMS', __("NO_TEAMS"), res);

        let required = {
            max_players: 1000,
            joining_amount: {
                min: 10,
                max: 10000
            },
            win_amount: {
                min: 10,
                max: 1000000
            }
        }

        const leagueTypes = new Array(1, 2); // 1=Cash, 2=Practice
        const teamTypes = new Array(1, 2); // 1=Multiple, 2=Single
        const confirmedLeagues = new Array(1, 2); // 1=No, 2=Yes
        const bonusApplicables = new Array(1, 2); // 1=No, 2=Yes
        const megaLeagues = new Array(0, 1); // 0=No, 1=Yes

        // LEAGUE DATA
        let leagueName = req.body.league_name;
        let totalPlayers = req.body.size;
        let winningAmount = req.body.winning_amount;
        let multipleJoin = req.body.multiple_join;
        let multipleWinners = req.body.total_winners;

        // validate team type, multiple or single
        let teamType = (multipleJoin == 0) ? 0 : 1;
        /**
         * Validate league name
         */
        if (!Validator.isAlphanumeric(Validator.blacklist(leagueName, ' '))) return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'INVALID_LEAGUE_NAME', __("INVALID_LEAGUE_NAME"), res);
        if (!Validator.isLength(leagueName, { min: 5, max: 30 })) return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'INVALID_LEAGUE_NAME_LENGTH', __("INVALID_LEAGUE_LENGTH"), res);

        /**
         * Validate max players
         */
        if (totalPlayers < 2 || totalPlayers > required.max_players) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'INVALID_PLAYERS', __("INVALID_PLAYERS"), res);
        }

        /**
         * Validate winning amount
         */
        if (winningAmount < required.win_amount.min || winningAmount > required.win_amount.max) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'INVALID_AMOUNT', __("INVALID_WIN_AMOUNT") + required.win_amount.min, res);
        }
        //total Winners
        let totalWinners = multipleWinners ? multipleWinners : 1;
        // validate total Winners
        if (totalWinners < 1) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'INVALID_WINNERS', __("INVALID_WINNERS"), res);
        }
        totalWinners = parseInt(totalWinners);
        totalPlayers = parseInt(totalPlayers);
        if (totalWinners > totalPlayers) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'INVALID_WINNERS', __("INVALID_WINNERS"), res);
        }
        // calculate joining amount
        let commissionRate = Utils.AppConstraint.PRIVATE_LEAGUE_COMMISSION;
        let commissionAmount = Math.ceil(winningAmount * commissionRate) / 100;

        let totalAmount = parseFloat(winningAmount) + parseFloat(commissionAmount);
        let joiningAmount = Math.ceil(totalAmount / totalPlayers);
        // validate joining amount,
        if (joiningAmount < required.joining_amount.min || totalWinners > required.joining_amount.max) {
            return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'INVALID_JOINING_AMOUNT', __("INVALID_JOINING_AMOUNT"), res);
        }

        //rake per user
        let rakePerUser = (totalAmount - winningAmount) / totalPlayers;
        if (rakePerUser < 0) rakePerUser = 0;

        // generate league code
        let leagueCode = await this.generateLeagueCode(6);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(6);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(6);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(6);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(7);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(7);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(7);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(7);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(8);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(8);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(8);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(8);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(9);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(9);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(9);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(9);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(10);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(10);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(10);
        if (!leagueCode) leagueCode = await this.generateLeagueCode(10);
        console.log("leaguecode2 >>>", leagueCode)
        if (!leagueCode) return await Utils.ResponseHandler(true, Utils.StatusCodes.Error, "league_code_error", __('SOME_ERROR'), res);


        let validData = {
            created_by: user_id,
            is_private: 1,
            league_code: leagueCode,
            fantasy_type: fantasy_type,
            match_key: match_key,
            league_type: 1,
            is_mega: 0,
            league_name: leagueName,
            team_type: teamType,
            confirmed_league: 1,
            bonus_applicable: 1,
            max_players: totalPlayers,
            joining_amount: joiningAmount,
            total_amount: totalAmount,
            win_amount: winningAmount,
            league_repeats: 0,
            total_winners: totalWinners,
            league_status: 1,
            rake_per_user: rakePerUser
        }

        let proceedLeagueData = {};
        let validatedWinners = [];

        if (totalWinners == 1) {
            //for a single winner
            let newLeague = await SQL.Users.insertData(validData, "bb_leagues");
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'success', __("success"), res, { league: { league_id: newLeague.insertId } });
        } else {
            //for multiple winners
            let winners = req.body.ranks;
            if (!winners || winners == undefined) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'winners_required', __('WINNER_AMOUMNT_REQUIRED'), res);
            winners = winners.split(',').map(i => parseInt(i));
            if (winners.length != totalWinners) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "winner_error", __('ALL_RANKS_REQUIRED', { totalWinners: totalWinners }), res);
            // validate winner data
            let totalPrizeAmount = 0;
            for (i = 0; i < totalWinners; i++) {
                let j = i + 1; //actual work
                //check Rank
                if (typeof winners[i] == 'undefined' || winners[i] == null) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Prize Required", __("WINNING_AMOUNT_REQUIRED_FOR_RANK", { rank: j }), res);
                let prevAmount = winningAmount;
                if (i) prevAmount = winners[i - 1];
                let prizeAmount = winners[i];
                /**
                 * Validating the prize amount
                 */
                if (prizeAmount < 1 || totalWinners > prevAmount) {
                    return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'INVALID_JOINING_AMOUNT', __("INVALID_JOINING_AMOUNT"), res);
                }
                totalPrizeAmount += prizeAmount;
                let rankObj = {};
                rankObj.from = j;
                rankObj.to = j;
                rankObj.price = prizeAmount;
                validatedWinners.push(rankObj);
            }
            // check total prize amount
            if (totalPrizeAmount != winningAmount) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Distribution', __("PLEASE_DISTRIBUTE_PRIZE_AMOUNT_CORRECTLY"), res);
            // Default league status for multiple winners
            validData.league_status = 2;
            proceedLeagueData = true;
            /**
             * Make entery in database with multiple winners status i.e @league_status = 2
             *
             */
            let newLeague = await SQL.Users.insertData(validData, "bb_leagues");
            let newLeagueId = newLeague.insertId;
            if (newLeagueId) {
                let leagueDataError = false;
                // Insert each winner data
                // return res.send({ validatedWinners: validatedWinners })
                Bluebird.each(validatedWinners, async(winnerData, index, length) => {
                    let leagueData = {
                        league_id: newLeagueId,
                        win_from: winnerData.from,
                        win_to: winnerData.to,
                        win_amount: winnerData.price
                    }
                    let thisSuccess = await SQL.Users.insertData(leagueData, "bb_leagues_data");
                    if (!thisSuccess.insertId) {
                        leagueDataError = true;
                    }
                }).then(async _ => {
                    if (leagueDataError) {
                        //emove league and its data
                        await SQL.Cricket.removeLeagueIfError(newLeagueId);
                        await SQL.Cricket.removeDataLeaguesDatatable(newLeagueId);
                        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Error", __('SOME_ERROR'), res);
                    }
                    //update league status to 1
                    await SQL.Cricket.updateLeagueStatus(newLeagueId, 1);
                    return Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'success', __("success"), res, { league: { league_id: newLeagueId } });
                }).catch(async e => {
                    console.log('error in private league==>>> ', e);
                    return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res, response)
                })
            }
        }
    } catch (error) {
        console.log('error=> ', error)
        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Error", __('SOME_ERROR'), res);
    }
}


exports.generateLeagueCode = async(length) => {
    let leagueCode = Utils.RandomString.leagueCodeStr(length);
    leagueCode = `CT${leagueCode}`
    console.log("leaguecode >>", leagueCode)
    if (!leagueCode) {
        console.log("--------", leagueCode);

        return false;
    }

    // check existence
    let where = ` where league_code = '${leagueCode}' `;
    let exists = await SQL_QUERY_MATCH.getLeagueDetails(where);
    console.log("Exists league length", exists);
    if (exists.length > 0) return false;
    return leagueCode;
}

exports.fetchUserTeam = async(matchKey, userId, teamNumber = "", fantasyType = "", match = "") => {
    if (matchKey) {
        //get Match
        let match = await SQL_QUERY_MATCH.getMatchTableByKey(matchKey);
        if (!match.length > 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('WRONG_DATA'), res);
    }
    let teamTable = "bb_user_teams";
    let leagueTable = "bb_user_leagues";
    let readIndex = match[0].read_index;
    if (readIndex == 1) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_1";
    } else if (readIndex == 2) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_2";
    } else if (readIndex == 9) {
        teamTable = "bb_user_teams_dump";
        leagueTable = "bb_user_leagues_dump";
    }

    // get user teams on this match
    let where = `where user_id = ${user_id} and match_key = ${matchKey}`;
    let teams = await SQL.Cricket.getUserTeams(matchKey, userId, teamNumber, fantasyType, teamTable, match);

    // format teams data
    let teamNumbers = new Array();
    let userTeams = classicTeams = batsmanTeams = bowlerTeams = new Array();
    teams.forEach(async(team, index) => {
        let thisType = await team.fantasy_type;
        let thisNumber = await team.team_number;
        let thisPair = await thisType + "" + thisNumber;
        // team_number
        if (!teamNumbers[index].includes(thisPair)) {
            teamNumbers[index].thisPair = thisPair;
            userTeams[index].thisPair.fantasy_type = thisType;
            userTeams[index].thisPair.team_number = thisNumber;
            userTeams[index].thisPair.my_team_number = thisType + "" + thisNumber;
        }
        // player info
        userTeams[index].thisPair.players.team.player_key = team;

    })

    let arr = userTeams[0].values()
    for (let i of arr) {
        userTeams[0].push(i)
    }

    // make user teams order according to player role
    if (userTeams.length > 0) {
        let sorted = new Array;
        userTeams.forEach(async(thisTeam, index) => {
            let batsman = keeper = allrounders = bowlers = new Array();
            if (thisTeam.fantasy_type == 1) {
                let allPlayers = await thisTeam.players;
                allPlayers.forEach(async(v, i) => {
                    let playerKey = v.players;
                    if (v[i].player_playing_role == "batsman") batsman[i].player_key = v;
                    else if (v[i].player_playing_role == "keeper") keeper[i].player_key = v;
                    else if (v[i].player_playing_role == "allrounder") allrounders[i].player_key = v;
                    else if (v[i].player_playing_role == "bowler") bowlers[i].player_key = v;

                })
                let playerArr = [];
                await playerArr.push(batsman[index].player_key);
                await playerArr.push(keeper[index].player_key);
                await playerArr.push(keeper[index].player_key);
                thisTeam.players = playerArr;

                sorted.push(thisTeam);

            } else sorted = thisTeam;
        })
        userTeams = sorted;
    }
    return userTeams;
}

exports.swapTeam = async(options) => {
    return new Promise(async(resolve, rejected) => {
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
        let league = await SQL.Cricket.checkLeagueAvailability(userId, leagueId, matchKey, fantasyType, 1, 1, 1);
        league = league[0]

        console.log("checkLeagueAvailability>>>>", league);

        if (!league) return await rejected({ Msg: __('LEAGUE_NOT_EXIST'), title: 'league_not_exist', status: Utils.StatusCodes.Error });

        // check match is closed
        if (league.closed == 1) return await rejected({ Msg: __('MATCH_CLOSED'), title: 'Match is closed now.', status: Utils.StatusCodes.Error });
        let leagueTeams = league.all_teams_joined;
        console.log("LeagueTeams Are >>>", leagueTeams);

        if (leagueTeams) {
            leagueTeams = leagueTeams.split(",");
            // check if joined with the old team
            if (!leagueTeams.includes(oldTeam)) return await rejected({ Msg: __('WRONG_DATA'), title: 'not joined with old team', status: Utils.StatusCodes.Error });
            // check if alreeady joined with the new team
            if (leagueTeams.includes(newTeam)) return await rejected({ Msg: __('LEAGUE_JOINED_SAME_TEAM'), title: 'exist', status: Utils.StatusCodes.Error });
        } else return await rejected({ Msg: __('JOIN_LEAGUE_FIRST'), title: 'not joined', status: Utils.StatusCodes.Error })

        // check if user new team exists for the match
        let teamFound = await SQL.Cricket.checkTeamExists(userId, matchKey, fantasyType, newTeam)
        console.log("team found is>>>", teamFound);
        if (teamFound.length == 0) return await rejected({ Msg: __('WRONG_DATA'), title: 'team not exist', status: Utils.StatusCodes.Error });

        // SWAP TEAM NOW
        console.log("user ip is >>>", userIp)
        let swapTeamSuccess = await SQL.Cricket.swapTeam(matchKey, leagueId, userId, oldTeam, newTeam, userIp)
        if (swapTeamSuccess) {
            let JoinedLeagueUsers = await SQL.Cricket.getUserLeaguesDetails(matchKey, leagueId, "bb_user_leagues");
            let page = 1;
            console.log("joinedLeagueUsers from DB", JoinedLeagueUsers);

            // if (!JoinedLeagueUsers) JoinedLeagueUsers = [];
            JoinedLeagueUsers = await JoinedLeagueUsers.sort((a, b) => a.team_rank - b.team_rank);
            await Utils.Redis.set(Utils.Keys.CRIC_LEAGUES + leagueId + userId + page, JSON.stringify(JoinedLeagueUsers), 'EX', Utils.RedisExpire.CRIC_LEAGUES);
            return await resolve({ Msg: __('TEAM_SWAP_SUCCESS'), title: 'success', status: Utils.StatusCodes.Success });
        }

        return await rejected({ Msg: __('WROMG_DATA'), title: 'error to swap team' });

    })
}

exports.promoBanners = async(req, res, next) => {
    let isSignup = req.query.is_signup;
    let currentDate = moment().format('YYYY-MM-DD h:mm:ss');
    let currentDateIST = moment().format('YYYY-MM-DD h:mm:ss');
    let deviceType;
    let platform = req.headers.platform;
    if (platform == 'android') {
        deviceType = 2;
    } else if (platform == 'iOS') {
        deviceType = 1;
    } else {
        deviceType = 3;
    }
    let promotions;
    if (isSignup == 1) {
        promotions = await SQL.Cricket.getPromoBanner(` where banner_type = 1 and
      status = 1 and (start_date IS NULL OR start_date<='${currentDateIST}') and
      (end_date IS NULL OR end_date>='${currentDateIST}') `)
    } else if (isSignup == 2) {
        promotions = await SQL.Cricket.getHomoPromoBanners(1, currentDate, 2)
    } else {
    //     promotions = await SQL.Cricket.getPromoBanner(` where banner_type = 0 and
    //  status = 1 and (start_date IS NULL OR start_date<='${currentDateIST}') and
    //  (end_date IS NULL OR end_date>='${currentDateIST}') `)
        let cacheKeyPromoBanner = Utils.Keys.PROMOTION_BANNER +"_" + deviceType + "_0"
        promotions = await Utils.Redis.getAsync(cacheKeyPromoBanner);
    }
    if(!promotions) promotions = [];

    let response = {
        banners: promotions.length > 0 ? promotions : null
    }
    return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('SUCCESS'), res, response)

}



exports.generateLeagueCode = this.generateLeagueCode;
exports.generateLeagueCode = this.generateLeagueCode;
exports.generateLeagueCode = this.generateLeagueCode;