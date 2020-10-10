const SQL = require('../sql');
const moment = require('moment');

let data = [
    { "bp": "10", "tbm": "default" },
    { "bp": "50", "tbm": "50" },
    { "bp": "40", "tbm": "40" },
    { "bp": "30", "tbm": "30" },
    { "bp": "20", "tbm": "20" },
    { "bp": "15", "tbm": "15" }
]


exports.timeBaseBonus = async (match, league) => {
    console.log("inside tbm");

    return new Promise(async (resolve, rejected) => {

        if (league.bonus_applicable == 2) {

            console.log("league >>>>", league )
            let data = league.time_based_bonus;
            if(league.time_based_bonus == null || league.time_based_bonus == 0 ){
                data = []
            }else{
                data = JSON.parse(data)
            }
            // console.log(data);
            // let match = await SQL.Cricket.getMatchByKey("start_date_unix", matchKey);
            let currentTimeStamp = Math.floor(Date.now() / 1000);
            let startDate = match.start_date_unix;
            let reaminingTime = parseInt(startDate) - parseInt(currentTimeStamp);
            let minutes = reaminingTime / 60;
            // minutes = 25
            console.log(match, currentTimeStamp, reaminingTime, minutes);
            console.log(typeof minutes);
            console.log("data >>>", data)
            let bonusApplied = 0
            for (let thisTime of data) {
                if (minutes >= thisTime.tbm) {
                    bonusApplied = thisTime.bp;
                    return resolve(bonusApplied)
                }
            }
            let defaultBonus = data.find(i => i.tbm == "default");
            if(defaultBonus){
                bonusApplied = defaultBonus.bp;
                return resolve(bonusApplied)
            }

            return resolve(bonusApplied)

        }else{
            resolve(0)
        }

    })
}

