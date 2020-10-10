const router = require('express').Router();
// const Controller.Match = require('../controllers/Controller.Match');
const Controllers = require('../src/controllers')
const Middleware = require('../src/middleware')

const Utils = require('../src/utils')

const { check, body, query, param } = require('express-validator/check');


router.use(Middleware.Login.checkToken)

/*
Football
*/
router.get('/matches', Controllers.Football.Match.getActiveMatches);

router.get('/match',

    // validation check
    [
        query('match_key').exists().withMessage('match_key is required'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric')
    ],
    //routes Controller
    Middleware.CustomValidMsg.errorHandle,
    Controllers.Football.Match.getMatchDetail);

router.get('/joined/matches', Controllers.Football.Match.getJoinedMatches);
router.get('/matches/players',

    // validation check
    [
        query('match_key').exists().withMessage('match_key is required'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric')
    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,
    Controllers.Football.Match.getMatchPlayersList);

router.post('/matches/teams',
    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),

    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,

    Controllers.Football.Match.userTeams);
router.post('/team',

    // validation check
    [
        body('match_key').exists().withMessage('Please Enter match_key..'),
        body('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        body('players').isString().withMessage('players needs to be String'),
        body('captain').exists().withMessage('Please Enter captain..'),
        body('captain').isNumeric().withMessage('captain needs to be numeric'),
        body('vice_captain').exists().withMessage('Please Enter vice_captain..'),
        body('vice_captain').isNumeric().withMessage('vice_captain needs to be numeric')
    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,
    Controllers.Football.Match.createTeam);
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
    Middleware.CustomValidMsg.errorHandle,

    Controllers.Football.Match.updateTeams);
router.post('/scoreboard',

    // validation check
    [
        body('match_key').exists().withMessage(' match_key is required')
    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,

    (req, res, next) => {
        Controllers.Football.Match.matchScoreboard({
            user_id: req.user_user_id,
            match_key: req.body.match_key
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

router.get('/promobanner', Controllers.Football.Match.promoBanners);

router.post('/playerInfo',

    // validation check
    [
        body('match_key').exists().withMessage(' match_key is required'),
        body('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        body('player_key').exists().withMessage(' player_key is required'),
        body('player_key').isNumeric().withMessage('player_key needs to     be numeric'),
    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,

    (req, res, next) => {
        Controllers.Football.Match.playerInfo({
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
router.post('/swapTeam',

    // validation check
    [
        body('match_key').exists().withMessage(' match_key is required'),
        body('league_id').exists().withMessage(' league_id is required'),
        body('old_team').exists().withMessage(' old_team is required'),
        body('new_team').exists().withMessage(' new_team is required'),
    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,

    (req, res, next) => {
        Controllers.Football.Match.swapTeam({
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
        query('match_key').exists().withMessage(' match_key is required'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric'),

    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,

    Controllers.Football.Match.getUserJoinedLeaguesPermatch);

router.get('/leagues/:match_key/:fantasyType',

    // validation check
    [
        param('match_key').exists().withMessage(' match_key is required..'),
        param('match_key').isNumeric().withMessage('match_key needs to be numeric'),
    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,

    Controllers.Football.Match.getMatchLeagues);

router.post('/leaguecatagory', Controllers.Football.Leagues.getMatchV1Category);
router.post('/join',

    // validation check
    [
        body('match_key').exists().withMessage(' match_key is required'),
        body('league_id').exists().withMessage(' league_id is required'),
        body('teams').exists().withMessage(' team no. is required '),
    ],

    //route Controller
    Middleware.CustomValidMsg.errorHandle,

    Controllers.Football.Leagues.joinLeague);

router.post('/league/preview',
    // validation check
    [
        body('match_key').exists().withMessage(' match_key is required'),
        body('league_id').exists().withMessage(' league_id is required'),
        body('teams').exists().withMessage(' team no. is required '),
    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,

    Controllers.Football.Leagues.joinLeaguePreview)

router.post('/league/create',

    // validation check
    [
        body('match_key').exists().withMessage(' match_key is required..'),
        body('league_name').exists().withMessage(' league_name is required'),
        body('size').exists().withMessage(' league size is required'),
        body('winning_amount').exists().withMessage(' winning_amount is required'),
    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,

    Controllers.Football.Match.createPrivateLeague);
router.post('/league/code',

    // validation check
    [
        body('league_code').exists().withMessage('Please Enter league_code..')
    ],
    //route Controller
    Middleware.CustomValidMsg.errorHandle,
    Controllers.Football.Leagues.leaguByCode);

module.exports = router;