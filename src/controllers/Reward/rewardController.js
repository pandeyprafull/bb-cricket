const db = require('../../utils/CricketDbConfig');
const responseConfigObj = require('../../utils/configResponse');
const SQL_QUERY_MATCH = require('../../sql/cricketQuery');
const SQL_QUERY_USER = require('../../sql/userQuery');
const SQL = require('../../sql');
const complexSortArr = require('../../utils/CustomArraySort');
const checkObjProperties = require('../../utils/checkObjEqualProperty');
const Utils = require('../../utils');
const Controllers = require('../../utils/validateController');
// const bcrypt = require('bcrypt');
const Bluebird = require('bluebird')
let Validator = require('validator');
const Config = require('../../config');
const moment = require('moment');

exports.getProducts = async (req, res, next) => {
  let userId = req.user.user_id;
  let savedAddress, userData;
  if (userId) {
    savedAddress = await SQL.Users.getAddressByUserId(userId)
  } else {
    userData = req.user;
    if (userData.user_id) {
      savedAddress = await SQL.Users.getAddressByUserId(userData.user_id)
    }
  }

  let lastDate = moment().subtract(Utils.Constants.DAY_DIFF_FOR_CLAIM_PRODUCT, 'day').format('YYYY-MM-DD hh:mm:ss');

  console.log("Currentdate >>>", lastDate);

  let last30DaysClaimedByUser;
  if (userId) {
    last30DaysClaimedByUser = await SQL.Users.getLastClaimedProductsByUserId(userId);
  } else {
    userData = req.user;
    if (userData.user_id) {
      last30DaysClaimedByUser = await SQL.Users.getLastClaimedProductsByUserId(userData.user_id)
    }
  }

  if (last30DaysClaimedByUser.length < 0) last30DaysClaimedByUser = null;
  if (savedAddress.length < 0) savedAddress = null;

  //fetch product for reward store
  let productList = await SQL.Users.getAllWithCategory();

  // Fetch banner for reward program
  let bannerList = await SQL.Users.getRewardBanner();

  let response = { productlist: productList, banner: bannerList, saveAddress: savedAddress, lastClaimedProduct: last30DaysClaimedByUser }

  return await Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('SUCCESS'), res, response);
}

exports.claimConfirm = async(req, res, next) => {
  let userId = req.user.user_id;
  let productId = req.body.product;
  let email = req.body.email;
  let pincode = req.body.pincode;
  let address = req.body.address;
  let city = req.body.city;

  let rewardResponse;
  if (!userId) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Wrong_data", __('WRONG_DATA'), res);

  let userDetail = await SQL.Users.getUserById(userId);
  userDetail = userDetail[0];

  if (!userDetail) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Wrong_data", __('WRONG_DATA'), res)

  if (userDetail.current_bbcoins) {
    if (productId) {
      let getProductDetail = await SQL.Users.getProductWithCategory(productId);
      if (getProductDetail.length > 0) {
        if (getProductDetail[0].left_items == 0) return Utils.ResponseHandler(false, Utils.StatusCodes.Items_Out_Of_Stock, "item out of stock", __('ITEM_OUT_OF_STOCK'), res);

        if (userDetail.current_bbcoins < getProductDetail[0].bbcoins) return Utils.ResponseHandler(false, "wrong_data", __('INSUFFICIENT_COINS'), res);

        if (userDetail.phone_verified != 1 || userDetail.email_verified != 1 || userDetail.pan_verified != 1) {
          return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __(ACCOUNT_VERIFICATION), res);
        } else {
          if (email && !Validator.isEmail(email)) {
            return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "invalid Email", __('EMAIL_INVALID'), res);
          }

          if (getProductDetail[0].reward_category_id == 1) {
            let regex = /^(\d{6})$/;
            if (pincode && !regex.test(pincode)) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('INVALID_PINCODE'), res);

            if (address && city && pincode) {
              rewardResponse = await this.rewardWithdrawal(userDetail, getProductDetail[0], req.body);
            } else {
              return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('ADDRESS_REQUIRED'), res)
            }
          } else {
            rewardResponse = await this.rewardWithdrawal(userDetail, getProductDetail[0], req.body)
          }

          if (rewardResponse) {
            let response = { productInfo: getProductDetail.length > 0 ? getProductDetail[0] : null };
            return Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('Success'), res, response)
          }
        }
      } else {
        return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Wrong_data", __("WRONG_DATA"), res)
      }
    } else {
      return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "Wrong_data", __("WRONG_DATA"), res)
    }
  } else {
    return Utils.ResponseHandler(true, Utils.StatusCodes.Error, "wrong_data", __('INSUFFICIENT_COINS'), res)
  }
}

exports.rewardWithdrawal = async (userInfo, productInfo, params) => {
    if (userInfo && productInfo) {
      let userId = userInfo.user_id;
      let orderClaim = {
        user_id: userId,
        reward_product_id: productInfo.reward_prod_id,
        claim_bbcoins: productInfo.bbcoins,
        is_approved: 1,
        status: 1
      }

      orderClaim.claim_email = params.email ? params.email : null;
      if (productInfo.reward_category_id == 1) {
        let address = params.address;
        let add_line2 = params.add_line2 ? params.add_line2 : null;
        let city = params.city;
        let state = params.state;
        let pincode = params.pincode;
        orderClaim.address = address;
        orderClaim.add_line2 = add_line2;
        orderClaim.city = city;
        orderClaim.state = state;
        orderClaim.pincode = pincode;
        orderClaim.is_approved = 1;
        orderClaim.created_at = 'NOW()';
        orderClaim.updated_at = 'NOW()';
      }

      let dbStatus = await SQL.Users.insertData2(orderClaim, "bb_reward_claim");

      console.log("dbStatus >>>>>", dbStatus);
      if (dbStatus) {
        let restCoins = productInfo.bbcoins;
        let update = {
          current_bbcoins:  (userInfo.current_bbcoins - restCoins)
        }
        let dbResult = await SQL.Users.updateTable(` where user_id = ${userId}`, update, ` bb_users `)

        await this.sendEmailForClaim(userInfo, productInfo, orderClaim.claim_email)

        let creditStats = {
          user_id: userId,
          product_id: productInfo.reward_prod_id,
          bbcoins: productInfo.bbcoins,
          transaction_type: 2,
          transaction_message: __('CODE_REDEEMED'),
          transaction_date: 'NOW()',
          modified_date: 'NOW()'
        }

        await SQL.Users.insertData2(creditStats, "bb_rewards_stats")
        let getProductItem = await SQL.Users.getProductWithCategory(productInfo.reward_prod_id);
        let forProduct = productInfo.reward_prod_id;
        let updateLeftItems = await SQL.Users.updateTable(` where reward_prod_id = ${forProduct} `, { left_items: getProductItem[0].left_items - 1  }, "bb_reward_product")
        if (updateLeftItems) return true
      } else {
        return false
      }
    }
}

exports.sendEmailForClaim = async(user, product, claimEmail = null) =>{
let firstName = user.name ? user.name : user.username;
let email;
if(claimEmail) email = claimEmail;
else email = user.email;

let coin = product.bbcoins;
let productNameEn = product.reward_name;
let productNameHi = product.reward_name_hi;

let link = 'https://www.ballebaazi.com/';
let mailerData = {
  user_email: email,
  user_name: firstName,
  product: product,
  subject: "Reward Claimed Successfully.",
  link: link,
  productName: productNameEn

}
//send Email
   await Utils.EmailService.sendMail(Utils.Constants.emails.rewardClaim, mailerData)

}

exports.claimedStats = async(req, res, next) =>{
  let userId = req.user.user_id;
  if(!userId) return Utils.ResponseHandler(fasle, Utils.StatusCodes.Error, "Wrong data", __('WRONG_DATA'), res);

  let userDetail = await SQL.Users.getUserById(userId);
  userDetail = userDetail[0];

  if(!userDetail) return Utils.ResponseHandler(false,
    Utils.StatusCodes.Error, "wrong_data", __('WRONG_DATA'), res);
    let result = await SQL.Users.getClaimedList(userId);
    let response = {history: result };

    return Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('SUCCESS'), res, response);
}

exports.claimedTransaction = async(req, res, next) =>{
  let userId = req.user.user_id;
  let page = req.query.page;
  let limit = req.query.limit;

  if(!userId) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __(WRONG_DATA), res);
  let userDetail = await SQL.Users.getUserById(userId);
  userDetail = userDetail[0];

  if(!userDetail) return Utils.ResponseHandler(false, Utils.StatusCodes.Error, "wrong_data", __('WRONG_DATA'), res);

  let result;
  if(page && limit){
    page = page ? page : 1;
    //paginate
    let perPage = limit;
    page = req.query.page ? req.query.page : 1;
    page = page == 0 || page < 0 ? 1 : page;
    let offset = ((perPage * page) - perPage);

   result = await SQL.Users.statsListWithPagination(userId, offset, limit);

  }else{
    result = await SQL.Users.statsListWithPagination(userId, offset, limit)
  }
  let response = {
    transaction : result, negative_txn_types: 2
  }

  return Utils.ResponseHandler(true, Utils.StatusCodes.Success, "Success", __('SUCCESS'), res, response);
}
