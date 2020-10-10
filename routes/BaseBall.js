const router = require('express').Router();
const Controllers = require('../src/controllers');
const Middlewares = require('../src/middleware');
const Utils = require('../src/utils');
const { check, body, query, param } = require('express-validator/check');


const timeBase = require('../src/utils/timeBaseBonus');
// const checkLoginToken = require('../middleware/checkL oginToken');
//const verifyTokenDb = require('../middleware/verifyTokenDb');

router.get('/timebase', (req, res, next) => {
    timeBase.timeBaseBonus([
        { "bp": "10", "tbm": "default" },
        { "bp": "50", "tbm": "50" },
        { "bp": "40", "tbm": "40" },
        { "bp": "30", "tbm": "30" },
        { "bp": "20", "tbm": "20" },
        { "bp": "15", "tbm": "15" }
    ], 46053).then(result => res.send(result));
})    // dummy

router.use(Middlewares.Login.checkToken);
/**
 * Cricket match routes
 */
router.get('/matches', Controllers.Baseball.Match.getActiveMatches);

router.get('/joined/matches',

    (req, res, next) => {
        Controllers.Baseball.Match.getJoinedMatches({
            user: req.user,
            userId: req.user.user_id
        }).then(result => {
            let Msg = result.Msg;
            let title = result.title
            let response = result.response;
            let statusCode = response.status ? response.status : Utils.StatusCodes.Success;

            console.log("response is>>>", response)
            return Utils.ResponseHandler(true, statusCode, title, Msg, res, response);
        }).catch(e => {
            let Msg = e.Msg ? e.Msg : `Wrong data`;
            let title = e.title;
            let response = e.response ? e.response : {};
            let statusCode = e.status ? e.status : Utils.StatusCodes.Error;
            return Utils.ResponseHandler(false, statusCode, title, Msg, res, response);
        })
    });

router.get('/matches/players',
    // validation check
    [
        query('match_key').exists().withMessage('match_key is required'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    (req, res, next) => {
        Controllers.Baseball.Match.getMatchPlayersList({
            match_key: req.query.match_key,
            userId: req.user.user_id
        }).then(result => {
            let Msg = result.Msg;
            let title = result.title
            let response = result.response;
            let statusCode = response.status ? response.status : Utils.StatusCodes.Success;

            console.log("response is>>>", response)
            return Utils.ResponseHandler(true, statusCode, title, Msg, res, response);
        }).catch(e => {
            let Msg = e.Msg ? e.Msg : ` Wrong data `;
            let title = e.title;
            let response = e.response ? e.response : {};
            let statusCode = e.status ? e.status : Utils.StatusCodes.Error;
            return Utils.ResponseHandler(false, statusCode, title, Msg, res, response);
        })
    });

router.get('/fullFantasyScore',
    // validation check
    [
        query('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        query('type').exists().withMessage('Please Enter Scoretype..'),
        query('team_number').isNumeric().withMessage('team_number needs to be numeric'),
        query('team_number').exists().withMessage('Please Enter team_number..'),

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Baseball.Match.getFullfantasyScoreBoard);

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
    Controllers.BasketBall.Match.getContestData);

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
        Controllers.Baseball.Match.playerInfo({
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
    Controllers.Baseball.Match.createTeam);

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
    Controllers.Baseball.Match.updateTeams);


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
        Controllers.Baseball.Match.swapTeam({
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

/*
Leagues Routes
*/

router.get('/leagues/:match_key/:fantasyType',
    // validation check
    [
        param('match_key').exists().withMessage('Please Enter match_key..'),
        param('match_key').isNumeric().withMessage('match_key needs to be numeric'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Baseball.Match.getMatchLeagues);

router.get('/joined/leagues',
    // validation check
    [
        query('match_key').exists().withMessage('Please Enter match_key..'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric'),

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Baseball.Match.getUserJoinedLeaguesPermatch);

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

    Controllers.Baseball.Match.getJoinedLeagueUsersOfMatch);

router.post('/join',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('league_id').exists().withMessage('Please Enter league_id..'),
        body('teams').exists().withMessage('Please Enter team no. '),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Baseball.Leagues.joinLeague)

router.post('/league/preview',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('league_id').exists().withMessage('Please Enter league_id..'),
        body('teams').exists().withMessage('Please Enter team no. '),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Baseball.Leagues.joinLeaguePreview);

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

    Controllers.Baseball.Match.createPrivateLeague);

router.post('/league/code',
    // validation check
    [
        body('league_code').exists().withMessage('Please Enter league_code..')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Baseball.Leagues.leagueByCode);

router.post('/leaguecategory',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('fantasy_type').exists().withMessage('Please Enter fantasy_type..'),
        body('category').exists().withMessage('Please Enter category..'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Baseball.Leagues.getMatchV1Category);

module.exports = router;