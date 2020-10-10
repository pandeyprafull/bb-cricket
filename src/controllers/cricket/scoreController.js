const Utils = require('../../utils');
const SQL = require('../../sql');

exports._userTeamsFlow = true

/**     GET CONTEST DATA AFTER LEAGUE CLOSED */
exports.getContestData = async(req, res, next) => {
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
    const league = await SQL.Cricket.getCustomLeague(where, column1, true, column2);
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
    let teamTable = "bb_user_teams";
    let leagueTable = "bb_user_leagues";

    // check match is closed
    let matchClosed = league[0].closed;
    let readIndex = league[0].read_index;

    if (readIndex == 1) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_1"
    } else if (readIndex == 2) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_2";
    } else if (readIndex == 9) {
        teamTable = "bb_user_teams_dump";
        leagueTable = "bb_user_leagues_dump";
    }

    //  current user points at the top
    const myLeagues = await SQL.Cricket.getUserLeaguesForContest(match_key, league_id, leagueTable, user_id)
    console.log("myLeagues are>>>>", myLeagues);

    // get all user points excluding current user
    const allLeague = await SQL.Cricket.getUserLeaguesForContest(match_key, league_id, leagueTable, user_id, true, from, limit, matchClosed);
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

exports.userTicketsInfo = async(userId, matchKey) => {

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

exports.getUserContest = async(req, res, next) => {
    let matchKey = req.query.match_key;
    let userId = req.query.user_id;
    // fetch user contests

    let userContests = new Array();
    let limit = 50;
    let teamTable = "bb_user_teams";
    let leagueTable = "bb_user_leagues";
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

    // show table ranking
    let userLeagues = await SQL.Cricket.getUserLeaguesWithTopRank(userId, matchKey, leagueTable)
    let allLeagueIds = [];

    await userLeagues.forEach(async(Obj) => {

            let thisLeagueId = Obj.league_id;
            if (allLeagueIds.includes(thisLeagueId)) await allLeagueIds.push(thisLeagueId);
            // current user points at the top
            let myLeagues = await SQL.Cricket.getUserLeaguesForContest(matchKey, thisLeagueId, leagueTable, userId);

            // get all user points excluding current user
            let allLeague = await SQL.Cricket.getUserLeaguesForContest(matchKey, thisLeagueId, leagueTable, userId, true, 0, limit)

            // count total joined excluding current user

            let totalJoined = Obj.total_joined - myLeagues.length;
            let nextPage = (limit < totalJoined) ? "2" : "0";

            Obj.contest_players = {
                'next_page': nextPage,
                'self': myLeagues,
                'others': allLeagues
            }
            userContests.push(Obj)

        })
        // get unjoined private leagues
    let privateUnjoined = new Array()
    if (match.closed != 1) {
        privateUnjoined = await SQL.Cricket.getUnjoinedPrivate(matchKey, userId);
        if (privateUnjoined.length > 0) {
            await privateUnjoined.forEach(async(private) => {
                let Obj = {
                    'row_id': "0",
                    'match_key': private.match_key,
                    'fantasy_type': private.fantasy_type,
                    'league_id': private.league_id,
                    'user_id': private.created_by,
                    'user_name': "",
                    'team_number': "",
                    'cash_applied': "0.00",
                    'bonus_applied': "0.00",
                    'total_points': "0.00",
                    'team_rank': "0.00",
                    'credits_won': "0.00",
                    'credits_added': "0",
                    'date_added': private.date_added,
                    'rank': "0",
                    'league_name': private.league_name,
                    'league_type': private.league_type,
                    'confirmed_league': private.confirmed_league,
                    'max_players': private.max_players,
                    'win_amount': private.win_amount,
                    'joining_amount': private.joining_amount,
                    'total_joined': private.total_joined,
                    'total_winners': private.total_winners,
                    'league_code': private.league_code,
                    'is_private': private.is_private,
                    'contest_players': {
                        'next_page': "0",
                        'self': [],
                        'others': []
                    }
                }

                await userContests.push(Obj);
            })



        }
    }


    // fetch user teams
    let userTeams = await this.fetchUserTeams(matchKey, userId, false, false, false, res);
    let response = {
        "user_leagues": userContests,
        "private_unjoined": privateUnjoined,
        "user_teams": userTeams
    }
    return response


}

exports.fetchUserTeams = async(matchKey, userId, teamNumber = "", fantasyType = "", match = "", res) => {
    let where;
    if (!match) {
        //get match
        if (!match[0]) await SQL.Cricket.getMatchTableByKey(matchKey)
        if (!match) return await Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('WRONG_DATA'), res);

    }
    let teamTable = "bb_user_teams";
    let leagueTable = "bb_user_leagues";
    let readIndex = match[0].read_index;

    if (readIndex == 1) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_1"
    } else if (readIndex == 2) {
        teamTable = "bb_closed_user_teams_0";
        leagueTable = "bb_closed_user_leagues_2";
    } else if (readIndex == 9) {
        teamTable = "bb_user_teams_dump";
        leagueTable = "bb_user_leagues_dump";
    }

    // get user teams on this match
    where = `user_id = ${userId} and match_key = ${matchKey}`;

    let teams = await SQL.Cricket.getUserTeams(matchKey, userId, teamNumber, fantasyType, teamTable, match)

    // format teams data
    let teamNumbers = new Array();
    let userTeams = classicTeams = batsmanTeams = bowlerTeams = new Object();

    await teams.forEach(async(team) => {
        let thisType = team['fantasy_type'];
        let thisNumber = team['team_number'];
        let thisPair = thisType + "-" + thisNumber;

        //team_number
        if (!teamNumbers.includes(thisPair)) {
            teamNumbers.push(thisPair);
            userTeams.thisPair.fantasy_type = thisType;
            userTeams.thisPair.team_number = thisNumber;
            userTeams.thisPair.my_team_number = thisType + "" + thisNumber;
        }
        // player info
        userTeams.thisPair['players'].team['player_key'] = team;


    })
    userTeams = Object.values(userTeams);

    // make user teams order according to player role
    if (userTeams) {
        let sorted = new Array();
        await userTeams.forEach(async(thisTeam) => {
            let batsman = keeper = allrounders = bowlers = new Object();
            if (thisTeam['fantasy_type'] == 1) {
                let allPlayers = thisTeam['players'];
                await allPlayers.forEach(async(v) => {
                    let playerKey = v['player_key'];
                    if (v['player_playing_role'] == "batsman") batsman['playerKey'] = v;
                    else if (v['player_playing_role'] == "keeper") keeper['playerKey'] = v;
                    else if (v['player_playing_role'] == "allrounder") allrounders['playerKey'] = v;
                    else if (v['player_playing_role'] == "bowler") bowlers['playerKey'] = v;

                })
                thisTeam['players'] = batsman + keeper + allrounders + bowlers;

                sorted.push(thisTeam);

            } else sorted.push(thisTeam)
        })

        userTeams = sorted;
    }
    return userTeams;

}