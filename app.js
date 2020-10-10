const createError = require('http-errors');
const express = require('express');
const requestIp = require('request-ip');
const path = require('path');
const bodyParser = require('body-parser');
const logger = require('morgan');
const i18n = require('i18n')
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
var cors = require('cors')
const passport = require('passport');
const helmet = require('helmet');
const Strategy = require('passport-facebook').Strategy;
// const swaggerUi = require('swagger-ui-express');
// const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./src/config');
const sequelize = require('./src/utils').Sequelize;

const Models = require('./src/models');
const Routes = require('./routes');
// const RoutesV1 = require('./routesV1');

const db = require('./src/utils/CricketDbConfig');
const app = express();

if (process.env.NODE_ENV == 'production') {
    console.log = function() {};
}
app.use(helmet())
app.use(cors())
i18n.configure({
    locales: ['en', 'de'],
    cookie: 'locales',
    defaultLocale: 'hn',
    extension: ".json",
    directory: __dirname + '/locales',
    register: global,
    logDebugFn: function(msg) {
        console.log('debug', msg);
    },
    logWarnFn: function(msg) {
        console.log('warn', msg);
    },
    logErrorFn: function(msg) {
        console.log('error', msg);
    }
});
app.use(i18n.init);
app.use(requestIp.mw());
//to access from any origin
app.use(cors());
app.use((req, res, next) => {
    let locales = req.headers.locales;
    // console.log('-------------->>> ', locales);
    if (locales) {
        if (locales == "hi") {
            locales = "en";
        }
        req.setLocale(locales);
    } else {
        req.setLocale("en");
    }
    next();
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
//swagger setup........
// const options = require('./utils/swagger');
// const specs = swaggerJsdoc(options);
// app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true}));
//.......

//social login
/** passport setup */
// console.log('fb=> ',config.FB_Login_Strategy);
// process.on("uncaughtException",(err)=>{
//     console.log('exception==== >>',err);
// })
// process.on("uncaughtExceptionMonitor",(err)=>{
//     console.log('exception==== >>',err);
// })
// process.on("unhandledRejection",(err)=>{
//     console.log('exception==== >>',err);
// })

passport.use(new Strategy(config.FB_Login_Strategy, (accessToken, refreshToken, user, cb) => {
    console.log("accessTokn is .....", accessToken);
    return cb(null, user);
}));

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});





app.use(passport.initialize());

//new sequelized routes
// app.use('/v1', RoutesV1.ViewsV1);
// app.use('/users/v1', RoutesV1.UserV1);

// app.use('/cricket/v1', RoutesV1.CricketV1);
// app.use('/football/v1', RoutesV1.FootballV1);
// app.use('/social/v1', RoutesV1.SocialLoginV1);

// old routes
app.use('/', Routes.Views);
app.use('/users', Routes.User);
app.use('/cricket', Routes.Cricket);
app.use('/football', Routes.Football);
app.use('/kabaddi', Routes.Kabaddi);
app.use('/basketBall', Routes.BasketBall);
app.use('/baseball', Routes.BaseBall);
app.use('/social', Routes.SocialLogin);
app.use('/reward', Routes.Reward)

process.setMaxListeners(0);
module.exports = app;
