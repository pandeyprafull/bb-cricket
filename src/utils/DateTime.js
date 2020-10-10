

const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
console.log("old date>>>", date);
let moment = require('moment');
let utcDate= moment().subtract(330, 'minutes').format('YYYY-MM-DD HH:mm:ss a');
console.log("utc", utcDate)

let gmtDate1 = moment().format('YYYY-MM-DD hh:mm:ss ');
console.log("currentDateTime Gmt1", gmtDate1);


let gmtDate2 = moment().add(330, 'minutes').format('YYYY-MM-DD hh:mm:ss ');
console.log("currentDateTime Gmt2", gmtDate2);

module.exports = {  utcDate, gmtDate1, gmtDate2 }


