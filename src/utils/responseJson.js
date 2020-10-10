const responseJson = (Api_stats, responseObj = null, responseConfigObj, res) => {
  return res.status(Api_stats.status).json({...Api_stats, server_timestamp: new Date().getTime(), responseObj, ...responseConfigObj})
}

module.exports = responseJson