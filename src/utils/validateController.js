let moment = require('moment');
let Utils = require('../utils');
let Constants = require('./Constants');
let StatusCodes = require('./statusCodes');



module.exports = {
    validateAccountType: async(accountType) =>{
    return new Promise(async(resolve, rejected) =>{
        let types = Constants.authTypes
        console.log("Authtype is>>>",types);
         accountType = parseInt(accountType);
        if(!accountType) return await rejected({Msg: __('ACCOUNT_REQUIRED'), title: 'missing_value', status: StatusCodes.Error});

        let isIncludes = types.includes(accountType);
        if(!isIncludes) return await rejected({Msg: __('ACCOUNT_INVALID') , title: 'invalid', status: StatusCodes.Error})

        return await resolve({Msg: __('ACCOUNT_VALID')  , title: 'valid', status: StatusCodes.Success, response: accountType })
    })
    },
    validateText: async(value, field, required = false, min = 2, max = false) => {
        let response;

        if (!required && !value) return response = await Utils.Validators.valiadateLeagueName(true, StatusCodes.Success, 'null_entry', field + __('IS_NOT_REQUIRED'))

        if (required && !value) return response = await Utils.Validators.valiadateLeagueName(false, StatusCodes.Error, 'missing_value', field + __('IS_REQUIRED'));
        // value = value.trim();
        // min max length
        field = field.toLowerCase();
        if (min && value.length < min) return response = await Utils.Validators.valiadateLeagueName(false, StatusCodes.Error, 'Short', field + __('IS_SHORT_BEGINS') + min + __('CHAR_LONG'))

        if (max && value.length > max) return response = await Utils.Validators.valiadateLeagueName(false, StatusCodes.Error, 'Big', field + __('IS_BIG_BEGINS') + max + __('CHAR_LONG'));

        return response = await Utils.Validators.valiadateLeagueName(true, Utils.StatusCodes.Success, 'valid', field + __('IS_VALID'), value);

    },

    validateTextNew: async(value, field, required = false, min = 2, max = false) => {
        return new Promise(async(resolve, rejected) => {
            if (!required && !value) return await rejected({ Msg: field + __('IS_REQUIRED'), title: 'null_entry', status: StatusCodes.Error });

            if (required && !value) return await rejected({ Msg: field + __('IS_REQUIRED'), title: 'missing_value', status: StatusCodes.Error });

            field = field.toLowerCase();
            value = value.toString();

            if (min && value.length < min) return await rejected({ Msg: field + __('IS_SHORT_BEGINS') + min + __('CHAR_LONG'), title: 'Short', status: StatusCodes.Error });

            if (max && value.length > max) return await rejected({ Msg: field + __('IS_BIG_BEGINS') + max + __('CHAR_LONG'), title: 'big', status: StatusCodes.Error });

            return await resolve({ Msg: field + __('IS_VALID'), title: 'valid', response: value, status: StatusCodes.Success });
        })
    },
    validateEmail: async(email, required = false, unique = false) => {
        return new Promise(async(resolve, rejected) => {
            email = email.toString().toLowerCase().trim();
            if (!required && !email) return await rejected({ Msg: __('EMAIL_REQUIRED'), title: 'null_entry', status: StatusCodes.Error })

            if (!required && !email) return await rejected({ Msg: __('EMAIL_REQUIRED'), title: 'missing_value', status: StatusCodes.Error });

            let letters = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            let isValid = letters.test(email);

            console.log("Email validation >>>>", isValid)
            if (isValid) {
                return await resolve({ Msg: __('EMAIL_VALID'), title: 'valid', response: email, status: StatusCodes.Success });
            }
            return await rejected({ Msg: __('EMAIL_INVALID'), title: 'Inavlid Email', status: StatusCodes.Error});
        })
    },
    validatePhone: async(phone, required = false, min = 10, max = 10) => {
        return new Promise(async(resolve, rejected) => {
            phone = phone.toString().trim();
            if (!required && !phone) return await rejected({ Msg: __('MOBILE_REQUIRED'), title: 'null_entry' });
            if (required && !phone) return await rejected({ Msg: __('MOBILE_REQUIRED'), title: 'missing_value' });

            // min max length
            if (!min && phone.length < min) return await rejected({ Msg: "Mobile_number" + __('IS_SHORT_BEGINS') + " " + min + " " + __('DIGIT_LONG'), title: 'Short' });

            if (max && phone.length > max) return await rejected({ Msg: "Mobile Number " + __('IS_BIG_BEGINS') + " " + max + " " + __('DIGIT_LONG'), title: 'big' });
            // valid digits
            let phoneRGEX = /^[(]{0,1}[0-9]{3}[)]{0,1}[-\s\.]{0,1}[0-9]{3}[-\s\.]{0,1}[0-9]{4}$/;
            let isValid = phoneRGEX.test(phone);
            console.log("Mobile number validation>>", isValid);
            if (isValid) {
                if (phone.toString().split('')[0] == 0) return await rejected({ Msg: __('MOBILE_NOT_VALID'), title: 'invalid' });
                return await resolve({ Msg: __('MOBILE_VALID'), title: 'valid', response: phone });
            }
            return await rejected({ Msg: __('MOBILE_NOT_VALID'), title: 'invalid' });
        })
    },
    validateUsername: async(value, required = false, min = 2, max = 16) => {
        return new Promise(async(resolve, rejected) => {
            let field = "username ";
            let label = "Username ";
            value = value.toString().toLowerCase().trim();
            if (!required && !value) return await rejected({ Msg: label + __('IS_REQUIRED'), title: 'null_entry' });
            if (required && !value) return await rejected({ Msg: label + __('IS_REQUIRED'), title: 'missing_value' });
            // min max length
            if (min && value.length < min) return await rejected({ Msg: label + __('IS_SHORT_BEGINS') + min + __('CHAR_LONG'), title: 'Short' });

            if (max && value.length > max) return await rejected({ Msg: label + __('IS_BIG_BEGINS') + max + __('CHAR_LONG') })

            // check Alnum
            let letters = /((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i
            let isValid = letters.test(value);
            if (isValid) return await resolve({ Msg: label + __('IS_VALID'), title: 'valid', response: value })

            return await rejected({ Msg: label + __('NOT_VALID_ALNUM'), title: 'invalid' })

        })
    },
    validateNameNew: async(name, field, required = false, min = 2, max = 30) => {
        return new Promise(async(resolve, rejected) => {
            field = field.toLowerCase();
            let label = field;
            name = name.toString().toLowerCase().trim();
            if (!required && !name) return await rejected({ Msg: label + __('IS_REQUIRED'), title: 'null entry' });

            if (required && !name) return await rejected({ Msg: label + __('IS_REQUIRED'), title: 'missing_value' });
            // min max length
            if (max && name.length < min) return await rejected({ Msg: label + __('IS_SHORT_BEGINS') + min + __('CHAR_LONG'), title: 'Short' });

            if (max && name.length > max) return await rejected({ Msg: label + __('IS_BIG_BEGINS') + max + __('CHAR_LONG'), title: 'big' })
                //check alnum
            name = name.toString();
            return resolve({ Msg: label + __('IS_VALID'), title: 'valid', response: name });

            // let letters = /((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i
            // let isValid = letters.test(name);
            // console.log("Validated name is", isValid, name);
            // if (isValid) return await resolve({ Msg: label + __('IS_VALID'), title: 'valid', response: name })

            // return await rejected({ Msg: label + __('NOT_VALID_ALPHA'), title: 'invalid' });
        })
    },

    validateDigits: async(value, field, required = false, min = 1, max = false, minValue = false, maxValue = false) => {
        let response;


        if (!required && !value) return response = await Utils.Validators.valiadateLeagueName(true, StatusCodes.Success, 'null_entry', field + " " + __('IS_NOT_REQUIRED'), value);
        if (required && value === "") return response = await Utils.Validators.valiadateLeagueName(false, StatusCodes.Error, 'missing_value', field + " " + __('IS_REQUIRED'));
        // console.log("Value Is >>>>", value);
        // value.trim();
        //min max length
        field = field.toLowerCase();
        if (min && value.length < min) return response = await Utils.Validators.valiadateLeagueName(false, StatusCodes.Error, 'Short', field + " " + __('IS_SHORT_BEGINS') + min + __('DIGIT_LONG'));

        if (max && value.length > max) return response = await Utils.Validators.valiadateLeagueName(false, StatusCodes.Error, 'Big', field + " " + __('IS_BIG_BEGINS') + max + __('DIGIT_LONG'));


        // minValue maxValue
        if (minValue && value < minValue) return response = await Utils.Validators.valiadateLeagueName(false, StatusCodes.Error, 'min', __('MIN_VALUE') + " " + field + " " + minValue);

        console.log("maxValue IS>>>>", maxValue);
        console.log("value Is>>>>>", value);
        if (maxValue && value > maxValue) {
            response = await Utils.Validators.valiadateLeagueName(false, Utils.StatusCodes.Error, 'max', __('MAX_VALUE') + " " + field + " " + maxValue);
            //  console.log("Response Data is::", response);
            return response;
        }

        if (!isNaN(value)) return response = await Utils.Validators.valiadateLeagueName(true, StatusCodes.Success, 'valid', field + " " + __('IS_VALID'), value);

        return response = await Utils.Validators.valiadateLeagueName(false, Utils.StatusCodes.Error, 'invalid', field + " " + __('NOT_VALID_DIGIT'));

    },


    validateDigitsNew: async(value, field, required = false, min = 1, max = false, minValue = false, maxValue = false) => {

        return new Promise(async(resolve, rejected) => {
            let response;

            if (!required && !value) {
                return await rejected({ Msg: field + " " + __('IS_NOT_REQUIRED'), title: 'null_entry', response: value, status: 200 })
            }
            if (required && value === "") {
                return await rejected({ Msg: field + " " + __('IS_REQUIRED'), title: missing_value, status: 400 })

            }
            // console.log("Value Is >>>>", value);
            // value.trim();
            //min max length
            field = field.toLowerCase();
            value = value.toString();
            if (min && value.length < min) {
                return await rejected({ Msg: field + " " + __('IS_SHORT_BEGINS') + min + __('DIGIT_LONG'), title: 'short', status: 400 });
            }
            if (max && value.length > max) {
                return await rejected({ Msg: field + " " + __('IS_BIG_BEGINS') + max + __('DIGIT_LONG'), title: 'Big', status: 400 });
            }
            // minValue maxValue
            if (minValue && value < minValue) {
                return await rejected({ Msg: __('MIN_VALUE') + " " + field + " " + minValue, title: 'min', status: 400 });
            }
            console.log("maxValue IS>>>>", maxValue);
            console.log("value Is>>>>>", value);
            if (maxValue && value > maxValue) {
                return await rejected({ Msg: __('MAX_VALUE') + " " + field + " " + maxValue, title: 'max', status: 400 })

            }
            if (!isNaN(value)) {
                return await resolve({ Msg: field + " " + __('IS_VALID'), title: 'valid', response: value, status: 200 });
            }
            return response = await rejected({ Msg: field + " " + __('NOT_VALID_DIGIT'), title: 'invalid', status: 400 })
        })
    },

    validateAlnum: async(value, field, required = false, min = 2, max = 30, space = true) => {
        return new Promise(async(resolve, rejected) => {
            field = field.toLowerCase();
            value = value ? value.trim() : null;

            if (!required && !value) return await resolve({ Msg: field + " " + __('IS_NOT_REQUIRED'), title: 'null_entry', response: value, status: 200 });

            if (required && !value) return await rejected({ Msg: field + " " + __('IS_REQUIRED'), title: 'missing_value', status: 400 });

            // min max length
            value = value.toString();
            if (min && value.length < min) return await rejected({ Msg: field + " " + __('IS_SHORT_BEGINS') + " " + min + " " + __('CHAR_LONG'), title: 'short', status: 400 })

            if (max && value.length > max) return await rejected({ Msg: field + " " + __('IS_BIG_BEGINS') + " " + max + " " + __('CHAR_LONG'), title: 'big', status: 400 });

            //check alnum
            value = value.toString()
            let letters = /((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i
            let isValid = letters.test(value);

            //    console.log("isValid", value ,isValid);

            if (isValid) {
                return await resolve({ Msg: field + " " + __('IS_VALID'), title: 'valid', status: 200, response: value })
            }
            return await rejected({ Msg: field + " " + __('NOT_VALID_ALNUM'), title: 'invalid', status: 400 })
        })
    },

    validateBirth: async(dob, required = false, minAge = 18, maxAge = 99) => {
        return new Promise(async(resolve, rejected) => {
            dob = dob.toString().trim();
            if (!required && !dob) return await rejected({ Msg: __('DOB_REQUIRED'), title: 'null_entry' });
            if (required && !dob) return await rejected({ Msg: __('DOB_REQUIRED'), title: 'missing_value' });

            //valid date
            let date = moment().format('YYYY-MM-DD');
            let isValid = moment(dob).isValid()
            console.log('Validated date is>>>', isValid);
            if (isValid) {
                let age = moment().diff(dob, "years", false);
                console.log('====>>>> ', age);

                //min max  age
                if (minAge && age < minAge) return await rejected({ Msg: __('MIN_AGE') + " " + minAge + " years", title: 'Short' });

                if (maxAge && age > maxAge) return await rejected({ Msg: __('MAX_AGE') + maxAge + " years" });
                return await resolve({ Msg: __('DOB_VALID'), title: 'valid', response: dob });

            }
            return await rejected({ Msg: __('DOB_INVALID'), title: 'invalid' });
        })
    },
    validateGender: async(gender, required = false) => {
        return new Promise(async(resolve, rejected) => {
            let Genders = ['M', 'F'];
            gender = gender.toString().trim();
            gender = gender[0];
            if (!required && !gender) return await rejected({ Msg: __('GENDER_IS_REQUIRED'), title: 'null_entry' });
            if (required && !gender) return await rejected({ Msg: __('GENDER_IS_REQUIRED'), title: 'missing_value' });
            let isIncludes = Genders.includes(gender);
            if (!isIncludes) return await rejected({ Msg: __('GENDER_INVALID'), title: 'invalid' })

            return await resolve({ Msg: __('GENDER_VALID'), title: 'valid', response: gender });


        })
    }
}