const SQL = require('../../sql')
const Utils = require('../../utils');
const Bluebird = require('bluebird')

module.exports = {
    getUpdateList: async(req, res) => {
        const { deviceType, versionCode } = req.query;
        if (!deviceType || !versionCode) {
            return await Utils.ResponseHandler(true, 400, __("WRONG_DATA"), __("WRONG_DATA"), res, response)
        }
        var updateList = await SQL.Users.getUpdateList(deviceType, versionCode);
        var response = {
            data: updateList
        }
        return await Utils.ResponseHandler(true, 200, __("success"), __("otp_success"), res, response)
    },
    getConfig: async (req, res) => {
        let userId = req.user.user_id;
        const configDetails = await SQL.Users.getConfig();
        let defaultUserRecords = Utils.Constants.DEFAULT_USER_RECORDS;
        let userRecords;
        if (req.user.user_id) {
            userRecords = await SQL.Users.getUserRecordTable(userId, ` total_classic, total_classic_kb, total_classic_fb, total_classic_bs, total_classic_bk, total_bowling, total_batting, total_wizard, total_reverse, total_quiz_joined   `)
        }
        console.log("userRecords are >>>", userRecords);
        userRecords = (userRecords && userRecords.length > 0) ? userRecords[0] : defaultUserRecords
        var configs = {};
        let getTotalInviteuser = await SQL.Users.getTotalInvitedByUser(userId)
        getTotalInviteuser = getTotalInviteuser[0];

        let userTutorials = await SQL.Users.getUserExtras(userId, ` user_tutorials_ids `);

        if (userTutorials) {
            userTutorials = (userTutorials == undefined || userTutorials.user_tutorials_ids == null) ? 0 : userTutorials.user_tutorials_ids;
        } else {
            userTutorials = 0
        }

        Bluebird.each(configDetails, async (item, index) => {
            configs[item.name] = item.value
        }).then(async _ => {
            let response = {
                configs: {
                    ...configs,
                    invited_contacts: getTotalInviteuser ? getTotalInviteuser.totalContact : "0"
                },
                user_records: {
                    ...userRecords,
                    user_tutorials_ids: userTutorials
                }
            }
            // response.configs.pass_status = 1;
            console.log('config data---->>> ', response);
            return await Utils.ResponseHandler(true, 200, __("success"), __("success"), res, response)
        })
    },

    getConfig2: async (options) => {

        return new Promise(async (resolve, rejected) => {

            let userId = options.user_id;
            const configDetails = await SQL.Users.getConfig();
            let defaultUserRecords = Utils.Constants.DEFAULT_USER_RECORDS;
            let userRecords;
            console.log("userId in options", options.user_id)
            if (userId) {
                console.log("userId in config", userId)
                userRecords = await SQL.Users.getUserRecordTable(userId, `total_classic, total_classic_kb, total_classic_fb, total_classic_bs, total_classic_bk, total_bowling, total_batting, total_wizard, total_reverse, total_quiz_joined `)
                // console.log("userRecords .....>>", userRecords);

            }
            // console.log("userRecords .....>>", userRecords);
            userRecords = (userRecords && userRecords.length > 0) ? userRecords[0] : defaultUserRecords
            var configs = {};

            let getTotalInviteuser = await SQL.Users.getTotalInvitedByUser(userId)
            getTotalInviteuser = getTotalInviteuser[0]

            let userTutorials = await SQL.Users.getUserExtras(userId, ` user_tutorials_ids `);

            if (userTutorials) {
                userTutorials = (userTutorials == undefined || userTutorials.user_tutorials_ids == null) ? 0 : userTutorials.user_tutorials_ids;
            } else {
                userTutorials = 0
            }

            Bluebird.each(configDetails, async (item, index) => {
                configs[item.name] = item.value
            }).then(async _ => {
                let response = {
                    configs: {
                        ...configs,
                        invited_contacts: getTotalInviteuser ? getTotalInviteuser.totalContact : "0"
                    },
                    user_records: {
                        ...userRecords,
                        user_tutorials_ids: userTutorials
                    }
                }
                return resolve(response)
            }).catch(err => rejected(err));
        })

    }
}