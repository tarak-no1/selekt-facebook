'use strict';

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference
const request = require('request');
const Config = require('./const.js');

const getFirstMessagingEntry = (body) => {
  // console.log(JSON.stringify(body, null, 2));
  const val = body.object === 'page' &&
    body.entry &&
    Array.isArray(body.entry) &&
    body.entry.length > 0 &&
    body.entry[0] &&
    body.entry[0].messaging &&
    Array.isArray(body.entry[0].messaging) &&
    body.entry[0].messaging.length > 0 &&
    body.entry[0].messaging[0];
    console.log("val "+val);
  /*const stand_val = body.object === 'page' &&
    body.entry &&
    Array.isArray(body.entry) &&
    body.entry.length > 0 &&
    body.entry[0] &&
    body.entry[0].standby &&
    Array.isArray(body.entry[0].standby) &&
    body.entry[0].standby.length > 0 &&
    body.entry[0].standby[0];*/

  return val || null;
}; 
const sendRequest = (sender,messageData) =>{
   request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: Config.FB_PAGE_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: messageData
    }
  }, function (error, response) {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
 }
const sendBubble = (sender) => {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: Config.FB_PAGE_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: sender},
      "sender_action": "typing_on"
    }
  }, function (error, response) {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
}
function getName(sender,callback){
    request({
        url: "https://graph.facebook.com/v2.6/" + sender,
        qs: {
            access_token : Config.FB_PAGE_TOKEN,
            fields: "first_name"
        },
        method: "GET",

    }, function(error, response, body) {
        if(error){
            console.log("error getting username")
        } else{
            var bodyObj = JSON.parse(body)
            let name = bodyObj.first_name
            console.log("first_name",name)
            callback(name)
        }
    })

}
module.exports = {
  getFirstMessagingEntry : getFirstMessagingEntry,
  sendRequest : sendRequest,
  sendBubble : sendBubble,
  getName : getName,
};