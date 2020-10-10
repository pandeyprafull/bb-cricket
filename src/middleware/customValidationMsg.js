const { check, validationResult } = require('express-validator');
const Utils = require('../utils');

exports.errorHandle = async(req, res, next) =>{

    // Finds the validation errors in this request  and wraps them in an object with handy functions
    const error = validationResult(req);

    if (!error.isEmpty()) {
        console.log("error of val >>>", error);
        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Wrong_data", error.errors[0].msg, res)
    }else{
        next();
    }
}