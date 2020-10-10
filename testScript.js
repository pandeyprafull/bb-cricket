let rp = require("request-promise");


var options = {
time: true,
uri: 'http://15.207.45.0/cricket/leagues/-10623/1',
resolveWithFullResponse: true,
headers: {
user_id: 2153567,
Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMTUzNTY3LCJwaG9uZSI6Ijk2MjcwMjkyMjQiLCJpYXQiOjE1OTgyNjA4NjAsImV4cCI6MTYwMjU4MDg2MH0.cSNRmNn4nGVoRZrtEHRSudjB6WtJfLroigkBhIgdneA"
},
json: true // Automatically parses the JSON string in the response
};

for (let index = 0; index < 100; index++) {
rp(options)
.then(function(repos) {
console.log('User has repos', repos.elapsedTime);
})
.catch(function(err) {
// API call failed...
console.log("error=>", err);
});
}