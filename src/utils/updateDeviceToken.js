let SQL = require('../../src/sql');

let updateDeviceToken = async(deviceData) => {

    let upadtedData = await SQL.Users.insertOrUpdate(deviceData);
     console.log("updated data>>>",upadtedData);

    return upadtedData;
}

module.exports = {
    updateDeviceToken
}




