

const db = require('../utils/CricketDbConfig');



module.exports  = {
     currentDate : async () => {
        let Date = await db.query('select NOW() as date ');
        console.log("date is >>>>>", Date[0].date);
        Date = Date[0].date
        return Date
    }
}