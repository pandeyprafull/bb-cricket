const router = require('express').Router();
const Controllers = require('../src/controllers');
const Middlewares = require('../src/middleware');
const Utils = require('../src/utils');


router.use(Middlewares.Login.checkToken);
router.get('/getProducts', Controllers.Reward.RewardController.getProducts);
router.post('/claimConfirm', Controllers.Reward.RewardController.claimConfirm);

router.get('/claimTransaction', Controllers.Reward.RewardController.claimedTransaction);

router.get('/claimStats', Controllers.Reward.RewardController.claimedStats)
module.exports = router;