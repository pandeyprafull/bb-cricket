const router = require('express').Router();
const Controllers = require('../src/controllers');
const Middlewares = require('../src/middleware');
const Utils = require('../src/utils');

const { check, body, query, param } = require('express-validator/check');


router.use(Middlewares.Login.checkToken);

/**
 * kabaddi match routes
 */
router.get('/matches', Controllers.Kabaddi.Match.getActiveMatches);
router.get('/match',
    // validation check
    [
        query('match_key').exists().withMessage('match_key is required'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric')
    ],
    //routes Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Kabaddi.Match.getMatchDetail);
router.get('/matches/players',
    // validation check
    [
        query('match_key').exists().withMessage('match_key is required'),
        query('match_key').isNumeric().withMessage('match_key needs to be numeric')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Kabaddi.Match.getMatchPlayersList);

router.post('/matches/teams', Controllers.Kabaddi.Match.userTeams);
router.post('/team', Controllers.Kabaddi.Match.createTeam);
router.post('/team/update', Controllers.Kabaddi.Match.updateTeams);


router.post('/scoreboard',
    // validation check
    [
        body('match_key').exists().withMessage(' match_key is required')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    (req, res, next) => {
        Controllers.Kabaddi.Match.matchScoreboard({
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

router.post('/playerInfo',
    // validation check
    [
        body('match_key').exists().withMessage(' match_key is required'),
        body('match_key').isNumeric().withMessage('match_key needs to be numeric'),
        body('player_key').exists().withMessage(' player_key is required'),
        body('player_key').isNumeric().withMessage('player_key needs to be numeric'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    (req, res, next) => {
        Controllers.Kabaddi.Match.playerInfo({
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
    Middlewares.CustomValidMsg.errorHandle,
    (req, res, next) => {
        Controllers.Kabaddi.Match.swapTeam({
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
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Kabaddi.Match.getUserJoinedLeaguesPermatch);
router.get('/leagues/:match_key/:fantasyType',
    // validation check
    [
        param('match_key').exists().withMessage(' match_key is required..'),
        param('match_key').isNumeric().withMessage('match_key needs to be numeric'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle, Controllers.Kabaddi.Match.getMatchLeagues);
router.post('/join',

    // validation check
    [
        body('match_key').exists().withMessage(' match_key is required'),
        body('league_id').exists().withMessage(' league_id is required'),
        body('teams').exists().withMessage(' team no. is required '),
    ],

    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.Kabaddi.Leagues.joinLeague);

module.exports = router;