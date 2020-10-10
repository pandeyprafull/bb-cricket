const validator = require('validator');
module.exports = {
    validatePhone: (phone) => {
        let regex = `^([+][9][1]|[9][1]|[0]){0,1}([7-9]{1})([0-9]{9})$`
        if (!phone.toString().match(regex)) return false
        else return true

    },
    valiadateLeagueName: (status, statusCode, title, message = null, Api_data) => {
        return {
            "status": status,
            "code": statusCode,
            "title": title,
            "message": message,
            "response": Api_data,
            "under_maintenance": "no",
            "payment_default_amount": 100,
            "new_notifications": null,
            "referral_amount": 50,
            "closing_ts": 10,
            "server_timestamp": new Date().getTime(),
            "android_version_min": "21402000",
            "android_version_max": "21402205",
            "android_update_url": "https://www.ballebaazi.com/download/BalleBaazi_2_2_5.apk",
            "android_update_duration": "1800000",
            "ios_version_min": "1.0.4",
            "ios_version_max": "2.2",
            "ios_update_url": "https://itunes.apple.com/us/app/ballebaazi/id1438726846?ls=1&mt=8",
            "ios_update_duration": "86400000",
            "popup_banner_duration": "14400000",
            "max_teams": 9,
            "max_teams_other": 9,
            "isJackpot": null,
            "file_path": {
                "user_images": "https://s3.ap-south-1.amazonaws.com/ballebaazi-test/user_images/",
                "team_images": "https://s3.ap-south-1.amazonaws.com/ballebaazi-test/team_images/",
                "promotion_images": "https://s3.ap-south-1.amazonaws.com/ballebaazi-test/promotion_images/",
                "pan_images": "https://s3.ap-south-1.amazonaws.com/ballebaazi-test/pan_images/",
                "bank_images": "https://s3.ap-south-1.amazonaws.com/ballebaazi-test/bank_images/",
                "aadhaar_images": "https://s3.ap-south-1.amazonaws.com/ballebaazi-test/aadhaar_images/",
                "leaderboard_images": "https://s3.ap-south-1.amazonaws.com/ballebaazi-test/leaderboard_images/",
                "teams_pdf": "https://s3.ap-south-1.amazonaws.com/ballebaazi-test/teams_pdf/"
            }

        }
    },
    validateName: (name, min = 2, max = 30) => {
        if (!name) {
            return { status: false, code: 400, title: 'short', message: "Name required" }
        } else if (min && name.lenght < min) {
            return { status: false, code: 400, title: 'short', message: "Name is to short" }
        } else if (max && name.lenght > max) {
            return { status: false, code: 400, title: 'short', message: "Name is to big" }
        } else if (!validator.isAlpha(name)) {
            return { status: false, code: 400, title: 'short', message: "Invalid name." }
        } else {
            return { status: true, code: 200, title: "success" }
        }
    },
    validateGender: (gender) => {
        let genders = ["M", "F"];
        if (!name) {
            return { status: false, code: 400, title: 'short', message: "Name required" }
        } else if (!validator.isIn(gender, genders)) {
            return { status: false, code: 400, title: 'invalid', message: "Gender is invalid, must be either Male or Female." }
        } else {
            return { status: true, code: 200, title: "success" }
        }
    }
}