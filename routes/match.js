const router = require('express').Router();
const matchController = require('../src/controllers/matchController');

const checkToken = require('../src/middleware/checkLoginToken');
//const verifyTokenDb = require('../middleware/verifyTokenDb');

router.get('/getmatches', checkToken, matchController.getAllMatches);

router.get('/getmatches/active', checkToken, matchController.getActiveMatches);

router.get('/getmatches/all_active_matches_league', checkToken, matchController.getActiveMatchesLeague);

router.get('/getmatches/Each_active_match_league/:match_key', checkToken, matchController.getEach_active_match_leagues);

router.get('/getmatches/team', checkToken, matchController.getTeams_of_each_Match_of_a_user);

module.exports = router;