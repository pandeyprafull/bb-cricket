const Sequelize = require(`sequelize`);

 let sequelize = new Sequelize(process.env.DB, process.env.USERT, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: 'mysql',
    directory: true, // prevents the program from writing to disk
    port:3306,
    sync: false,
    forceSync: false, // Keep this false for safer use.
    pool:{
    max: 5000,
    min: 500,
    idle: 10000
    }
});


module.exports = sequelize
