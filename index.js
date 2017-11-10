var util = require('util');
var aws = require('aws-sdk');
var sns = new aws.SNS();
var s3 = new aws.S3();

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
        var phoneTest=/Subject: ([0-9]{11})/g;
        var textNum = phoneTest.exec(objectData);
        
        var boundTest =/boundary="(.*)"/g;
        var boundary = boundTest.exec(objectData);
        var splitEmail = objectData.split("--"+boundary[1]);
        var body = splitEmail[1];
        

        var bodyTest =/\r\n\r\n(.*)\r\n\r\n/g;
        body = bodyTest.exec(body);

        var base64regex = /Content-Transfer-Encoding: base64/;
        var textBody = body[1];
        if (base64regex.test(body)){
            textBody = new Buffer(body[1], 'base64').toString();
        }
        
        if (textNum === null){
            console.log("Error: no phone number detected");
            callback(null, null);
        }
        
        console.log("Text Body: "+textBody);
        sns.publish({
            Message:textBody,
            PhoneNumber:textNum[1]},function(err, data){
                if(err){
                    console.log("Error occured:\n"+err);
                    callback("Error occured");}
                console.log("Text sent!");
                callback(null, {"statusCode":200,"headers":{"Date":new Date()},"body":""});
        });
    });
};
