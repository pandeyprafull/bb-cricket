var AWS = require('aws-sdk');
let Config = require('../config');

AWS.config.update({
    region: Config.AWS.REGION,
    accessKeyId: Config.AWS.AWS_SQS_ACCESS_KEY_ID,
    secretAccessKey: Config.AWS.AWS_SQS_ACCESS_SECRET_KEY
});
var sqs = new AWS.SQS({ apiVersion: Config.AWS.VERSION });
let queueURL = Config.AWS.SQS_URL;
module.exports = {
    sendSqsMessage: async(data, cb) => {
        var params = {
            DelaySeconds: 0,
            MessageAttributes: {
                "Title": {
                    DataType: "String",
                    StringValue: "Create Team"
                },
                "Author": {
                    DataType: "String",
                    StringValue: "BalleBaazi"
                },
                "WeeksOn": {
                    DataType: "Number",
                    StringValue: "1"
                }
            },
            MessageBody: JSON.stringify(data),
            // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
            // MessageId: "Group1",  // Required for FIFO queues
            QueueUrl: queueURL
        };
        sqs.sendMessage(params, cb);
    }
}