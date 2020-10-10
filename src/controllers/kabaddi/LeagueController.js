const Utils = require('../../utils');
const SQL = require('../../sql')
const Config = require('../../config')
const db = require('../../utils/CricketDbConfig');
const Bluebird = require('bluebird');
var moment = require('moment');

const football_Db = require('../../utils/FootballDbConfig');
let MatchController = require('./MatchController');


function fetchUserTeams(userId, matchKey, fantasyType, joinedTeams = '') {
    return new Promise(async (resolve, reject) => {
        console.log("JoinedTeams before", joinedTeams)
        if (joinedTeams) {
            joinedTeams = joinedTeams.split(',').map(function (item) {
                return parseInt(item, 10);
            })
            console.log("JoinedTeams After", joinedTeams)

        } else joinedTeams = [];
        let where = `t1.user_id = ${userId} and t1.match_key = ${matchKey}`;
        if (fantasyType) {
            where = ` t1.user_id = ${userId} and t1.match_key = ${matchKey} and fantasy_type = ${fantasyType} `
        }
        let userTeams = await SQL.Kabaddi.getUserTeamDetails(`*`, where);
        let userTeamsArray = [];
        Bluebird.each(userTeams, async (userTeam, index, length) => {
            if (!joinedTeams.includes(userTeam.team_number)) {
                // console.log("Inside isIncludes of ffetchUserTeams>>>")
                let teamDetails = userTeamsArray.find(t => (t.team_number == userTeam.team_number && t.fantasy_type == userTeam.fantasy_type));
                if (!teamDetails) {
                    let formatedTeam = {
                        team_number: userTeam.team_number,
                        fantasy_type: userTeam.fantasy_type,
                        players: []
                    };
                    if (userTeam.player_role == 'captain') {
                        formatedTeam.captain = userTeam.player_key
                    } else if (userTeam.player_role == 'vice_captain') {
                        formatedTeam.vice_captain = userTeam.player_key
                    }
                    formatedTeam.players.push(userTeam)
                    userTeamsArray.push(formatedTeam);
                } else {
                    teamDetails.team_number = userTeam.team_number;
                    if (userTeam.player_role == 'captain') {
                        teamDetails.captain = userTeam.player_key
                    } else if (userTeam.player_role == 'vice_captain') {
                        teamDetails.vice_captain = userTeam.player_key
                    }
                    teamDetails.players.push(userTeam);
                }
            }
        }).then(_ => {
            console.log('ccccccccccccc');
            resolve(userTeamsArray)
        }).catch(e => {
            reject(e)
        })
    })
}

const leaguePreview = function (options) {
    return new Promise(async (resolve, reject) => {
        // var { userId, matchKey, leagueId, teams, fantasyType, ticket } = req.body
        fantasyType = options.fantasyType;
        userId = options.userId;
        matchKey = options.matchKey;
        leagueId = options.leagueId;
        let teams = options.teams;
        let isJoiningFlow = options.isJoining;
        var response = {};
        let ticket = options.ticketApplied;
        // console.log("keys are >>>>", userId, matchKey, leagueId, fantasyType)
        if (!userId || !matchKey || !leagueId || !fantasyType) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Error,
                message: __("WRONG_DATA"),
                title: __("WRONG_DATA")
            })
        }
        // console.log("===>>> ", teams, isJoiningFlow)
        if (isJoiningFlow && !teams) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Error,
                message: __("WRONG_DATA"),
                title: __("WRONG_DATA")
            })
        }
        let teamsArray = teams.split(',')
        var userDetails = await SQL.Users.getUserById(userId);
        if (!userDetails) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Error,
                message: __("WRONG_DATA"),
                title: __("WRONG_DATA")
            })
        }
        userDetails = userDetails[0];
        let totalCashAdded = parseFloat(userDetails.total_cash_added);
        if (!Object.values(Utils.Constants.fantasytypes).includes(parseInt(fantasyType))) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Error,
                message: __("WRONG_DATA"),
                title: __("WRONG_DATA")
            })
        }
        let leagueDetails = await SQL.Kabaddi.checkLeagueAvailability(leagueId, matchKey, fantasyType, userId, 1, 1, 1);
        console.log("LeagueDetails >>>>", leagueDetails);
        leagueDetails = leagueDetails[0];
        let msg = __("league_not_exists");
        let templateLeague;
        if (!leagueDetails) {
            templateLeague = await SQL.Kabaddi.getLeagueDetails(` where template_id = ${leagueId} and match_key = ${matchKey}`);
            templateLeague = templateLeague[0]
            leagueId = templateLeague.league_id
            let templateLeagueDetails = await SQL.Kabaddi.checkLeagueAvailability(leagueId, matchKey, fantasyType, userId, 1, 1, 1);
            leagueDetails = templateLeagueDetails[0];
            if (!leagueDetails) {
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Error,
                    message: msg,
                    title: "league_not_exists"
                })
            }
        }
        let allJoinedTeams = '';
        if (leagueDetails && leagueDetails.all_teams_joined) {
            allJoinedTeams = leagueDetails.all_teams_joined;
            delete leagueDetails.all_teams_joined;
        }
        leagueDetails.user_teams = allJoinedTeams;
        response.league = leagueDetails;
        if (leagueDetails.closed == 1) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Match_closed,
                message: __("match_closed"),
                title: "match_closed"
            })
        }
        /**
         * Validate all teams
         */
        var userDBTeams = await SQL.Kabaddi.getUserTeams(userId, matchKey, fantasyType, teams);
        if (!userDBTeams) {
            return reject({
                status: false,
                code: Utils.StatusCodes.No_Teams,
                message: __("NO_TEAMS"),
                title: "No_TEAMS"
            });
        } else {
            var invalidTeams = Object.values(userDBTeams).filter(element => teamsArray.includes(element));
            if (invalidTeams.length) {
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Error,
                    message: __("WRONG_DATA"),
                    title: "Invalid Team length"
                })
            }
        }
        let userUnjoinedTeam = await fetchUserTeams(userId, matchKey, fantasyType, leagueDetails.user_teams);
        if (userUnjoinedTeam.length <= 0) {
            return reject({
                status: false,
                code: Utils.StatusCodes.No_Teams,
                message: __("NO_TEAMS"),
                title: "NO_TEAMS"
            })
        }
        if (isJoiningFlow) {
            if (teamsArray.length > 1) {
                if (leagueDetails.max_players > parseInt(Config.MULTIJOINING_LEAGUE_THREASHOLD)) {
                    if (leagueDetails.total_joined >= (leagueDetails.max_players - parseInt(Config.MULTIJOINING_LEAGUE_THREASHOLD))) {
                        return reject({
                            status: false,
                            code: Utils.StatusCodes.Error,
                            message: __("LEAGUE_ABOUT_TO_FULL"),
                            title: "full"
                        })
                    }
                }
            }
        }

        if (leagueDetails['total_joined'] >= leagueDetails['max_players']) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Error,
                message: __("LEAGUE_FULL"),
                title: "full"
            })
        }
        if (teamsArray.length > leagueDetails['max_players'] - leagueDetails['total_joined']) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Error,
                message: __("LEAGUE_FULL"),
                title: "full"
            })
        }

        if (leagueDetails.is_infinity) {
            if (leagueDetails.total_joined >= Config.INFINITY_TERMINATOR) {
                await SQL.Kabaddi.updateLeague(`is_full=1`, `league_id=${leagueId}`, 'kb_leagues')
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Error,
                    message: __("LEAGUE_FULL"),
                    title: "full"
                })
            }
        }
        if (leagueDetails.team_type == 2 && teamsArray.length > 1) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Error,
                message: __("single_league"),
                title: "single_league"
            })
        }
        let joinedTeams = leagueDetails.user_teams;
        if (joinedTeams) {
            joinedTeams = joinedTeams.split(',');
            var matchedTeams = teamsArray.filter(element => joinedTeams.includes(element));
            if (matchedTeams.length) {
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Error,
                    message: `You have already joined the league with team ${matchedTeams[0]}, join the league with different team.`,
                    title: "full"
                })
            } else if (leagueDetails.team_type == 2) {
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Error,
                    message: __("single_league"),
                    title: "single_league"
                })
            }
        }
        if (leagueDetails.league_type == 4 && totalCashAdded < leagueDetails.min_deposit) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Error,
                message: `Your all time deposit should be Rs." . ${leagueDetails.min_deposit} . " or more to join this league.`,
                title: "full"
            })
        }
        let affiliatedBy = userDetails.affiliated_by;
        let joiningAmount = leagueDetails.joining_amount;
        if (isJoiningFlow) joiningAmount = joiningAmount * teamsArray.length;
        /**
         * TODO: Need to implement time based bonous
         */
        let bonousPercent = leagueDetails.bonus_percent / 100;
        let userUnusedAmount = userDetails.unused_amount + 0;
        let userCreditsAmount = userDetails.credits + 0;
        let userBonusAmount = userDetails.bonus_cash + 0;
        let userRealCash = (userUnusedAmount + userCreditsAmount) + 0;
        let userTotalCash = userRealCash + userBonusAmount;
        let userTickets = false;
        let availablePasses = false;
        let availableTickets = false;
        // ticket = true;
        let ticketApplicable = false;
        ticket = leagueDetails.is_private ? false : ticket;
        if (ticket) {
            // Get specific match tickets
            userTickets = await SQL.Users.getUserActiveTickets(userId, matchKey, leagueDetails.category, leagueDetails.joining_amount);
            if (!userTickets && userTickets.length == 0) {
                // if specific match ticket not available then check for any match ticket
                userTickets = await SQL.Users.getUserActiveTickets(userId, false, leagueDetails.category, leagueDetails.joining_amount);
            }
            if (userTickets) {
                availablePasses = userTickets.filter(e => e.ticket_type = 3);
                availableTickets = userTickets.filter(e => e.ticket_type != 3);
                availablePasses = availablePasses.length > 0 ? availablePasses : false;
                availableTickets = availableTickets.length > 0 ? availableTickets : false;
            };
            if (availablePasses) {
                ticketApplicable = true;
                userTickets = availablePasses;
            } else if (availableTickets) {
                ticketApplicable = true;
                userTickets = availableTickets;
            } else {
                userTickets = null;
            };
            // if (userTickets && userTickets.length > 0) {
            //     // check ticket is already used for the template_id in the match
            //     let usedTickets = await SQL.Users.checkUsedTicket(userId, matchKey, leagueDetails.category, leagueDetails.joining_amount);
            //     if (usedTickets.length > 0) {
            //         ticketApplicable = false;
            //         userTickets = false;
            //     } else {
            //         ticketApplicable = true;
            //     }
            // }
        }
        let ticketApplied = 0;
        if (ticketApplicable) {
            /**
             * TODO: implement ticket applyed logic here
             */
            ticketApplied = 1; //ticket is options
            if (leagueDetails.bonus_applicable != 2) { // is not bonus applicable league
                if (userRealCash < joiningAmount) ticketApplied = 2; // ticket is mandatory
            }
            response.ticketApplied = ticketApplied;
            if (ticketApplied != 0) {
                joiningAmount = joiningAmount - leagueDetails.joining_amount;
            }
        } else {
            if (leagueDetails.bonus_applicable != 2 && userRealCash < joiningAmount) {
                response.required_amount = {
                    amount: joiningAmount - userRealCash
                }
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Insufficient_credit,
                    message: __("insufficient_credit"),
                    title: "full",
                    response: response
                })
            }
        }

        if (ticketApplied == 0) {
            if (userUnusedAmount < 0 || userCreditsAmount < 0 || userBonusAmount < 0) {
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Error,
                    message: __("NEGATIVE_AMOUNT_ERR"),
                    title: "full"
                })
            }
        }

        if (leagueDetails.bonus_applicable != 2) {
            if (userRealCash < joiningAmount) {
                response.required_amount = {
                    amount: joiningAmount - userRealCash
                }
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Insufficient_credit,
                    message: __("insufficient_credit"),
                    title: "full",
                    response: response
                })
            }
        } else {
            var maxApplicableBonus = (parseFloat(joiningAmount) * parseFloat(bonousPercent)).toFixed(2)
        }

        /**
         * Calculating the applied amounts
         */
        var unusedAmntApplied = 0;
        var bonusAmtApplied = 0;
        var creditsApplied = 0;
        var cashAmntApplied = 0;
        var userRemainingBonus = 0;
        var userRemainingUnusedAmnt = 0;
        var userRemainingCredits = 0;
        console.log('Current unused amount====>> ', userUnusedAmount);
        console.log('Current bonus amount====>> ', userBonusAmount);
        console.log('Current credit amount====>> ', userCreditsAmount);

        if (maxApplicableBonus) {
            var insufficentBonus = 0;
            if (userBonusAmount > maxApplicableBonus) {
                bonusAmtApplied = maxApplicableBonus;
                userRemainingBonus = userBonusAmount - maxApplicableBonus;
            } else {
                insufficentBonus = maxApplicableBonus - userBonusAmount;
                bonusAmtApplied = userBonusAmount;
                userRemainingBonus = 0;
            }
            if (insufficentBonus) {
                unusedAmntRequired = joiningAmount - bonusAmtApplied
                if (userUnusedAmount > unusedAmntRequired) {
                    unusedAmntApplied = unusedAmntRequired;
                    userRemainingUnusedAmnt = userUnusedAmount - unusedAmntRequired;
                } else {
                    unusedAmntApplied = userUnusedAmount;
                    userRemainingUnusedAmnt = 0;
                    var creditRequired = joiningAmount - unusedAmntApplied - bonusAmtApplied;
                    if (userCreditsAmount >= creditRequired) {
                        creditsApplied = creditRequired;
                        userRemainingCredits = userCreditsAmount - creditRequired;
                    } else {
                        response.required_amount = {
                            amount: creditRequired - userCreditsAmount
                        }
                        return reject({
                            status: false,
                            code: Utils.StatusCodes.Insufficient_credit,
                            message: __("insufficient_credit"),
                            title: "full",
                            response: response
                        })
                    }
                }
            } else {
                var requiredAmount = joiningAmount - bonusAmtApplied;
                if (userUnusedAmount > requiredAmount) {
                    unusedAmntApplied = requiredAmount;
                    userRemainingUnusedAmnt = userUnusedAmount - requiredAmount;
                } else {
                    var unusedAmntRequired = requiredAmount - userUnusedAmount;
                    unusedAmntApplied = userUnusedAmount;
                    userRemainingUnusedAmnt = 0;
                    if (userCreditsAmount >= unusedAmntRequired) {
                        creditsApplied = unusedAmntRequired;
                        userRemainingCredits = userCreditsAmount - unusedAmntRequired;
                    } else {
                        response.required_amount = {
                            amount: unusedAmntRequired - userCreditsAmount
                        }
                        return reject({
                            status: false,
                            code: Utils.StatusCodes.Insufficient_credit,
                            message: __("insufficient_credit"),
                            title: "full",
                            response: response
                        })
                    }
                }
            }
        } else {
            if (userUnusedAmount > joiningAmount) {
                unusedAmntApplied = joiningAmount;
                userRemainingUnusedAmnt = userUnusedAmount - joiningAmount;
            } else {
                var unusedAmntRequired = joiningAmount - userUnusedAmount;
                unusedAmntApplied = userUnusedAmount;
                userRemainingUnusedAmnt = 0;
                if (userCreditsAmount >= unusedAmntRequired) {
                    creditsApplied = unusedAmntRequired;
                    userRemainingCredits = userCreditsAmount - unusedAmntRequired;
                } else {
                    response.required_amount = {
                        amount: unusedAmntRequired - userCreditsAmount
                    }
                    return reject({
                        status: false,
                        code: Utils.StatusCodes.Insufficient_credit,
                        message: __("insufficient_credit"),
                        title: "full",
                        response: response
                    })
                }
            }
        }
        // let allJoinedTeams = leagueDetails.all_teams_joined;
        // delete leagueDetails.all_teams_joined;
        // leagueDetails.user_teams = allJoinedTeams;
        let data = {
            status: true,
            code: Utils.StatusCodes.Success,
            message: __("success"),
            title: "success",
            response: {
                user: userDetails,
                league: leagueDetails,
                teams: teamsArray,
                userBalance: {
                    unused: userUnusedAmount,
                    credits: userCreditsAmount,
                    bonus: userBonusAmount,
                },
                appliedAmount: {
                    unusedAmntApplied: unusedAmntApplied,
                    creditsApplied: creditsApplied,
                    bonusAmtApplied: bonusAmtApplied
                },
                ticketApplied: ticketApplied,
                userTickets: userTickets
            },
        }
        console.log('league preview succes sending....');
        resolve(data)
    })
}

async function addChildLeague(matchKey, leagueId) {
    // console.log('Inside child Add League....')
    // console.log("LeagueId , MatchKey", leagueId, matchKey)
    return new Promise(async(resolve, reject) => {
        let leagueDetails = await SQL.Kabaddi.getLeaguesDetails(matchKey, leagueId, "kb_leagues");
        // console.log("league Details>>>>>....", leagueDetails)
        if (leagueDetails == undefined || leagueDetails.length < 0) {
            leagueDetails = await SQL.Kabaddi.getLeaguesByTemplate(matchKey, leagueId)
        }
        leagueDetails = leagueDetails[0]
        console.log("LeagueDetails is >>>>0", leagueDetails);

        if (!leagueDetails || leagueDetails == "" || leagueDetails == undefined || leagueDetails == null) reject({ status: false, code: 400, message: __("WRONG_DATA"), title: "league not exist" });
        let currentJoined = 0;
        let maxTeams = 0;
        if (leagueDetails) {
            currentJoined = leagueDetails.total_joined;
            maxTeams = leagueDetails.max_players;
        }
        let fullUpdated = false;
        let isFull = false;
        if (leagueDetails.is_infinity) {
            let setQuery = ``;
            if ((currentJoined >= Config.INFINITY_TERMINATOR) && !leagueDetails.is_full) isFull = true;
            // updating winners
            if (leagueDetails.league_winner_type == 'fixed_winner') {
                let winPercent = leagueDetails.winning_percentage;
                let totalAmount = (currentJoined * leagueDetails.joining_amount).toFixed(2);
                let currentPrize = ((totalAmount * winPercent) / 100).toFixed(2);
                setQuery = `win_amount=${currentPrize}`
                if (isFull) {
                    fullUpdated = true;
                    setQuery = setQuery + `, is_full = 1`
                }
                await SQL.Kabaddi.updateLeague(setQuery, `league_id=${leagueId}`, 'kb_leagues')
            } else {
                let winPercent = leagueDetails.total_winners_percent;
                let setQuery = ``;
                let currentWinners = ((currentJoined * winPercent) / 100).toFixed(2)
                if (!currentWinners) currentWinners = 1;
                let currentPrize = currentWinners * leagueDetails.win_per_user;
                if (currentWinners) {
                    setQuery = `win_amount=${currentPrize}, total_winners=${currentWinners}`
                    if (isFull) {
                        fullUpdated = true;
                        setQuery = setQuery + ` is_full = 1`
                    }
                    await SQL.Kabaddi.updateLeague(setQuery, `league_id=${leagueId}`, 'kb_leagues')
                }
            }
        }
        // update is full
        if (!fullUpdated && (currentJoined >= maxTeams) && !leagueDetails.is_full) {
            await SQL.Cricket.updateLeague(`is_full=1`, `league_id=${leagueId}`, 'kb_leagues')
        }
        if (currentJoined < maxTeams) {
            console.log('current joined=>> ', currentJoined);
            console.log('max teams =>> ', currentJoined);
            return reject({
                status: false,
                code: 400,
                message: "Current joined is not reach to max limit",
                title: "WRONG_DATA"
            })
        }
        let referenceLeagueId = leagueDetails.reference_league;
        let leagueRepeats = leagueDetails.league_repeats;
        let leagueRepeated = leagueDetails.repeat_counts;
        let referenceLeague = false;
        let activeRefrenceLeague = false;
        console.log('refrence league id => ', referenceLeagueId);

        if (referenceLeagueId != 0) {
            referenceLeague = await SQL.Kabaddi.getLeaguesDetails(matchKey, referenceLeagueId, "kb_leagues");
            console.log('refrence=>>>> ', referenceLeague);

            if (!referenceLeague) return reject({
                status: false,
                code: 400,
                message: 'Refrence league not founded',
                title: "WRONG_DATA"
            });
            if (referenceLeague.length <= 0) return reject({
                status: false,
                code: 400,
                message: 'Refrence league not founded',
                title: "WRONG_DATA"
            });
            referenceLeague = referenceLeague[0];
            leagueRepeats = referenceLeague.league_repeats;
            leagueRepeated = referenceLeague.repeat_counts;

            activeRefrenceLeague = await SQL.Football.getLeagueDetails(`where reference_league=${referenceLeagueId} and max_players>total_joined`);
        }
        if (!leagueRepeats) return reject({
            status: false,
            code: 400,
            message: 'League not repeatable',
            title: "WRONG_DATA"
        });

        if (leagueRepeated >= leagueRepeats) return reject({
            status: false,
            code: 400,
            message: 'League repeatation completed',
            title: "WRONG_DATA"
        });

        // check if any fo the refrence league is active
        if (activeRefrenceLeague && activeRefrenceLeague.length > 0) return reject({
            status: false,
            code: 400,
            message: 'A refrence league is already active.',
            title: "WRONG_DATA"
        });

        /**
         * Repeat the same league for the match
         * and generate the league Code
         */
        let leagueCode = await MatchController.generateLeagueCode(6);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(6);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(6);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(6);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(7);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(7);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(7);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(7);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(8);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(8);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(8);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(8);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(9);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(9);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(9);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(9);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(10);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(10);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(10);
        if (!leagueCode) leagueCode = await MatchController.generateLeagueCode(10);
        console.log("league code generated=>>>> ", leagueCode, referenceLeagueId);

        if (!leagueCode) return reject({
            status: false,
            code: 400,
            message: 'Unable to geenerate league code.',
            title: "WRONG_DATA"
        });
        if (referenceLeague) leagueDetails = referenceLeague;
        let newLeagueData = {
            "category": leagueDetails.category,
            "is_private": leagueDetails.is_private,
            "league_code": leagueCode,
            "fantasy_type": leagueDetails.fantasy_type,
            "template_id": leagueDetails.template_id,
            "reference_league": referenceLeagueId ? referenceLeagueId : leagueId,
            "match_key": matchKey,
            "league_order": leagueDetails.league_order,
            "league_type": leagueDetails.league_type,
            "min_deposit": leagueDetails.min_deposit,
            "is_mega": leagueDetails.is_mega,
            "league_name": leagueDetails.league_name,
            "team_type": leagueDetails.team_type,
            "confirmed_league": 1,
            "bonus_applicable": leagueDetails.bonus_applicable,
            "bonus_percent": leagueDetails.bonus_percent,
            "max_players": leagueDetails.max_players,
            "joining_amount": leagueDetails.joining_amount,
            "total_amount": leagueDetails.total_amount,
            "win_amount": leagueDetails.win_amount,
            "total_winners": leagueDetails.total_winners,
            "rake_per_user": leagueDetails.rake_per_user,
            "league_msg": leagueDetails.league_msg,
            "is_reward": leagueDetails.is_reward,
            "total_bbcoins": leagueDetails.total_bbcoins ? leagueDetails.total_bbcoins : 0,
            "outgoing_bbcoins": leagueDetails.outgoing_bbcoins ? leagueDetails.outgoing_bbcoins : 0,
            "league_winner_type": leagueDetails.league_winner_type,
            "is_jackpot": leagueDetails.is_jackpot,
            "min_players": leagueDetails.min_players,
            "is_infinity": leagueDetails.is_infinity,
            "win_per_user": leagueDetails.win_per_user,
            "total_winners_percent": leagueDetails.total_winners_percent,
            "winning_percentage": leagueDetails.winning_percentage,
            "banner_image": leagueDetails.banner_image,
            "total_winners_infinity": leagueDetails.total_winners_infinity,
            "time_based_bonus": leagueDetails.time_based_bonus
        };
        let proceedLeagueData = true;
        let winners = false;
        if (leagueDetails.total_winners <= 1) {
            newLeagueData.league_status = 1;
            winners = await SQL.Football.getLeagueData(`league_id=${referenceLeagueId}`)
        } else {
            newLeagueData.league_status = 2;
            proceedLeagueData = true;
            winners = await SQL.Football.getLeagueData(`league_id=${referenceLeagueId}`)
        }
        let newInsertedLeague = await SQL.Kabaddi.insertData2(newLeagueData, "kb_leagues")
        if (!newInsertedLeague) return reject({
            status: false,
            code: 400,
            message: 'Unable to add league.',
            title: "WRONG_DATA"
        });
        let newLeagueId = newInsertedLeague.insertId;
        if (!proceedLeagueData) {
            await SQL.Football.updateLeague(`repeat_counts=repeat_counts+1`, `league_id=${leagueId}`, 'bb_leagues')
            return resolve({
                status: true,
                newInsertedLeague: newInsertedLeague
            })
        }
        let winnerBulkData = [];
        for (const iterator of winners) {
            winnerBulkData.push({
                league_id: newLeagueId,
                win_from: iterator.win_from,
                win_to: iterator.win_to,
                win_amount: iterator.win_amount,
                bbcoins: iterator.bbcoins ? bbcoins : 0
            })
        }
        await SQL.Kabaddi.leagueDatabulkInsert(winnerBulkData, "kb_leagues_data")
            //TODO: error handline if any error remove the added leagues
        await SQL.Kabaddi.updateLeague(`repeat_counts=repeat_counts+1`, `league_id=${leagueId}`, 'kb_leagues')
        await SQL.Kabaddi.updateLeague(`league_status=1`, `league_id=${newLeagueId}`, 'kb_leagues')
        return resolve({
            status: true,
            newInsertedLeague: newInsertedLeague
        })
    })
}

async function insertLeagueJoiningData(userDetails, leagueDetails, teamsArray, userUnusedAmount, userCreditsAmount, userBonusAmount, appliedAmounut, ticketApplied, tickets, clientIp) {
    console.log(`insertLeagueJoiningData function `, ticketApplied);
    return new Promise((resolve, reject) => {
        try {
            db.getConnection((error, connection) => {
                // console.log(leagueDetails);
                if (error) {
                    console.log('error in getting connection=>> ', error);
                    reject(error)
                }
                connection.beginTransaction(async (err) => {
                    if (err) {
                        return await connection.rollback(() => {
                            connection.release()
                            console.log('error in transaction of joining -> ', err);
                            reject(err)
                        });
                    } else {
                        let userCurrentBal = await db.query(`SELECT unused_amount, credits, bonus_cash FROM bb_users WHERE user_id=${userDetails.user_id} FOR UPDATE`)
                        if (userCurrentBal.unused_amount < userUnusedAmount || userCurrentBal.credits < userCreditsAmount || userCurrentBal.bonus_cash < userBonusAmount) {
                            // throw "Your credits have been changed, please try again."
                            console.log('credits changed while joining =>>> ');
                            connection.release()
                            reject("Your credits have been changed, please try again.")
                        } else {
                            console.log('procedding league joining data ==>> ');
                            var leagueBulkValues = ``;
                            var creditStatsBulkValues = ``;
                            let unusedAmntApplied = 0;
                            let creditsApplied = 0;
                            let bonusAmtApplied = 0;
                            if (appliedAmounut.unusedAmntApplied) {
                                unusedAmntApplied = appliedAmounut.unusedAmntApplied / teamsArray.length
                            }
                            if (appliedAmounut.creditsApplied) {
                                creditsApplied = appliedAmounut.creditsApplied / teamsArray.length
                            }
                            if (appliedAmounut.bonusAmtApplied) {
                                bonusAmtApplied = appliedAmounut.bonusAmtApplied / teamsArray.length
                            }
                            let leagueBulkData = [];
                            let creditStatsBulkData = [];
                            let currentDate = Utils.Mysql_dt
                            Bluebird.each(teamsArray, (element, index) => {
                                let ticketCount = 0;
                                if (tickets) tickets.length;
                                if (ticketApplied == 1 && index < ticketCount) {
                                    let txnType = Utils.Constants.txnTypes.leagueJoinedWithTicket;
                                    let txnMsg = Utils.Constants.txnMessages.leagueJoinedWithTicket
                                    if (tickets[0].ticket_type == 3) {
                                        txnType = Utils.Constants.txnTypes.leagueJoinedWithPass;
                                        txnMsg = Utils.Constants.txnMessages.leagueJoinedWithPass;
                                    }
                                    leagueBulkData.push({
                                        match_key: leagueDetails.match_key,
                                        fantasy_type: leagueDetails.fantasy_type,
                                        league_id: leagueDetails.league_id,
                                        user_id: userDetails.user_id,
                                        user_name: userDetails.username,
                                        team_number: element,
                                        unused_applied: unusedAmntApplied,
                                        cash_applied: creditsApplied,
                                        bonus_applied: bonusAmtApplied,
                                        is_ticket: 0,
                                        user_ip_join: clientIp,
                                        date_added: currentDate
                                    });
                                    creditStatsBulkData.push({
                                        user_id: userDetails.user_id,
                                        play_type: 1,
                                        unused_cash: unusedAmntApplied,
                                        real_cash: unusedAmntApplied + creditsApplied,
                                        bonus_cash: bonusAmtApplied,
                                        amount: 0,
                                        league_id: leagueDetails.league_id,
                                        league_name: leagueDetails.league_name,
                                        match_key: leagueDetails.match_key,
                                        match_name: leagueDetails.match_short_name,
                                        match_date: leagueDetails.start_date_unix,
                                        team_name: element,
                                        team_a_flag: leagueDetails.team_a_flag,
                                        team_b_flag: leagueDetails.team_b_flag,
                                        transaction_type: txnType,
                                        transaction_message: txnMsg,
                                        transaction_date: currentDate
                                    })
                                } else {
                                    leagueBulkData.push({
                                        match_key: leagueDetails.match_key,
                                        fantasy_type: leagueDetails.fantasy_type,
                                        league_id: leagueDetails.league_id,
                                        user_id: userDetails.user_id,
                                        user_name: userDetails.username,
                                        team_number: element,
                                        unused_applied: 0,
                                        cash_applied: 0,
                                        bonus_applied: leagueDetails.joining_amount,
                                        is_ticket: 1,
                                        user_ip_join: clientIp,
                                        date_added: currentDate
                                    });
                                    creditStatsBulkData.push({
                                        user_id: userDetails.user_id,
                                        play_type: 1,
                                        unused_cash: unusedAmntApplied,
                                        real_cash: unusedAmntApplied + creditsApplied,
                                        bonus_cash: bonusAmtApplied,
                                        amount: leagueDetails.joining_amount,
                                        league_id: leagueDetails.league_id,
                                        league_name: leagueDetails.league_name,
                                        match_key: leagueDetails.match_key,
                                        match_name: leagueDetails.match_short_name,
                                        match_date: leagueDetails.start_date_unix,
                                        team_name: element,
                                        team_a_flag: leagueDetails.team_a_flag,
                                        team_b_flag: leagueDetails.team_b_flag,
                                        transaction_type: Utils.Constants.txnTypes.leagueJoined,
                                        transaction_message: Utils.Constants.txnMessages.leagueJoined,
                                        transaction_date: currentDate
                                    })
                                }
                            }).then(async _ => {
                                var result = false;
                                try {
                                    result = await SQL.Kabaddi.userLeagueBulkInsert(leagueBulkData)
                                } catch (error) {
                                    connection.release()
                                    reject(error)
                                }
                                if (result && result.affectedRows) {
                                    result = await SQL.Users.creditstatsBulkInsert(creditStatsBulkData)
                                    await SQL.Users.updateUserBalance(`unused_amount=unused_amount-${appliedAmounut.unusedAmntApplied},bonus_cash=bonus_cash-${appliedAmounut.bonusAmtApplied}, credits=credits-${appliedAmounut.creditsApplied}`, `user_id=${userId}`);
                                    connection.commit();
                                    connection.release()
                                    resolve(result)
                                } else {
                                    connection.release()
                                    reject("Unable to join league")
                                }
                            }).catch(_ => {
                                // connection.release()
                                reject(_)
                            })
                        }
                    }
                })
            })
        } catch (error) {
            reject(error)
        }
    })
}


module.exports = {
    fetchUserTeams: fetchUserTeams,
    joinLeague: async (req, res) => {
        let user = req.user;
        if (!user.user_id) return await Utils.ResponseHandler(false, 400, "user not found", __("WRONG_DATA"), res)
        let userId = req.user.user_id;
        let fantasyType = req.body.fantasy_type;
        let matchKey = req.body.match_key;
        let leagueId = req.body.league_id;
        let teams = req.body.teams;
        let ticketApplied = req.body.ticket_applied;
        const ip = req.clientIp;
        if (!userId || !fantasyType || !matchKey || !teams || !leagueId)
            return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res);

        leaguePreview({
            userId: userId,
            fantasyType: fantasyType,
            matchKey: matchKey,
            leagueId: leagueId,
            teams: teams.toString(),
            isJoining: true,
            ticketApplied: ticketApplied
        }).then(async success => {
            console.log('successsss getting success');
            try {
                if (success) {

                    let teamsArray = success.response.teams
                    let userDetails = success.response.user;
                    let leagueDetails = success.response.league;
                    let userUnusedAmount = success.response.userBalance.unused;
                    let userCreditsAmount = success.response.userBalance.credits;
                    let userBonusAmount = success.response.userBalance.bonus;

                    let unusedAmntApplied = success.response.appliedAmount.unusedAmntApplied;
                    let creditsApplied = success.response.appliedAmount.creditsApplied;
                    let bonusAmtApplied = success.response.appliedAmount.bonusAmtApplied;
                    ticketApplied = success.response.ticketApplied;
                    let ticket = success.response.userTickets;
                    // return res.send({
                    //     ticket: success.response.userTickets,
                    //     count: success.response.userTickets.length
                    // });
                    insertLeagueJoiningData(userDetails, leagueDetails, teamsArray, userUnusedAmount, userCreditsAmount, userBonusAmount, { unusedAmntApplied: unusedAmntApplied, creditsApplied: creditsApplied, bonusAmtApplied: bonusAmtApplied }, success.response.ticketApplied, ticket, ip).then(async result => {
                        // console.log("League joined success fully ", result);
                        // console.log('league details ==>> ', response);
                        if (result.affectedRows) {
                            if (leagueDetails.league_type == 1) { // if not practice and freerolls league
                                let userTickets = false;
                                if (ticket) ticket.length > 0 ? ticket[0] : false;
                                if (!userTickets) {
                                    if (userDetails.affiliated_by && (unusedAmntApplied + creditsApplied) > 0) {
                                        //for affiliate users
                                        /**TODO:
                                         * make enteryes in affiliate joining table
                                         * INSERT IGNORE INTO bb_affiliate_joinings (match_key, affiliate_id, joiner, date_added) VALUES $values
                                         */
                                        console.log("Ticket not Applie=====>>>> ,", userTickets);
                                    }
                                } else {
                                    console.log("Ticket applied===>>> ", matchKey, userTickets);
                                    let currentDate = moment().format('YYYY MM DD h:mm:ss').toString();
                                    let ticketsRowIds = ticket.map(value => value.row_id).toString();
                                    var query = `UPDATE bb_ticket_users SET used_status = ?, play_type =?,match_used =?,league_used =? WHERE row_id in(${ticketsRowIds})`
                                    var ticketUpdateResult = await SQL.Users.rawQuery(query, [2, 1, matchKey, leagueId, userTickets.row_id])
                                }
                            } else {
                                // var query = `UPDATE bb_users SET total_contest_joined = total_contest_joined+1, last_contest_date ='${moment()}',modified_date ='${moment()}', WHERE user_id=${userId}`
                                var ticketUpdateResult = await db.query(query)
                            }
                            console.log("leagueDetails is>>>", leagueDetails);
                            let params = {
                                user_email: user.email,
                                user_name: user.username,
                                link: __('WEB_LINK'),
                                leagueDetails: {
                                    team_number: req.body.teams,
                                    league_name: leagueDetails.league_name,
                                    entry_fee: leagueDetails.joining_amount,
                                    prize_pool: leagueDetails.win_amount,
                                    match_name: leagueDetails.match_name,
                                    Msg: __('LEAGUE_JOIN_SUCCESS')
                                }
                            };
                            await Utils.EmailService.sendMail(Utils.Constants.emails.joinLeagueMail, params);
                            await addChildLeague(matchKey, leagueId)
                            return await Utils.ResponseHandler(true, 200, "Success", __("LEAGUE_JOIN_SUCCESS"), res)
                        } else {
                            console.log('error in joinin->> ', result);
                            return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res, response)
                        }
                    }).catch(async _ => {
                        console.log('Error in league joining===>>> 11111', _);
                        // return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
                        return await Utils.ResponseHandler(true, 200, "Success", __("LEAGUE_JOIN_SUCCESS"), res)
                    })
                } else {
                    console.log('success not defined->> ', success);
                    return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
                }
            } catch (error) {
                console.log('error ==>>> ', error);
                return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
            }
        }, async error => {
            if (error.response && error.response.league.user_teams) error.response.league.user_teams = error.response.league.user_teams.split(',');
            return await Utils.ResponseHandler(error.status, error.code, error.title, error.message, res, error.response)
        }).catch(async e => {
            console.log('Error in league joining===>>> 2222', e);
            return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
        })
    },
}