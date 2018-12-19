let global = require('../public/global.js');
let autocomplete_es = require("../db_config/autoComplete_ES.js");
let helper = require('./helper');
let sessions = require('../public/sessions');
let mapping = require('../public/mapping');
let functions = require('./functions');
let entity_bot = require("./entity_bot");
let fs = require("fs");
let word_mapping = JSON.parse(fs.readFileSync("./public/word_mapping.json"));
let bot_questions = require("./bot_questions");
let conversationGraph = require("../public/conversationGraphs");
let offline_bot = require("./offline_bot");
const given_templates = JSON.parse(fs.readFileSync("./public/templates.json"));

/*
* this function is used to getting the entities and processesing the user typed message
* @param {string} sessionId
* @param {string} message
* @param {obj} event
*/
function processingMessage(sessionId, message, event_time)
{
    let user_context = sessions.getContext(sessionId);
    console.log("getting the entities for message");
    entity_bot.getEntities(message, user_context, function(entities)
    {
        console.log("Detected Entities ==============");
        console.log(JSON.stringify(entities, null, 2));

        addEntitiesToContext(sessionId, entities, message);
        user_context = sessions.getContext(sessionId);
        user_context["previous_user_messages"].push({"type":"user_typed_message", "message" :message, "entities": entities});

        if(event_time)
        {

            storeUserTypedMessageEvent(sessionId, event_time, {"text":message, "entities_identified":entities});    
        }
        let message_delay = user_context["message_delay"];
        if(user_context.hasOwnProperty("product_line_not_included"))
        {
            message_delay+=1500;
            delete user_context["product_line_not_included"];
            let no_indianwear_message = bot_questions.noIndianWearMessage();
            setTimeout(function(){
                offline_bot.sendMessage("suggestions", no_indianwear_message, sessionId);
            },message_delay);
        }
        else if(user_context.hasOwnProperty("greet"))
        {
            delete user_context["greet"];
            let greet_message = bot_questions.greetMessage();
            setTimeout(function(){
                offline_bot.sendMessage("chat", greet_message, sessionId);
            },message_delay);
            message_delay+=1500;
            let suggestion_message = bot_questions.sendSuggestionsMessage();
            setTimeout(function(){
                offline_bot.sendMessage("suggestions", suggestion_message, sessionId);
            },message_delay);
            message_delay+=1500;
        }
        else
        {
            processBotUnderStoodModule(sessionId, entities, message, event_time);
            user_context = sessions.getContext(sessionId);
            message_delay = user_context["message_delay"];
            if(user_context.hasOwnProperty("bot_understood_conflict"))
            {
                delete user_context["bot_understood_conflict"];
                return;
            }
            if(user_context.hasOwnProperty("product_line"))
            {
                message_delay = displayReasonMessages(sessionId, message_delay);
                user_context["message_delay"] = message_delay;
                offline_bot.sendProductsToUser(sessionId);
                //offline_bot.sendBenefitsToUser(sessionId);
                offline_bot.sendAppliedValues(sessionId);
                
                if(user_context.hasOwnProperty("deals"))
                {
                    user_context["occasion_status"] = true;
                    message_delay += 1500;
                }
            }
            sessions.storeContext(sessionId, user_context);
            helper.getTotalProducts(sessionId, function(total_products){
                console.log("Total : ", total_products, "Conflict status: ", user_context["conflict_status"]);
                setTimeout(function()
                {
                    if(!user_context.hasOwnProperty("product_line"))
                    {
                        askProductlineQuestion(sessionId);
                    }
                    else if(user_context["conflict_status"])
                    {
                        user_context["conflict_status"] = false;
                        let conflict_question = bot_questions.occasionConflictQuestion(user_context["product_line"], user_context["occasion_productline_map"][0]["key"]);
                        offline_bot.sendMessage("bot_question", conflict_question, sessionId);
                        /*setTimeout(function(){
                            user_context = sessions.clearContext(sessionId);
                            sessions.storeContext(sessionId, user_context)
                        },1500);*/
                    }
                    else if(total_products<=10)
                    {
                        foundLessProducts(sessionId, total_products)
                    }
                    else if(!user_context["occasion_status"]) // checking the user is already answered the occasion question or not
                    {
                        askOccasionQuestion(sessionId);
                    }
                    else if(!user_context["user_profile"]["profile_status"]) // checking the user profile question is answered or not
                    {
                        checkUserProfileStatus(sessionId);
                    }
                    else if(!user_context["user_profile"]["concern_status"]) // checking the body concern question is answered or not
                    {
                        askBodyConcernQuestion(sessionId);
                    }
                    else
                    {
                        askPreEndQuestion(sessionId);
                    }
                },message_delay);
            });
        }
    });
}

let processingUserAnswer = 
{
    occasionQuestion: function(sessionId,  answers, selected_option_details) // user answered value is belongs to occasionQuestion
    {
        let message_delay = 1500;
        let event_time = new Date().getTime();
        let user_context = sessions.getContext(sessionId);
        user_context["occasion_status"] = true;
        console.log("user selected the occasion question option");
        let user_answer = answers[0];
        
        storeUserSelectedOptionEvent(sessionId, event_time, user_answer);
        if(user_answer=="nothing")
        {
            user_context["previous_user_messages"].push(selected_option_details);
            setTimeout(function(){
                checkUserProfileStatus(sessionId);
            },message_delay);
        }
        else
        {
            processingMessage(sessionId,  user_answer);
        }
    },
    broadOccasionQuestion: function(sessionId,  answers, selected_option_details) // user answered value is belongs to broadOccasionQuestion
    {
        let message_delay = 1500;
        let event_time = new Date().getTime();
        console.log("user selected the occasion question option");
        let user_context = sessions.getContext(sessionId);
        let user_answer = answers[0];
        storeUserSelectedOptionEvent(sessionId, event_time, user_answer);
        if(user_answer=="nothing")
        {
            user_context["occasion_status"] = true;
            user_context["previous_user_messages"].push(selected_option_details);
            setTimeout(function(){
                checkUserProfileStatus(sessionId);
            }, message_delay);
        }
        else
        {
            processingMessage(sessionId,  user_answer);
        }
    },
    bodyProfileQuestion: function(sessionId,  user_profile) // user answered value is belongs to bodyprofileQuestion
    {
        let message_delay = 1500;
        let user_context = sessions.getContext(sessionId);
        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
        if(Object.keys(user_profile).length>0)
        {
            // getting the all reason values of selected body profile values
            let tags = helper.getBodyProfileReasons(user_context["product_line"], user_profile);
            for(let vl in tags)
            {
                // getting the all profile benefits
                if(user_context["benefits"].indexOf(tags[vl]["value"])==-1 && user_context["priority_values"]["benefits"].indexOf(tags[vl]["value"])==-1)
                {
                    user_context["benefits"].push(tags[vl]["value"]);
                }
            }

            helper.makeTagReasons(product_line, tags, [], function(with_conflict_reasons, without_conflict_reasons)
            {
                if(without_conflict_reasons.length>0)
                {
                    let profile_reason_message = bot_questions.bodyProfileReasons(without_conflict_reasons);
                    setTimeout(function(){
                        offline_bot.sendMessage("bot_question", profile_reason_message, sessionId);
                    }, message_delay);
                    message_delay += 1500; 
                }
                if(user_context["user_profile"]["concern_status"])
                {
                    setTimeout(function(){
                        processingUserAnswer["bodyConcernQuestion"](sessionId, user_context["user_profile"]["body_concerns"]);
                    },message_delay);
                }
                else
                {
                    offline_bot.sendProductsToUser(sessionId);
                    //offline_bot.sendBenefitsToUser(sessionId);
                    offline_bot.sendAppliedValues(sessionId);
                    
                    setTimeout(function(){
                        askBodyConcernQuestion(sessionId);
                    },message_delay);
                }
            });
        }
        else
        {
            setTimeout(function(){
                askBodyConcernQuestion(sessionId);
            },message_delay);
        }
    },
    bodyConcernQuestion: function(sessionId,  body_concerns) // user answered value is belongs to bodyconcernQuestion
    {
        let message_delay = 1500;
        let user_context = sessions.getContext(sessionId);
        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
        console.log(body_concerns);
        if(body_concerns.length>0)
        {
            // getting the reasons only for body concerns
            let tags = helper.getBodyConcernReasons(user_context["product_line"], body_concerns);
            for(let vl in tags)
            {
                if(user_context["benefits"].indexOf(tags[vl]["value"])==-1 && user_context["priority_values"]["benefits"].indexOf(tags[vl]["value"])==-1)
                {
                    user_context["benefits"].push(tags[vl]["value"]);
                }
            }
            
            offline_bot.sendProductsToUser(sessionId);
            //offline_bot.sendBenefitsToUser(sessionId);
            offline_bot.sendAppliedValues(sessionId);

            helper.makeTagReasons(product_line, tags, [], function(with_conflict_reasons, without_conflict_reasons)
            {
                if(without_conflict_reasons.length>0)
                {
                    let profile_reason_message = bot_questions.bodyConcernReasons(without_conflict_reasons);
                    setTimeout(function(){
                        offline_bot.sendMessage("bot_question", profile_reason_message, sessionId);
                    },message_delay);
                    message_delay +=1500;
                }
                setTimeout(function(){
                    askPreEndQuestion(sessionId);
                },message_delay);
            });
        }
        else
        {
            setTimeout(function(){
                askPreEndQuestion(sessionId);
            },message_delay);
        }
    },
    preEndQuestion: function(sessionId,  user_answer, selected_option_details)
    {
        let message_delay = 1500;
        let user_context = sessions.getContext(sessionId);
        let event_time = new Date().getTime();
        let user_selected_answer = "";
        if(selected_option_details)
            user_context["previous_user_messages"].push(selected_option_details);
        if(user_answer[0]=="refine_the_list") // checking the user selected value is refine list or not
        {
            user_context["question_queue"] = ["customize"];
            sessions.storeContext(sessionId,  user_context);
            setTimeout(function(){
                askRefineListQuestion(sessionId);
            },message_delay);
            user_selected_answer = "Further refine the list";
        }
        else if(user_answer[0]=="give_feed_back") // checking the user selected value is feedback or not
        {
            user_selected_answer = "Give feedback";
            let feedback_question = bot_questions.feedbackQuestion();
            setTimeout(function(){
                offline_bot.sendMessage("bot_question", feedback_question, sessionId);
            },message_delay);
        }
        storeUserSelectedOptionEvent(sessionId, event_time, user_selected_answer);
    },
    refineListQuestion: function(sessionId,  answer_keys, selected_option_details)
    {
        let message_delay = 1500;
        let event_time = new Date().getTime();    
        let user_context = sessions.getContext(sessionId);
        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
        let last_question_asked = user_context.unanswered_question;
        let new_questions_to_add_to_queue = [];
        let user_selected_messages = [];
        let adjective_questions_count_status = true;

        selected_option_details["last_question_asked"] = last_question_asked;
        selected_option_details["included_values_in_context"] = [];
        for(let i=0;i<answer_keys.length;i++) 
        {
            let answer_key = answer_keys[i];
            let new_questions_key = last_question_asked + "_" + answer_key;
            let selected_answer = conversationGraph.questions[product_line][last_question_asked]["options"][answer_key]['text'];
            user_selected_messages.push(selected_answer);
            storeUserSelectedOptionEvent(sessionId, event_time, selected_answer);
            // Adding the benefit/adjective associated with the answer to context

            let adjective_to_be_added = conversationGraph.questions[product_line][last_question_asked]['options'][answer_key]['adjective'];
            let benefit_to_be_added = conversationGraph.questions[product_line][last_question_asked]['options'][answer_key]['benefit'];
            
            if(adjective_to_be_added && adjective_to_be_added != "" && adjective_to_be_added != "na")
            {
                if(user_context["adjectives_new"].indexOf(adjective_to_be_added)==-1 && user_context["priority_values"]["adjectives"].indexOf(adjective_to_be_added)==-1)
                {
                    selected_option_details["included_values_in_context"].push({"type":"adjective", "value":adjective_to_be_added, "adjective_questions_count_status":adjective_questions_count_status});
                    if(adjective_questions_count_status)
                    {
                        adjective_questions_count_status = false;
                        user_context["adjective_questions_count"]++;
                    }
                    user_context.adjectives_new.push(adjective_to_be_added);
                }
                let adj_name = helper.getBenefitname(adjective_to_be_added, product_line, "adjectives");
                let adj_value = word_mapping[product_line]["adjectives"][adj_name];
                if(adj_value)
                {
                    if(adj_value.reason!="" && adj_value.reason!="na")
                    {
                        user_context["reason_messages"].push({"type":"adjective","display_name":adj_name,"reason":adj_value.reason});
                    }
                }
            }
            if(benefit_to_be_added && benefit_to_be_added != "" && benefit_to_be_added != "na")
            {
                if(user_context["benefits"].indexOf(benefit_to_be_added)==-1)
                {
                    selected_option_details["included_values_in_context"].push({"type":"benefit", "value":benefit_to_be_added});
                    user_context.benefits.push(benefit_to_be_added);
                }
                let ben_name = helper.getBenefitname(benefit_to_be_added, product_line, "benefits");
                let ben_value = word_mapping[product_line]["benefits"][ben_name];
                if(ben_value)
                {
                    if(ben_value.reason!="" && ben_value.reason!="na")
                    {
                        user_context["reason_messages"].push({"type":"benefit","display_name":ben_name,"reason":ben_value.reason});    
                    }
                }
            }
            // Checking if new questions to be added to queue basis the present answer
            if(conversationGraph.conversation_rules[product_line][new_questions_key]) {
                new_questions_to_add_to_queue = new_questions_to_add_to_queue.concat(conversationGraph.conversation_rules[product_line][new_questions_key]);
            }
        }
        selected_option_details["previous_question_queue"] = user_context["question_queue"].concat();
        user_context["previous_message"] = user_selected_messages.join(", ");
        Array.prototype.unshift.apply(user_context['question_queue'], new_questions_to_add_to_queue);
        selected_option_details["current_question_queue"] = user_context["question_queue"].concat();
        if(selected_option_details["from"]!="undo")
            user_context["previous_user_messages"].push(selected_option_details);

        sessions.storeContext(sessionId,  user_context);
        offline_bot.sendProductsToUser(sessionId);
        //offline_bot.sendBenefitsToUser(sessionId);
        offline_bot.sendAppliedValues(sessionId);

        helper.getTotalProducts(sessionId, function(total_products){
            message_delay = displayReasonMessages(sessionId, message_delay);
            if(total_products<=10)
            {
                user_context["is_flow_complete"] = true;
                setTimeout(function(){
                    foundLessProducts(sessionId, total_products);
                },message_delay);
            }
            else
            {
                setTimeout(function(){
                    askRefineListQuestion(sessionId);
                },message_delay);
            }
        });
    },
    userProfileStatusQuestion: function(sessionId,  answer_keys, selected_option_details)
    {
        let message_delay = 1500;
        let user_context = sessions.getContext(sessionId);
        let user_answer = answer_keys[0];
        let event_time = new Date().getTime();
        if(selected_option_details)
            user_context["previous_user_messages"].push(selected_option_details);
        if(user_answer=="its_me") //
        {
            storeUserSelectedOptionEvent(sessionId, event_time, "Its me");
            user_context["user_profile"]["profile_status"] = true;
            user_context["user_profile"]["concern_status"] = true;
            let user_profile = 
            {
                age : user_context["user_profile"]["age"],
                height : user_context["user_profile"]["height"],
                skintone : user_context["user_profile"]["skintone"],
                bodyshape : user_context["user_profile"]["bodyshape"] 
            };
            sessions.storeContext(sessionId, user_context);
            this.bodyProfileQuestion(sessionId,  user_profile);
        }
        else if(user_answer=="not_me") // 
        {
            storeUserSelectedOptionEvent(sessionId, event_time, "Not me");
            setTimeout(function(){
                askUserProfileQuestion(sessionId);
            },message_delay);
        }
        else //skip condition
        {
            storeUserSelectedOptionEvent(sessionId, event_time, "Skip profile");
            user_context["user_profile"]["profile_status"] = true;
            user_context["user_profile"]["concern_status"] = true;
            sessions.storeContext(sessionId,  user_context);
            setTimeout(function(){
                askPreEndQuestion(sessionId);
            },message_delay);
        }
    },
    feedbackQuestion: function(sessionId,  feedback)
    {
        let user_context = sessions.getContext(sessionId);
        let message_delay = 1500;
        let user_feedback_text = feedback[0];
        let event_time = new Date().getTime();
        storeUserSelectedOptionEvent(sessionId, event_time, user_feedback_text);
        if(user_feedback_text.toLowerCase()=="other")
        {
            user_context["unanswered_question"] = "take_feedback";
            let ask_feedback = bot_questions.textMessages("Kindly message me your feedback");
            ask_feedback.gif_status = false;
            setTimeout(function(){
                offline_bot.sendMessage("chat", ask_feedback, sessionId);
            },message_delay);
        }
        else
        {
            user_context["unanswered_question"] = undefined;
            sessions.storeContext(sessionId, user_context);
            let feedback_response_message = bot_questions.textMessages("Thanks for your feedback");
            feedback_response_message.gif_status = false;
            setTimeout(function(){
                offline_bot.sendMessage("chat",feedback_response_message,sessionId);
            },message_delay);
            let event_time = new Date().getTime();
            let user_details = sessions.getAppSession(sessionId);
            let feedback_query = "insert into feedback(device_id, content, timestamp)values('"+user_details["device_id"]+"','"+user_feedback_text+"','"+event_time+"');";
            helper.saveInSql("selekt", feedback_query);
        }
    },
    occasionProductlineQuestion: function(sessionId,  user_answer)
    {
        let message = user_answer[0];
        let event_time = new Date().getTime();
        storeUserSelectedOptionEvent(sessionId, event_time, message);

        processingMessage(sessionId,  message);
    },
    someIdentifiedQuestion: function(sessionId, user_answer, selected_option_details)
    {
        let event_time = new Date().getTime();
        let user_selected_message = user_answer[0];
        let user_context = sessions.getContext(sessionId);
        user_context["previous_user_messages"].push(selected_option_details);
        
        if(user_selected_message=="no")
        {
            user_context["quuestion_number"]++;
            offline_bot.sendMessage("clear_chat", {}, sessionId);
            storeUserSelectedOptionEvent(sessionId, event_time, "No");
            let suggestion_message = bot_questions.askProductLineMessage();
            offline_bot.sendMessage("suggestions", suggestion_message, sessionId);
            user_context = sessions.clearContext(sessionId);
            sessions.storeContext(sessionId, user_context);
        }
        else
        {
            storeUserSelectedOptionEvent(sessionId, event_time, "Yes");
            processingMessage(sessionId, user_selected_message);
        }
    },
    occasionConflictQuestion: function(sessionId, user_answer)
    {
        let event_time = new Date().getTime();
        let user_context = sessions.getContext(sessionId);
        let user_selected_message = user_answer[0];
        
        if(user_selected_message=="restart_chat")
        {
            offline_bot.sendMessage("clear_chat",{}, sessionId);
            user_context = sessions.clearContext(sessionId);
            sessions.storeContext(sessionId, user_context);
            
            storeUserSelectedOptionEvent(sessionId, event_time, "Restart Chat");
            let suggestion_message = bot_questions.sendSuggestionsMessage();
            offline_bot.sendMessage("suggestions", suggestion_message, sessionId);
        }
        else
        {
            delete user_context["product_line"];
            delete user_context["occasion_productline_map"];
            user_context["conflict_status"] = false;
            storeUserSelectedOptionEvent(sessionId, event_time, user_selected_message);
            processingMessage(sessionId, user_selected_message);
        }
    },
    occasionFilterConflictQuestion: function(sessionId, user_answer)
    {
        let event_time = new Date().getTime();
        let user_context = sessions.getContext(sessionId);
        let user_selected_message = user_answer[0];
        
        if(user_selected_message=="restart_chat")
        {
            offline_bot.sendMessage("clear_chat",{}, sessionId);
            user_context = sessions.clearContext(sessionId);
            sessions.storeContext(sessionId, user_context);
            
            storeUserSelectedOptionEvent(sessionId, event_time, "Restart Chat");
            let suggestion_message = bot_questions.sendSuggestionsMessage();
            offline_bot.sendMessage("suggestions", suggestion_message, sessionId);
        }
        else
        {
            user_context["filters"] = [];
            if(user_context.hasOwnProperty("broad_occasion"))
            {
                let benefit_entity_key = user_context["broad_occasion"]["benefit_entity_key"];
                let benefit_index = user_context["priority_values"]["benefits"].indexOf(benefit_entity_key);
                if(benefit_index!=-1)
                    user_context["priority_values"]["benefits"].splice(benefit_index, 1);
                delete user_context["broad_occasion"];
            }
            if(user_context.hasOwnProperty("occasion"))
            {
                let benefit_entity_key = user_context["occasion"]["benefit_entity_key"];
                let benefit_index = user_context["priority_values"]["benefits"].indexOf(benefit_entity_key);
                if(benefit_index!=-1)
                    user_context["priority_values"]["benefits"].splice(benefit_index, 1);
                delete user_context["occasion"];
            }
            if(user_context.hasOwnProperty("broad_occasion"))
            {
                let benefit_entity_key = user_context["broad_occasion"]["benefit_entity_key"];
                let benefit_index = user_context["priority_values"]["benefits"].indexOf(benefit_entity_key);
                if(benefit_index!=-1)
                    user_context["priority_values"]["benefits"].splice(benefit_index, 1);
                delete user_context["broad_occasion"];
            }

            sessions.storeContext(sessionId, user_context);
            storeUserSelectedOptionEvent(sessionId, event_time, user_selected_message);
            processingMessage(sessionId, user_selected_message);
        }
    }
};

/*
* this function is used to send the reason messages
*/
function displayReasonMessages(sessionId, message_delay)
{
    let user_context = sessions.getContext(sessionId);
    if(user_context["reason_messages"].length>0 || (!user_context["occasion_status"] && !user_context["user_profile"]["profile_status"] && !user_context["conflict_status"]))
    {
        setTimeout(function(){
            helper.getReasonMessage(sessionId, function(reason_msg){
                if(reason_msg!="")
                {
                    let reason_message_info = bot_questions.textMessages(reason_msg);
                    reason_message_info["reason_status"] = true;
                    offline_bot.sendMessage("chat", reason_message_info, sessionId);
                }
            });
        },message_delay);
        message_delay += 1500;
    }
    return message_delay;
}
function foundLessProducts(sessionId, total_products)
{
	let user_context = sessions.getContext(sessionId);
	if(total_products==0)
	{
        functions.checkForConflict(sessionId, function(filters, occasion){
            if(filters && occasion)
            {
                let conflict_message = bot_questions.occasionFilterConflictQuestion(filters, occasion, user_context["product_line"]);
                //console.log(conflict_message)
                offline_bot.sendMessage("bot_question", conflict_message, sessionId);
            }
            else
            {
                user_context["is_flow_complete"] =true;
                let no_products_message = bot_questions.noProductFoundMessage();
                no_products_message["reason_status"] = false;
                offline_bot.sendMessage("chat", no_products_message, sessionId);
            }
        });
	}
    else
    {
        user_context["is_flow_complete"] =true;
        let less_products_message = bot_questions.lessProducts(total_products);
        less_products_message["reason_status"] = true;
        offline_bot.sendMessage("chat", less_products_message, sessionId);
    }
}
/*
* this function is used to ask refine list questions
* @param {string} sessionId
*/
function askRefineListQuestion(sessionId)
{
    console.log("In askRefineListQuestion function");
    let user_context = sessions.getContext(sessionId);
    let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
    
    if(user_context['question_queue'].length == 0) // checking the conversation flow is completed or not
    {
        user_context["is_flow_complete"] = true;
        let conversation_completed_message = bot_questions.conversationCompleteMessage();
        offline_bot.sendMessage("chat",conversation_completed_message,sessionId);            
    }
    else
    {
        user_context["is_flow_complete"] = false;
        user_context["prev_questions_queue"] = user_context["question_queue"].concat();
        let next_question = user_context['question_queue'].shift();
        user_context["unanswered_question"] = next_question;
        let question = conversationGraph.questions[product_line][next_question];
        helper.processConversationQuestion(sessionId, next_question, question, function(response){
            offline_bot.sendMessage("bot_question", response, sessionId);
        });
    }
}

function processBotUnderStoodModule(sessionId, entities, message, event_time)
{
    let user_context = sessions.getContext(sessionId);
    let message_delay = user_context["message_delay"];
    if(event_time && Object.keys(entities).length>0 && user_context["question_number"]==1)
    {

        let templates = getBotUnderstoodTemplate(entities);
        let cleaned_message = entity_bot.processMessageWithEntities(message, entities);
        cleaned_message = cleaned_message.trim();
        if(templates.length>0)
        {
            let bot_understood_message = bot_questions.textMessages("I understood: "+templates[0]);
            setTimeout(function()
            {
                autocomplete_es.updateMessagePopularity(templates[0]);
                offline_bot.sendMessage("chat", bot_understood_message, sessionId);
            }, message_delay);
            message_delay += 1500;
            if(cleaned_message!="")
            {
                let cleaned_message_array = cleaned_message.split(" ");
                let require_values = entity_bot.requireValues(cleaned_message_array, message);
                let some_identified_question = bot_questions.someIdentifiedQuestion(require_values.message);
                setTimeout(function(){
                    offline_bot.sendMessage("bot_question", some_identified_question, sessionId);
                }, message_delay);
                message_delay += 1500;
                user_context["bot_understood_conflict"] = true; 
            }
        }
        else
        {
            let no_entities_message = bot_questions.noEntitiesMessage();
            user_context["is_flow_complete"] = true;
            setTimeout(function()
            {
                offline_bot.sendMessage("chat",no_entities_message,sessionId);
            },message_delay);
            user_context["bot_understood_conflict"] = true; 
        }
        storeBotUnderStoodEvent(sessionId, templates, message);
    }
    user_context["message_delay"] = message_delay;
    sessions.storeContext(sessionId, user_context);
}
/*
* this function is used to ask the productline questions
* @param {string} sessionId
*/
function askProductlineQuestion(sessionId)
{
    let message_delay = 0;
    console.log("in askProductlineQuestion function");
    let user_context = sessions.getContext(sessionId);
    // checking the user message is only containg the occasion or not
    if(user_context.hasOwnProperty("occasion_productline_map") && !user_context.hasOwnProperty("broad_category"))
    {
        let occasion = user_context["occasion_productline_map"][0]["key"];
        let values = user_context["occasion_productline_map"][0]["values"];
        // asking the particular occasion product lines for the user
        let occasion_msg = bot_questions.occasionProductlineQuestion(occasion, values);
        occasion_msg["reason_status"] = true;
        setTimeout(function(){
            offline_bot.sendMessage("bot_question",occasion_msg, sessionId);
        },message_delay);
    }
    // checking the user message is having the body profile question or not
    if(user_context.hasOwnProperty("body_profile_productline_map") && !user_context.hasOwnProperty("broad_category"))
    {
        let body_profile_values = user_context["body_profile_productline_map"];
        let common_product_lines = body_profile_values[0]["values"];
    }
    if(user_context["current_entities"] && Object.keys(user_context["current_entities"]).length==0)
    {
        let suggestion_message = bot_questions.sendSuggestionsMessage();
        offline_bot.sendMessage("suggestions", suggestion_message, sessionId);
    }
    if(user_context.hasOwnProperty("deals"))
    {
        let ask_product_line = bot_questions.askProductLineMessage();
        setTimeout(function(){
            offline_bot.sendMessage("chat", ask_product_line, sessionId);
        },message_delay);
    }
}
/*
* this function is used to check the user context is already have the user profile data or not
* @param {string} sessionId
*/
function checkUserProfileStatus(sessionId)
{
    let message_delay = 0;
    let user_context = sessions.getContext(sessionId);
    let profile_values = ["age", "height", "bodyshape", "skintone"];
    let unanswered_profile_values = profile_values.filter(function(pv){
        return !user_context["user_profile"].hasOwnProperty(pv);
    });
    let profile_info_msg = bot_questions.profileInfoMessage();
    offline_bot.sendMessage("chat", profile_info_msg, sessionId);
    message_delay+=1500;
    if(unanswered_profile_values.length==0)
    {
        let profile_status_question = bot_questions.userProfileStatusQuestion(user_context["user_profile"]);
        setTimeout(function(){
            offline_bot.sendMessage("bot_question", profile_status_question, sessionId);
        },message_delay);
    }
    else
    {
        setTimeout(function(){
            askUserProfileQuestion(sessionId);
        },message_delay);
    }
}
/*
* this function is used to ask the user profile question
* @param {string} sessionId
*/
function askUserProfileQuestion(sessionId)
{
    console.log("In askUserProfileQuestion function");
    let user_context = sessions.getContext(sessionId);
    let profile_values = ["age", "height", "bodyshape", "skintone"];
    let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
    let profile_question_object = [];

    for(let i in profile_values)
    {
        let p_value = profile_values[i];
        if(!user_context.hasOwnProperty(p_value))
        {
            let profile_info = word_mapping[product_line][p_value];
            let p_value_keys = Object.keys(profile_info);
            if(p_value_keys.length>0)
            {
                let profile_data_values = p_value_keys.map(function(a){
                    let status = false;
                    if(user_context["user_profile"].hasOwnProperty(p_value) && user_context["user_profile"][p_value]==a)
                    {
                        status = true;
                    }
                    return {
                        "value":a,
                        "status":status
                    };
                });
                if(p_value!="height")
                {
                    profile_data_values = profile_data_values.sort(function(v1, v2){
                        a = v1["value"].toLowerCase();
                        b = v2["value"].toLowerCase();
                        if (a < b) return -1;
                        if (a > b) return 1;
                        return 0;
                    });
                }
                else{
                    profile_data_values = profile_data_values.reverse();
                }
                profile_question_object.push({"key":p_value,"value":profile_data_values});
            }
        }
    }
    if(Object.keys(profile_question_object).length>0)
    {
        let profile_question_message = bot_questions.bodyProfileQuestion(profile_question_object);

        offline_bot.sendMessage("bot_question", profile_question_message, sessionId);
    }
    else
    {
        askBodyConcernQuestion(sessionId);
    }
}

/*
* this function is used to ask the body concerns question
* @param {string} sessionId
*/
function askBodyConcernQuestion(sessionId)
{
    console.log("in askBodyConcernQuestion function")
    let user_context = sessions.getContext(sessionId);
    let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
    let body_concerns_info = word_mapping[product_line]["body_concern"];
    let body_concerns_values = Object.keys(body_concerns_info);
    let body_concerns_array = [];
    if(!user_context.hasOwnProperty("body_concerns"))
    {
        body_concerns_array = body_concerns_values.map(function(a){
            let status = false;
            if(user_context["user_profile"]["body_concerns"].indexOf(a)!=-1)
            {
                status = true;
            }
            return {
                "value":a,
                "status":status
            };
        });
    }
    if(body_concerns_array.length>0 && !user_context["user_profile"]["concern_status"])
    {
        let body_concerns_message = bot_questions.bodyConcernQuestion(body_concerns_array);
        offline_bot.sendMessage("bot_question",body_concerns_message, sessionId);
    }
    else
    {
        askPreEndQuestion(sessionId);
    }
}
/*
* this function is used to ask the pre end question
* @param {string} sessionId
*/
function askPreEndQuestion(sessionId)
{
    let message_delay = 0;
    let user_context = sessions.getContext(sessionId);
    user_context["is_flow_complete"] = true;
    user_context["question_queue"] = user_context["prev_questions_queue"].concat();

    if(user_context["question_queue"].length==0)
    {
        let product_list_reason_message = bot_questions.productListReasonMessage(user_context["user_profile"]);
        product_list_reason_message["reason_status"] = true;
        offline_bot.sendMessage("chat", product_list_reason_message, sessionId);
        message_delay+=1500;
        let pre_end_question = bot_questions.preEndQuestion();
        setTimeout(function(){
            offline_bot.sendMessage("bot_question", pre_end_question, sessionId);
        },message_delay);
    }
    else
    {
        askRefineListQuestion(sessionId);
    }
}
/*
* this function is used to ask the occasion type questions
* @param {string} sessionId
*/
function askOccasionQuestion(sessionId)
{
    let message_delay = 0;
    console.log("in askOccasionQuestion function");
    let user_context = sessions.getContext(sessionId);
    let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
    // checking the broad occasion is exists in the context or not
    if(user_context.hasOwnProperty("broad_occasion"))
    {
        let broad_occasion_value = user_context["broad_occasion"]["key"];
        let sub_occasions = word_mapping[product_line]["broad_occasions"][broad_occasion_value]["occasion_map"];
        let occasion_question = bot_questions.occasionQuestion(broad_occasion_value, sub_occasions);
        setTimeout(function(){
            offline_bot.sendMessage("bot_question", occasion_question, sessionId);
        }, message_delay);
    }
    else
    {
        let occasion_info_question = bot_questions.occasionInfoMessage();
        occasion_info_question["reason_status"] = false;
        setTimeout(function(){
            offline_bot.sendMessage("chat", occasion_info_question, sessionId);
        }, message_delay);
        message_delay +=1500;
        let broad_occasions = word_mapping[product_line]["broad_occasions"];
        let broad_occasion_keys = Object.keys(broad_occasions);
        let broad_occasion_question = bot_questions.broadOccasionQuestion(user_context["product_line"], broad_occasion_keys);
        setTimeout(function(){
            offline_bot.sendMessage("bot_question", broad_occasion_question, sessionId);
        },message_delay);
    }
}
/*
* this function is used to add the current entities into the context
* @param {string} sessionId
* @param {obj} entities
*/
function addEntitiesToContext(sessionId,  entities, message)
{
    console.log("In add entities to context function");
    let user_context = sessions.getContext(sessionId);
    user_context["current_entities"] = entities;
    let message_delay = 1500;
    if(Object.keys(entities).length==0)
    {
        let no_entities_message = bot_questions.noEntitiesMessage();
        setTimeout(function(){
            offline_bot.sendMessage("chat",no_entities_message,sessionId);
        },message_delay);
        message_delay +=1500;
        user_context["message_delay"] = message_delay;
        return;
    }
    if(entities.hasOwnProperty("product_line_not_included"))
    {
        user_context["product_line_not_included"] = true;
        return;
    }
    if(entities.hasOwnProperty("product_line"))
    {
        console.log("Found productline in message");
        if(entities['product_line'] != user_context.product_line)
        {
            if(user_context.hasOwnProperty("product_line"))
            {
                console.log("product line already existed")
                offline_bot.sendMessage("clear_chat", {}, sessionId);
                user_context = sessions.clearContext(sessionId);
                user_context["question_number"]++;
                user_context["previous_user_messages"] = [];
                sessions.storeContext(sessionId, user_context);
            }
        }
        user_context["product_line"] = entities['product_line'];
    }
    let product_line = null;
    try{
        product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
    }catch(e){}
    // checking the user message is having broad_occasion or not
    if(entities.hasOwnProperty("broad_occasion"))
    {
        if(user_context.hasOwnProperty("broad_occasion") && user_context["broad_occasion"])
        {
            if(user_context["broad_occasion"]["key"]!=entities["broad_occasion"]["key"])
            {
                offline_bot.sendMessage("clear_chat", {}, sessionId);
                let context_product_line = user_context["product_line"];
                user_context = sessions.clearContext(sessionId);
                user_context["question_number"]++;
                user_context["product_line"] = context_product_line;
                sessions.storeContext(sessionId, user_context);
            }
        }
        user_context["broad_occasion"] = entities['broad_occasion'];
        user_context["conflict_status"] = false;
        let broad_occasion_benefit = entities["broad_occasion"]["benefit_entity_key"];
        if(user_context["priority_values"]["benefits"].indexOf(broad_occasion_benefit)==-1)
        {
            user_context["priority_values"]["benefits"].push(broad_occasion_benefit);   
        }
        user_context["previous_message"] = entities["broad_occasion"]["key"];
        if(product_line)
        {
            let display_name = helper.getBenefitname(broad_occasion_benefit, product_line, "benefits");
            let reason = word_mapping[product_line]["benefits"][display_name]["reason"];
            if(reason && reason!="na" && reason!="")
            {
                // saving the reason into the context
                user_context["reason_messages"].push({"type":"benefit","display_name":display_name,"reason":reason});
            }
        }
    }
    // checking the user message is having occasion or not
    if(entities.hasOwnProperty("occasion"))
    {
        if(user_context.hasOwnProperty("occasion") && user_context["occasion"])
        {
            if(user_context["occasion"]["key"]!=entities["occasion"]["key"])
            {
                offline_bot.sendMessage("clear_chat", {}, sessionId);
                let context_product_line = user_context["product_line"];
                user_context = sessions.clearContext(sessionId);
                user_context["question_number"]++;
                user_context["product_line"] = context_product_line;
                sessions.storeContext(sessionId, user_context);
            }
        }
        user_context["occasion"] = entities["occasion"];
        user_context["occasion_status"] = true;
        user_context["conflict_status"] = false;
        let occasion_benefit = entities["occasion"]["benefit_entity_key"];
        if(user_context["priority_values"]["benefits"].indexOf(occasion_benefit)==-1)
        {
            user_context["priority_values"]["benefits"].push(occasion_benefit);   
        }
        user_context["previous_message"] = entities["occasion"]["key"];
        if(product_line)
        {
            let display_name = helper.getBenefitname(occasion_benefit, product_line, "benefits");
            let reason = word_mapping[product_line]["benefits"][display_name]["reason"];
            if(reason && reason!="na" && reason!="")
            {
                // saving the reason into the context
                user_context["reason_messages"].push({"type":"benefit","display_name":display_name,"reason":reason});
            }
        }
    }
    if(entities.hasOwnProperty("occasion_productline_map"))
    {
        user_context["occasion_productline_map"] = entities["occasion_productline_map"];
        if(!user_context.hasOwnProperty("occasion") && !user_context.hasOwnProperty("broad_occasion"))
        {
            user_context["conflict_status"] = true;
        }
        else
        {
            let index_value = user_context["priority_values"]["benefits"].indexOf("no_occasion_detected");
            if(index_value!=-1)
            {
                user_context["priority_values"]["benefits"].splice(index_value, 1);
            }
            user_context["conflict_status"] = false;
        }
    }
    let remove_filter_status = false;
    if(entities.hasOwnProperty("type")) // checking the current user message type
    {
        if(entities["type"]=="remove")
        {
            remove_filter_status = true;
            console.log("found Remove type in message");
        }
        else
        {
            //
        }
    }
    if(entities.hasOwnProperty("attribute_values"))
    {
        let entities_attribute_values = entities["attribute_values"];
        let filter_values = [];
        for(let i in entities_attribute_values)
        {
            filter_values.push(entities_attribute_values[i].key);

            if(!user_context["adjective_attributes"].hasOwnProperty(entities_attribute_values[i].db_key))
                user_context["adjective_attributes"][entities_attribute_values[i].db_key] = true;
            let obj = {};
            obj["product_filter."+entities_attribute_values[i].db_key] = entities_attribute_values[i].key;
            user_context["filters"].push(obj);
        }
        if(user_context["question_number"]!=1)
        {
            let filter_message = bot_questions.inBetweenChatMessage(filter_values.join(" ")+" "+user_context["product_line"]);
            setTimeout(function(){
                offline_bot.sendMessage("chat", filter_message, sessionId);
            },message_delay);
            message_delay += 1500;
        }
        //console.log(user_context["filters"]);
    }
    if(entities.hasOwnProperty("range")) // checking the range is in user message or not
    {
        let range = entities.range.type;
        let number = entities.range.numbers;
        let range_query = {"range":{"product_filter.discount_price":{}}};
        
        if(number)
        {
            if(range=="above")
            {
                if(remove_filter_status)
                {
                    context.remove_tags.push({"key":"range","value":{"product_filter.discount_price":{"gte":number[0]}}});
                }
                else {
                    range_query.range["product_filter.discount_price"]["gte"] = number[0];
                }
            }
            else if(range=="under")
            {
                if(remove_filter_status)
                {
                    context.remove_tags.push({"key":"range","value":{"product_filter.discount_price":{"lte":number[0]}}});
                }
                else {
                    range_query.range["product_filter.discount_price"]["lte"] = number[0];
                }
            }
            else if(range=="between")
            {
                if(number[0]>number[1])
                {
                    let temp = number[0];
                    number[0] = number[1];
                    number[1] = temp;
                }
                if(remove_filter_status)
                {
                    context.remove_tags.push({"key":"range","value":{"product_filter.discount_price":{"gte":number[0],"lte":number[1]}}});
                }
                else {
                    range_query.range["product_filter.discount_price"]["gte"] = number[0];
                    range_query.range["product_filter.discount_price"]["lte"] = number[1];
                }
            }
            // console.log("Range ", range_query);
            if(Object.keys(range_query.range["product_filter.discount_price"]).length>0)
                user_context["filters"].push(range_query);
        }
    }
    if(entities.hasOwnProperty("adjectives"))
    {
        let adjectives = entities["adjectives"];
        let adjective_values = [];
        for(let i in adjectives)
        {
            adjective_values.push(adjectives[i]["key"]);
            let adjective = adjectives[i]["entity_key"];
            if(user_context["priority_values"]["adjectives"].indexOf(adjective)==-1)
            {
                user_context["adjective_questions_count"]++;
                user_context["priority_values"]["adjectives"].push(adjective);
            }
            let reason = adjectives[i]["reason"];
            if(reason && reason!="na" && reason!="")
            {
                // saving the reason into the context
                user_context["reason_messages"].push({"type":"adjective","display_name":adjectives[i]["key"],"reason":reason});
            }
            let adj_attribute = adjectives[i]["attribute_key"];
            if(!user_context["adjective_attributes"].hasOwnProperty(adj_attribute))
                user_context["adjective_attributes"][adj_attribute] = true;
        }
        if(user_context["question_number"]!=1)
        {
            let filter_message = bot_questions.inBetweenChatMessage(adjective_values.join(" ")+" "+user_context["product_line"]);
            setTimeout(function(){
                offline_bot.sendMessage("chat", filter_message, sessionId);
            },message_delay);
            message_delay += 1500;
        }
    }
    if(entities.hasOwnProperty("entity_benefits"))
    {
        let entity_benefits = entities["entity_benefits"];
        for(let i in entity_benefits)
        {
            let benefit = entity_benefits[i]["entity_key"];
            if(user_context["priority_values"]["benefits"].indexOf(benefit)==-1)
            {
                user_context["priority_values"]["benefits"].push(benefit);
            }
            let reason = entity_benefits[i]["reason"];
            if(reason && reason!="na" && reason!="")
            {
                // saving the reason into the context
                user_context["reason_messages"].push({"type":"benefit","display_name":entity_benefits[i]["key"],"reason":reason});
            }
        }
    }
    if(entities.hasOwnProperty("age"))
    {
        user_context["age"] = entities["age"];
        let age_benefit = entities["age"]["entity_key"];
        if(user_context["priority_values"]["benefits"].indexOf(age_benefit)==-1)
            user_context["priority_values"]["benefits"].push(age_benefit);
        if(product_line && age_benefit!="" && age_benefit!="na")
        {
            let display_name = helper.getBenefitname(age_benefit, product_line, "benefits");
            let reason = word_mapping[product_line]["benefits"][display_name]["reason"];
            if(reason && reason!="na" && reason!="")
            {
                // saving the reason into the context
                user_context["reason_messages"].push({"type":"benefit","display_name":display_name,"reason":reason});
            }
        }
    }
    if(entities.hasOwnProperty("height"))
    {
        user_context["height"] = entities["height"];
        let height_benefit = entities["height"]["entity_key"];
        if(user_context["priority_values"]["benefits"].indexOf(height_benefit)==-1)
            user_context["priority_values"]["benefits"].push(height_benefit);
        if(product_line && height_benefit!="" && height_benefit!="na")
        {
            let display_name = helper.getBenefitname(height_benefit, product_line, "benefits");
            let reason = word_mapping[product_line]["benefits"][display_name]["reason"];
            if(reason && reason!="na" && reason!="")
            {
                // saving the reason into the context
                user_context["reason_messages"].push({"type":"benefit","display_name":display_name,"reason":reason});
            }
        }
    }
    if(entities.hasOwnProperty("skintone"))
    {
        user_context["skintone"] = entities["skintone"];
        let skintone_benefit = entities["skintone"]["entity_key"];
        if(user_context["priority_values"]["benefits"].indexOf(skintone_benefit)==-1)
            user_context["priority_values"]["benefits"].push(skintone_benefit);
        if(product_line && skintone_benefit!="" && skintone_benefit!="na")
        {
            let display_name = helper.getBenefitname(skintone_benefit, product_line, "benefits");
            let reason = word_mapping[product_line]["benefits"][display_name]["reason"];
            if(reason && reason!="na" && reason!="")
            {
                // saving the reason into the context
                user_context["reason_messages"].push({"type":"benefit","display_name":display_name,"reason":reason});
            }
        }
    }
    if(entities.hasOwnProperty("bodyshape"))
    {
        user_context["bodyshape"] = entities["bodyshape"];
        let bodyshape_benefit = entities["bodyshape"]["entity_key"];
        if(user_context["priority_values"]["benefits"].indexOf(bodyshape_benefit)==-1)
            user_context["priority_values"]["benefits"].push(bodyshape_benefit);
        if(product_line && bodyshape_benefit!="" && bodyshape_benefit!="na")
        {
            let display_name = helper.getBenefitname(bodyshape_benefit, product_line, "benefits");
            let reason = word_mapping[product_line]["benefits"][display_name]["reason"];
            if(reason && reason!="na" && reason!="")
            {
                // saving the reason into the context
                user_context["reason_messages"].push({"type":"benefit","display_name":display_name,"reason":reason});
            }
        }
    }
    if(entities.hasOwnProperty("body_concerns"))
    {
        let body_concerns = entities["body_concerns"];
        user_context["body_concerns"] = body_concerns.map(function(cn){return cn["key"];});
        for(let i in body_concerns)
        {
            let concern_benefit = body_concerns[i]["benefit_key"];
            if(user_context["priority_values"]["benefits"].indexOf(concern_benefit)==-1)
                user_context["priority_values"]["benefits"].push(concern_benefit);
            if(product_line && concern_benefit!="" && concern_benefit!="na")
            {
                let display_name = helper.getBenefitname(concern_benefit, product_line, "benefits");
                let reason = word_mapping[product_line]["benefits"][display_name]["reason"];
                if(reason && reason!="na" && reason!="")
                {
                    // saving the reason into the context
                    user_context["reason_messages"].push({"type":"benefit","display_name":display_name,"reason":reason});
                }
            }
        }
    }
    if(entities.hasOwnProperty("greet") && Object.keys(entities).length==1)
    {
        user_context.greet = true;
    }
    if(entities.hasOwnProperty("deals"))
    {
        user_context["deals"] = true;
    }
    user_context["message_delay"] = message_delay;
    sessions.storeContext(sessionId,  user_context);
}
/*
* this function used to get bot understood templete based on templates
*/
function getBotUnderstoodTemplate(entities)
{   
    let msg_entities = JSON.parse(JSON.stringify(entities));
    delete msg_entities["greet"];
    if(msg_entities.hasOwnProperty("occasion_productline_map"))
    {
        delete msg_entities["broad_occasion"];
        delete msg_entities["occasion"];
        for(let i in msg_entities["occasion_productline_map"])
        {
            let obj = msg_entities["occasion_productline_map"][i];
            let type = obj["type"]=="broad_occasions"?"broad_occasion":"occasion";
            msg_entities[type] = obj["key"];
        }
        delete msg_entities["occasion_productline_map"];
    }
    if(msg_entities.hasOwnProperty("range"))
    {
        try{
            msg_entities["numbers"] = msg_entities["range"]["numbers"].sort(function(a,b){return a-b;});
        }catch(e){}
        msg_entities["range"] = msg_entities["range"]["type"];
    }
    if(msg_entities.hasOwnProperty("attribute_values"))
    {
        msg_entities["attribute_values"] = msg_entities["attribute_values"].map(function(a){return a["key"];});
        msg_entities["attribute_values"] = msg_entities["attribute_values"].join(" ");
    }
    if(msg_entities.hasOwnProperty("body_profile_productline_map"))
    {
        delete msg_entities["height"];
        delete msg_entities["age"];
        delete msg_entities["skintone"];
        delete msg_entities["bodyshape"];
        for(let i in msg_entities["body_profile_productline_map"])
        {
            let obj = msg_entities["body_profile_productline_map"][i];
            msg_entities[obj["type"]] = obj["key"];
        }
        delete msg_entities["body_profile_productline_map"];
    }
    if(msg_entities.hasOwnProperty("body_concerns"))
    {
        msg_entities["body_concerns"] = msg_entities["body_concerns"].map(function(a){return a["key"];});
    }
    if(msg_entities.hasOwnProperty("adjectives"))
    {
        msg_entities["adjectives"] = msg_entities["adjectives"].map(function(a){return a["key"];});
    }
    let templates = given_templates.concat();
    let entity_keys = Object.keys(msg_entities);

    templates = templates.filter(function(a){
        let splited_value = a.split("<<");
        return splited_value.length==entity_keys.length+1;
    });
    for(let i in entity_keys)
    {
        let key = entity_keys[i];
        let obj_key = "<<"+key+">>";
        templates = templates.map(function(a){
            if(a.indexOf(obj_key)!=-1)
            {
                a = a.replace(obj_key, msg_entities[key]);
            }
            return a;
        });
    }
    templates =  templates.filter(function(a){
        return a.indexOf(">>")==-1;
    });
    return templates;
}

function storeBotUnderStoodEvent(sessionId, templates, user_message)
{
    let user_context = sessions.getContext(sessionId);

    let event_time = new Date().getTime();
    let event = {
        type : "bot_understood_message",
        time : event_time,
        chat_id : user_context["chat_id"],
        bot_understood_message : templates,
        user_message : user_message
    };
    setTimeout(function(){
        helper.logger_api_call(sessionId, event);
    },1);
}
/*
* this function helps to store the user typed message event
*/
function storeUserTypedMessageEvent(sessionId, event_time, event_object)
{
    let user_context = sessions.getContext(sessionId);
    console.log("User typed message event");
    let event = {
        type : "user_typed_message",
        time : event_time,
        chat_id : user_context["chat_id"],
        end_of_chat : user_context["is_flow_complete"],
        product_line : user_context["product_line"],
        details : event_object
    };
    setTimeout(function(){
        helper.logger_api_call(sessionId, event);
    },1);
}
/*
* this function helps to store the user selected message event
*/
function storeUserSelectedOptionEvent(sessionId, event_time, answer)
{
    let user_context = sessions.getContext(sessionId);
    console.log("User selected message event");
    let event = {
        type : "user_selected_message",
        time : event_time,
        chat_id : user_context["chat_id"],
        end_of_chat : user_context["is_flow_complete"],
        product_line : user_context["product_line"],
        details : answer
    };
    setTimeout(function(){
        helper.logger_api_call(sessionId, event);
    },1);
}

module.exports = 
{
    processingMessage: processingMessage,
    processingUserAnswer: processingUserAnswer,
    getBotUnderstoodTemplate: getBotUnderstoodTemplate,
    storeUserSelectedOptionEvent: storeUserSelectedOptionEvent,
    checkUserProfileStatus : checkUserProfileStatus,
    askUserProfileQuestion : askUserProfileQuestion,
    askBodyConcernQuestion : askBodyConcernQuestion,
    askPreEndQuestion : askPreEndQuestion
}