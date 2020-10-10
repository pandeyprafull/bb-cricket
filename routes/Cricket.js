const router = require('express').Router();
const Controllers = require('../src/controllers');
const Middlewares = require('../src/middleware');
const Utils = require('../src/utils');
const { check, body, query, param } = require('express-validator/check');


const timeBase = require('../src/utils/timeBaseBonus');
// const checkLoginToken = require('../middleware/checkL oginToken');
//const verifyTokenDb = require('../middleware/verifyTokenDb');

router.get('/redistest', async (req, res) => {
    try {
        let Utils = require('../src/utils');
        const v8 = require('v8');
        // let currentMemory = 'current memory =>'+JSON.stringify(process.memoryUsage() )+" getHeapSpaceStatistics => "+ JSON.stringify(v8.getHeapSpaceStatistics())+ ' getHeapStatistics => '+ JSON.stringify(v8.getHeapStatistics());
        let currentMemory = JSON.stringify(v8.getHeapSpaceStatistics())+" \n";
        let fs = require('fs');
        fs.appendFileSync('memorylogs', currentMemory, ()=>{})
        let redisData = await Utils.Redis.getAsync('zfcache:MATCH_MODEL')
        if (redisData) {
            res.send({ data: redisData })
        } else {
            res.status(400);
        }
    } catch (error) {
        res.status(400);
    }
})

router.get('/redistesttemp', (req, res) => {
    try {
        let Utils = require('../src/utils');
        setTimeout(async () => {
            let redisData = await Utils.Redis.getAsync('zfcache:MATCH_MODEL')
            if (redisData) {
                res.send({ data: redisData })
            } else {
                res.status(400);
            }
        }, 100000)
    } catch (error) {
        res.status(400);
    }
})

router.use(Middlewares.Login.checkToken);
/**
 * Cricket match routes
 */
router.get('/matches', Controllers.Cricket.Match.getActiveMatches);

router.get('/match',
    // validation check
    [
        query('match_key').isNumeric().withMessage('match_key needs to be numeric')
    ],
    //routes Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Cricket.Match.getMatchDetail);

router.get('/joined/matches', Controllers.Cricket.Match.getJoinedMatches);
router.get('/matches/players',
    // validation check
    [
        query('match_key').exists().withMessage('match_key is required'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Cricket.Match.getMatchPlayersList);

router.get('/fullFantasyScore',
    // validation check
    [
        query('match_key').exists().withMessage('Please Enter match_key..')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    (req, res, next) => {
        Controllers.Cricket.Match.matchScoreboard({
            self_user_id: req.user.user_id,
            user_id: req.query.user_id,
            match_key: req.query.match_key,
            score_type: req.query.type,
            team_number: req.query.team_number,
            fantasy_type: req.query.fantasy_type
        }).then(result => {
            let Msg = result.Msg;
            let title = result.title;
            let response = result.response;
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, title, Msg, res, response);
        }).catch(e => {
            let Msg = e.Msg;
            let title = e.title;
            let response = e.response
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, title, Msg, res, response);
        })
    });

router.get('/player', Controllers.Cricket.Match.getPlayerStats); //dummy
router.get('/getmatches/user_valid_tickets', Controllers.Cricket.Match.getUserValidTickets);
router.get('/getContestData',
    // validation check
    [
        query('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        query('match_key').exists().withMessage('Please Enter match_key..'),
        query('league_id').isNumeric().withMessage('league_id needs to be numeric'),
        query('league_id').exists().withMessage('Please Enter league_id..')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Cricket.Score.getContestData);



// router.get('/leagues', Controllers.Cricket.Match.getActiveMatchesLeague); //dummy not need to fetch all the leagues
// router.get('/leagues', Controllers.Cricket.Match.getMatchLeagues);
// router.get('/getmatches', Controllers.Cricket.Match.getAllMatches);
// router.get('/getmatchV1', Controllers.Cricket.Score.getMatchV1Category);

/**
 * Teams route
 */
router.post('/playerInfo',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        body('player_key').exists().withMessage('Please Enter player_key..'),
        body('player_key').isNumeric().withMessage('player_key needs to be numeric'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    (req, res, next) => {
        Controllers.Cricket.Match.playerInfo({
            matchKey: req.body.match_key,
            playerKey: req.body.player_key,
            userId: req.user.user_id
        }).then(result => {
            let Msg = result.Msg;
            let title = result.title
            let response = result.response;
            let statusCode = response.status ? response.status : Utils.StatusCodes.Success;
            return Utils.ResponseHandler(true, statusCode, title, Msg, res, response);
        }).catch(e => {
            let Msg = e.Msg;
            let title = e.title;
            let response = e.response;
            let statusCode = e.status ? e.status : Utils.StatusCodes.Error;
            return Utils.ResponseHandler(false, statusCode, title, Msg, res, response);
        })
    })

router.post('/team',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        body('players').isString().withMessage('players needs to be String'),
        body('captain').exists().withMessage('Please Enter captain..'),
        body('captain').isNumeric().withMessage('captain needs to be numeric'),
        body('vice_captain').exists().withMessage('Please Enter vice_captain..'),
        body('vice_captain').isNumeric().withMessage('vice_captain needs to be numeric'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Cricket.Match.createTeam);
router.post('/team/update',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        body('players').isString().withMessage('players needs to be String'),
        body('captain').exists().withMessage('Please Enter captain..'),
        body('captain').isNumeric().withMessage('captain needs to be numeric'),
        body('vice_captain').exists().withMessage('Please Enter vice_captain..'),
        body('vice_captain').isNumeric().withMessage('vice_captain needs to be numeric'),
        body('team_number').exists().withMessage('Please Enter team_number..'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Cricket.Match.updateTeams);

router.post('/matches/teams',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        // body('livescore').exists().withMessage('Please Enter livescore..'),
        // body('livescore').isNumeric().withMessage('player_key needs to be numeric'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Cricket.Match.userTeams);



router.post('/scoreboard',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    (req, res, next) => {
        Controllers.Cricket.Match.postMatchScoreCard({
            user_id: req.user.user_id,
            match_key: req.body.match_key,
            // score_type: req.body.type,
            // team_number: req.body.team_number,
            // fantasy_type: req.body.fantasy_type
        }).then(result => {
            let Msg = result.Msg;
            let title = result.title
            let response = result.response
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, title, Msg, res, response);
        }).catch(e => {
            let Msg = e.Msg;
            let title = e.title;
            let response = e.response
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, title, Msg, res, response);
        })
    });


router.get('/promobanner', Controllers.Cricket.Match.promoBanners);
router.get('/userTeamPreview', Controllers.Cricket.Match.getTeamPreviewOfMatch); // not in use dummy
router.get('/teamDetailsForFullfantasyScore', Controllers.Cricket.Match.getTeamDetailsForFullfantasyScore);
router.get('/league/winners/:id',

    // validation check
    [
        param('id').exists().withMessage('league_id is required...')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Cricket.Leagues.getLeagueWinners);

router.post('/swapTeam',

    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('league_id').exists().withMessage('Please Enter league_id..'),
        body('old_team').exists().withMessage('Please Enter old_team..'),
        body('new_team').exists().withMessage('Please Enter new_team..'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    (req, res, next) => {
        Controllers.Cricket.Match.swapTeam({
            user_id: req.user.user_id,
            match_key: req.body.match_key,
            league_id: req.body.league_id,
            old_team: req.body.old_team,
            new_team: req.body.new_team,
            fantasy_type: req.body.fantasy_type,
            user_ip: req.connection.remoteAddress

        }).then(result => {
            let Msg = result.Msg;
            let title = result.title
            let response = result.response
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, title, Msg, res, response);
        }).catch(e => {
            let Msg = e.Msg;
            let title = e.title;
            let response = e.response
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, title, Msg, res, response);
        })
    });


/**
 * league routes
 */
router.get('/joined/leagues',
    // validation check
    [
        query('match_key').exists().withMessage('Please Enter match_key..'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric'),

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Cricket.Match.getUserJoinedLeaguesPermatch);

router.get('/joined/teams',

    // validation check
    [
        query('match_key').exists().withMessage('Please Enter match_key..'),
        query('league_id').exists().withMessage('Please Enter league_id..'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        query('league_id').isNumeric().withMessage('league_id needs to be numeric'),


    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Cricket.Match.getJoinedLeagueUsersOfMatch);

router.post('/join',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('league_id').exists().withMessage('Please Enter league_id..'),
        body('teams').exists().withMessage('Please Enter team no. '),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Cricket.Leagues.joinLeague)

router.post('/league/preview',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('league_id').exists().withMessage('Please Enter league_id..')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Cricket.Leagues.joinLeaguePreview);


router.get('/leagues/:match_key/:fantasyType',
    // validation check
    [
        param('match_key').exists().withMessage('Please Enter match_key..'),
        param('match_key').isNumeric().withMessage('match_key needs to be numeric'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Cricket.Match.getMatchLeagues);
router.get('/getmatches/leagues/view_more_leagues', Controllers.Cricket.Match.getViewMoreCategorizedLeagues); // dummy

router.post('/league/create',

    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('league_name').exists().withMessage('Please Enter league_name..'),
        body('size').exists().withMessage('Please Enter league size..'),
        body('winning_amount').exists().withMessage('Please Enter winning_amount..'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Cricket.Match.createPrivateLeague);

router.post('/league/code',
    // validation check
    [
        body('league_code').exists().withMessage('Please Enter league_code..')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Cricket.Leagues.leagueByCode);

router.post('/leaguecatagory',

    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('fantasy_type').exists().withMessage('Please Enter fantasy_type..'),
        body('category').exists().withMessage('Please Enter category..'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Cricket.Leagues.getMatchV1Category);



module.exports = router;