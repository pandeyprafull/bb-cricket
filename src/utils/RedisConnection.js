const redis = require("redis");
const Config = require('../config');
const bluebird = require('bluebird');
const util = require("util");

// bluebird.promisifyAll(redis.RedisClient.prototype);
client = redis.createClient(6379, Config.REDIS_HOST, { enable_offline_queue: false });
const getAsync = util.promisify(client.get).bind(client);
const setAsync = util.promisify(client.set).bind(client);
// if (process.env.NODE_ENV == 'production') {
//     client = redis.createClient(6379, Config.REDIS_HOST);
// }
// let connList = []
// for (let index = 0; index < process.env.REDIS_CONNECTION_LIMIT; index++) {
//     connList.push(redis.createClient(6379, Config.REDIS_HOST))
// }
// let counter = 0;
// function getRedisConn() {
//     counter++;
//     if (connList.length == counter) counter = 0;
//     return connList[counter]
// }
// module.exports = getRedisConn();
module.exports.getAsync = getAsync;
module.exports.set = setAsync;