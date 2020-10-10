const Utils = require('../../utils');
const SQL = require('../../sql')
const Config = require('../../config')
const db = require('../../utils/CricketDbConfig');
const Bluebird = require('bluebird');
var moment = require('moment');
let MatchController = require('./MatchContorller');

async function userTicketsInfo(userId, matchKey) {
    let ticketUsedForMatch = await SQL.Cricket.getTicketUsersTable(` t1.user_id = ${userId} and t1.match_used = ${matchKey} and t1.used_status = 2`, `t1.league_used, t1.date_used`, true, ` t2.ticket_id, t2.ticket_title, t2.ticket_type, t2.league_id, t2.ticket_status`);

    // get active tickets
    let activeTickets = await SQL.Cricket.userActiveTickets(userId);

    let matchLeagueTickets = anyLeagueTickets = matchLeagueKeys = matchTicketKeys = new Array();
    if (activeTickets) {
        await activeTickets.forEach(async thisTicket => {
            if (thisTicket['ticket_type'] == 1) {
                let matchLeagueKey = thisTicket['match_key'] + "_" + thisTicket['league_id'];
                if (matchLeagueTickets.map(i => Object.keys(i).map(j => j == matchLeagueKey ? true : false))) {
                    if (thisTicket['ticket_expiry'] < matchLeagueTickets.map(i => i['ticket_expiry'])) matchLeagueTickets.map(i => i[matchLeagueKey] = thisTicket);
                } else {
                    matchLeagueKeys.push(matchLeagueKey);
                    matchLeagueTickets.map(i => i[matchLeagueKey] = thisTicket);
                }
            }
            anyLeagueTickets.push(thisTicket);
        })
    }
    // get all used tickets for the matches
    if (matchLeagueTickets) {
        let matchTicketKeys = matchLeagueTickets.join(",");

        let ticketUsed = await SQL.Cricket.getTicketUsersTable(`t1.user_id = ${user_id} and t1.match_used IN(${matchTicketKeys}) and used_status = 2`, `t1.match_used`, true, `t2.ticket_id, t2.ticket_type, t2.league_id`);

        if (ticketUsed) {
            await ticketUsed.forEach(async thisUsed => {
                let thismatchLeague = thisUsed['match_used'] + "_" + thisUsed['league_id'];
                if (matchLeagueTickets.map(i => Object.keys(i).map(j => j == thismatchLeague ? true : false))) {
                    await matchLeagueTickets.map(async thisTicket => delete thisTicket[matchLeagueTickets]);
                }
            })
        }


    }
    let mergeTickets = matchLeagueTickets.concat(anyLeagueTickets);
    mergeTickets = await mergeTickets.map(async thisTicket => Object.values(thisTicket));

    let response = {
        'match_used': ticketUsedForMatch,
        'active_tickets': mergeTickets
    }

    return response;

}


async function insertLeagueJoiningData(userDetails, leagueDetails, teamsArray, userUnusedAmount, userCreditsAmount, userBonusAmount, appliedAmounut, ticketApplied, tickets, availablePasses, clientIp) {
    console.log(`insertLeagueJoiningData function `, leagueDetails);
    let joinedTeams = [];
    if (leagueDetails.user_teams) joinedTeams = leagueDetails.user_teams.split(',');
    console.log('applied amount= >>>>> ', appliedAmounut);

    // return ;
    return new Promise(async (resolve, reject) => {
        try {
            //########################################################################################################################
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

            let currentDate = await db.query('select NOW() as date');

            currentDate = currentDate[0].date
            let remaningbonusAmount = appliedAmounut.bonusAmtApplied;
            let remaningUnusedAmount = appliedAmounut.unusedAmntApplied;
            let remaningCreditsAmount = appliedAmounut.creditsApplied;

            let isJumperApplicable = true
            if (ticketApplied == 1) isJumperApplicable = false
            let joinedTeamsCounter = joinedTeams.length;
            let passProcessed = 0;
            Bluebird.each(teamsArray, (element, index) => {
                let ticketCount = 0;
                if (tickets) ticketCount++;
                if (ticketApplied == 1 && index < ticketCount) isJumperApplicable = false;
                if (isJumperApplicable) {
                    if (leagueDetails.jumper) {
                        bonusAmtApplied = 0;
                        unusedAmntApplied = 0;
                        creditsApplied = 0;
                        // console.log('league jumper => ', leagueDetails.jumper.split(","));
                        let jumperBonus = leagueDetails.jumper.split(",");
                        let thisTeamBonusApplied = (leagueDetails.joining_amount * jumperBonus[joinedTeamsCounter]) / 100;
                        if (appliedAmounut.bonusAmtApplied <= 0) {
                            thisTeamBonusApplied = 0;
                        }
                        if (remaningbonusAmount < thisTeamBonusApplied) {
                            thisTeamBonusApplied = remaningbonusAmount;
                        }
                        let thisTeamUnusedApplied = leagueDetails.joining_amount - thisTeamBonusApplied;
                        let thisTeamCreditsApplied = 0;

                        if (thisTeamBonusApplied <= remaningbonusAmount) {
                            bonusAmtApplied = thisTeamBonusApplied;
                        } else {
                            bonusAmtApplied = thisTeamBonusApplied - (thisTeamBonusApplied - remaningbonusAmount);
                            thisTeamUnusedApplied = thisTeamUnusedApplied + (bonusAmtApplied - remaningbonusAmount)
                        }

                        if (thisTeamUnusedApplied <= remaningUnusedAmount) {
                            unusedAmntApplied = thisTeamUnusedApplied;
                        } else {
                            unusedAmntApplied = thisTeamUnusedApplied - (thisTeamUnusedApplied - remaningUnusedAmount);
                            thisTeamCreditsApplied = thisTeamCreditsApplied + (unusedAmntApplied - remaningUnusedAmount);
                        }
                        unusedAmntApplied = parseFloat(unusedAmntApplied);
                        bonusAmtApplied = parseFloat(bonusAmtApplied);
                        if ((unusedAmntApplied + bonusAmtApplied) < leagueDetails.joining_amount) {
                            let creditRequired = leagueDetails.joining_amount - (bonusAmtApplied + unusedAmntApplied);
                            if (creditRequired <= remaningCreditsAmount) {
                                creditsApplied = creditRequired;
                            } else {
                                creditsApplied = remaningCreditsAmount;
                            }
                        }
                        remaningbonusAmount = remaningbonusAmount - bonusAmtApplied;
                        remaningUnusedAmount = remaningUnusedAmount - unusedAmntApplied;
                        remaningCreditsAmount = remaningCreditsAmount - creditsApplied;
                        remaningbonusAmount = remaningbonusAmount.toFixed(2)
                        remaningUnusedAmount = remaningUnusedAmount.toFixed(2)
                        remaningCreditsAmount = remaningCreditsAmount.toFixed(2)
                        joinedTeamsCounter++;
                    }
                }
                isJumperApplicable = true;

                if (availablePasses.length > 0 && passProcessed < availablePasses.length && passProcessed < teamsArray.length) {
                    unusedAmntApplied = 0;
                    creditsApplied = 0;
                    bonusAmtApplied = 0;
                    let txnType = Utils.Constants.txnTypes.leagueJoinedWithTicket;
                    let txnMsg = Utils.Constants.txnMessages.leagueJoinedWithTicket
                    if (tickets.ticket_type == 3) {
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
                        unused_applied: leagueDetails.joining_amount / 2,
                        cash_applied: creditsApplied,
                        bonus_applied: leagueDetails.joining_amount / 2,
                        is_ticket: 2,
                        user_ip_join: clientIp,
                        date_added: currentDate
                    });
                    creditStatsBulkData.push({
                        user_id: userDetails.user_id,
                        play_type: 1,
                        unused_cash: leagueDetails.joining_amount / 2,
                        real_cash: unusedAmntApplied + creditsApplied,
                        bonus_cash: leagueDetails.joining_amount / 2,
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
                    passProcessed = passProcessed + 1;
                } else if (ticketApplied == 1 && index < ticketCount) {
                    if (appliedAmounut.unusedAmntApplied) {
                        unusedAmntApplied = appliedAmounut.unusedAmntApplied / (teamsArray.length - 1)
                    }
                    if (appliedAmounut.creditsApplied) {
                        creditsApplied = appliedAmounut.creditsApplied / (teamsArray.length - 1)
                    }
                    if (appliedAmounut.bonusAmtApplied) {
                        bonusAmtApplied = appliedAmounut.bonusAmtApplied / (teamsArray.length - 1)
                    }
                    let txnType = Utils.Constants.txnTypes.leagueJoinedWithTicket;
                    let txnMsg = Utils.Constants.txnMessages.leagueJoinedWithTicket
                    if (tickets.ticket_type == 3) {
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
                        unused_cash: 0,
                        real_cash: 0,
                        bonus_cash: leagueDetails.joining_amount,
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
                    if (availablePasses.length > 0) {
                        if (appliedAmounut.unusedAmntApplied > 0) {
                            unusedAmntApplied = appliedAmounut.unusedAmntApplied / (teamsArray.length - availablePasses.length)
                        }
                        if (appliedAmounut.creditsApplied > 0) {
                            creditsApplied = appliedAmounut.creditsApplied / (teamsArray.length - availablePasses.length)
                        }
                        if (appliedAmounut.bonusAmtApplied > 0) {
                            bonusAmtApplied = appliedAmounut.bonusAmtApplied / (teamsArray.length - availablePasses.length)
                        }
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

                db.getConnection((error, connection) => {
                    // console.log(leagueDetails);
                    if (error) {
                        console.log('error in getting connection=>> ', error);
                        connection.rollback();
                        reject(error)
                    }
                    connection.beginTransaction(async (err) => {
                        try {
                            if (err) {
                                console.log('error in begin transaction=>> ', error);
                                connection.rollback();
                                reject(err)
                            } else {
                                connection.query(`SELECT unused_amount, credits,bonus_cash FROM bb_users WHERE user_id= ? FOR UPDATE`, userDetails.user_id, async (error, userCurrentBal) => {
                                    if (error) {
                                        console.log('error in get balance =>> ', error);
                                        connection.rollback();
                                        reject(error)
                                    } else if (userCurrentBal.unused_amount < userUnusedAmount || userCurrentBal.credits < userCreditsAmount || userCurrentBal.bonus_cash < userBonusAmount) {
                                        connection.rollback()
                                        reject("Your credits have been changed, please try again.")
                                    } else {
                                        var result = false;
                                        let bulkData = leagueBulkData;
                                        let data = leagueBulkData[0];
                                        let columns = Object.keys(data);
                                        let sql = `insert into bb_user_leagues (${columns}) VALUES ?`;
                                        connection.query(sql, [bulkData.map(item => [item.match_key, item.fantasy_type, item.league_id, item.user_id,
                                        item.user_name, item.team_number, item.unused_applied, item.cash_applied, item.bonus_applied,
                                        item.is_ticket, item.user_ip_join, item.date_added
                                        ])], async (error, result) => {
                                            if (result && result.affectedRows) {
                                                let bulkData = creditStatsBulkData;
                                                data = creditStatsBulkData[0];
                                                let columns = Object.keys(data);
                                                let sql = `insert into bb_credit_stats (${columns}) VALUES ?`;
                                                connection.query(sql, [bulkData.map(item => [item.user_id, item.play_type, item.unused_cash, item.real_cash, item.bonus_cash, item.amount, item.league_id, item.league_name, item.match_key, item.match_name, item.match_date, item.team_name, item.team_a_flag, item.team_b_flag, item.transaction_type, item.transaction_message, item.transaction_date])], (error, result) => {
                                                    if (error) {
                                                        connection.rollback()
                                                        reject("Unable to join league")
                                                    } else {
                                                        connection.query(`UPDATE bb_users SET unused_amount=unused_amount-${appliedAmounut.unusedAmntApplied},bonus_cash=bonus_cash-${appliedAmounut.bonusAmtApplied}, credits=credits-${appliedAmounut.creditsApplied}, total_contest_joined = total_contest_joined+1, last_contest_date = NOW(), modified_date = NOW() WHERE  user_id = ${userDetails.user_id}`, (error, userresult) => {
                                                            if (error) {
                                                                connection.rollback()
                                                                reject("Unable to join league")
                                                            } else {
                                                                connection.commit();
                                                                connection.release()
                                                                resolve({
                                                                    result: result,
                                                                    userDetails: userDetails,
                                                                    leagueDetails: leagueDetails,
                                                                    teamsArray: teamsArray,
                                                                    userUnusedAmount: userUnusedAmount,
                                                                    userCreditsAmount: userCreditsAmount,
                                                                    userBonusAmount: userBonusAmount,
                                                                    appliedAmounut: appliedAmounut,
                                                                    ticketApplied: ticketApplied,
                                                                    tickets: tickets
                                                                })
                                                            }
                                                        });
                                                    }
                                                });
                                            } else {
                                                connection.rollback()
                                                reject("Unable to join league")
                                            }
                                        });
                                    }
                                })
                            }
                        } catch (error) {
                            connection.rollback();
                            reject(error)
                        }
                    })
                })
            }).catch(_ => {
                reject(_)
            })
            //########################################################################################################################
        } catch (error) {
            reject(error)
        }
    })
}

async function addChildLeague(matchKey, leagueId) {
    // console.log('Inside child Add League....')
    // console.log("LeagueId , MatchKey", leagueId, matchKey)
    return new Promise(async (resolve, reject) => {
        console.log("match_key and league_id", matchKey, leagueId)
        let leagueDetails = await SQL.Cricket.getLeaguesDetails(matchKey, leagueId, "bb_leagues");
        console.log("league Details>>>>>....", leagueDetails)
        if (leagueDetails.length == 0) {
            leagueDetails = await SQL.Cricket.getLeaguesByTemplate(matchKey, leagueId)
        }
        leagueDetails = leagueDetails[0]

        // console.log("league Details by template>>>>>....", leagueDetails)

        if (!leagueDetails || leagueDetails == "" || leagueDetails == undefined || leagueDetails == null) resolve({ status: false, code: 400, message: __("WRONG_DATA"), title: "league not exist" });
        let currentJoined = 0;
        let maxTeams = 0;
        if (leagueDetails) {
            currentJoined = leagueDetails.total_joined;
            maxTeams = leagueDetails.max_players;
        }
        let fullUpdated = false;
        let isFull = false;
        if (leagueDetails.is_infinity == 1) {
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
                await SQL.Cricket.updateLeague(setQuery, `league_id=${leagueId}`, 'bb_leagues')
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
                        setQuery = setQuery + `, is_full = 1`
                    }
                    await SQL.Cricket.updateLeague(setQuery, `league_id=${leagueId}`, 'bb_leagues')
                }
            }
        }
        // update is full
        if (!fullUpdated && (currentJoined >= maxTeams) && !leagueDetails.is_full) {
            await SQL.Cricket.updateLeague(`is_full=1`, `league_id=${leagueId}`, 'bb_leagues')
        }
        if (currentJoined < maxTeams) {
            console.log('current joined=>> ', currentJoined);
            console.log('max teams =>> ', currentJoined);
            return resolve({
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
        let leagueIdRepeatCount = leagueId;
        console.log('refrence league id => ', referenceLeagueId);

        if (referenceLeagueId != 0) {
            referenceLeague = await SQL.Cricket.getLeaguesDetails(matchKey, referenceLeagueId, "bb_leagues");
            console.log('refrence=>>>> ', referenceLeague);

            if (!referenceLeague) return resolve({
                status: false,
                code: 400,
                message: 'Refrence league not founded',
                title: "WRONG_DATA"
            });
            if (referenceLeague.length <= 0) return resolve({
                status: false,
                code: 400,
                message: 'Refrence league not founded',
                title: "WRONG_DATA"
            });
            referenceLeague = referenceLeague[0];
            leagueRepeats = referenceLeague.league_repeats;
            leagueRepeated = referenceLeague.repeat_counts;
            leagueIdRepeatCount = referenceLeagueId
            activeRefrenceLeague = await SQL.Cricket.getLeagueDetails(`where reference_league=${referenceLeagueId} and max_players>total_joined`);
        }
        if (!leagueRepeats) return resolve({
            status: false,
            code: 400,
            message: 'League not repeatable',
            title: "WRONG_DATA"
        });

        if (leagueRepeated >= leagueRepeats) return resolve({
            status: false,
            code: 400,
            message: 'League repeatation completed',
            title: "WRONG_DATA"
        });

        // check if any fo the refrence league is active
        if (activeRefrenceLeague && activeRefrenceLeague.length > 0) return resolve({
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

        if (!leagueCode) return resolve({
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
            "time_based_bonus": leagueDetails.time_based_bonus,
            "date_added": "NOW()"
        };
        let proceedLeagueData = false;
        let winners = await SQL.Cricket.getLeagueData(`league_id=${referenceLeagueId ? referenceLeagueId : leagueId}`);
        newLeagueData.league_status = 1;
        if (winners.length > 0) {
            newLeagueData.league_status = 2;
            proceedLeagueData = true;
        }
        let newInsertedLeague = await SQL.Users.insertData2(newLeagueData, "bb_leagues")
        if (!newInsertedLeague) return resolve({
            status: false,
            code: 400,
            message: 'Unable to add league.',
            title: "WRONG_DATA"
        });
        let newLeagueId = newInsertedLeague.insertId;
        if (!proceedLeagueData) {
            await SQL.Cricket.updateLeague(`repeat_counts=repeat_counts+1`, `league_id=${leagueIdRepeatCount}`, 'bb_leagues')
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
                bbcoins: iterator.bbcoins ? iterator.bbcoins : 0
            })
        }
        try {
            let newLeagueData = await SQL.Cricket.leagueDatabulkInsert(winnerBulkData, "bb_leagues_data")
        } catch (error) {
            console.log('error=> ', error);
            await SQL.Cricket.removeLeagueIfError(newLeagueId);
        }
        //TODO: error handline if any error remove the added leagues
        await SQL.Cricket.updateLeague(`repeat_counts=repeat_counts+1`, `league_id=${leagueIdRepeatCount}`, 'bb_leagues')
        await SQL.Cricket.updateLeague(`league_status=1`, `league_id=${newLeagueId}`, 'bb_leagues')
        return resolve({
            status: true,
            newInsertedLeague: newInsertedLeague
        })
    })
}

function fetchUserTeams(userId, matchKey, fantasyType, joinedTeams) {
    return new Promise(async (resolve, reject) => {
        joinedTeams = joinedTeams == ' ' ? joinedTeams = ' ' : joinedTeams

        let match = await SQL.Cricket.getMatchByKey('*', matchKey);


        console.log("match >>>", match);

        if (match.length == 0) {
            return await reject({ Msg: __('WRONG_DATA'), title: 'error', status: Utils.StatusCodes.Error });
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
        console.log("JoinedTeams before", joinedTeams);
        if (joinedTeams) {
            joinedTeams = joinedTeams.split(',').map(function (item) {
                return parseInt(item, 10);
            })
            console.log("JoinedTeams After", joinedTeams, typeof joinedTeams[0])

        } else joinedTeams = [];
        let where = ` t1.user_id = ${userId} and t1.match_key = ${matchKey} `;
        if (fantasyType == Utils.Constants.fantasyTypes) {
            where = ` t1.user_id = ${userId} and t1.match_key = ${matchKey} and fantasy_type in (${fantasyType.join()})   `
        } else {
            where = ` t1.user_id = ${userId} and t1.match_key = ${matchKey} and fantasy_type = ${fantasyType}  `
        }

        let userTeams = [];
        let maxTeam = Config.MAX_TEAM
        console.log("maxtEam is >>>", maxTeam, fantasyType)
        for (let teamNumber = 1; teamNumber <= maxTeam; teamNumber++) {
            // let team = true;
            let checkInDb = true;
            let isTeamFound = false;
            let dbFantasyType = [];
            if (fantasyType == Utils.Constants.fantasyTypes) {
                for (let index = 1; index < Utils.Constants.fantasyTypes.length + 1; index++) {
                    let team;
                    if (match.closed == 1) {
                        team = await Utils.Redis.getAsync(Utils.Keys.USER_TEAMS_MODEL_POST_MATCH + "_" + userId + "_" + matchKey + "_" + teamNumber + "_" + index);
                    } else {
                        team = await Utils.Redis.getAsync(Utils.Keys.USER_TEAMS_MODEL + "_" + userId + "_" + matchKey + "_" + teamNumber + "_" + index);
                    }

                    if (team == "NO_TEAM_AVAILABLE") { } else if (team) {
                        if (team != "NO_TEAM_AVAILABLE") {
                            team = JSON.parse(team);
                            userTeams.push(...team);
                            isTeamFound = true;
                        }
                    } else {
                        // if (index != 4 && index != 5)
                        dbFantasyType.push(index);
                    }
                }
                if (dbFantasyType.length > 0) {
                    console.log('fantasy type to find in db ', dbFantasyType, teamNumber);
                    console.log('userCricket Team from DB for fantasy types ', teamNumber);
                    where = ` t1.user_id = ${userId} and t1.match_key = ${matchKey} and fantasy_type in (${dbFantasyType.join()}) and t1.team_number = ${teamNumber}  `
                    let team = await SQL.Cricket.getUserTeamDetails(`*`, where, teamTable);
                    if (team.length > 0) {
                        userTeams.push(...team)
                        console.log('from db =>>>', teamNumber, dbFantasyType);
                        for (let ftype = 0; ftype < dbFantasyType.length; ftype++) {
                            const element = dbFantasyType[ftype];
                            // Utils.Redis.set(Utils.Keys.USER_TEAMS_MODEL + "_" + userId + "_" + matchKey + "_" + teamNumber + "_" + element, JSON.stringify(team), 'EX', Utils.RedisExpire.USER_TEAMS_MODEL)
                        }
                        isTeamFound = true;
                    }
                }
                checkInDb = true;
            } else {
                let team;
                if (match.closed == 1) {
                    team = await Utils.Redis.getAsync(Utils.Keys.USER_TEAMS_MODEL_POST_MATCH + "_" + userId + "_" + matchKey + "_" + teamNumber + "_" + fantasyType);
                } else {
                    team = await Utils.Redis.getAsync(Utils.Keys.USER_TEAMS_MODEL + "_" + userId + "_" + matchKey + "_" + teamNumber + "_" + fantasyType);
                }

                if (team == "NO_TEAM_AVAILABLE") {
                    break;
                } else if (team) {
                    if (team != "NO_TEAM_AVAILABLE") {
                        team = JSON.parse(team);
                        userTeams.push(...team);
                        isTeamFound = true;
                    }
                } else {
                    checkInDb = false;
                    where = ` t1.user_id = ${userId} and t1.match_key = ${matchKey} and fantasy_type = ${fantasyType} and t1.team_number = ${teamNumber} `;
                    let team = await SQL.Cricket.getUserTeamDetails(`*`, where, teamTable);
                    if (team.length > 0) {
                        console.log('from db =>>> ', teamNumber, fantasyType);
                        userTeams.push(...team);
                        if (match.closed == 1) {
                            Utils.Redis.set(Utils.Keys.USER_TEAMS_MODEL_POST_MATCH + "_" + userId + "_" + matchKey + "_" + teamNumber + "_" + fantasyType, JSON.stringify(team), 'EX', Utils.RedisExpire.USER_TEAMS_MODEL_POST_MATCH)
                        } else {
                            Utils.Redis.set(Utils.Keys.USER_TEAMS_MODEL + "_" + userId + "_" + matchKey + "_" + teamNumber + "_" + fantasyType, JSON.stringify(team), 'EX', Utils.RedisExpire.USER_TEAMS_MODEL)
                        }
                        isTeamFound = true;
                    } else {
                        break;
                    }
                }
            }
            // console.log("userTeams >>>", team);
            console.log("checkInDb >>>", checkInDb, teamNumber);
            if (!isTeamFound) {
                break;
            }
        }

        //  console.log("userTeams  >>>>", userTeams, typeof userTeams[0].team_number);
        // userTeams = await SQL.Cricket.getUserTeamDetails(`*`, where, teamTable);
        let userTeamsArray = [];
        Bluebird.each(userTeams, async (userTeam, index, length) => {
            if (!joinedTeams.includes(parseInt(userTeam.team_number))) {
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
                    } else if (userTeam.player_role == 'captain_wizard') {
                        formatedTeam.captain_wizard = userTeam.player_key
                    } else if (userTeam.player_role == 'vice_captain_wizard') {
                        formatedTeam.vice_captain_wizard = userTeam.player_key
                    } else if (userTeam.player_role == 'wizard') {
                        formatedTeam.wizard = userTeam.player_key
                    }
                    formatedTeam.players.push(userTeam)
                    userTeamsArray.push(formatedTeam);
                } else {
                    teamDetails.team_number = userTeam.team_number;
                    if (userTeam.player_role == 'captain') {
                        teamDetails.captain = userTeam.player_key
                    } else if (userTeam.player_role == 'vice_captain') {
                        teamDetails.vice_captain = userTeam.player_key
                    } else if (userTeam.player_role == 'captain_wizard') {
                        teamDetails.captain_wizard = userTeam.player_key
                    } else if (userTeam.player_role == 'vice_captain_wizard') {
                        teamDetails.vice_captain_wizard = userTeam.player_key
                    } else if (userTeam.player_role == 'wizard') {
                        teamDetails.wizard = userTeam.player_key
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

function fetchUserTeamsOld(userId, matchKey, fantasyType, joinedTeams) {
    return new Promise(async (resolve, reject) => {
        joinedTeams = joinedTeams == ' ' ? joinedTeams = ' ' : joinedTeams

        let match = await SQL.Cricket.getMatchByKey("*", matchKey);
        if (match && !match.length) {
            return await rejected({ Msg: __('WRONG_DATA'), title: 'error', status: Utils.StatusCodes.Error });
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
        // console.log("JoinedTeams before", joinedTeams)
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
        let userTeams = await SQL.Cricket.getUserTeamDetails(`*`, where, teamTable);
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
        let fantasyType = options.fantasyType;
        let userId = options.userId;
        let matchKey = options.matchKey;
        let leagueId = options.leagueId;
        let teams = options.teams;
        let teamNumber = teams.trim().split(',')
        teamNumber = teamNumber[0]
        let isJoiningFlow = options.isJoining;
        var response = {};
        let ticket = options.ticketApplied;
        // console.log("keys are >>>>", userId, matchKey, leagueId, fantasyType)
        let user = await SQL.Users.getUserById(userId, false);
        user = user[0];

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
        if (!userDetails.length > 0) {
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
        let leagueDetails = await SQL.Cricket.checkLeagueAvailability(userId, leagueId, matchKey, fantasyType, 1, 1, 1);
        leagueDetails = leagueDetails[0];
        let msg = __("LEAGUE_NOT_EXIST");
        let isJoiningFromTicket = false;
        let templateLeague;
        if (!leagueDetails) {
            templateLeague = await SQL.Cricket.getLeagueDetails(` where template_id = ${leagueId} and match_key = ${matchKey} and is_full = 0 `);
            console.log("template League >>>", templateLeague)
            if (templateLeague.length > 0) {
                templateLeague = templateLeague[0]
                leagueId = templateLeague.league_id
            }
            let templateLeagueDetails = await SQL.Cricket.checkLeagueAvailability(userId, leagueId, matchKey, fantasyType, 1, 1, 1);
            if (templateLeagueDetails.length > 0) {
                leagueDetails = templateLeagueDetails[0];
                isJoiningFromTicket = true;
            }
            if (!leagueDetails) {
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Error,
                    message: msg,
                    title: "league not exists"
                })
            }
        }
        let allJoinedTeams = '';
        console.log("All Teams Joined In LeagueDetails >>>", leagueDetails)
        if (leagueDetails && leagueDetails.all_teams_joined) {
            allJoinedTeams = leagueDetails.all_teams_joined;
            delete leagueDetails.all_teams_joined;
        }
        leagueDetails.user_teams = allJoinedTeams;
        // console.log("All Teams Joined In LeagueDetails >>>2", leagueDetails)

        response.league = leagueDetails;
        if (leagueDetails.closed == 1) {
            return reject({
                status: false,
                code: Utils.StatusCodes.Match_closed,
                message: __("match_closed"),
                title: "match_closed"
            })
        }

        //#############################################Ticket check flow start ###########################################################
        response.user_balance = {
            unused: userDetails.unused_amount + 0,
            credits: userDetails.credits + 0,
            bonus: userDetails.bonus_cash + 0
        }
        let userTickets = false;
        let availablePasses = false;
        let availableTickets = false;
        // ticket = true;
        let ticketApplicable = false;
        ticket = leagueDetails.is_private ? false : ticket;
        if (ticket) {
            // Get specific match tickets
            userTickets = await SQL.Users.getUserActiveTickets(userId, matchKey, leagueDetails.category, leagueDetails.joining_amount);
            if (userTickets.length == 0) {
                console.log("inside for match");

                // if specific match ticket not available then check for any match ticket
                userTickets = await SQL.Users.getUserActiveTickets(userId, false, leagueDetails.category, leagueDetails.joining_amount);
            }
            console.log(" tickets are  >>>>>");
            if (userTickets.length > 0) {
                availablePasses = userTickets.filter(e => {
                    if (e.ticket_type == 3 && e.match_key == leagueDetails.match_key) {
                        return e;
                    }
                });
                availableTickets = userTickets.filter(e => e.ticket_type != 3);
                availablePasses = availablePasses.length > 0 ? availablePasses : false;
                availableTickets = availableTickets.length > 0 ? availableTickets : false;
            };
            // console.log("available Passes and tickets", availablePasses, availableTickets);

            if (availablePasses.length > 0 && !isJoiningFromTicket) {
                ticketApplicable = true;

                let totalAvailablePasses = availablePasses.length > 0 ? availablePasses.length : 0

                userTickets = availablePasses[0];
                userTickets.total_passes = totalAvailablePasses
                console.log("inside passes >> and userTickets", userTickets);
                userTickets = userTickets
                // userTickets.total_passes = availablePasses
                // userTickets = availablePasses;
            } else if (availableTickets.length > 0) {
                ticketApplicable = true;
                userTickets = availableTickets[0];

                userTickets.total_passes = availableTickets.length > 0 ? availableTickets.length : 0
            } else {
                userTickets = null;
            };

            userTickets = { ...userTickets }

            console.log("userTicket outside if else >>>>", userTickets);

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
        let isticketApplied = 0;
        if (ticketApplicable) {
            let userUnusedAmount = userDetails.unused_amount + 0;
            let userCreditsAmount = userDetails.credits + 0;
            let userBonusAmount = userDetails.bonus_cash + 0;
            let userRealCash = (userUnusedAmount + userCreditsAmount) + 0;
            let userTotalCash = userRealCash + userBonusAmount;

            isticketApplied = 1; //ticket is options
            if (leagueDetails.bonus_applicable != 2) { // is not bonus applicable league
                if (userRealCash < leagueDetails.joining_amount) isticketApplied = 2; // ticket is mandatory
            } else if ((userRealCash + userBonusAmount) < leagueDetails.joining_amount) isticketApplied = 2; // ticket is mandatory
            response.ticket_applied = isticketApplied;
        }
        response.ticket_applied = isticketApplied;
        response.ticket = Object.keys(userTickets).length ? userTickets : null;
        //#############################################Ticket check flow end #############################################################

        /**
         * Validate all teams
         */
        // var userDBTeams = await SQL.Cricket.getUserTeamDetails(`*`, ` t1.user_id = ${userId} and t1.match_key = ${matchKey} and fantasy_type = ${fantasyType} `, "bb_user_teams");
        // console.log("userDBTeams >>>>", userDBTeams);
        let userUnjoinedTeam = await fetchUserTeams(userId, matchKey, fantasyType, leagueDetails.user_teams);
        userDBTeams = userUnjoinedTeam;
        console.log("userDBTeams >>>>_____=====>>>-------- ", userUnjoinedTeam.length, userDBTeams);

        userDBTeams = userDBTeams.length > 0 ? userDBTeams : false;
        if (!userDBTeams) {
            return reject({
                status: false,
                code: Utils.StatusCodes.No_Teams,
                message: __("NO_TEAMS"),
                title: "No_TEAMS",
                response: response
            });
        }
        // else {
        //     var invalidTeams = Object.values(userDBTeams).filter(element => teamsArray.includes(element));
        //     if (invalidTeams.length) {
        //         return reject({
        //             status: false,
        //             code: Utils.StatusCodes.Error,
        //             message: __("WRONG_DATA"),
        //             title: "Invalid Team length"
        //         })
        //     }
        // }
        console.log("Fetch in preview >>> -=--------", leagueDetails.user_teams);
        if (leagueDetails.team_type == 2) {
            if (leagueDetails.user_teams != "") {
                return reject({
                    status: false,
                    code: Utils.StatusCodes.Error,
                    message: __("single_league"),
                    title: "single_league"
                })
            }
        }

        // let userUnjoinedTeam = await fetchUserTeams(userId, matchKey, fantasyType, leagueDetails.user_teams);
        // console.log("UnkoinedTeam >>>", userUnjoinedTeam)
        if (userUnjoinedTeam.length <= 0) {
            return reject({
                status: false,
                code: Utils.StatusCodes.No_Teams,
                message: __("NO_TEAMS"),
                title: "NO_TEAMS",
                response: response
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
            if (leagueDetails['is_full'] == 0) {
                await SQL.Cricket.updateLeague(` is_full=1 `, ` league_id=${leagueId} `, 'bb_leagues')
                await addChildLeague(matchKey, leagueId);
            }
            let templateId = leagueDetails["reference_league"];
            let templateLeague = [];
            if (templateId)
                templateLeague = await SQL.Cricket.getLeagueDetails(` where reference_league = ${templateId} and match_key = ${matchKey} and is_full =0`);
            console.log("template League >>>", templateLeague)
            if (templateLeague.length > 0) {
                templateLeague = templateLeague[0]
                leagueId = templateLeague.league_id
            }
            let templateLeagueDetails = await SQL.Cricket.checkLeagueAvailability(userId, leagueId, matchKey, fantasyType, 1, 1, 1);
            if (templateLeagueDetails.length > 0) leagueDetails = templateLeagueDetails[0];
            if (!leagueDetails)
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
                await SQL.Cricket.updateLeague(` is_full=1 `, ` league_id=${leagueId} `, 'bb_leagues')
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

        // for depositor freeroll only

        if (leagueDetails.league_type == 4) {
            // && totalCashAdded < leagueDetails.min_deposit)
            let userRecordDetails = await SQL.Users.getUserRecordTable(userId, ` first_deposit, last_deposit, first_deposit_amount, total_cash_deposit, first_withdrawal `);
            let daysLimit, txnAmount, requiredAmount = {}

            if (userRecordDetails.length == 0) {
                requiredAmount.deposit_required = leagueDetails.min_deposit
                return reject({
                    status: false,
                    code: Utils.StatusCodes.for_depositors,
                    message: `Users who have deposited ₹${leagueDetails.min_deposit} or more on BalleBaazi are eligible to enter this freeroll.`,
                    title: "for_depositors_only",
                    response: requiredAmount
                })
            }

            userRecordDetails = userRecordDetails[0];
            let currentDate = await db.query('select NOW() as date');

            currentDate = currentDate[0].date

            currentDate = new Date(currentDate).getTime() / 1000;
            let lastDepositDate = userRecordDetails.last_deposit;
            console.log("currentDate >>>", currentDate, "lastDeposit date >>>", lastDepositDate);
            // console.log(currentDate - lastDepositDate)
            // let daysBetween = Math.ceil(Math.abs(currentDate - lastDepositDate)/86400)

            ;
            console.log("total Cash Addded", totalCashAdded)
            let freerollMsg = '';
            if (leagueDetails.free_role_days == 0 && totalCashAdded < leagueDetails.min_deposit) {

                requiredAmount.deposit_required = leagueDetails.min_deposit - totalCashAdded;

                return reject({
                    status: false,
                    code: Utils.StatusCodes.for_depositors,
                    message: `Users who have deposited ₹${leagueDetails.min_deposit} or more on BalleBaazi are eligible to enter this freeroll.`,
                    title: "for_depositors_only",
                    response: requiredAmount
                })

            } else if (leagueDetails.free_role_days == 1) {

                daysLimit = moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');

                console.log("daysLimit>>> in 1", daysLimit);
                txnAmount = await SQL.Users.getTxnDepositAmount(userId, daysLimit);

                txnAmount = txnAmount[0];

                freerollMsg = `Users who have deposited ₹${leagueDetails.min_deposit} or more today are eligible to enter this freeroll.`

            } else if (leagueDetails.free_role_days == 7) {

                daysLimit = moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss');

                console.log("daysLimit>>> in 7", daysLimit);
                txnAmount = await SQL.Users.getTxnDepositAmount(userId, daysLimit);

                txnAmount = txnAmount[0];

                freerollMsg = `Users who have deposited ₹${leagueDetails.min_deposit} or more in last 7 days are eligible to enter this freeroll.`
            } else if (leagueDetails.free_role_days == 30) {

                daysLimit = moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss');

                console.log("daysLimit>>> in 30", daysLimit);
                txnAmount = await SQL.Users.getTxnDepositAmount(userId, daysLimit);

                txnAmount = txnAmount[0];
                freerollMsg = `Users who have deposited ₹${leagueDetails.min_deposit} or more in last 30 days are eligible to enter this freeroll.`
            }

            console.log("txnAmount >>>", txnAmount)

            if (leagueDetails.free_role_days != 0) {
                requiredAmount.deposit_required = leagueDetails.min_deposit - txnAmount.cash_deposited;
                if (leagueDetails.free_role_days != 0 && leagueDetails.min_deposit > txnAmount.cash_deposited) {

                    console.log("INside Msg >>")
                    return reject({
                        status: false,
                        code: Utils.StatusCodes.for_depositors,
                        message: freerollMsg,
                        title: "for_depositors_only",
                        response: requiredAmount
                    })

                }
            }


        }
        // if (leagueDetails.league_type == 4 && totalCashAdded < leagueDetails.min_deposit) {
        //     return reject({
        //         status: false,
        //         code: Utils.StatusCodes.Error,
        //         message: `Your all time deposit should be Rs.${leagueDetails.min_deposit} or more to join this league.`,
        //         title: "full"
        //     })
        // }


        let affiliatedBy = userDetails.affiliated_by;
        let joiningAmount = leagueDetails.joining_amount;
        isJoiningFlow = teamsArray.length > 1 ? true : false
        if (isJoiningFlow) joiningAmount = joiningAmount * teamsArray.length;
        console.log("joining Amount >>>", joiningAmount, isJoiningFlow)
        // isJoiningFlow = false
        /**
         * TODO: Need to implement time based bonous(implemented)
         */
        let match = await SQL.Cricket.getMatchDetailsByMatchKey(matchKey);
        match = match[0];

        let bonousPercent = await Utils.TimeBaseBonus.timeBaseBonus(match, leagueDetails);
        console.log("bonus Percent is  >>>>", bonousPercent)
        if (!bonousPercent) bonousPercent = leagueDetails.bonus_percent;

        //Implementation of jumper
        let jumperBonusSum = 0;
        let isJumperApplicable = false;
        let jumperBonus = [];
        if (leagueDetails.jumper) {
            isJumperApplicable = true;
            jumperBonus = leagueDetails.jumper.split(',');
            console.log('===================================================== joinedTeams', joinedTeams);
            let jumperBonusCurrentTeam = jumperBonus[joinedTeams.length];
            if (teamsArray.length == 1 && jumperBonusCurrentTeam) {
                bonousPercent = jumperBonusCurrentTeam;
            } else {
                for (let index = 1; index < teamsArray.length + 1; index++) {
                    let joinedTeamCount = joinedTeams.length - 1;
                    console.log('jumper bonous by teams=== > ', parseInt(jumperBonus[joinedTeamCount + index]));
                    jumperBonusSum += parseInt(jumperBonus[joinedTeamCount + index]);
                }
                // for (let thisTeam of teamsArray) {
                //     console.log("thisTeam is >>>", thisTeam)
                //     thisTeam = parseInt(thisTeam)
                //     jumperBonusSum += parseInt(jumperBonus[thisTeam - 1]);
                // }
                console.log("jumperBonus Sum >>>", jumperBonusSum, teamsArray.length);

                bonousPercent = jumperBonusSum / teamsArray.length
            }
        }

        console.log("bonus Percent is  >>>>", bonousPercent)


        let lowbalance = false;
        let lowbalanceResponse = [];
        bonousPercent = bonousPercent / 100;
        let userUnusedAmount = userDetails.unused_amount + 0;
        let userCreditsAmount = userDetails.credits + 0;
        let userBonusAmount = userDetails.bonus_cash + 0;
        let userRealCash = (userUnusedAmount + userCreditsAmount) + 0;
        let userTotalCash = userRealCash + userBonusAmount;
        // let userTickets = false;
        // let availablePasses = false;
        // let availableTickets = false;
        // // ticket = true;
        // let ticketApplicable = false;
        // ticket = leagueDetails.is_private ? false : ticket;
        // if (ticket) {
        //     // Get specific match tickets
        //     userTickets = await SQL.Users.getUserActiveTickets(userId, matchKey, leagueDetails.category, leagueDetails.joining_amount);
        //     if (userTickets.length == 0) {
        //         console.log("inside for match");

        //         // if specific match ticket not available then check for any match ticket
        //         userTickets = await SQL.Users.getUserActiveTickets(userId, false, leagueDetails.category, leagueDetails.joining_amount);
        //     }
        //     console.log(" tickets are  >>>>>", userTickets);
        //     if (userTickets.length > 0) {
        //         availablePasses = userTickets.filter(e => e.ticket_type == 3);
        //         availableTickets = userTickets.filter(e => e.ticket_type != 3);
        //         availablePasses = availablePasses.length > 0 ? availablePasses : false;
        //         availableTickets = availableTickets.length > 0 ? availableTickets : false;
        //     };
        //     console.log("available Passes and tickets", availablePasses, availableTickets);

        //     if (availablePasses.length > 0) {
        //         ticketApplicable = true;

        //         let totalAvailablePasses = availablePasses.length > 0 ? availablePasses.length : 0

        //         userTickets = availablePasses[0];
        //         userTickets.total_passes = totalAvailablePasses
        //         console.log("inside passes >> and userTickets", userTickets);
        //         userTickets = userTickets
        //         // userTickets.total_passes = availablePasses
        //         // userTickets = availablePasses;
        //     } else if (availableTickets.length > 0) {
        //         ticketApplicable = true;
        //         userTickets = availableTickets[0];

        //         userTickets.total_passes = availableTickets.length > 0 ? availableTickets.length : 0
        //     } else {
        //         userTickets = null;
        //     };

        //     userTickets = { ...userTickets }

        //     console.log("userTicket outside if else >>>>", userTickets);

        //     // if (userTickets && userTickets.length > 0) {
        //     //     // check ticket is already used for the template_id in the match
        //     //     let usedTickets = await SQL.Users.checkUsedTicket(userId, matchKey, leagueDetails.category, leagueDetails.joining_amount);
        //     //     if (usedTickets.length > 0) {
        //     //         ticketApplicable = false;
        //     //         userTickets = false;
        //     //     } else {
        //     //         ticketApplicable = true;
        //     //     }
        //     // }
        // }
        let ticketApplied = 0;
        if (ticketApplicable) {
            ticketApplied = 1; //ticket is options
            if (leagueDetails.bonus_applicable != 2) { // is not bonus applicable league
                if (userRealCash < joiningAmount) ticketApplied = 2; // ticket is mandatory
            } else if ((userRealCash + userBonusAmount) < leagueDetails.joining_amount) ticketApplied = 2; // ticket is mandatory
            response.ticketApplied = ticketApplied;

            if (ticketApplied != 0) {
                if (availablePasses.length > 0) {
                    if (teamsArray.length <= availablePasses.length)
                        joiningAmount = joiningAmount - leagueDetails.joining_amount * (teamsArray.length);
                    else joiningAmount = joiningAmount - leagueDetails.joining_amount * (availablePasses.length);
                } else joiningAmount = joiningAmount - leagueDetails.joining_amount;
            } else {
                if ((userRealCash + userBonusAmount) < leagueDetails.joining_amount) ticketApplied = 2; // ticket is mandatory
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
            console.log("maxApplicable Bonus>>>", maxApplicableBonus, joiningAmount, bonousPercent)

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
                console.log("maxApplicable Bonus>>>", maxApplicableBonus)
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


        //joined Teams
        let joinedLeagues = await SQL.Cricket.getJoinedLeagues(matchKey, userId);



        console.log("leagueDetails.user_teams >>>", leagueDetails.user_teams)
        // leagueDetails.user_teams = team_number;

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
                jumperBonus: jumperBonus,
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
                userTickets: userTickets,
                availablePasses: availablePasses,
                joined_teams: leagueDetails.user_teams,
                user_teams: userUnjoinedTeam
            }
        }
        // console.log('league preview succes sending....',data);
        resolve(data)
    })
}

module.exports = {

    joinLeaguePreview: async (req, res) => {
        let user = req.user;
        if (!user) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "WRONG_DATA", __("WRONG_DATA"), res)
        let userId = req.user.user_id;
        // console.log("USer >>>>", userId);
        let fantasyType = req.body.fantasy_type;
        let matchKey = req.body.match_key;
        let leagueId = req.body.league_id;
        let teams = req.body.teams;
        let ticketApplied = req.body.check_ticket;
        if (!userId || !fantasyType || !matchKey || !leagueId)
            return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res);
        if (!teams) {
            teams = '';
        }
        // ticketApplied = 1;
        leaguePreview({
            userId: userId,
            fantasyType: fantasyType,
            matchKey: matchKey,
            leagueId: leagueId,
            teams: teams.toString(),
            isJoining: false,
            ticketApplied: ticketApplied
        }).then(async success => {
            if (success) {
                try {
                    // let teams = await fetchUserTeams(userId, matchKey, fantasyType, success.response.league.user_teams);
                    let teams = success.response.user_teams;
                    console.log("Joined teams in succes leaguePrev", teams);
                    let multijoining = 1;
                    if ((success.response.league.max_players - success.response.league.total_joined) <= Config.MULTIJOINING_LEAGUE_THREASHOLD || success.response.league.max_players <= Config.MULTIJOINING_LEAGUE_THREASHOLD) {
                        multijoining = 0;
                    }
                    let ticket = null;
                    if (success.response.userTickets) ticket = success.response.userTickets ? success.response.userTickets : null;
                    console.log("tickets in fetchUserTeams", ticket, success.response.userTickets);

                    if (ticket) {
                        let userTickets = success.response.userTickets
                        ticket = Object.keys(userTickets).length === 0 ? null : userTickets;
                    }
                    // let userTickets = ticket.length > 0 ? ticket[0] : null;
                    let joinedTeams = success.response.joined_teams
                    if (!joinedTeams) joinedTeams = "";
                    joinedTeams = joinedTeams == "" ? joinedTeams = [] : joinedTeams.split(',');

                    let response = {
                        applied_amount: success.response.appliedAmount,
                        user_teams: teams,
                        user_balance: success.response.userBalance,
                        league: success.response.league,
                        ticket_applied: success.response.ticketApplied,
                        is_multi_joining: multijoining,
                        ticket: ticket,
                        joined_teams: joinedTeams
                    }
                    return await Utils.ResponseHandler(success.status, success.code, success.title, success.message, res, response);
                } catch (error) {
                    return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
                }
                // .then(async teams => {}, async error => {
                //     return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
                // }).catch(async e => {
                //     console.log('error in league preview<<>>>==>>> ', e);
                //     return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
                // })
            } else {
                console.log('error in league preview success==>>> ', success);
                return await Utils.ResponseHandler(false, Utils.StatusCodes.No_Teams, "NO_TEAMS", __("NO_TEAMS"), res, success.response)
            }
        }, async error => {
            console.log('------->>>>> ppppppppppppppp++++++=====================>>> ', error.response);
            // if (error.response)
            //     if (error.response.league && error.response.league.user_teams) error.response.league.user_teams = error.response.league.user_teams.split(',');
            return await Utils.ResponseHandler(error.status, error.code, error.title, error.message, res, error.response)
        }).catch(async e => {
            console.log('error in league preview==>>> ', e);
            return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
        })
    },
    joinLeague: async (req, res) => {
        console.log('req.body is >>>', req.body);
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
                    console.log("success is >>", success.response)
                    let teamsArray = success.response.teams
                    let userDetails = success.response.user;
                    let leagueDetails = success.response.league;
                    // let jumperBonus = success.response.jumperBonus;
                    let userUnusedAmount = success.response.userBalance.unused;
                    let userCreditsAmount = success.response.userBalance.credits;
                    let userBonusAmount = success.response.userBalance.bonus;

                    let unusedAmntApplied = success.response.appliedAmount.unusedAmntApplied;
                    let cashApplied = success.response.appliedAmount.creditsApplied;
                    /**
                     * need to change cashApplied
                     */
                    cashApplied = cashApplied ? cashApplied : 0;
                    let creditsApplied = success.response.appliedAmount.creditsApplied;
                    let bonusAmtApplied = success.response.appliedAmount.bonusAmtApplied;
                    ticketApplied = success.response.ticketApplied;
                    let ticket = success.response.userTickets;
                    let availablePasses = success.response.availablePasses
                    // return res.send({
                    //     ticket: success.response.userTickets,
                    //     count: success.response.userTickets.length
                    // });
                    let ticketAppliedStatus = success.response.ticketApplied;
                    if(ticketAppliedStatus != 0){
                        ticketAppliedStatus = 1;
                    }
                    let joiningResult = await insertLeagueJoiningData(
                        userDetails,
                        leagueDetails,
                        teamsArray,
                        userUnusedAmount,
                        userCreditsAmount,
                        userBonusAmount,
                        {
                            unusedAmntApplied: unusedAmntApplied,
                            creditsApplied: creditsApplied,
                            bonusAmtApplied: bonusAmtApplied
                        },
                        ticketAppliedStatus,
                        ticket, availablePasses, ip)
                    let result = joiningResult.result;
                    console.log("League joined success fully ", result);
                    // console.log('league details ==>> ', leagueDetails);

                    //clear cache for postmatch
                    // await Utils.Redis.set(Utils.Keys.CRICKET_JOINED_LEAGUES_MATCHES + userId, '', 'EX', Utils.RedisExpire.CRICKET_JOINED_LEAGUES_MATCHES)

                    if (result.affectedRows) {
                        let userDetails = joiningResult.userDetails;
                        let leagueDetails = joiningResult.leagueDetails;
                        let teamsArray = joiningResult.teamsArray;
                        let userUnusedAmount = joiningResult.userUnusedAmount;
                        let userCreditsAmount = joiningResult.userCreditsAmount;
                        let userBonusAmount = joiningResult.userBonusAmount;
                        let appliedAmounut = joiningResult.appliedAmounut;
                        let ticketApplied = joiningResult.ticketApplied;
                        let tickets = joiningResult.tickets;
                        matchKey = leagueDetails.match_key;
                        leagueId = leagueDetails.league_id;

                        unusedAmntApplied = appliedAmounut.unusedAmntApplied + 0;
                        creditsApplied = appliedAmounut.creditsApplied + 0;
                        bonusAmtApplied = appliedAmounut.bonusAmtApplied + 0;
                        let teamCount = teamsArray.length > 0 ? teamsArray.length : 0
                        //upadte league on joining
                        console.log("teamsArray is >>>", teamCount)
                        if (ticketApplied) {
                            if (teamCount > 1) {
                                bonusAmtApplied = bonusAmtApplied - leagueDetails.joining_amount
                            } else bonusAmtApplied = leagueDetails.joining_amount
                        } else if (availablePasses.length > 0) {
                            if (teamCount > 1) {
                                bonusAmtApplied = bonusAmtApplied - (leagueDetails.joining_amount * teamCount)
                            } else bonusAmtApplied = leagueDetails.joining_amount
                        }
                        await SQL.Cricket.updateLeagueOnJOining(teamCount, unusedAmntApplied, cashApplied, bonusAmtApplied, leagueDetails.league_id)

                        //update user records
                        let currentDate = await Utils.CurrentDate.currentDate()
                        await SQL.Cricket.updateUserRecordsOnJoining(fantasyType, teamCount, userId, currentDate);
                        if (leagueDetails.league_type == 1) { // if not practice and freerolls league
                            let userTickets = false;
                            userTickets = Object.keys(ticket).length === 0 ? false : ticket;
                            if (!userTickets) {
                                // userDetails.affiliated_by = 1
                                if (userDetails.affiliated_by != 0 && (unusedAmntApplied + creditsApplied) > 0) {
                                    console.log("Ticket not Applie=====>>>> ,", userTickets);

                                    let affiliateBulkValues = [];
                                    let teamsToJoin = teams.toString();
                                    teamsToJoin = teamsToJoin.split(',');
                                    let currentDate = await Utils.CurrentDate.currentDate();
                                    for (let thisTeam of teamsToJoin) {
                                        let affiliteTeam = {
                                            joiner: userId,
                                            match_key: matchKey,
                                            affiliate_id: userDetails.affiliated_by,
                                            date_added: currentDate
                                        }
                                        affiliateBulkValues.push(affiliteTeam)
                                    }
                                    await SQL.Users.BulkAffiliateInsert(affiliateBulkValues)

                                }
                            } else if (availablePasses.length > 0) {
                                for (let index = 0; index < availablePasses.length; index++) {
                                    const iterator = availablePasses[index];
                                    var query = `UPDATE bb_ticket_users SET used_status = ?, play_type = ?, match_used = ?, league_used = ?, date_used = NOW() WHERE row_id = ?`
                                    var ticketUpdateResult = await SQL.Users.rawQuery(query, [2, 1, matchKey, leagueId, iterator.row_id])
                                    if (index + 1 == teamCount) {
                                        break;
                                    }
                                }
                            } else {
                                console.log("Ticket applied===>>> ", matchKey, userTickets, userDetails.user_id);
                                let currentDate = await db.query('select Now() as date');

                                currentDate = currentDate[0].date
                                let ticketsRowIds = ticket.row_id.toString();
                                var query = `UPDATE bb_ticket_users SET used_status = ?, play_type = ?, match_used = ?,league_used = ?, date_used = ? WHERE row_id in(${ticketsRowIds})`
                                var ticketUpdateResult = await SQL.Users.rawQuery(query, [2, 1, matchKey, leagueId, currentDate, userTickets.row_id])

                                await Utils.Redis.set(Utils.Keys.USER_TICKETS + userDetails.user_id, "", 'EX', Utils.RedisExpire.USER_TICKETS);
                            }
                        } else {
                            // var query = `UPDATE bb_users SET total_contest_joined = total_contest_joined+1, last_contest_date ='${moment()}',modified_date ='${moment()}', WHERE user_id=${userId}`
                            // var ticketUpdateResult = await db.query(query)
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
                        // await Utils.EmailService.sendMail(Utils.Constants.emails.joinLeagueMail, params);
                        await addChildLeague(matchKey, leagueId);
                        let response = {
                            league: leagueDetails,
                        }
                        delete response.league.user_teams
                        return await Utils.ResponseHandler(true, 200, "Success", __("LEAGUE_JOIN_SUCCESS"), res, response)
                    } else {
                        console.log('error in joinin->> ', result);
                        return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res, response)
                    }
                } else {
                    console.log('success not defined->> ', success);
                    return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
                }
            } catch (error) {
                console.log('error ==>>> ', error);
                return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
            }
        }, async error => {
            console.log('------->>>>> ppppppppppppppp++++++=====================>>> ', error.response);
            if (error.response) {
                if (error.response.league)
                    error.response.league.user_teams = error.response.league.user_teams ? error.response.league.user_teams.split(',') : [];
            } else {
                if (error.response)
                    error.response.league.user_teams = [];
            }
            return await Utils.ResponseHandler(error.status, error.code, error.title, error.message, res, error.response)
        }).catch(async e => {
            console.log('Error in league joining===>>> 2222', e);
            return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
        })
    },
    getLeagueWinners: async (req, res) => {
        console.log('Getting league winners');
        try {
            let leagueId = req.params.id;
            if (!leagueId || leagueId == undefined || leagueId == null || leagueId == "") {
                return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
            } else {
                let leagueDetails = await SQL.Cricket.getLeagueDetails(`where league_id = '${leagueId}'`)
                leagueDetails = leagueDetails[0];
                let singleWinner = false;
                if (leagueDetails && leagueDetails["is_reward"] == 1 && leagueDetails["total_winners"] == 1) {
                    singleWinner = [{
                        "league_id": leagueId,
                        "win_from": "1",
                        "win_to": "1",
                        "win_amount": leagueDetails.win_amount,
                        "win_product": null,
                        "ticket_name": null,
                        "win_percent": null,
                        "bbcoins": null
                    }]
                }
                let winners = await SQL.Cricket.getLeagueData(` league_id=${leagueId} `)
                if (singleWinner) {
                    winners = [...singleWinner, ...winners];
                }
                return await Utils.ResponseHandler(true, 200, "Success", __("Success"), res, { winners: winners })
            }
        } catch (error) {
            console.log('error in getting league winners==>> ', error);
            return await Utils.ResponseHandler(false, 400, "SOME_ERROR", __("SOME_ERROR"), res)
        }
    },
    /*GET VIEW MORE CATEGORIZED LEAGUE    */
    getMatchV1Category: async (req, res, next) => {

        try {
            const columnsOnly = this._userTeamsFlow;
            let user_id = req.user.user_id;
            if (!user_id) return Utils.ResponseHandler(false, Utils.StatusCodes.Not_found, "user_not_found", __('WRONG_DATA'), res);
            let seasonKey = req.body.season_key; //Selected Match
            let matchKey = req.body.match_key; // Selected Match0
            let fantasyType = req.body.fantasy_type;
            let categoryId = req.body.category;
            if (!fantasyType) fantasyType = 1;

            if (!matchKey || !categoryId) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('WRONG_DATA'), res);

            const fantasyTypes = new Array(0, 1, 2, 3, 4);
            fantasyType = fantasyType ? fantasyType : 0; //default

            // if (!fantasyTypes.includes(fantasyType)) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "fantasy_error", __('WRONG_DATA'), res);

            // if (fantasyType == 4) return Utils.ResponseHandler(false, Utils.StatusCodes.Resource_gone, "mycontest_data", __('CONTEST_DATA'), res)

            // get match details
            let matchColumns = `match_key, match_format, match_short_name, read_index, admin_status, start_date_unix, team_a_short_name, team_b_short_name, match_status, season_key, season_short_name, closing_ts, team_a_key, team_b_key, active, categorisation`
            if (!columnsOnly) matchColumns = false;

            const selectedMatch = await SQL.Cricket.getMatchKey(matchKey, matchColumns, true);

            matchKey = selectedMatch[0].match_key;

            console.log("Selected Match >>>>", selectedMatch);
            let categorisation = selectedMatch[0].categorisation;
            delete selectedMatch[0].categorisation;

            let leagueCategorisation = null;
            if (categorisation) leagueCategorisation = JSON.parse(categorisation);

            if (!matchKey) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('MATCH_NOT_EXIST'), res)

            let teamFlags = {}

            // teams flag for selected match
            teamFlags.team_a_key = selectedMatch[0].team_a_flag;
            teamFlags.team_b_key = selectedMatch[0].team_b_flag;


            selectedMatch[0].team_a_key = selectedMatch[0].team_a_flag;
            selectedMatch[0].team_b_key = selectedMatch[0].team_b_flag;

            let leagueColumns = `"category", "league_id",  "template_id", "reference_league", "league_name", "fantasy_type", "match_key", "win_amount", "bonus_applicable", "is_mega", "is_private", "league_msg", "team_type", "total_joined", "total_winners_percent", "confirmed_league", "league_type", "total_winners", "max_players", "bonus_percent", "joining_amount", "is_infinity", "win_per_user", "banner_image","time_based_bonus","jumper"`
            let catagoryLeague = await SQL.Cricket.getLeagueByCatagory(
                `t1.match_key = ${matchKey}
           AND league_status = '1'
           AND is_full = '0'
           AND is_private = '0'
           AND t1.fantasy_type = ${fantasyType}
           AND t1.category = ${categoryId}
           `,
                user_id,
                leagueColumns
            )
            // for (const iterator of catagoryLeague) {
            //     if (iterator.user_teams) {
            //         iterator.user_teams = iterator.user_teams.split(",")
            //     }
            // }
            catagoryLeague = catagoryLeague.map(e => {
                if (e.user_teams) {
                    e.user_teams = e.user_teams.split(",")
                } else {
                    e.user_teams = []
                }
                return e;
            })


            //team_count
            let teamCount = await Utils.Redis.getAsync(Utils.Keys.TEAM_COUNT + user_id);
            if (!teamCount) {
                teamCount = await SQL.Cricket.getTeamCountByMatch(user_id, matchKey, fantasyType);
                await Utils.Redis.set(Utils.Keys.TEAM_COUNT + user_id, JSON.stringify(teamCount), 'EX', Utils.RedisExpire.TEAM_COUNT)

            } else {
                teamCount = JSON.parse(teamCount);
            }
            //Match Leagues
            let matchLeagues = await Utils.Redis.getAsync(Utils.Keys.CRICKET_LEAGUES + '_' + fantasyType + "_" + matchKey);
            if (!matchLeagues) {
                console.log("Matchleagues From DB");
                matchLeagues = await SQL.Cricket.getEachActiveMatchesLeagues(matchKey, fantasyType);
                await Utils.Redis.set(Utils.Keys.CRICKET_LEAGUES + '_' + fantasyType + "_" + matchKey, JSON.stringify(matchLeagues), 'EX', Utils.RedisExpire.CRICKET_LEAGUES);
            } else {
                matchLeagues = JSON.parse(matchLeagues);
            }
            //joinedLeagues
            let joinedLeagues = await Utils.Redis.getAsync(Utils.Keys.JOINED_LEAGUES + user_id + matchKey);
            if (!joinedLeagues) {
                joinedLeagues = await SQL.Cricket.getJoinedLeagues(matchKey, user_id);
                await Utils.Redis.set(Utils.Keys.JOINED_LEAGUES + user_id + matchKey, JSON.stringify(joinedLeagues), 'EX', Utils.RedisExpire.JOINED_LEAGUES)
            } else {
                joinedLeagues = JSON.parse(joinedLeagues)
            }


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
                })

                let response = {
                    'selected_match': selectedMatch[0],
                    'match_leagues': catagoryLeague,
                    classic_teams: classicTeams ? classicTeams.total_teams : null,
                    batting_teams: battingTeams ? battingTeams.total_teams : null,
                    bowling_teams: bowlingTeams ? bowlingTeams.total_teams : null,
                    classic_leagues: classicJoinedLeague.length ? classicJoinedLeague.length : null,
                    batting_leagues: battingJoinedLeague.length ? battingJoinedLeague.length : null,
                    bowling_leagues: bowlingJoinedLeague.length ? bowlingJoinedLeague.length : null
                }

                return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, 'Success', __('Success'), res, response);
            }).catch(async e => {
                console.log('Error in league joining===>>>33333 ', e);
                return await Utils.ResponseHandler(false, 400, "error", __("SOME_ERROR"), res)
            });
        } catch (error) {
            console.log('error in get match v1 catagory>> ', error);
            return await Utils.ResponseHandler(false, 400, "SOME_ERROR", __("SOME_ERROR"), res)
        }
    },
    leagueByCode: async (req, res) => {
        let user = req.user;
        if (!user) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)

        let userId = user.user_id;
        console.log("user_id >>>>>", userId);
        let leagueCode = req.body.league_code;


        if (!leagueCode) return await Utils.ResponseHandler(false, 400, "CONTEST_NOT_AVAILABLE", __("CONTEST_NOT_AVAILABLE"), res)
        let leagueDetails = await SQL.Cricket.getLeagueDetails(`where league_code = '${leagueCode}'`)
        if (!leagueDetails) return await Utils.ResponseHandler(false, 400, "CONTEST_NOT_AVAILABLE", __("CONTEST_NOT_AVAILABLE"), res)
        if (leagueDetails.length <= 0) return await Utils.ResponseHandler(false, 400, "CONTEST_NOT_AVAILABLE", __("CONTEST_NOT_AVAILABLE"), res)
        leagueDetails = leagueDetails[0];
        if (leagueDetails.league_status != 1) return await Utils.ResponseHandler(false, 400, "DELETED", __("CONTEST_NOT_AVAILABLE"), res)
        let matchKey = leagueDetails.match_key;
        let leagueId = leagueDetails.league_id;
        let fantasyType = leagueDetails.fantasy_type;
        let matchDetails = await SQL.Cricket.getMatchByKey(`*, if((start_date_unix-UNIX_TIMESTAMP()-closing_ts)<=0, 1, 0) as closed `, matchKey);
        if (!matchDetails) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
        if (matchDetails.length <= 0) return await Utils.ResponseHandler(false, 400, "WRONG_DATA", __("WRONG_DATA"), res)
        matchDetails = matchDetails[0];
        if (matchDetails.closed == 1) return await Utils.ResponseHandler(false, 400, "MATCH_CLOSED", __("MATCH_CLOSED"), res)

        let totalJoined = await SQL.Users.getUserRecordTable(userId, ` sum(total_batting + total_bowling + total_classic + total_classic_fb + total_classic_kb) as totalJoined`)
        totalJoined = totalJoined[0].totalJoined;

        console.log("totalJoined is >>", totalJoined);
        let firstTimeCategory = Config.First_Time_League_Category;
        if (parseInt(totalJoined) > 0 && leagueDetails.category == firstTimeCategory) {
            console.log(" played old users")
            return await Utils.ResponseHandler(false, 400, "league error", __("FIRST_TIME_LEAGUE"), res)
        }

        let leagueColumns = ` category AS category,
        league_id AS league_id,
        template_id AS template_id,
        reference_league AS reference_league,
        league_name AS league_name,
        fantasy_type AS fantasy_type,
        match_key AS match_key,
        win_amount AS win_amount,
        bonus_applicable AS bonus_applicable,
        is_mega AS is_mega,
        is_jackpot AS is_jackpot,
        is_private AS is_private,
        league_msg AS league_msg,
        team_type AS team_type,
        total_joined AS total_joined,
        total_winners_percent AS total_winners_percent,
        confirmed_league AS confirmed_league,
        league_type AS league_type,
        total_winners AS total_winners,
        max_players AS max_players,
        bonus_percent AS bonus_percent,
        joining_amount AS joining_amount,
        is_infinity AS is_infinity,
        win_per_user AS win_per_user,
        league_winner_type AS league_winner_type,
        banner_image AS banner_image,
        time_based_bonus AS time_based_bonus,
        is_reward as is_reward,
        jumper as jumper,
        league_code as league_code `
        let winners = await SQL.Cricket.getLeagueDetails(`where league_id = ${leagueId}`, leagueColumns)

        let match_key = leagueDetails.match_key

        let user_id = req.user.user_id;
        //joinedLeagues

        let joinedLeagues = await SQL.Cricket.getJoinedLeagues(match_key, user_id);

        //check userTeams
        let team_number = [];
        joinedLeagues.map(async thisJoinedLeague => {
            if (thisJoinedLeague.league_id == leagueDetails.league_id) {
                let isIncludes = team_number.includes(thisJoinedLeague.team_number)
                if (!isIncludes) {
                    team_number.push(thisJoinedLeague.team_number)

                }
            }
        })
        leagueDetails.user_teams = team_number;

        //tickets
        const userTickets = await SQL.Users.getUserActiveTickets(user_id);
        const active_tickets = await userTickets.filter(thisTicket => thisTicket.ticket_status == 1);
        //    const ticket_used = await userTickets.filter(thisTicket => thisTicket.ticket_status == 2);

        const ticket_used = await SQL.Users.ticketUsedForMatch(userId, matchKey);


        let response = {
            match: matchDetails,
            league: leagueDetails,
            winners: winners,
            active_tickets: active_tickets,
            ticket_used: ticket_used.length > 0 ? ticket_used : []
        }
        return await Utils.ResponseHandler(true, 200, "success", __("success"), res, response)
    },
    fetchUserTeams: fetchUserTeams
}