let config = require('../config');
const createResponseJson = (status, statusCode, title, message = null, res, Api_data, req) => {
    let new_notifications = 0
    if (req) {
        if (req.user)
            new_notifications = req.user.notifications ? parseInt(req.user.notifications) : 0
    }
    console.log('[----------------------------------------', message, statusCode);
    return res.send({
        "status": status,
        "code": statusCode,
        "title": title,
        "message": message,
        "response": Api_data,
        "under_maintenance": "no",
        "payment_default_amount": 100,
        "new_notifications": new_notifications,
        "referral_amount": 50,
        "closing_ts": 10,
        "server_timestamp": Math.floor(Date.now() / 1000),
        "android_version_min": "21402000",
        "android_version_max": "21402205",
        "android_update_url": "https://www.ballebaazi.com/download/BalleBaazi_2_2_5.apk",
        "android_update_duration": "1800000",
        "ios_version_min": "1.0.4",
        "ios_version_max": "2.2",
        "ios_update_url": "https://itunes.apple.com/us/app/ballebaazi/id1438726846?ls=1&mt=8",
        "ios_update_duration": "86400000",
        "popup_banner_duration": "14400000",
        "max_teams": config.MAX_TEAM,
        "max_teams_other": config.MAX_TEAM_OTHERS,
        "isJackpot": null,
        "file_path": {
            "user_images": `https://s3.${config.AWS.AWS_S3_REGION}.amazonaws.com/${config.AWS.AWS_S3_BUCKET}/user_images/`,
            "team_images": `https://s3.${config.AWS.AWS_S3_REGION}.amazonaws.com/${config.AWS.AWS_S3_BUCKET}/team_images/`,
            "promotion_images": `https://s3.${config.AWS.AWS_S3_REGION}.amazonaws.com/${config.AWS.AWS_S3_BUCKET}/promotion_images/`,
            "pan_images": `https://s3.${config.AWS.AWS_S3_REGION}.amazonaws.com/${config.AWS.AWS_S3_BUCKET}/pan_images/`,
            "bank_images": `https://s3.${config.AWS.AWS_S3_REGION}.amazonaws.com/${config.AWS.AWS_S3_BUCKET}/bank_images/`,
            "aadhaar_images": `https://s3.${config.AWS.AWS_S3_REGION}.amazonaws.com/${config.AWS.AWS_S3_BUCKET}/aadhaar_images/`,
            "leaderboard_images": `https://s3.${config.AWS.AWS_S3_REGION}.amazonaws.com/${config.AWS.AWS_S3_BUCKET}/leaderboard_images/`,
            "teams_pdf": `https://s3.${config.AWS.AWS_S3_REGION}.amazonaws.com/${config.AWS.AWS_S3_BUCKET}/teams_pdf/`
        }
    })
}

module.exports = createResponseJson;