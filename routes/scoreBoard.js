const router = require('express').Router();

const Controllers = require('../src/controllers');
const Middlewares = require('../src/middleware');

router.use(Middlewares.Login.checkToken);

// router.get('/getContestData', Controllers.ScoreBoard.Match.getContestData);
// router.get('/getmatchV1', Controllers.ScoreBoard.Match.getMatchV1Category);



module.exports = router;