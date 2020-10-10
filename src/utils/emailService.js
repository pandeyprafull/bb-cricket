const lib = require('pepipost');
const configuration = lib.Configuration;
const controller = lib.EmailController;
const Attribute = lib.Attribute;
let apiKey = 'api key to be passed here';
let body = new lib.EmailBody();
let config = require('../config');
let fs = require('fs');
let path = require('path');
let Constants = require('./Constants');
let ejs = require('ejs');

exports.sendMail = async (type, params) => {
    let template, subject, userEmail, userName, validName, html;
    console.log("type is >", type)
    if (type == Constants.emails.bankVerifyEmail) {
        let customType = params.type
        if (customType == "bankVerified") {
            subject = `Bank Details Updated`
            template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/bank_verified.html')).toString();
        }
        userEmail = params.user_email;
        userName = params.user_name ? params.user_name : params.user_email;
        validName = params.user_name.split(' ');
        console.log("validName is >>>", validName);
        let link = params.link;
        html = ejs.render(template, { name: validName[0], link: link })

    } else if (type == Constants.emails.verifyEmail) {
        template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/email_verify.html')).toString();
        userEmail = params.email;
        let name = params.name;
        let link = params.link;
        console.log('link===>>> ', link);

        html = ejs.render(template, { name: name, link: link });
        // console.log("html is >>>>", html);
        subject = `Email Verification Required`
    } else if (type == Constants.emails.withdrawRequest) {
        template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/withdraw_request.html')).toString();
        userEmail = params.user_email;
        userName = params.user_name.split(' ');
        let link = params.link;
        console.log('link===>>> ', link);

        html = ejs.render(template, { name: userName.length > 0 ? userName[0] : userEmail, link: link });
        subject = `Withdraw Request Process`;
    } else if (type == Constants.emails.cancelWithdrawlRequest) {
        template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/withdraw_cancelled.html')).toString();
        userEmail = params.user_email;
        userName = params.user_name.split(' ');
        let link = params.link;
        console.log('link===>>> ', link);

        html = ejs.render(template, { name: userName.length > 0 ? userName[0] : userEmail, link: link });
        subject = `Withdraw Request Cancel`;
    } else if (type == Constants.emails.joinLeagueMail) {
        template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/newtemplates/League_Joined.html')).toString();
        userEmail = params.user_email;
        userName = params.user_name.split(' ');
        let link = params.link;
        console.log('link===>>> ', link);
        console.log('params===>>> ', params);


        html = ejs.render(template, { name: userName.length > 0 ? userName[0] : userEmail, link: link, leagueDetails: params.leagueDetails });
        subject = `User Joined League`;
    } else if (type = Constants.emails.fundtransferPP) {
        template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/newtemplates/fund-transfer.html')).toString();
        userEmail = params.user_email;
        userName = params.user_name.split(' ');
        let link = params.link;

        html = ejs.render(template, { name: userName.length > 0 ? userName[0] : userEmail, link: link });
        subject = `fund-transfer PartnerShip Program`;

    } else if (type == Constants.emails.paymentGateway) {
        if (params.is_Promo) {
            template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/newtemplates/User_Deposit_Cash_(With Promo).html')).toString();
        }
        template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/newtemplates/User_Deposit_Cash_(Without Promo).html')).toString();
        userEmail = params.user_email;
        userName = params.user_name.split(' ');
        let link = params.link;

        html = ejs.render(template, { name: userName.length > 0 ? userName[0] : userEmail, link: link });
        subject = ` User Cash Deposit`;
    } else if (type == Constants.emails.rewardClaim) {

        console.log("product category ....", params.product.reward_category_id);
        if (params.product.reward_category_id == 1) {
            template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/newtemplates/Claim-Reward-(Logistics).html'))
        } else if (params.product.reward_category_id == 2) {
            template = fs.readFileSync(path.join(__dirname, '../../templates/emailers/newtemplates/Claim-Reward.html'))
        } else if (params.product.reward_category_id == 3) {
            template = fs.readFileSync(__dirname, '../../templates/emailers/newtemplates/Claim-Reward-(BB-Rewards).html')
        }
        let link = params.link
        userEmail = params.user_email;
        userName = params.user_name;
        product = params.productName

        html = ejs.render(template, {name: userName.length > 0 ? userName : userEmail, product: product, link : link});

        subject = params.subject
    }
    return await this.netcoreEmail(userEmail, subject, html);
},

    exports.netcoreEmail = async (to, subject, html) => {
        body.personalizations = [];
        body.personalizations[0] = new lib.Personalizations();
        body.personalizations[0].recipient = to;
        body.personalizations[0].attributes = new Attribute({
            name: 'Jon Doe'
        });
        body.tags = 'Ballebaazi';
        body.from = new lib.From();
        body.from.fromEmail = config.Email.NETCORE_FROM_EMAIL;
        body.from.fromName = config.Email.NETCORE_FROM_NAME;
        body.subject = subject
        body.content = html;
        /**
         * For other setting in the
         */
        body.settings = new lib.Settings();
        body.settings.unsubscribe = 0;
        BASE_URI = "";

      try{
        const promise = await controller.createSendEmail(config.Email.NETCORE_KEY, body, BASE_URI);
        console.log("promise of a mailer", promise)
      }catch(err){
        console.log("mail error>>>>", err);
      }
    }
