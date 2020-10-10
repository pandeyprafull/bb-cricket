var config = module.exports = {};
// commom key for cricket kabaddi and football
config.BULK_SMS_URL = `http://bulkpush.mytoday.com/BulkSms/SingleMsgApi?feedid=${process.env.BULK_FEED_ID}&username=${process.env.BULK_FEED_USER}&password=${process.env.BULK_FEED_PASS}&senderid=${process.env.BULK_FEED_SEND_ID}`
config.MAX_TEAM = 11;
config.MAX_TEAM_OTHERS = 11;
config.BONUS_EXPIRY = true;
config.IS_PARTNERSHIPT_ACTIVE = 1;
config.MAX_INVALID_OTP_ATTEMPTS = 3;
config.ENABLE_SQS = false;
config.M91_AUTHKEY = process.env.M91_KEY
config.M91_SENDER = process.env.M91_SENDER
config.EMAIL_TOKEN_SECRET = process.env.EMAIL_TOKEN_SECRET
config.CAMPAIN_EVENTS = [1, 2, 3, 4, 10]
config.M91_ROUTE = process.env.M91_ROUTE
config.M91_URL = process.env.M91_URL
config.mode = 'development'
config.MULTIJOINING_LEAGUE_THREASHOLD = 100;
config.INFINITY_TERMINATOR = 100000
config.WITHDRAW_TDS_START = 1000000
config.LEADERBOARD_FANTASY_TYPES = [1, 2, 3]
config.WITHDRAW_TDS_PERCENT = 0
config.IMAGES_BUCKET = 'ballebaazi-test'
config.IS_MULTI_JOINING = 1 // 1 --> enable , 0 --> disable
config.IDFY_KEY = '92a1df46-7cc1-4c97-8fb5-194ee630b1e1'
config.REDIS_HOST = 'bbdev.u0rh8w.ng.0001.aps1.cache.amazonaws.com' // 'localhost'
    // //
config.BASE_URL = `http://${process.env.SERVER_HOST}:3000/`
config.EMAIL_VERIFY = `http://${process.env.SERVER_HOST}:3000/`
config.LOCAL = `http://${process.env.SERVER_HOST}:3000/`
    // config.PAYU_URL = "https://test.payu.in/_payment"

config.PAYU = {
    PAYU_MERCHANT_KEY: process.env.PAYU_MERCHANT_KEY,
    PAYU_MERCHANT_SALT: process.env.PAYU_MERCHANT_SALT,
    PAYU_URL: "https://secure.payu.in/_payment",
    // PAYU_URL: 'https://sandboxsecure.payu.in/_payment'
}

config.PAYTM = {
    MID: process.env.PAYTM_MERCHANT_MID,
    PAYTM_MERCHANT_KEY: process.env.PAYTM_MERCHANT_KEY,
    WEBSITE: process.env.PAYTM_MERCHANT_WEBSITE,
    CHANNEL_ID: process.env.PAYTM_CHANNEL_ID,
    INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE,
    STATUS_URL: `https://securegw-stage.paytm.in/order/status`,
    TXN_URL: `https://securegw-stage.paytm.in/order/process`,
    // TXN_URL: `https://securegw-stage.paytm.in/theia/processTransaction`,
    CALLBACK_URL: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/users/paytm`,
    PAYTM_ENVIOURMENT: process.env.PAYTM_ENVIOURMENT
}
config.AWS = {
    SQS_URL: "https://sqs.ap-south-1.amazonaws.com/427757176765/createEditTeamBB",
    AWS_SQS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SQS_ACCESS_SECRET_KEY: process.env.AWS_ACCESS_KEY_SECRET,
    REGION: 'ap-south-1',
    VERSION: 'latest',
    AWS_S3_KEY: process.env.S3_AWS_ACCESS_KEY,
    AWS_S3_SECRET: process.env.S3_AWS_ACCESS_KEY_SECRET,
    AWS_S3_BUCKET: process.env.S3_AWS_BUCKET,
    AWS_S3_REGION: process.env.S3_AWS_REGION,
    AWS_S3_VERSION: process.env.S3_AWS_VERSION,
    S3_FOLDERS: {
        USER_IMAGES: "user_images"
    }
}

// cricket configs
config.cricket_db = {
    connectionLimit: 100,
    supportBigNumbers: true,
    // bigNumberStrings: true,
    host: process.env.HOST,
    user: process.env.USERT,
    password: process.env.PASSWORD,
    database: process.env.DB,
    port: '3306'
}

// football configs
config.football_db = {
        connectionLimit: 10,
        supportBigNumbers: true,
        bigNumberStrings: true,
        host: process.env.FB_HOST,
        user: process.env.FB_USERT,
        password: process.env.FB_PASSWORD,
        database: process.env.FOOTBALL_DB,
        port: '3306'
    },

    // kabaddi configs
    config.Kabaddi_db = {
        connectionLimit: 10,
        supportBigNumbers: true,
        bigNumberStrings: true,
        host: process.env.KB_HOST,
        user: process.env.KB_USERT,
        password: process.env.KB_PASSWORD,
        database: process.env.KABADDI_DB,
        port: '3306'
    }

//basketball_db
config.BasketBall_db = {
    connectionLimit: 10,
    supportBigNumbers: true,
    bigNumberStrings: true,
    host: process.env.BK_HOST,
    user: process.env.BK_USERT,
    password: process.env.BK_PASSWORD,
    database: process.env.BASKETBALL_DB,
    port: '3306'
}

//basketball_db
config.Ballebaazi_quiz_db = {
    connectionLimit: 10,
    supportBigNumbers: true,
    bigNumberStrings: true,
    host: process.env.QB_HOST,
    user: process.env.QB_USERT,
    password: process.env.QB_PASSWORD,
    database: process.env.BALLEBAAZI_QUIZ,
    port: '3306'
}

config.Baseball_db = {
        connectionLimit: 10,
        supportBigNumbers: true,
        bigNumberStrings: true,
        host: process.env.BS_HOST,
        user: process.env.BS_USERT,
        password: process.env.BS_PASSWORD,
        database: process.env.BASEBALL_DB,
        port: '3306'
    }
    //social Login
config.FB_Login_Strategy = {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/social/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email'],
    enableProof: true
}

config.Email = {
    NETCORE_KEY: process.env.NETCORE_KEY,
    NETCORE_FROM_EMAIL: process.env.NETCORE_FROM_EMAIL,
    NETCORE_FROM_NAME: process.env.NETCORE_FROM_NAME
}

config.First_Time_League_Category = 19
config.league_recommendation_category = "1,3,4,14"