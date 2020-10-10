

const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
// console.log("old date>>>", date);
let moment = require('moment');
let newDate = moment().subtract(330, 'minutes').format('YYYY-MM-DD HH:mm:ss a');
// console.log("utc", newDate)

let currentDateTime = moment().format('YYYY-MM-DD h:mm:ss a');
// console.log("currentDateTime Gmt", currentDateTime);

module.exports = newDate


