const router = require('express').Router();
const passport = require('passport');
let Controller = require('../src/controllers');
let Middleware = require('../src/middleware');

// router.use(Middleware.GusetToken.checkToken)

router.post('/google', Controller.User.SocialLoginController.socialLoginAndSignup);

router.post('/login', Controller.User.UserController.LoginWithNumber);

router.post('/login/verify', Controller.User.UserController.postVerifyOtp);

module.exports = router;