/**
 * Created by TARUN on 25-May-16.
 */
'use strict';


const sessions = {};
const app_sessions = {};

const clearContext = function(sessionId)
{
    let context = getContext(sessionId);
    let chat_id = context.chat_id;
    let user_profile = context["user_profile"];
    user_profile["profile_status"] = false;
    user_profile["concern_status"] = false;
    user_profile["age_status"] = false;
    user_profile["height_status"] = false;
    user_profile["skintone_status"] = false; 
    user_profile["bodyshape_status"] = false,
    
    sessions[sessionId].context = undefined;
    let previous_user_messages = context["previous_user_messages"];

    let obj = {
            username : context["username"],
            user_profile : user_profile,
            answers : [],
            benefits : [],
            attribute_values : [],
            priority_values:{"benefits":[], "adjectives" : []},
            question_number : 0,
            filters : [],
            added_filters : [],
            remove_filters: [],

            remove_tags:[],
            end_of_chat : false,
            from:0,
            event_state : false,
            is_flow_complete:false,
            adjectives_new : [],
            adjective_attributes : {},
            previous_user_messages : previous_user_messages,
            question_queue : [],
            prev_questions_queue : [],
            question_state : true,
            unanswered_question : undefined,
            chat_id : chat_id+1,
            reason_messages : [],
            preference_question_type :"",occasion_status :false,
            adjective_questions_count: 0,
            conflict_status : false,
            previous_message: "",
            sort_type : "match_score",
            bot_messages : []
    };
    sessions[sessionId]["context"] = obj;
    return sessions[sessionId].context;
};
const getContext = function(sessionId){
    return sessions[sessionId].context;
};
const storeContext = function(sessionId,context){
    sessions[sessionId]["context"] = context;
};

const createSession = function(sessionId,deviceId)  {
    console.log("session created");
    sessions[sessionId] = {
        sessionId: sessionId,
        deviceId : deviceId,
        context: {
            user_profile : {profile_status:false, concern_status :false, age_status :false, height_status : false, skintone_status : false, bodyshape_status : false, body_concerns:[]},
            answers : [],
            benefits : [],
            adjectives : [],
            attribute_values : [],
            priority_values:{"benefits":[], "adjectives" : []},
            question_number : 0,
            filters : [],
            added_filters : [],
            remove_filters: [],

            remove_tags:[],
            end_of_chat : false,
            from:0,
            event_state : false,
            is_flow_complete:false,
            adjectives_new : [],
            adjective_attributes: {},
            previous_user_messages : [],
            question_queue : [],
            prev_questions_queue : [],
            question_state : true,
            unanswered_question : undefined,
            chat_id: 1,
            reason_messages: [],
            preference_question_type: "",
            occasion_status :false,
            adjective_questions_count: 0,
            conflict_status : false,
            previous_message: "",
            sort_type : "match_score",
            bot_messages : []
        }

    };
};
const isSessionExists = function(checkSessionId){

    if(sessions.hasOwnProperty(checkSessionId))
        return true;
    return false
};

const createAppSessions = function(sessionId, data)
{
    app_sessions[sessionId] = data;
};
const getAppSession = function(sessionId)
{
    if(app_sessions.hasOwnProperty(sessionId))
        return app_sessions[sessionId];
    else
        return {};
};
const getDeviceId = function(sessionId)
{
    let device_id = "";
    try{
        if(sessions[sessionId].deviceId)
            device_id = sessions[sessionId].deviceId;
    }catch(e){}
    return device_id;
};
module.exports = {
    getContext : getContext,
    storeContext : storeContext,
    createSession:createSession,
    isSessionExists:isSessionExists,
    clearContext:clearContext,
    createAppSessions:createAppSessions,
    getAppSession:getAppSession,
    getDeviceId : getDeviceId
};