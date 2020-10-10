const usernameStr = Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 8);

console.log(usernameStr);

const passwordStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

console.log(passwordStr);

const leagueCodeStr = (length) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}



//=> '2cf05d94db'



module.exports = { usernameStr, passwordStr, leagueCodeStr };