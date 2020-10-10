let express = require('express');
let aws = require('aws-sdk');
let bodyParser = require('body-parser');
let multer = require('multer');
let multerS3 = require('multer-s3');
let path = require('path');

let config = require('../config');
// console.log('=>>>', config.AWS.AWS_S3_BUCKET);

let s3_config = {
    secretAccessKey: config.AWS.AWS_S3_SECRET,
    accessKeyId: config.AWS.AWS_SQS_ACCESS_KEY_ID,
    region: config.AWS.AWS_S3_REGION,
};
// console.log("--->> ", s3_config);

let app = express();
let s3 = new aws.S3(s3_config);


var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.AWS.AWS_S3_BUCKET,
        key: (req, file, cb) => {
            console.log(file);
            cb(null, file.fieldname + "_" + Date.now() + "." + path.extname(file.originalname)); //use Date.now() for unique file keys
        }
    })
});

module.exports = upload