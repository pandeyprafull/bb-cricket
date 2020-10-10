let Models = require('../models');
let moment = require('moment');
let currentDateUtc = moment().subtract(330, 'minutes').format('YYYY-MM-DD HH:mm:ss');
let Bluebird = require('bluebird')
module.exports = {
    insertData: async (data, table) => {
    if (!data || !table) {
        return false;
    }
    let columns = Object.keys(data);
    let values = Object.values(data);
    let sql = `insert into ${table} (`;
    values = '';
    return await Bluebird.each(columns, (key, index, length) => {
        if (data.hasOwnProperty(key)) {
            const element = data[key];
            sql = sql + key + ","
            if (typeof element === 'string' || element instanceof String) {
                values = values + "'" + element + "'" + ","
            } else {
                values = values + element + ","
            }
        }
    }).then(async (result) => {
        sql = sql.slice(0, -1)
        values = values.slice(0, -1)
        sql = sql + ") VALUES"
        sql = sql + "(" + values + ")";
        // console.log('response=>>>>> r', sql);
        let response = await Models.rawQuery(sql);
        return response = response.results.length > 0 ? response.results : [];
    }).catch(e => {
        console.log('erro in inserting-->> ', e);
    })
},
}
