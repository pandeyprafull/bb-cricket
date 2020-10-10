let aws = require('aws-sdk');
let bodyParser = require('body-parser');
let multer = require('multer');
let multerS3 = require('multer-s3');
let path = require('path');
let config = require('../src/config');
const express = require('express');
const router = express.Router();
const Controllers = require('../src/controllers');
// const userController = require('../controllers/userControllers');
const Middlewares = require('../src/middleware');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');
const SQL = require('../src/sql')
const Utils = require('../src/utils');
const passport = require('passport');

const { check, body, query, param } = require('express-validator/check');


router.get('/uinnjdd', async (_req, res, _next) => {
    let Utils = require('../src/utils');
    let currentMemory = 'current memory =>'+process.memoryUsage();
    let fs = require('fs');
    fs.appendFileSync('memorylogs', currentMemory, ()=>{})
    let redisData = await Utils.Redis.getAsync('zfcache:MATCH_MODEL')
    if (redisData) {
        res.send({ data: redisData })
    } else {
        res.status(400);
    }
})
// router.use('/api-docs', swaggerUi.serve);
// router.get('/api-docs', swaggerUi.setup(swaggerDocument));
router.post('/api', Middlewares.GusetToken.checkToken, Controllers.User.BridgeController.getUser);
// open routes for payment callbacks
router.post('/cash', Middlewares.Login.checkToken, Controllers.User.PaymentController.addCashPayu)
router.get('/cash', Controllers.User.PaymentController.addCashPayu)
router.post('/update_txn', Controllers.User.PaymentController.updateTxn)
router.post('/paytm', Controllers.User.PaymentController.paytmCallbackHandler)
router.get('/paytm', (req, res) => { res.render('redirecthome'); });
router.get('/payu', (req, res) => { res.send("Redirecting to app"); });
router.post('/payum/success', Controllers.User.PaymentController.payuCallbackHandler)
router.post('/payum/failure', Controllers.User.PaymentController.payuCallbackHandler)
    // router.get('/verify/email', Controllers.VerifyController.UserEmailVerify)

// api with guest token verification

router.post('/login', Middlewares.GusetToken.checkToken, Controllers.User.UserController.LoginWithNumber);
router.post('/signup', (req, res, next) => {
    Controllers.User.UserController.signup({
        account_type: req.body.account_type,
        email: req.body.email,
        facebook_id: req.body.facebook_id,
        device_type: req.body.device_type,
        device_id: req.body.device_id,
        device_token: req.body.device_token,
        device_ip: req.connection.remoteAddress
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
})
router.post('/login/verify',

    // validation check
    [
        body('phone').exists().withMessage(' phone is required ..'),
        body('otp').exists().withMessage('Please Enter otp '),
        // body('device_token').exists().withMessage('device_token is required ...'),
        // body('device_id').exists().withMessage(' device_id is required'),
        // body('device_type').exists().withMessage(' device_type is required'),
        // body('language').exists().withMessage(' language is required'),
        // body('app_version').exists().withMessage(' app_version is required'),

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Middlewares.GusetToken.checkToken, Controllers.User.UserController.postVerifyOtp);
router.post('/token', Controllers.User.UserController.generateToken);

/*
  GET users listing
  user token varification
 */
router.use(Middlewares.Login.checkToken);
router.get('/profile/:id',


    // validation check
    [
        param('id').exists().withMessage('user_id is required in param')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.User.UserController.getUser);

router.post('/withdraw',

    // validation check
    [
        body('amount').exists().withMessage('Amount is required'),
        body('gateway_type').exists().withMessage('gateway_type is required'),
        body('type').exists().withMessage('payment type is required')

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.User.BridgeController.submitWithdrawlRequest);

router.post('/withdrawCancel',

    // validation check
    [
        body('withdraw_id').exists().withMessage('withdraw_id is required'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.User.BridgeController.cancleWithdrawlRequest);

router.get('/logout', Controllers.User.UserController.logOut)
router.get('/wallet', Controllers.User.UserController.getUserWalletDetails);
router.get('/txnhistory', Controllers.User.UserController.getUserTxnHistory);
router.get('/notifications', Controllers.User.UserController.getUserNotification);
router.get('/acknowledge',
    // validation check
    [
        query('type').exists().withMessage('type is required'),
        query('lang').exists().withMessage('language_type is required'),

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.User.UserController.acknowledgement);
router.get('/tickets', Controllers.User.UserController.getUserValidTickets)
router.get('/how_to_play', Controllers.User.UserController.getHowToPlay);
router.get('/update',
    // validation check
    [
        query('versionCode').exists().withMessage('versionCode is required'),
        query('deviceType').exists().withMessage('deviceType is required'),

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.User.SupportController.getUpdateList);

router.get('/configs', Controllers.User.SupportController.getConfig);
router.post('/username',

    // validation check
    [
        // query('username').exists().withMessage('username is required')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.User.UserController.SignUpBonus);

router.post('/changeLanguage', Controllers.User.UserController.changeLanguage);
router.post('/partner', Controllers.User.PartnerShipController.becomePartner);
router.post('/banner', (req, res, next) => {
    Controllers.User.PartnerShipController.partnerShipProgramBanner({
        user_id: req.user.user_id,
        lang: req.body.lang,
        referrals: req.body.referrals,
        user: req.user
    }).then(result => {
        let Msg = result.Msg;
        let title = result.title;
        let response = result.response
        return Utils.ResponseHandler(true, Utils.StatusCodes.Success, title, Msg, res, response);
    }).catch(e => {
        let Msg = e.Msg;
        let title = e.title
        let response = e.response
        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, title, Msg, res, response);
    })
});

router.post('/affiliateswithdraw', (req, res, next) => {
    Controllers.User.PartnerShipController.withdrawAffiliates({
        user_id: req.user.user_id,
        amount: req.body.amount
    }).then(result => {
        let Msg = result.Msg;
        let title = result.title
        let response = result.response
        return Utils.ResponseHandler(true, Utils.StatusCodes.Success, title, Msg, res, response);
    }).catch(e => {
        let Msg = e.Msg;
        let title = e.title
        let response = e.response
        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, title, Msg, res, response);
    })
})
router.post('/affiliates', (req, res, next) => {
        Controllers.User.PartnerShipController.getAffiliateStats({
            user_id: req.user.user_id,
            type: req.body.type,
            page: req.body.page,
            order_type: req.body.order_type
        }).then(result => {
            let Msg = result.Msg;
            let title = result.title
            let response = result.response
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, title, Msg, res, response);
        }).catch(e => {
            let Msg = e.Msg;
            let title = e.title
            let response = e.response
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, title, Msg, res, response);
        })
    })
    /*  Upload image middleware*/

var s3 = new aws.S3({
    accessKeyId: config.AWS.AWS_S3_KEY,
    secretAccessKey: config.AWS.AWS_S3_SECRET
})
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.AWS.AWS_S3_BUCKET,
        metadata: function(req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function(req, file, cb) {
            var fileName = Date.now() + '' + file.originalname
            console.log("file >>>", file);

            req.myfilename = fileName;

            if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                req.mimetypeError = true
            }
            cb(null, `${config.AWS.S3_FOLDERS.USER_IMAGES}/${fileName}`)
        }

    })
});

router.post('/uploadImage', upload.single('image'), Controllers.User.UserController.uploadUserImage);

router.get('/ifsc/:ifsc', Controllers.User.UserController.verifyIFSC);


router.get('/leaders',
    // validation check
    [
        query('fetch_type').exists().withMessage('fetch_type is required'),

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Cricket.Match.getLeaderBoard);
router.get('/leaders/ranking',

    // validation check
    [
        query('leaderboard_id').exists().withMessage('leaderboard_id is required'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.Cricket.Match.getLeaderBoardRanking);
/**
 * Promotions related routes
 */
router.get('/promos', Controllers.User.UserController.getPromotions);
router.post('/checkpromo',

    // validation check
    [
        body('amount').exists().withMessage('amount is required'),
        body('code').exists().withMessage('promocode is required'),

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.User.UserController.checkPomocode)

router.post('/verify/email',
    // validation check
    [
        body('email').exists().withMessage('email is required')

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.VerifyController.verifyEmail);
router.post('/linkpaytm', Controllers.User.UserController.linkPaytmWallet);
/**
 * @KYC Related routes
 */
router.post('/verifypan',
    // validation check
    [
        body('pan_no').exists().withMessage('pan_no is required'),
        body('dob').exists().withMessage('dob is required'),
        body('state').exists().withMessage('state is required')

    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    Controllers.User.UserController.updateUserPanDetails);
router.get('/pan', Controllers.User.UserController.getPanDetails);
router.get('/aadhar', Controllers.User.UserController.getAadharDetails);
// router.get('/promocode',  Controllers.User.UserController.)
router.post('/verifybank',

    // validation check
    [
        body('account_number').exists().withMessage('account_number is required'),
        body('branch_name').exists().withMessage('branch_name is required'),
        body('bank_name').exists().withMessage('bank_name is required'),
        body('ifsc_code').exists().withMessage('ifsc_code is required')
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,

    (req, res, next) => {
        Controllers.VerifyController.verifyBank({
            userId: req.user.user_id,
            Account_Number: req.body.account_number,
            ifsc_code: req.body.ifsc_code,
            bank_name: req.body.bank_name,
            branch_name: req.body.branch_name
        }).then(result => {
            let Msg = result.Msg;
            let title = result.title
            let response = result.response
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, title, Msg, res, response);
        }).catch(e => {
            let Msg = e.Msg;
            let title = e.title
            let response = e.response
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, title, Msg, res, response);
        })
    });


router.post('/redeemcode',
    // validation check
    [
        body('code').exists().withMessage('redeemcode is required'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    (req, res) => {
        Controllers.User.UserController.applyRedeemCode({
            code: req.body.code,
            user: req.user.user_id
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
    })

router.post('/edit_profile', (req, res, next) => {
    Controllers.User.UserController.editProfile({
        user_id: req.user.user_id,
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
        dob: req.body.dob,
        gender: req.body.gender

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
 *@Passes routes
 */

router.post('/passes', Controllers.User.PassesController.getPassses);
router.post('/purchasPasses',

    // validation check
    [
        body('pass_id').exists().withMessage('pass_id is required'),
    ],
    //route Controller
    Middlewares.CustomValidMsg.errorHandle,
    Controllers.User.PassesController.purchasePass);

//social login routes
router.get('/auth/facebook', passport.authenticate("facebook"));
router.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
        successRedirect: "/users/",
        failureRedirect: "/users/fail"
    })
);

router.get("/fail", (req, res) => {
    res.send("Failed attempt");
});

router.get("/", (req, res) => {
    res.send("Success");
});



module.exports = router;