const jwt = require('jsonwebtoken');
const Utils = require('../utils');
module.exports = {
    checkToken: (req, res, next) => {
        let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
        // console.log('token from client===>> ', token);
        if (typeof token !== 'undefined') {
            // Remove token from string
            token = token.slice(7, token.length);
            req.token = token;
        } else {
            return Utils.ResponseHandler(false, Utils.StatusCodes.Not_found, __('Token_not_found'), __('TOKEN_NOT_FOUND'), res)
        }
        if (token) {
            jwt.verify(token, process.env.GUEST_SECRET, (err, decoded) => {
                if (err) {
                    return Utils.ResponseHandler(false, Utils.StatusCodes.Token_expired, __('Invalid token'), __('EXPIRED_TOKEN'), res);
                } else {
                    req.decoded = decoded;
                    // console.log("Decoded token is in guest ....", decoded);
                    next();
                }
            });
        } else {
            return Utils.ResponseHandler(false, Utils.StatusCodes.Not_found, __('Token_not_found'), __('TOKEN_NOT_FOUND'), res);
        }
    }
}

// module.exports =  checkToken;