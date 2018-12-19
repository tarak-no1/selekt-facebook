'use strict';

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const createContext = function(sessionId)  {
    console.log("session created");
    sessions[sessionId] = {
        sessionId: sessionId,
        context: {
            user_profile : {profile_status:false, concern_status :false,skip_status:false,available:false, body_concerns:[]},
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
            prev_context : {},
            prev_context_available:false,
            unanswered_question_refine : undefined,
            filters_status : false
        }

    };
};
const getContext = function(sessionId){
    return sessions[sessionId].context;
};
const storeContext = function(sessionId,context){
    sessions[sessionId]["context"] = context;
};
const clearContext=function(sessionId){
    sessions[sessionId]["context"] = {
            user_profile : {profile_status:false, concern_status :false,skip_status:false,available:false, body_concerns:[]},
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
            prev_context : {},
            prev_context_available : false,
            unanswered_question_refine:undefined,
            filters_status : false    
    }
    return sessions[sessionId]["context"];
}
const getAppSession = function(sessionId)
{
    if(sessions.hasOwnProperty(sessionId))
        return sessions[sessionId];
    else
        return {};
};
const isSessionAvailable = function(senderId) { 
	 let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].sessionId === senderId) {
       console.log("Yep, got it!");
      sessionId = k;
    }
  });
  return sessionId;
}
function clearContextNotProfile(sessionId)
{
    let user_context = this.getContext(sessionId)
    let user_name = user_context["user_name"];
    let user_profile = user_context["user_profile"];
    let prev_context = user_context;
    user_context = this.clearContext(sessionId);
    user_context["user_name"] = user_name;
    user_context["user_profile"] = user_profile;
    user_context["question_number"] =1;
    user_context["user_profile"]["profile_status"]=false;
    user_context["user_profile"]["concern_status"]=false;
    // user_context["prev_context"]=prev_context;
    // user_context["prev_context_available"]=true;
    this.storeContext(sessionId,user_context);
}
module.exports = {
    getContext : getContext,
    createContext : createContext,
    isSessionAvailable : isSessionAvailable,
    storeContext : storeContext,
    clearContext : clearContext,
    getAppSession : getAppSession,
    clearContextNotProfile : clearContextNotProfile,
};