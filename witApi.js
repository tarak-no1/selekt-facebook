let request = require("request");
const BaseURL =  'https://api.wit.ai';

const WIT_TOKEN = "R2WWWL2HJXLEK4SWZQO2XXHIEOIDG7J3";
const headers = {
    'Authorization': 'Bearer ' + WIT_TOKEN,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
};
function getOptions(qs) {
    return {
        method: 'GET',
        url: BaseURL + '/message?' + qs,
        headers: headers
    }
}
function witMessageAPI(message, cb){
    let qs = 'q=' + encodeURIComponent(message);
    request(getOptions(qs), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let data = JSON.parse(body);
            cb(data["entities"]);
        }
        else{
            console.log("error occurred");
        }
    });
}

module.exports = {
    witMessageAPI:witMessageAPI
};