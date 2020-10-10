// const jwt = require('jsonwebtoken');


// const decodeToken = (req, res, next) =>{
//     jwt.verify(req.token, process.env.SECRET, (err, authData)=>{
//         if(authData){
//             return next();
//         }
//         else{
//             return res.status(403).json({message: "Forbidden error / unAuthorized user", status: 403})
//         }
//     })
// }

// module.exports = decodeToken;

////////////////////////////Second Method //////////////////////////////////

let jwt = require('jsonwebtoken');
const db = require('../utils/CricketDbConfig');
const Utils = require('../utils');
const SQL = require('../sql');

module.exports = {
    checkToken: async(req, res, next) => {
        let token = await req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
        // console.log("token from header", token, typeof token)
        if (typeof token != 'undefined') {
            // Remove token from string
            token = token.slice(7, token.length);
            req.token = token
            console.log("Slice token is", token);
            //////
            token = token.toString()
            let access_token = await Utils.Redis.getAsync(token);
            console.log("after reddis token");
            // access_token = null;
            console.log("Reddis Token is ", access_token, typeof access_token);
            if (!access_token || access_token == ' ' || access_token == {} || access_token == null) {
                access_token = await SQL.Users.getAccessToken(token, 1);
                console.log('Access Token from Database', access_token);

                access_token = access_token ? access_token.access_token.toString() : ' '
                Utils.Redis.set(access_token, access_token, 'EX', Utils.RedisExpire.ACCESS_TOKEN)
            } else {
                console.log("access_token from Reddis", access_token)
                    // access_token = JSON.parse(access_token);
            }

            if (access_token.length > 0) {
                // token = token.toString()
                console.log("access_token >>>", access_token, "token >>>",
                    token, ' ' + access_token === ' ' + token)

                if (access_token == token) {
                    jwt.verify(token, process.env.SECRET, async(err, decoded) => {
                        if (err) {
                            return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('invalid Token'), __('EXPIRED_TOKEN'), res);
                        } else {
                            console.log('decode is  >>>>', decoded)
                            req.decoded = decoded;
                            let userDetails = await SQL.Users.getUserById(decoded.user_id)
                            if (!userDetails || !userDetails.length) {
                                return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('Unauthorized_User'), __('Unauthorized_User'), res)
                            } else {
                                // res.send({ user: userDetails[0] })
                                req.user = userDetails[0];
                                req.token = access_token
                                    // console.log("access_token >>>>", req.user.access_token, access_token)
                                if (req._parsedOriginalUrl && req._parsedOriginalUrl.path != '/users/logout') {
                                    if (userDetails[0].status == 0) return Utils.ResponseHandler(false, Utils.StatusCodes.Account_blocked, 'Account blocked', __('account_blocked'), res)
                                }
                                next();
                            }
                        }
                    });
                } else {
                    return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('Unauthorized_User'), __('Unauthorized_User'), res)
                }
            } else {
                return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('Bad Token'), __('BAD_TOKEN'), res);
            }
        } else {
            return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('Unauthorized_User'), __('BAD_TOKEN'), res)
        }
    },
    checkTokenOld: async(req, res, next) => {
        let token = await req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
        if (typeof token != 'undefined') {
            // Remove token from string
            token = token.slice(7, token.length);
            req.token = token;
            //  console.log("Slice token is",token);
            jwt.verify(token, process.env.SECRET, async(err, decoded) => {
                if (err) {
                    return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('invalid Token'), __('EXPIRED_TOKEN'), res);
                } else {
                    req.decoded = decoded;
                    let userDetails = await SQL.Users.getUserById(decoded.user_id)
                    if (!userDetails || !userDetails.length) {
                        return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('Unauthorized_User'), __('Unauthorized_User'), res)
                    } else {
                        userDetails = userDetails[0];
                        req.user = userDetails;
                        next();
                        // For one device one login
                        // if (userDetails.access_token.toString() === token.toString()) {
                        //     req.user = userDetails;
                        //     next();
                        // } else {
                        //     return Utils.ResponseHandler(false, Utils.StatusCodes.Unauthorized_user, __('Unauthorized_User'), __('Unauthorized_User'), res)
                        // }
                    }
                }
            });
        } else {
            return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('Token_expired'), __('BAD_TOKEN'), res)
        }
    }
}