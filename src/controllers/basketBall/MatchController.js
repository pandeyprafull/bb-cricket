
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
const LeagueController = require('./LeagueController');

let moment = require('moment')

module.exports = {

    getActiveMatches: async (req, res, next) => {
        try {
            // const status_code = req.params.status_code;
            let { user_id } = req.user;

            let activeMatches = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_ACTIVE_MATCHES);
            if (!activeMatches) {
                console.log('Cricket match list from Database');
                activeMatches = await SQL.BasketBall.getActiveUpcomminMatches();
                Utils.Redis.set(Utils.Keys.BASKETBALL_ACTIVE_MATCHES, JSON.stringify(activeMatches), 'EX', Utils.RedisExpire.BASKETBALL_ACTIVE_MATCHES)
            } else {
                activeMatches = JSON.parse(activeMatches);
            }

            //Quiz
            let activeQuizes = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_ACTIVE_QUIZES)

            if (!activeQuizes) {
                console.log("Inside quizes from DB");
                activeQuizes = await SQL.Quiz.getActiveQuizes(false);

                Utils.Redis.set(Utils.Keys.BASKETBALL_ACTIVE_QUIZES, JSON.stringify(activeQuizes), 'EX', Utils.RedisExpire.BASKETBALL_ACTIVE_QUIZES)
            } else {
                activeQuizes = JSON.parse(activeQuizes)
            }


            let promotionBanners = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_PROMOBANNERS)
            if (!promotionBanners) {
                console.log('Promotion banner list from Database');

                promotionBanners = await SQL.Cricket.getHomoPromoBanners();
                Utils.Redis.set(Utils.Keys.BASKETBALL_PROMOBANNERS, JSON.stringify(promotionBanners), 'EX', Utils.RedisExpire.BASKETBALL_PROMOBANNERS)
            } else {
                promotionBanners = JSON.parse(promotionBanners)
            }
            let announcements = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_ANNOUNCEMENTS)
            if (!announcements) {
                console.log('Announcements list from Database');
                announcements = await SQL.Users.getAnnouncements(1, 1)
                Utils.Redis.set(Utils.Keys.CRICKET_ANNOUNCEMENTS, JSON.stringify(announcements), 'EX', Utils.RedisExpire.BASKETBALL_ANNOUNCEMENTS);
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
                Quiz: activeQuizes,
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
            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, __("success"), __("success"), res, response)
        } catch (error) {
            console.error('error==> ', error);

            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "SOME_ERROR", __("SOME_ERROR"), res)
        }
    },

    //get all leagues of a particular match......(New)
    getMatchLeagues: async (req, res, next) => {
        const { match_key } = req.params;
        const { user_id } = req.user;
        // console.log("user>>>>>", user_id);

        let fantasyType = req.params.fantasyType ? req.params.fantasyType : 0;
        console.log('fantsay type=====>>>>>>......... ', fantasyType);

        if (!match_key) {
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('error'), __('Wrong_data_recived'), res)
        }

        //Match details
        let matchDetails = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_MATCH_DETAIL + "_" + match_key);
        if (!matchDetails) {
            console.log("MatchDetails From DB");
            let matchColumns = ` match_key, match_format, match_short_name, read_index, admin_status, start_date_unix, team_a_short_name, team_b_short_name, match_status, season_key, season_short_name, closing_ts, team_a_key, team_b_key, active, categorisation,gender_match_category,active,show_playing22 `;

            matchDetails = await SQL.BasketBall.getMatchByKey(matchColumns, match_key)
            matchDetails = matchDetails[0];

            await Utils.Redis.set(Utils.Keys.BASKETBALL_MATCH_DETAIL + "_" + match_key, JSON.stringify(matchDetails), 'EX', Utils.RedisExpire.BASKETBALL_MATCH_DETAIL);
        } else {
            matchDetails = JSON.parse(matchDetails);
        }

        //Match Leagues
        let matchLeagues = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_LEAGUES + '_' + fantasyType + "_" + match_key);
        if (!matchLeagues) {
            console.log("Matchleagues From DB");
            matchLeagues = await SQL.BasketBall.getEachActiveMatchesLeagues(match_key, fantasyType);
            console.log("matchLeagues>>>>", matchLeagues.length);

            await Utils.Redis.set(Utils.Keys.BASKETBALL_LEAGUES + '_' + fantasyType + "_" + match_key, JSON.stringify(matchLeagues), 'EX', Utils.RedisExpire.BASKETBALL_LEAGUES);
        } else {
            matchLeagues = JSON.parse(matchLeagues);
        }

        //announcement
        let announcements = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_ANNOUNCEMENTS)
        if (!announcements) {
            console.log('Announcements list from Database');
            announcements = await SQL.Users.getAnnouncements(1, 1)
            Utils.Redis.set(Utils.Keys.BASKETBALL_ANNOUNCEMENTS, JSON.stringify(announcements), 'EX', Utils.RedisExpire.BASKETBALL_ANNOUNCEMENTS);
        } else {
            announcements = JSON.parse(announcements);
        }

        //team_count
        let teamCount = await Utils.Redis.getAsync(Utils.Keys.TEAM_COUNT + user_id);
        if (!teamCount) {
            teamCount = await SQL.BasketBall.getTeamCountByMatch(user_id, match_key, fantasyType);
            await Utils.Redis.set(Utils.Keys.TEAM_COUNT + user_id, JSON.stringify(teamCount), 'EX', Utils.RedisExpire.TEAM_COUNT)

        } else {
            teamCount = JSON.parse(teamCount);
        }
        //joinedLeagues
        let joinedLeagues = await Utils.Redis.getAsync(Utils.Keys.JOINED_LEAGUES + user_id + match_key);
        if (!joinedLeagues) {
            joinedLeagues = await SQL.BasketBall.getJoinedLeagues(match_key, user_id);
            await Utils.Redis.set(Utils.Keys.JOINED_LEAGUES + user_id + match_key, JSON.stringify(joinedLeagues), 'EX', Utils.RedisExpire.JOINED_LEAGUES)
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
            let totalJoined = await SQL.Users.getUserRecordTable(user_id, ` sum(total_batting + total_bowling + total_classic + total_classic_fb + total_classic_kb) as totalJoined`)
            totalJoined = totalJoined[0].totalJoined;

            if (parseInt(totalJoined) > 0 || totalJoined != null) {
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
            // //release connection after response
            // const released = await db.on('release', (connection) => {
            //     console.log(connection.threadId);
            // });
            // //   console.log("released connection......", released);
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, __('Success'), __('Success'), res, response)
        }).catch(e => {
            console.log('error => ', e);
            return e
        })
    },

    getJoinedMatches: async (options) => {
        return new Promise(async (resolve, rejected) => {
            let user = options.user
            let user_id = options.userId
            if (!user || !user_id) return rejected({ Msg: __('WRONG_DATA'), title: 'error', status: Utils.StatusCodes.Error })

            let live = [];
            let upcomings = [];
            let completed = [];
            let matchList = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_JOINED_LEAGUES_MATCHES);

            if (!matchList) {
                console.log("MatchList from DB");
                matchList = await SQL.BasketBall.getUserJoinedLeaguesMatches();
                console.log("MatchList .......", matchList);
                await Utils.Redis.set(Utils.Keys.BASKETBALL_JOINED_LEAGUES_MATCHES, JSON.stringify(matchList), 'EX', Utils.RedisExpire.BASKETBALL_JOINED_LEAGUES_MATCHES)
            } else {
                console.log("MatchList from Rediis");
                matchList = JSON.parse(matchList)
            }
            for (let k of matchList) {
                let thisMatch = k.match_key;
                let thisSeason = k.season_key;
                let thisClosed = k.closed;
                let thisStatus = k.match_status;
                let thisOverview = k.status_overview;
                let readIndex = k.read_index;
                if (readIndex == 1) readTable = `bk_user_leagues_1`;
                else if (readIndex == 2) readTable = `bk_user_leagues_2`;
                else if (readIndex == 9) readTable = `bk_user_leagues_dump`;
                else readTable = `bk_user_leagues`;
                console.log("readTable is >>>>", readTable);
                let totalJoinedLeagues = await SQL.BasketBall.getTotalJoinedLeaguesMatches(thisMatch, user_id, readTable);
                if (totalJoinedLeagues.length > 0) {
                    console.log("thisStatus >>>", thisStatus);
                    if (thisStatus == "started") live.push(k);
                    else if (thisStatus == "notstarted") upcomings.push(k);
                    else completed.push(k)
                }
            }
            if (!live || !upcomings || !completed) return rejected({ Msg: __('LEAGUES_NOT_FOUND'), title: 'Not Found', status: Utils.StatusCodes.Error })

            let announcements = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_ANNOUNCEMENTS)
            if (!announcements) {
                console.log('Announcements list from Database', Utils.Constants.PLAY_TYPE.BASKETBALL);
                announcements = await SQL.Users.getAnnouncements(1, Utils.Constants.PLAY_TYPE.BASKETBALL)
                Utils.Redis.set(Utils.Keys.BASKETBALL_ANNOUNCEMENTS, JSON.stringify(announcements), 'EX', Utils.RedisExpire.BASKETBALL_ANNOUNCEMENTS);
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

            return resolve({ Msg: __("SUCCESS"), title: 'Success', status: Utils.StatusCodes.Success, response: response });
        })
    },
    getMatchPlayersList: async (options) => {
        return new Promise(async (resolve, rejected) => {
            const { match_key } = options;

            if (!match_key) return rejected({ Msg: __('REQUIRED_FIELDS'), title: 'Error', status: Utils.StatusCodes.Error })

            let match = await SQL.BasketBall.getMatchByKey(` match_key, match_format, match_short_name, read_index, admin_status, start_date_unix, team_a_short_name, team_b_short_name, match_status, season_key, season_short_name, show_playing22, closing_ts, active, team_a_key, team_b_key, gender_match_category`, match_key);
            let players = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_PLAYERS);
            if (!players) {
                console.log("Players found From DB");
                // let wherePlayers = `where match_key = ${match_key} and is_playing = 0 order by player_playing_role`;
                players = await SQL.BasketBall.getMatchPlayers(match_key);
                await Utils.Redis.set(Utils.Keys.BASKETBALL_PLAYERS, JSON.stringify(players), 'EX', Utils.RedisExpire.BASKETBALL_PLAYERS);
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
            return resolve({ Msg: __("SUCCESS"), title: 'Success', status: Utils.StatusCodes.Success, response: response });
        })

    },

    playerInfo: async (options) => {
        return new Promise(async (resolve, rejected) => {
            let { matchKey, playerKey, userId } = options;

            if (!matchKey || !playerKey) return await rejected({ Msg: __('WRONG_DATA'), title: 'Error', status: Utils.StatusCodes.Error })
            // get player info by match
            let playerInfo = await SQL.BasketBall.getPlayerSeasonInfo(matchKey, playerKey);
            playerInfo = playerInfo[0];
            console.log("playerInfo is >>>", playerInfo);


            if (!playerInfo) return rejected({ Msg: __('PLAYER_NOT_FOUND'), title: 'not_found', status: Utils.StatusCodes.Error });

            let seasonKey = playerInfo.season_key;
            let matchInfo = await SQL.BasketBall.getPlayerSelections(seasonKey, playerKey);
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
    },
    createTeam: async (req, res, next) => {
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
        const fantasyTypes = Utils.Constants.fantasyTypes;
        players = players.split(',');
        // captain = captain.trim();
        // myViceCaptain = myViceCaptain.trim();
        // console.log(fantasyTypes.includes(fantasyType));
        // console.log('fantasyTypes.includes(fantasyType)', fantasyType, fantasyTypes.includes(fantasyType));
        if (!fantasyTypes.includes(fantasyType)) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
        let MaxPlayers, defaultPointGuard, defaultShootingGuard, defaultSmallForward, defaultPowerForward, defaultCenter, maxCredits, maxFromTeam;
        let selectMaxPlayerError;
        if (fantasyType == 1) {
            MaxPlayers = 8;
            defaultPointGuard = { min: 1, max: 4 };
            defaultShootingGuard = { min: 1, max: 4 };
            defaultSmallForward = { min: 1, max: 4 };
            defaultPowerForward = { min: 1, max: 4 };
            defaultCenter = { min: 1, max: 4 };
            maxCredits = 100;
            maxFromTeam = 5;
            selectMaxPlayerError = __('SELECT_5');
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
        let matchColumns = ` match_short_name, team_a_key, team_b_key, read_index `;
        let match = await SQL.BasketBall.getMatchTableByKey(matchKey, matchColumns);
        if (!match || match.length <= 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
        match = match[0];
        //check match is closed
        // console.log('is match closed', match.closed);
        if (match.closed == 1) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('Match is closed now.'), res);
        console.log("--->>>> ", players.toString());

        //  get all players within the match
        let allplayers = await SQL.BasketBall.getPlayersByMatchKey(` match_key = ${matchKey} AND player_key IN(${players.toString()}) `);
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
            let pointGuard = shootingGuard = smallForward = powerForward = center = credits = team_1 = team_2 = 0;
            for (let i of allplayers) {
                let this_player_key = i.player_key;
                let this_team_key = i.team_key;
                this_team_key++ //increase team
                credits += i.player_credits;
                // console.log("credits for fantasy_type = 1 are..", credits)
                if (i.player_playing_role == "pointGuard") pointGuard++ //increase pointGuard

                else if (i.player_playing_role == "shootingGuard") shootingGuard++ //increase shootingGuard
                else if (i.player_playing_role == "smallForward") smallForward++ //increase smallForward
                else if (i.player_playing_role == "powerForward") powerForward++ //increase powerForward
                else if (i.player_playing_role == "center") center++ //increase center
            }

            // validate defaults
            let error = "";
            // if ($keeper != $defaultKeepers) $error = SELECT_KEEPER;

            if (pointGuard < defaultPointGuard.min) {
                error = __('MINIMUM_ROLE') + defaultPointGuard.min + " pointGuard"
            } else if (pointGuard > defaultPointGuard.max) {
                error = __('MAXIMUM_ROLE') + defaultPointGuard.max + " pointGuard"
            } else if (shootingGuard < defaultShootingGuard.min) {
                error = __('MINIMUM ROLE') + defaultShootingGuard.min + " shootingGuard"
            } else if (shootingGuard > defaultShootingGuard.max) {
                error = __('MAXIMUM_ROLE') + defaultShootingGuard.max + " shootingGuard"
            } else if (smallForward < defaultSmallForward.min) {
                error = __('MINIMUM_ROLE') + defaultSmallForward.min + " smallForward";
            } else if (smallForward > defaultSmallForward.max) {
                error = __('MAXIMUM_ROLE') + defaultSmallForward.max + " smallForward";
            } else if (powerForward < defaultPowerForward.min) {
                error = __('MINIMUM_ROLE') + defaultForward.min + " powerForward"
            } else if (powerForward > defaultPowerForward.max) {
                error = __('MAXIMUM_ROLE') + defaultForward.max + " powerForward"
            } else if (center < defaultCenter.min) {
                error = __('MINIMUM_ROLE') + defaultCenter.min + " center"
            } else if (center > defaultCenter.max) {
                error = __('MAXIMUM_ROLE') + defaultCenter.max + " center"
            }
            else if (team_1 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
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
        let userTeams = await SQL.BasketBall.getUserTeamDetails(`*`, where_clause);
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

                if (matchedPlayers.length == Utils.Constants.TOTAL_PLAYERS.bk_total_players && isIncludes.length > 0) {
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
                                let ipInsert = await SQL.BasketBall.insertData2(ipTableData, 'bk_user_teams_ip')
                                return await Utils.ResponseHandler(true, 200, "success", __('success'), res, success);
                            }
                        })
                    } else {
                        let teamInsertStatus = await SQL.BasketBall.teamBulkInsert(bulkInsertData, 'bk_user_teams')
                        let ipInsertStatus = await SQL.BasketBall.insertData2(ipTableData, 'bk_user_teams_ip')
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
    },

    updateTeams: async (req, res, next) => {

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
            let MaxPlayers, defaultPointGuard, defaultShootingGuard, defaultSmallForward, defaultPowerForward, defaultCenter, maxCredits, maxFromTeam;
            let selectMaxPlayerError;
            if (fantasyType == 1) {
                MaxPlayers = 8;
                defaultPointGuard = { min: 1, max: 4 };
                defaultShootingGuard = { min: 1, max: 4 };
                defaultSmallForward = { min: 1, max: 4 };
                defaultPowerForward = { min: 1, max: 4 };
                defaultCenter = { min: 1, max: 4 };
                maxCredits = 100;
                maxFromTeam = 5;
                selectMaxPlayerError = __('SELECT_5');
            } else {
                // for now only classic team is allowed
                return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Wrong fantasy", __('WRONG_DATA'), res);
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
            let match = await SQL.BasketBall.getMatchTableByKey(matchKey, matchColumns);
            if (!match || match.length <= 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('WRONG_DATA'), res);
            match = match[0];
            //check match is closed
            console.log('is match closed', match.closed);
            if (match.closed == 1) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __('Match is closed now.'), res);
            console.log("--->>>> ", players.toString());

            //  get all players within the match
            let allplayers = await SQL.BasketBall.getPlayersByMatchKey(`match_key = ${matchKey} AND player_key IN(${players.toString()})`);
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
                let pointGuard = shootingGuard = smallForward = powerForward = center = credits = team_1 = team_2 = 0;
                for (let i of allplayers) {
                    let this_player_key = i.player_key;
                    let this_team_key = i.team_key;
                    this_team_key++ //increase team
                    credits += i.player_credits;
                    // console.log("credits for fantasy_type = 1 are..", credits)
                    if (i.player_playing_role == "pointGuard") pointGuard++ //increase pointGuard

                    else if (i.player_playing_role == "shootingGuard") shootingGuard++ //increase shootingGuard
                    else if (i.player_playing_role == "smallForward") smallForward++ //increase smallForward
                    else if (i.player_playing_role == "powerForward") powerForward++ //increase powerForward
                    else if (i.player_playing_role == "center") center++ //increase center
                }

                // validate defaults
                let error = "";
                // if ($keeper != $defaultKeepers) $error = SELECT_KEEPER;

                if (pointGuard < defaultPointGuard.min) {
                    error = __('MINIMUM_ROLE') + defaultPointGuard.min + " pointGuard"
                } else if (pointGuard > defaultPointGuard.max) {
                    error = __('MAXIMUM_ROLE') + defaultPointGuard.max + " pointGuard"
                } else if (shootingGuard < defaultShootingGuard.min) {
                    error = __('MINIMUM ROLE') + defaultShootingGuard.min + " shootingGuard"
                } else if (shootingGuard > defaultShootingGuard.max) {
                    error = __('MAXIMUM_ROLE') + defaultShootingGuard.max + " shootingGuard"
                } else if (smallForward < defaultSmallForward.min) {
                    error = __('MINIMUM_ROLE') + defaultSmallForward.min + " smallForward";
                } else if (smallForward > defaultSmallForward.max) {
                    error = __('MAXIMUM_ROLE') + defaultSmallForward.max + " smallForward";
                } else if (powerForward < defaultPowerForward.min) {
                    error = __('MINIMUM_ROLE') + defaultForward.min + " powerForward"
                } else if (powerForward > defaultPowerForward.max) {
                    error = __('MAXIMUM_ROLE') + defaultForward.max + " powerForward"
                } else if (center < defaultCenter.min) {
                    error = __('MINIMUM_ROLE') + defaultCenter.min + " center"
                } else if (center > defaultCenter.max) {
                    error = __('MAXIMUM_ROLE') + defaultCenter.max + " center"
                }
                else if (team_1 > maxFromTeam) error = __('MAX_FROM_TEAM') + maxFromTeam;
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
            let userTeams = await SQL.BasketBall.getUserTeamDetails(`*`, where_clause);
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
                                    let ipInsert = await SQL.BasketBall.insertData2(ipTableData, 'bk_user_teams_ip')
                                    return await Utils.ResponseHandler(true, 200, "success", __('success'), res, success);
                                }
                            })
                        } else {
                            await SQL.BasketBall.removeUserTeam(`user_id=${userId} and match_key = ${matchKey} and team_number = ${team_number} and fantasy_type=${fantasyType}`)
                            let teamInsertStatus = await SQL.BasketBall.teamBulkInsert(bulkInsertData, 'bk_user_teams')
                            let ipInsertStatus = await SQL.BasketBall.insertData2(ipTableData, 'bk_user_teams_ip')
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
    },

    swapTeam: async (options) => {
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
            let league = await SQL.BasketBall.checkLeagueAvailability(userId, leagueId, matchKey, fantasyType, 1, 1, 1);
            league = league[0]

            console.log("checkLeagueAvailability>>>>", league);

            if (!league) return await rejected({ Msg: __('LEAGUE_NOT_EXIST'), title: 'league_not_exist', status: Utils.StatusCodes.Error });

            // check match is closed
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
            let teamFound = await SQL.BasketBall.checkTeamExists(userId, matchKey, fantasyType, newTeam)
            console.log("team found is>>>", teamFound);
            if (!teamFound.length > 0) return await rejected({ Msg: __('WRONG_DATA'), title: 'team not exist', status: Utils.StatusCodes.Error });

            // SWAP TEAM NOW
            console.log("user ip is >>>", userIp)
            let swapTeamSuccess = await SQL.BasketBall.swapTeam(matchKey, leagueId, userId, oldTeam, newTeam, userIp)
            if (swapTeamSuccess) return await resolve({ Msg: __('TEAM_SWAP_SUCCESS'), title: 'success', status: Utils.StatusCodes.Success });

            return await rejected({ Msg: __(WROMG_DATA), title: 'error to swap team' });

        })
    },
    //....................GET USER JOINED LEAGUES PER MATCH.........................................///////////
    getUserJoinedLeaguesPermatch: async (req, res, next) => {
        let user = req.user;
        if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'UNAUTHORIZE_ACCESS', __('UNAUTHORIZE_ACCESS'), res);
        let user_id = user.user_id;
        let { match_key, fantasy_type } = req.query;
        let fantasyType = fantasy_type ? fantasy_type : 0;

        console.log("match_key>>>", match_key)
        if (!user_id || !match_key) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('REQUIRED_FIELDS'), res);
        let columns = ` match_key, match_format, match_short_name, read_index, admin_status, start_date_unix, team_a_short_name, team_b_short_name, match_status, season_key, season_short_name, closing_ts, team_a_key, team_b_key, active, categorisation,gender_match_category,active,show_playing22 `
        let match = await SQL.BasketBall.getMatchByKey(columns, match_key);
        if (match && !match.length) {
            // console.log('Match details ==>> ',match);
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __('WRONG_DATA'), res);
        }

        match = match[0];

        console.log("match>>>", match)

        let readIndex = match.read_index;
        let teamTable = "bk_user_teams";
        let leagueTable = "bk_user_leagues";
        if (readIndex == 1) {
            teamTable = "bk_user_teams_0";
            leagueTable = "bk_user_leagues_1";
        } else if (readIndex == 2) {
            teamTable = "bk_user_teams_0";
            leagueTable = "bk_user_leagues_2";
        } else if (readIndex == 9) {
            teamTable = "bk_user_teams_dump";
            leagueTable = "bk_user_leagues_dump";
        }
        console.log(">>", leagueTable, readIndex);
        let leagues = await Utils.Redis.getAsync(Utils.Keys.BK_JOINED_LEAGUES + "_" + user_id + "_" + match_key + "_" + fantasy_type);
        console.log('league==>> ', fantasyType);
        if (!leagues || leagues.length == 0) {
            console.log("Leagues From DB.....")
            leagues = await SQL.BasketBall.getUserLeaguesWithTopRank(user_id, match_key, leagueTable, null, fantasyType);
            console.log("Leagues From DB.....", leagues);

            await Utils.Redis.set(Utils.Keys.BK_JOINED_LEAGUES + "_" + user_id + "_" + match_key + "_" + fantasy_type, JSON.stringify(leagues), 'EX', Utils.RedisExpire.BK_JOINED_LEAGUES);
        } else {
            leagues = JSON.parse(leagues)
        }
        /**
         * Get the unjoined private leagues
         */
        let unjoinedPrivateLeagues = await SQL.BasketBall.getUnjoinedPrivate(match_key, user_id);
        leagues = [...leagues, ...unjoinedPrivateLeagues]
        let announcements = await Utils.Redis.getAsync(Utils.Keys.BASKETBALL_ANNOUNCEMENTS)
        if (!announcements) {
            console.log('Announcements list from Database');
            const anouncementsWhere = `where play_type = ${1} and screen_type = 3`;
            announcements = await SQL.Users.getAnnouncements(3, 1)
            Utils.Redis.set(Utils.Keys.BASKETBALL_ANNOUNCEMENTS, JSON.stringify(announcements), 'EX', Utils.RedisExpire.BASKETBALL_ANNOUNCEMENTS);
        } else {
            announcements = JSON.parse(announcements);
        }
        announcements = announcements.length ? announcements[0] : null;

        let liveScore = await Utils.Redis.getAsync(Utils.Keys.LIVE_SCORE + "_" + user_id);
        if (!liveScore) {
            liveScore = await SQL.BasketBall.getLiveScore(match_key);
            await Utils.Redis.set(Utils.Keys.LIVE_SCORE + "_" + user_id, JSON.stringify(liveScore), 'EX', Utils.RedisExpire.LIVE_SCORE);
        } else {
            liveScore = JSON.parse(liveScore);
        }

        //user team count
        let teamCount = await Utils.Redis.getAsync(Utils.Keys.TEAM_COUNT + "_" + user_id);
        if (!teamCount) {
            console.log("Team count from Db");
            teamCount = await SQL.BasketBall.getTeamCountByMatch(user_id, match_key)
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
                leagues: uniqueJoinedLeagues,
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

    },

    getJoinedLeagueUsersOfMatch: async (req, res, next) => {
        const { match_key, league_id } = req.query;
        let { user_id } = req.user;
        console.log(">>>", user_id);
        let page = req.query.page;
        if (!user_id || !match_key || !league_id || !page) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRONG_DATA'), res);
        let match = await SQL.BasketBall.getMatchByKey("*", match_key);
        if (match && !match.length) {
            // console.log('Match details ==>> ',match);
            return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __('WRONG_DATA'), res);
        }
        let leagueTable, teamTable;
        match = match[0];
        // console.log("match is >>>", match);

        let readIndex = match.read_index;
        if (readIndex == 1) {
            teamTable = "bk_user_teams_0";
            leagueTable = "bk_user_leagues_1";
        } else if (readIndex == 2) {
            teamTable = "bk_user_teams_0";
            leagueTable = "bk_user_leagues_2";
        } else if (readIndex == 9) {
            teamTable = "bk_user_teams_dump";
            leagueTable = "bk_user_leagues_dump";
        }
        console.log("leagueTable>>", leagueTable);
        //paginate
        let perPage = 50;
        page = req.query.page ? req.query.page : 1
        page = page == 0 || page < 0 ? 1 : page
        let offset = ((perPage * page) - perPage);
        // console.log("Offset is >>>", offset);
        let limit = perPage;

        let JoinedLeagueUsers = await Utils.Redis.getAsync(Utils.Keys.BK_LEAGUES + user_id + page);
        if (!JoinedLeagueUsers) {
            JoinedLeagueUsers = await SQL.BasketBall.getUserLeaguesDetails(match_key, league_id, leagueTable);
            // if (!JoinedLeagueUsers) JoinedLeagueUsers = [];
            JoinedLeagueUsers = await JoinedLeagueUsers.sort((a, b) => a.team_rank - b.team_rank);
            await Utils.Redis.set(Utils.Keys.BK_LEAGUES + user_id + page, JSON.stringify(JoinedLeagueUsers), 'EX', Utils.RedisExpire.BK_LEAGUES);
        } else {
            JoinedLeagueUsers = JSON.parse(JoinedLeagueUsers);
        }
        let liveScore = await SQL.BasketBall.getLiveScore(match_key);
        JoinedLeagueUsers = JoinedLeagueUsers.slice(perPage * (page - 1), perPage * page);
        // let OpponentUsers = JoinedLeagueUsers;
        let Self = JoinedLeagueUsers.filter(i => i.user_id == user_id);
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
    },
    generateLeagueCode: async (length) => {
        let leagueCode = Utils.RandomString.leagueCodeStr(length);
        console.log("leaguecode >>", leagueCode)
        if (!leagueCode) {
            console.log("--------", leagueCode);

            return false;
        }
        return leagueCode
    },
    //////>>>>>>> API TO CREATE PRIVATE LEAGUE<<<<<<<<<<//////////
    createPrivateLeague: async (req, res, next) => {
        try {
            let user = req.user;
            if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res)
            let user_id = user.user_id;
            let { match_key, fantasy_type } = req.body;
            if (!match_key || !user_id || !fantasy_type) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'wrong_data', __('WRONG_DATA'), res);
            if (!Validator.isIn(fantasy_type.toString(), [1, 2, 3, 4, 5, 6])) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'wrong_data', __('WRONG_DATA'), res);
            // get match
            const match = await SQL.BasketBall.getMatchDetailsByMatchKey(match_key);
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
                    max: 100000
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
                return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, 'INVALID_AMOUNT', __("INVALID_AMOUNT") + required.win_amount.max, res);
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
            let leagueCode = await LeagueController.generateLeagueCode(6);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(6);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(6);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(6);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(7);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(7);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(7);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(7);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(8);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(8);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(8);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(8);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(9);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(9);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(9);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(9);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(10);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(10);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(10);
            if (!leagueCode) leagueCode = await LeagueController.generateLeagueCode(10);
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
                let newLeague = await SQL.BasketBall.insertData2(validData, "bk_leagues");
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
                let newLeague = await SQL.BasketBall.insertData2(validData, "bk_leagues");
                let newLeagueId = newLeague.insertId;
                if (newLeagueId) {
                    let leagueDataError = false;
                    // Insert each winner data
                    // return res.send({ validatedWinners: validatedWinners })
                    Bluebird.each(validatedWinners, async (winnerData, index, length) => {
                        let leagueData = {
                            league_id: newLeagueId,
                            win_from: winnerData.from,
                            win_to: winnerData.to,
                            win_amount: winnerData.price
                        }
                        let thisSuccess = await SQL.BasketBall.insertData2(leagueData, "bk_leagues_data");
                        if (!thisSuccess.insertId) {
                            leagueDataError = true;
                        }
                    }).then(async _ => {
                        if (leagueDataError) {
                            //emove league and its data
                            await SQL.BasketBall.removeLeagueIfError(newLeagueId);
                            await SQL.BasketBall.removeDataLeaguesDatatable(newLeagueId);
                            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Error", __('SOME_ERROR'), res);
                        }
                        //update league status to 1
                        await SQL.BasketBall.updateLeagueStatus(newLeagueId, 1);
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
    },
    getFullfantasyScoreBoard: async (req, res, next) => {
        let matchKey = req.query.match_key;
        let scoreType = req.query.type;
        scoreType = parseInt(scoreType);
        let userId = req.user.user_id;
        let teamNumber = req.query.team_number;
        let fantasyType = req.query.fantasy_type;
        if (userId == 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __('OPPONENT_TEAM'), res);
        if (!matchKey) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'WRONG_DATA', __("WRONG_DATA"), res);
        let match = await SQL.BasketBall.getMatchByKey("*", matchKey);
        if (!match.length > 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Wrong_Data', __('MATCH_NOT_FOUND'), res);
        //get match
        match = await SQL.BasketBall.getMatchfantasyScore(matchKey);
        if (!match.length > 0) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('MATCH_NOT_FOUND'), res);
        // check match is closed
        let matchClosed = match[0].closed;
        console.log(matchClosed, "ssssssssss");
        let scoreboard
        if (matchClosed) {
            // check is request is for user team
            if (scoreType) {
                console.log("MatchClosed 1 scoreType 1")
                let readTable = match.read_index == 9 ? "bk_user_teams_dump" : "bk_user_teams";
                // get user team scorecard
                if (!userId || !teamNumber || !fantasyType) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRONG_DATA'), res);
                scoreboard = await SQL.BasketBall.getPlaying22ByUserTeam(matchKey, userId, teamNumber, fantasyType, readTable);
            } else {
                console.log("MatchClosed 1 scoreType 0")
                // get match Scoreboard
                scoreboard = await SQL.BasketBall.getPlaying22ByMatchkey(matchKey);
            }

            let response = {
                scoreBoard: scoreboard.length > 0 ? scoreboard : null
            }

            return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('Success'), res, response);

        } else {
            if (scoreType) {
                console.log("MatchClosed 0 scoreType 1");
                readTable = match[0].read_index == 9 ? "bk_user_teams_dump" : "bk_user_teams";
                // get user team scorecard
                if (!userId || !teamNumber || !fantasyType) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'Error', __('WRONG_DATA'), res);
                scoreboard = await SQL.BasketBall.getPlaying22ByUserTeam(matchKey, userId, teamNumber, fantasyType, readTable);
                let response = {
                    scoreBoard: scoreboard.length > 0 ? scoreboard : null
                }
                return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('Success'), res, response);
            } else {
                console.log("MatchClosed 0 scoreType 0");
                // get match Scoreboard
                return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, 'match_not_closed', __('MATCH_NOT_CLOSED'), res)
            }
        }
    },
    getContestData: async (req, res, next) => {
        // user info
        let user_id = req.user.user_id;

        console.log(">>>>>>>", user_id)

        if (!user_id) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "user_not_found", __('USER_NOT_FOUND'), res);

        let { match_key, league_id } = req.query;
        if (!match_key || !league_id) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('MATCH_KEY_REQUIRED'), res);

        // check if league exists
        let where = `where t1.match_key = ${match_key} and t1.league_id = ${league_id}`;
        let column1 = `t1.total_joined`;
        let column2 = `t2.read_index, t2.last_read_updated`;
        const league = await SQL.BasketBall.getCustomLeague(where, column1, true, column2);
        console.log("Leagues Are>>>", league);

        if (!league && league == undefined) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('WRONG_DATA'), res);
        let page = req.body.page ? parseInt(req.body.page) - 1 : 0;
        let limit = 50;
        let from = page * limit;


        /*
         pagination Logic here}
          $page=@$data['page'] ? (int) $data['page']-1 : 0;
            $limit=50;
            $from=$page*$limit;


         */
        let teamTable = "bk_user_teams";
        let leagueTable = "bk_user_leagues";

        // check match is closed
        let matchClosed = league[0].closed;
        let readIndex = league[0].read_index;

        if (readIndex == 1) {
            teamTable = "bk_user_teams_0";
            leagueTable = "bk_user_leagues_1"
        } else if (readIndex == 2) {
            teamTable = "bk_user_teams_0";
            leagueTable = "bk_user_leagues_2";
        } else if (readIndex == 9) {
            teamTable = "bk_user_teams_dump";
            leagueTable = "bk_user_leagues_dump";
        }

        //  current user points at the top
        const myLeagues = await SQL.BasketBall.getUserLeaguesForContest(match_key, league_id, leagueTable, user_id)
        console.log("myLeagues are>>>>", myLeagues);

        // get all user points excluding current user
        const allLeague = await SQL.BasketBall.getUserLeaguesForContest(match_key, league_id, leagueTable, user_id, true, from, limit, matchClosed);
        console.log("All leagues are >>>>>", allLeague);


        // next page (count total joined excluding current user)
        let totalJoined = league[0].total_joined - myLeagues.length;
        let nextPage = ((from + limit) < totalJoined) ? "0" : "0";

        const response = {
            last_read_updated: league[0].last_read_updated,
            next_page: nextPage,
            current_user: myLeagues,
            all_users: allLeague
        }
        return Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('Success'), res, response);


    }

}