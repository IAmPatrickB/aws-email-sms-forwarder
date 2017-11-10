var util = require('util');
var aws = require('aws-sdk');
var sns = new aws.SNS();
var s3 = new aws.S3();

// TO-DO:
// Remove hardcoding of body location
// Validate base64 detection
// Validate body location across multiple email providers
// Validate regex for international numbers
// Determine desired format for inboud email

exports.handler = (event, context, callback) => {
    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey    =
    decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    s3.getObject({
        Bucket: srcBucket,
        Key: srcKey
    }, function(err, data) {
        if(err){console.log("Error occured:");
            console.log(err)}

        const objectData = data.Body.toString();
        var textNum = objectData.match(/Subject: ([0-9]{11})/g);
        textNum = textNum[0].match(/[0-9]{11}/g)[0].toString()
        var splitEmail = objectData.split("\r\n\r\n");
        var emailBody = splitEmail[splitEmail.length-5];
        var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        var textBody
        if (base64regex.test(emailBody)){
            textBody = new Buffer(emailBody, 'base64').toString();
        } else {
            textBody = emailBody;
        }
        if (textNum === null){
            var error = "Error: no phone number detected"
            console.log(error);
            callback(error, null);
        }
        sns.publish({
            Message:textBody,
            PhoneNumber:textNum},function(err, data){
                if(err)
                    console.log("Error occured:\n"+err);
                console.log("Text sentsent!");
                callback(null, {"statusCode":200,"headers":{"Date":new Date()},"body":""});
        });
    });
};
