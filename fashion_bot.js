let global = require('./public/global.js');
let autocomplete_es = require("./db_config/autoComplete_ES.js");
let helper = require('./helper');
let sessions = require('./public/sessions');
let mapping = require('./public/mapping');
let functions = require('./functions');
let entity_bot = require("./entity_bot");
let filter_list = require("./filter-list.js");
let fs = require("fs");
let word_mapping = JSON.parse(fs.readFileSync("./public/word_mapping.json"));
let bot_questions = require("./bot_questions");
let conversationGraph = require("./public/conversationGraphs");
let offline_bot = require("./offline_bot");
const given_templates = JSON.parse(fs.readFileSync("./public/templates.json"));
const FB = require("./facebook.js");
let happy= '\U0001F604';
let previous_question_actions =
{
    about_me : function(sessionId,user_answers,selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(user_context["previous_question_needed_entities"].indexOf("ok")!=-1)
        {
            let smart_question = bot_questions.textMessages("I am not as smart as you are! But I am many times faster than you "+"😊");
            user_context["bot_messages"].push(smart_question);

            let deal_quesion = bot_questions.okButtonQuestion("So help me understand your queries by making it simple and I will get you what you want instantly. Deal?");
            user_context["bot_messages"].push(deal_quesion);
            user_context["unanswered_question"] = "instructions_to_user";
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            sessions.storeContext(sessionId,user_context);
            sendBotMessages(sessionId);
        }
        else
        {
            let no_entities_message = bot_questions.noEntitiesMessage();
            user_context["bot_messages"].push(no_entities_message);
           
            let intro_message = bot_questions.introductionMessage(user_context["username"]);
            user_context["bot_messages"].push(intro_message)

            let about_me_question = bot_questions.okButtonQuestion("Before we begin, there are a few things you need to know about me. Ok?");
            user_context["bot_messages"].push(about_me_question);

            user_context["unanswered_question"] = "about_me";
            sessions.storeContext(sessionId, user_context);
            sendBotMessages(sessionId);
        }
    },
    instructions_to_user : function(sessionId,user_answers,selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(user_context["previous_question_needed_entities"].indexOf("ok")!=-1)
        {
            let smart_question = bot_questions.textMessages("And at any point, if you want to reset/refresh your chat, just type \"clear\"");
            user_context["bot_messages"].push(smart_question);

            let deal_quesion = bot_questions.okButtonQuestion("In case you want to go back to the previous question type \"undo\". Ok?");
            user_context["bot_messages"].push(deal_quesion);
            user_context["unanswered_question"] = "ask_suggestions";
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            sessions.storeContext(sessionId,user_context);
            sendBotMessages(sessionId);
        }
        else
        {
            let no_entities_message = bot_questions.noEntitiesMessage();
            user_context["bot_messages"].push(no_entities_message);

            let smart_question = bot_questions.textMessages("I am not as smart as you are! But I am many times faster than you "+"😊");
            user_context["bot_messages"].push(smart_question);

            let deal_quesion = bot_questions.okButtonQuestion("So help me understand your queries by making it simple and I will get you what you want instantly. Deal?");
            user_context["bot_messages"].push(deal_quesion);
            user_context["unanswered_question"] = "instructions_to_user";
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            sessions.storeContext(sessionId,user_context);
            sendBotMessages(sessionId);
        }
    }, 
    ask_suggestions : function(sessionId,user_answers,selected_option_details)
    {

        let user_context = sessions.getContext(sessionId);
        if(user_context["previous_question_needed_entities"].indexOf("ok")!=-1)
        {
            let smart_question = bot_questions.textMessages("Great! We are good to go");
            user_context["bot_messages"].push(smart_question);

            let send_suggestions_message = bot_questions.sendSuggestionsMessage();
            user_context["bot_messages"].push(send_suggestions_message);

            let after_suggestions_message = bot_questions.afterSuggestionsMessage();
            user_context["bot_messages"].push(after_suggestions_message);
            user_context["unanswered_question"] = "suggestions";
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            sessions.storeContext(sessionId,user_context);
            sendBotMessages(sessionId);
        }
        else
        {
            let no_entities_message = bot_questions.noEntitiesMessage();
            user_context["bot_messages"].push(no_entities_message);

            let smart_question = bot_questions.textMessages("And at any point, if you want to reset/refresh your chat, just type \"clear\"");
            user_context["bot_messages"].push(smart_question);

            let deal_quesion = bot_questions.okButtonQuestion("In case you want to go back to the previous question type \"undo\". Ok?");
            user_context["bot_messages"].push(deal_quesion);
            user_context["unanswered_question"] = "ask_suggestions";
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            sessions.storeContext(sessionId,user_context);
            sendBotMessages(sessionId);

        } 
    },
    user_name_asked : function(sessionId, user_message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        user_context["username"] = user_message;
        let before_suggestions_message = bot_questions.beforeSuggestionsMessage(user_message);
        user_context["bot_messages"].push(before_suggestions_message);

        let send_suggestions_message = bot_questions.sendSuggestionsMessage();
        user_context["bot_messages"].push(send_suggestions_message);

        let after_suggestions_message = bot_questions.afterSuggestionsMessage();
        user_context["bot_messages"].push(after_suggestions_message);
        user_context["unanswered_question"]="suggestions";
        if(selected_option_details)
        {
            user_context["previous_user_messages"].push(selected_option_details);
        }
        sessions.storeContext(sessionId,user_context);
        sendBotMessages(sessionId);
    },
    filters_question : function(sessionId, message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        console.log(message);
        if(user_context["previous_question_needed_entities"].indexOf("no")!=-1)
        { 
            user_context["filters_status"] = true;
            user_context["continue_chat_status"] = true;
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            if(!user_context["occasion_status"])
                askOccasionQuestion(sessionId);
            else
                checkUserProfileStatus(sessionId);
        }
        else if(user_context["previous_question_needed_entities"].indexOf("continue_chat")!=-1)
        {
            user_context["continue_chat_status"] = true;
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            helper.getTotalProducts(sessionId, function(total_products)
            {
                if(total_products<=30)
                {
                    foundLessProducts(sessionId, total_products)
                }
                else
                {
                    if(!user_context["occasion_status"])
                        askOccasionQuestion(sessionId);
                    else
                        checkUserProfileStatus(sessionId);
                }
            });
        }
        else
        {
            message = "choosing_other_is_not_correct";
            processingMessage(sessionId, message, true);
        }
    },
    conversation_completed : function(sessionId,user_answers,selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(selected_option_details)
            user_context["previous_user_messages"].push(selected_option_details);
        if(user_context["previous_question_needed_entities"].indexOf("feedback")!=-1)
        {
            let feedback_question = bot_questions.feedBackQuestion();
            user_context["bot_messages"].push(feedback_question);
            user_context["unanswered_question"] = "feedbackQuestion";
            sendBotMessages(sessionId)
        }
        else
        {
            processingMessage(sessionId, user_answers);
        }
    },
    continueStatusQuestion : function(sessionId, user_answers, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(user_context["previous_question_needed_entities"].indexOf("continue_chat")!=-1)
        {
            if(selected_option_details)
            user_context["previous_user_messages"].push(selected_option_details);
            user_context["continue_chat_status"] = true;
            sessions.storeContext(sessionId, user_context);

            if(!user_context["occasion_status"])
                askOccasionQuestion(sessionId);
            else
                checkUserProfileStatus(sessionId);
        }
        else
        {
            processingMessage(sessionId,user_answers, true);
        }
    },
    preference_status_question : function(sessionId, message,selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if((user_context["previous_question_needed_entities"].indexOf("check_deals")!=-1))
        {
            user_context["continue_chat_status"] = true;
            processingMessage(sessionId, "deals", true);
        }
        else if(user_context["previous_question_needed_entities"].indexOf("add_preferences")!=-1)
        {
            user_context["continue_chat_status"] = true;
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            user_context["question_queue"] = ["customize"];
            askRefineListQuestion(sessionId)
        }
        else
        {
            processingMessage(sessionId, message, true);
        }
    },
    occasionStatusQuestion : function(sessionId, message,selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(user_context["previous_question_needed_entities"].indexOf("yes")!=-1)
        {    
            user_context["is_user_wants_occasion"] = true;
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            askOccasionQuestion(sessionId);
        }
        else if(user_context["previous_question_needed_entities"].indexOf("no")!=-1)
        {
            user_context["is_user_wants_occasion"] = true;
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            user_context["occasion_status"] = true;
            sessions.storeContext(sessionId, user_context);
            checkUserProfileStatus(sessionId);
        }
        else
        {
            message = "choosing_other_is_not_correct";
            processingMessage(sessionId, message, true);
        }
    },
    broadOccasionQuestion : function(sessionId, message)
    {
        let user_context = sessions.getContext(sessionId);
        sessions.storeContext(sessionId, user_context);
        processingMessage(sessionId,  message, true);
    },
    occasionQuestion: function(sessionId, message) // user answered value is belongs to occasionQuestion
    {
        let user_context = sessions.getContext(sessionId);
        user_context["continue_chat_status"] = true;
        if(user_context["previous_question_needed_entities"].indexOf("nothing")!=-1)
        {
            checkUserProfileStatus(sessionId);
        }
        else
        {
            sessions.storeContext(sessionId, user_context);
            processingMessage(sessionId,  message, true);
        }
    },
    ageQuestion : function(sessionId, message, selected_option_details)
    {
        let get_numbers = message.match(/[-]{0,1}[\d.]*[\d]+/g);
        let user_context = sessions.getContext(sessionId);
        delete user_context['user_profile']["age"];
        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]]
        if(get_numbers && get_numbers.length>0)
        {
            let age_value = get_numbers[0], age_profile_value;
            if(selected_option_details)
            {
                selected_option_details["answers"] = age_value;
                user_context["previous_user_messages"].push(selected_option_details);
            }
            if(age_value>=18 && age_value<=27) age_profile_value = "18-27";
            else if(age_value>=28 && age_value<=38) age_profile_value = "28-38";
            else if(age_value>=39 && age_value<=80) age_profile_value = "39+";
            if(age_profile_value)
            {
                user_context["user_profile"]["age_status"] = true;
                user_context["user_profile"]["ageInYears"] = age_value;
                user_context["user_profile"]["age"] = age_profile_value;
                let age_benefit = word_mapping[product_line]["age"][age_profile_value]["entity_key"];
                if(age_benefit && age_benefit!="")
                {
                    if(user_context["benefits"].indexOf(age_benefit)==-1)
                        user_context["benefits"].push(age_benefit);
                }
                sessions.storeContext(sessionId, user_context);
            }
            else
            {
                user_context["age_again"] = true;
                let not_understood_message = bot_questions.textMessages("I didn't get that! Enter a number between 18 and 80");
                user_context["bot_messages"].push(not_understood_message);
            }
            sessions.storeContext(sessionId, user_context);
            askUserProfileQuestion(sessionId);
        }
        else
        {
            user_context["age_again"] = true;
            let not_understood_message = bot_questions.textMessages("I didn't get that! Enter a number between 18 and 80");
            user_context["bot_messages"].push(not_understood_message);
            sessions.storeContext(sessionId, user_context);
            askUserProfileQuestion(sessionId);
        }
    },
    heightQuestion : function(sessionId, user_selected_answer, selected_option_details)
    {
        let message_delay = 0;
        let user_context = sessions.getContext(sessionId);
        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
        if(selected_option_details)
        {
            user_context["previous_user_messages"].push(selected_option_details);
        }
        if(user_context["previous_question_needed_entities"].indexOf("skip")==-1)
        {
            entity_bot.getEntities(user_selected_answer, user_context, function(entities){
                if(entities.hasOwnProperty("height"))
                {
                    user_context["user_profile"]["height_status"] = true;
                    user_context["user_profile"]["height"] = entities["height"]["key"];
                    let height_benefit = entities["height"]["entity_key"];
                    if(height_benefit && height_benefit!="")
                    {
                        if(user_context["benefits"].indexOf(height_benefit)==-1)
                            user_context["benefits"].push(height_benefit);
                    }
                    sessions.storeContext(sessionId, user_context);
                    askUserProfileQuestion(sessionId);
                }
                else
                {
                    user_selected_answer = "choosing_other_is_not_correct"
                    processingMessage(sessionId, user_selected_answer, true);
                }
            });
        }
        else
        {
            user_context["user_profile"]["height_status"] = true;
            sessions.storeContext(sessionId, user_context);
            askUserProfileQuestion(sessionId);
        }
        
    },
    skintoneQuestion : function(sessionId, user_selected_answer,selected_option_details)
    {
        let message_delay = 0
        let user_context = sessions.getContext(sessionId);

        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
        if(selected_option_details)
        {
            user_context["previous_user_messages"].push(selected_option_details);
        }
        if(user_context["previous_question_needed_entities"].indexOf("skip")==-1)
        {
            
            entity_bot.getEntities(user_selected_answer, user_context, function(entities){
                if(entities.hasOwnProperty("skintone"))
                {
                    user_context["user_profile"]["skintone_status"] = true;
                    user_context["user_profile"]["skintone"] = entities["skintone"]["key"];
                    let skintone_benefit = entities["skintone"]["entity_key"];
                    if(skintone_benefit && skintone_benefit!="")
                    {
                        if(user_context["benefits"].indexOf(skintone_benefit)==-1)
                            user_context["benefits"].push(skintone_benefit);
                    }
                    sessions.storeContext(sessionId, user_context);
                    askUserProfileQuestion(sessionId);
                }
                else
                {
                    user_selected_answer = "choosing_other_is_not_correct"
                    processingMessage(sessionId, user_selected_answer, true);
                }
            });
            
        }
        else
        {
            user_context["user_profile"]["skintone_status"] = true;
            sessions.storeContext(sessionId, user_context);
            askUserProfileQuestion(sessionId);
        }
        
    },
    bodyshapeQuestion : function(sessionId, user_selected_answer, selected_option_details)
    {
        let message_delay = 0;
        let user_context = sessions.getContext(sessionId);
        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
        if(selected_option_details)
        {
            user_context["previous_user_messages"].push(selected_option_details);
        }
        if(user_context["previous_question_needed_entities"].indexOf("skip")==-1)
        {
            entity_bot.getEntities(user_selected_answer, user_context, function(entities){
                if(entities.hasOwnProperty("bodyshape"))
                {
                    user_context["user_profile"]["bodyshape_status"] = true;
                    user_context["user_profile"]["bodyshape"] = entities["bodyshape"]["key"];
                    let bodyshape_benefit = entities["bodyshape"]["entity_key"];
                    if(bodyshape_benefit && bodyshape_benefit!="")
                    {
                        if(user_context["benefits"].indexOf(bodyshape_benefit)==-1)
                            user_context["benefits"].push(bodyshape_benefit);
                    }
                    sessions.storeContext(sessionId, user_context);
                    askUserProfileQuestion(sessionId);
                }
                else
                {
                    user_selected_answer = "choosing_other_is_not_correct"
                    processingMessage(sessionId, user_selected_answer, true);
                }
            });
        }
        else
        {
            user_context["user_profile"]["bodyshape_status"] = true;
            sessions.storeContext(sessionId, user_context);
            askUserProfileQuestion(sessionId);
        }
        
    },
    bodyConcernQuestion : function(sessionId, user_message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);  
        if(user_context["previous_question_needed_entities"].indexOf("skip")!=-1)
        {
            console.log("bodyConcernQuestion ")
            user_context["user_profile"]["concern_status"] = true;
            user_context["user_profile"]["body_concerns"]= [];
            sessions.storeContext(sessionId,user_context);
            processingUserAnswer["bodyConcernQuestion"](sessionId,[]);
        }
        else
        {
            user_selected_answer = "choosing_other_is_not_correct"
            processingMessage(sessionId, user_message, true);
        }
    },
    refineListQuestion : function(sessionId, message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        //console.log(message.length,"message.length")
        var reg = /^\d+$/;
        let validate_number = reg.test(message);
        console.log(validate_number,"validate_number")
        if(message.length==1&&(validate_number))
        {
            selected_option_details["answers"] = [message];
            processingUserAnswer["refineListQuestion"](sessionId,[message], selected_option_details);
        }
        else
        {
            let new_questions_to_add_to_queue=[];
            //console.log(user_context);
            new_questions_to_add_to_queue.push(user_context.unanswered_question_refine);
            Array.prototype.unshift.apply(user_context['question_queue'], new_questions_to_add_to_queue);
            sessions.storeContext(sessionId, user_context);
            processingMessage(sessionId, message, true);
        }
    },
    proceed_further_question : function(sessionId, message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        let further_proceed = bot_questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
        user_context["bot_messages"].push(further_proceed);
        user_context["unanswered_question"] = "preference_status_question";
        if(selected_option_details)
        {
            user_context["previous_user_messages"].push(selected_option_details);
        }
        sessions.storeContext(sessionId, user_context);
        sendBotMessages(sessionId);
    },
    userProfileStatusQuestion : function(sessionId, user_answer, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(selected_option_details)
        {
            user_context["previous_user_messages"].push(selected_option_details);
        }
        if(user_context["previous_question_needed_entities"].indexOf("its_me")!=-1) //
        {
            user_context["user_profile"]["profile_status"] = true;
            user_context["user_profile"]["concern_status"] = true;
            user_context["user_profile"]["skip_status"] = false;
            let profile_values = ["age","height", "skintone","bodyshape"];
            let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
            profile_values = profile_values.filter(function(a){
                return user_context["user_profile"].hasOwnProperty(a);
            });
            profile_values.forEach(function(a)
            {
                let benefit = word_mapping[product_line][a][user_context["user_profile"][a]]["entity_key"];
                if(benefit && benefit!="")
                {
                    user_context["benefits"].push(benefit);   
                }
            });
            user_context["user_profile"]["body_concerns"].forEach(function(a){
                let benefit = word_mapping[product_line]["body_concern"][a]["benefit_key"];
                if(benefit && benefit!="")
                {
                    user_context["benefits"].push(benefit);
                }
            });
            let product_list_reason_message = bot_questions.productListReasonMessage(user_context["username"],user_context["user_profile"]);
            user_context["bot_messages"].push(product_list_reason_message);

            let further_proceed = bot_questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
            user_context["bot_messages"].push(further_proceed);
            user_context["unanswered_question"] = "preference_status_question";
            sessions.storeContext(sessionId, user_context);
            sendBotMessages(sessionId);
        }
        else if(user_context["previous_question_needed_entities"].indexOf("not_me")!=-1) // 
        {
            user_context["user_profile"]["skip_status"] = false;
            user_context["user_profile"]["available"]=true;
            sessions.storeContext(sessionId, user_context);
            askUserProfileQuestion(sessionId);
        }
        else if(user_context["previous_question_needed_entities"].indexOf("skip")!=-1) //skip condition
        {
            user_context["user_profile"]["profile_status"] = true;
            user_context["user_profile"]["concern_status"] = true;
            user_context["user_profile"]["skip_status"] = true;
            sessions.storeContext(sessionId, user_context);
            let product_list_reason_message = bot_questions.productListReasonMessage(user_context["username"],user_context["user_profile"]);
            user_context["bot_messages"].push(product_list_reason_message);

            let further_proceed = bot_questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
            user_context["bot_messages"].push(further_proceed);
            user_context["unanswered_question"] = "preference_status_question";
            sessions.storeContext(sessionId, user_context);
            sendBotMessages(sessionId);
        }
    },
    profile_intrest : function(sessionId, message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId); 
        if(user_context["previous_question_needed_entities"].indexOf("yes")!=-1)
        {

            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            user_context["profile_intrest_staus"] = true;
            sessions.storeContext(sessionId, user_context);
            askUserProfileQuestion(sessionId);
        }
        else if(user_context["previous_question_needed_entities"].indexOf("no")!=-1)
        {
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            user_context["profile_intrest_staus"] = false;
            user_context["user_profile"]["profile_status"] = true;
            user_context["user_profile"]["concern_status"] = true;
            user_context["user_profile"]["skip_status"] = true;
            let product_list_reason_message = bot_questions.productListReasonMessage(user_context["username"],user_context["user_profile"]);
            user_context["bot_messages"].push(product_list_reason_message);

            let further_proceed = bot_questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
            user_context["bot_messages"].push(further_proceed);
            user_context["unanswered_question"] = "preference_status_question";
            sessions.storeContext(sessionId, user_context);
            sendBotMessages(sessionId);
        }
        else
        {
            message = "choosing_other_is_not_correct";
            processingMessage(sessionId, message, true);
        }
    },
    brand_deals_question : function(sessionId, message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(selected_option_details)
        {
            user_context["previous_user_messages"].push(selected_option_details);
        }
        user_context["deals"] = false;
        console.log("Brand Status : ", user_context["brand_status"]);
        console.log("Price Status : ", user_context["price_status"])
        if(user_context["previous_question_needed_entities"].indexOf("continue_chat")!=-1)
        {
            user_context["unanswered_question"] = "brand_deals_question";
            let brand_deals_message = bot_questions.textMessages("Which among the following types of brands you want your deals in?");
            user_context["bot_messages"].push(brand_deals_message);
            let brand_deals_question = bot_questions.brandDealsQuestion(sessionId);
            user_context["bot_messages"].push(brand_deals_question);
            sessions.storeContext(sessionId, user_context);
            sendBotMessages(sessionId);
        }
        else
        {
            user_context["brand_deal_values"] = message.split(",");
            user_context["brand_status"] = true;
            let sentence = "Ok, I have filtered "+user_context["brand_deal_values"].join(", ")+" from today's best deals in Myntra, Jabong, Voonik "+user_context["product_line"];
            user_context["bot_messages"].push(bot_questions.textMessages(sentence));
            sessions.storeContext(sessionId, user_context);
            askBrandDealsQuestion(sessionId);
        }
    },
    ask_price_question : function(sessionId, message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(user_context["previous_question_needed_entities"].indexOf("continue_chat")!=-1)
        {
            let user_context = sessions.getContext(sessionId);
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            let price_range_question = bot_questions.textMessages("What price range do you want me to look in?\n[eg: Below 1500, 1000 to 1500]");
            user_context["bot_messages"].push(price_range_question);
            sessions.storeContext(sessionId, user_context);
            sendBotMessages(sessionId);
        }
        else
        {
            processingMessage(sessionId, message, true);
        }
    },
    take_feedback : function(sessionId,user_answers,selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        let user_details = sessions.getAppSession(sessionId);
        let feedback_query = "insert into feedback(device_id, content, timestamp)values('"+sessionId+"','"+user_answers+"','"+new Date().getTime()+"');";
        helper.saveInSql("selekt", feedback_query); 
        user_context["unanswered_question"] = undefined;
        let feedback_response_message = bot_questions.textMessages("Thanks for your feedback");
        user_context["bot_messages"].push(feedback_response_message);
        sessions.storeContext(sessionId,user_context);
        sendBotMessages(sessionId);
    },
    feedbackQuestion : function(sessionId, user_feedback_text, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(selected_option_details)
        {
            user_context["previous_user_messages"].push(selected_option_details);
        }
        if(user_feedback_text.toLowerCase()=="other")
        {
            user_context["unanswered_question"] = "take_feedback";
            let ask_feedback = bot_questions.textMessages("Kindly message me your feedback");
            user_context["bot_messages"].push(ask_feedback);
        }
        else
        {
            let user_details = sessions.getAppSession(sessionId);
            let feedback_query = "insert into feedback(device_id, content, timestamp)values('"+sessionId+"','"+user_feedback_text+"','"+new Date().getTime()+"');";
            helper.saveInSql("selekt", feedback_query);
            
            user_context["unanswered_question"] = undefined;
            let feedback_response_message = bot_questions.textMessages("Thanks for your feedback");
            user_context["bot_messages"].push(feedback_response_message);
        }
        sessions.storeContext(sessionId,user_context);
        sendBotMessages(sessionId);
    },
    someIdentifiedQuestion : function(sessionId, user_selected_message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        console.log("someIdentifiedQuestion")
        if(user_context["previous_question_needed_entities"].indexOf("no")!=-1)
        {
            if(selected_option_details)
            {
                user_context["previous_user_messages"].push(selected_option_details);
            }
            let suggestion_message = bot_questions.askProductLineMessage();
            FB.sendRequest(sessionId, suggestion_message);
            user_context = sessions.clearContext(sessionId);
            sessions.storeContext(sessionId, user_context);
        }
        else
        {
            console.log(user_selected_message,user_context["previous_user_messages"][user_context["previous_user_messages"].length-1]["entities"])
            removeEntitiesFromContext(user_context,user_context["previous_user_messages"][user_context["previous_user_messages"].length-1]["entities"])
            user_context["previous_user_messages"].pop();
            sessions.storeContext(sessionId, user_context);
            processingMessage(sessionId, user_selected_message, true);
        }
    },
    occasionFilterConflictQuestion : function(sessionId, user_selected_message)
    {
        let user_context = sessions.getContext(sessionId);
        
        if(user_context["previous_question_needed_entities"].indexOf("suggest_recommended")!=-1)
        {
            user_selected_message = user_context["filter_occasion_conflict_values"]["occasion"]+" "+user_context["product_line"];
            user_context["filters"] = [];
            user_context["continue_chat_status"] = false;
        }
        else if(user_context["previous_question_needed_entities"].indexOf("go_as_per_my_likes")!=-1)
        {
            user_selected_message = user_context["filter_occasion_conflict_values"]["filters"]+" "+user_context["product_line"];
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
            user_context["occasion_status"] = true;
            user_context["continue_chat_status"] = false;
            user_context["go_as_per_my_likes"] = true;
        }

        sessions.storeContext(sessionId, user_context);
        processingMessage(sessionId, user_selected_message, true);
    },
    occasionConflictQuestion : function(sessionId, user_selected_message, selected_option_details)
    {
        let user_context = sessions.getContext(sessionId);
        if(user_selected_message=="restart_chat")
        {
            user_context = sessions.clearContext(sessionId);
            sessions.storeContext(sessionId, user_context);

            let suggestion_message = bot_questions.sendSuggestionsMessage();
            user_context["bot_messages"].push(suggestion_message);
            sessions.storeContext(sessionId, user_context);
            sendBotMessages(sessionId);
        }
        else
        {
            delete user_context["product_line"];
            delete user_context["occasion_productline_map"];
            user_context["conflict_status"] = false;
            sessions.storeContext(sessionId, user_context);
            processingMessage(sessionId, user_selected_message, true);
        }
    },
    occasionProductlineQuestion: function(sessionId,  user_message, selected_option_details )
    {
        let user_context = sessions.getContext(sessionId);
        user_message = user_context["occasion_productline_map"][0]["key"]+" "+user_message;
        processingMessage(sessionId, user_message, true);
    }
};
/*
* this function is used to getting the entities and processesing the user typed message
* @param {string} sessionId
* @param {string} message
* @param {obj} event
*/
function processingMessage(sessionId, message,reason_status)
{
    let user_context = sessions.getContext(sessionId);
    let previous_question = user_context["unanswered_question"];
    console.log("Session Id ", sessionId, message,previous_question)
    if(previous_question_actions.hasOwnProperty(previous_question))
    {
        if(user_context["previous_question_needed_entities"].indexOf("undo")!=-1)
        {
            console.log(previous_question,message)
        }
        let selected_option_details = {
            type : previous_question,
            answers : message,
            entities : user_context["previous_question_needed_entities"]

        };
        user_context["unanswered_question"] = undefined;
        previous_question_actions[previous_question](sessionId, message,selected_option_details);
    }
    else
    {
        console.log("getting the entities for message");
        entity_bot.getEntities(message, user_context, function(entities, cleaned_message)
        {
            console.log("Detected Entities ==============");
            console.log(JSON.stringify(entities, null, 2));

            addEntitiesToContext(sessionId, entities, message);
            user_context = sessions.getContext(sessionId);
            user_context["previous_user_messages"].push({"type":"user_typed_message", "message" :message, "entities": entities});
            let message_delay = user_context["message_delay"];
            if(user_context.hasOwnProperty("product_line_not_included"))
            {
                message_delay+=1500;
                delete user_context["product_line_not_included"];
                let no_indianwear_message = bot_questions.noIndianWearMessage();
                user_context["bot_messages"].push(no_indianwear_message);
                sendBotMessages(sessionId);
            }
            else if(user_context.hasOwnProperty("greet"))
            {
                delete user_context["greet"];
                let greet_message = bot_questions.greetMessage();
                user_context["bot_messages"].push(greet_message);

                let suggestion_message = bot_questions.sendSuggestionsMessage();
                user_context["bot_messages"].push(suggestion_message);
                sendBotMessages(sessionId);
            }
            else
            {
                processBotUnderStoodModule(sessionId, entities, message, cleaned_message);
                user_context = sessions.getContext(sessionId);
                if(user_context.hasOwnProperty("bot_understood_conflict"))
                {
                    sendBotMessages(sessionId);
                    delete user_context["bot_understood_conflict"];
                    return;
                }
                
                helper.getTotalProducts(sessionId, function(total_products)
                {
                    //console.log(user_context["help_status"],user_context["no_entities_status"],"help_status","no_entities_status")
                    if((user_context.hasOwnProperty("product_line")&&!user_context["help_status"]&&!user_context["no_entities_status"])&&(user_context.hasOwnProperty("product_line")&&!user_context["no_entities_status"]))
                    {
                        user_context["no_entities_status"] = false;
                        sessions.storeContext(sessionId,user_context);
                        displayReasonMessages(sessionId, total_products, true);
                    }

                    console.log("Total : ", total_products, "Conflict status: ", user_context["conflict_status"]);
                    if(!user_context.hasOwnProperty("product_line"))
                    {
                        askProductlineQuestion(sessionId);
                    }
                    else if(user_context["conflict_status"])
                    {
                        user_context["conflict_status"] = false;
                        user_context["unanswered_question"] = "occasionConflictQuestion"
                        
                        let conflict_question = bot_questions.occasionConflictQuestionText(user_context["product_line"], user_context["occasion_productline_map"][0]["key"]);
                        user_context["bot_messages"].push(conflict_question);
                        let conflict_question_button = bot_questions.occasionConflictQuestionButton(user_context["product_line"], user_context["occasion_productline_map"][0]["key"]);
                        user_context["bot_messages"].push(conflict_question_button);
                        sessions.storeContext(sessionId,user_context);
                        sendBotMessages(sessionId);
                    }
                    else if(total_products<=30)
                    {
                        foundLessProducts(sessionId, total_products)
                    }
                    else if(user_context["deals"])
                    {
                        askBrandDealsQuestion(sessionId);
                    }
                    else if(!user_context["filters_status"])
                    {
                        let ask_filters = bot_questions.askFiltersQuestion(sessionId);
                        user_context["bot_messages"].push(ask_filters);
                        user_context["unanswered_question"] = "filters_question";
                        sessions.storeContext(sessionId, user_context);
                        sendBotMessages(sessionId);
                    }
                    else if(!user_context["continue_chat_status"])
                    {
                        user_context["unanswered_question"] = "continueStatusQuestion";
                        let continue_chat_question = bot_questions.continueStatusQuestion(sessionId);
                        user_context["bot_messages"].push(continue_chat_question);
                        sessions.storeContext(sessionId, user_context);
                        sendBotMessages(sessionId);
                    }
                    else if(!user_context["occasion_status"]) // checking the user is already answered the occasion question or not
                    {
                        askOccasionQuestion(sessionId,total_products);
                    } 
                    else if(!user_context["user_profile"]["profile_status"]) // checking the user profile question is answered or not
                    {
                        checkUserProfileStatus(sessionId);
                    }
                    else if(!user_context["user_profile"]["concern_status"]) // checking the body concern question is answered or not
                    {
                        askBodyConcernQuestion(sessionId);
                    }
                    else if(!user_context["is_flow_complete"])
                    {
                        askRefineListQuestion(sessionId);
                    }
                    else
                    {
                        console.log("in helper");
                        user_context["is_flow_complete"] = true;
                        user_context["unanswered_question"] = "conversation_completed"
                        let conversation_completed_message = bot_questions.conversationCompleteMessage(sessionId);
                        user_context["bot_messages"].push(conversation_completed_message);
                        sessions.storeContext(sessionId, user_context);
                        sendBotMessages(sessionId);
                    }
                });
            }
        });
    }
}

let processingUserAnswer = 
{
    bodyConcernQuestion: function(sessionId,  body_concerns) // user answered value is belongs to bodyconcernQuestion
    {
        let user_context = sessions.getContext(sessionId);
        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
        let selected_option_details = {
            "type":"bodyConcernQuestion",
            "answers" : body_concerns
        };
        user_context["previous_user_messages"].push(selected_option_details);
        if(body_concerns.length>0)
        {
            // getting the reasons only for body concerns

            let tags = helper.getBodyConcernReasons(user_context["product_line"], body_concerns);
            for(let vl in tags)
            {
                console.log("tag value",tags[vl]["value"]);
                if(user_context["benefits"].indexOf(tags[vl]["value"])==-1 && user_context["priority_values"]["benefits"].indexOf(tags[vl]["value"])==-1)
                {
                    user_context["benefits"].push(tags[vl]["value"]);
                }
            }            
            helper.makeTagReasons(product_line, tags, [], function(with_conflict_reasons, without_conflict_reasons)
            {
                let reasons_messages=""
                console.log("in bodyconcernQuestion with_conflict_reasons, without_conflict_reasons",with_conflict_reasons, without_conflict_reasons);
                if(without_conflict_reasons.length>0)
                {
                    for(x in without_conflict_reasons)
                    {
                        console.log(without_conflict_reasons[x].reason);
                        reasons_messages+=without_conflict_reasons[x].reason+"\n\n";
                        console.log(reasons_messages); 
                    }
                    // let profile_reason_message = bot_questions.bodyConcernReasons(reasons_messages);
                    // user_context["bot_messages"].push(profile_reason_message);
                    let product_list_reason_message = bot_questions.productListReasonMessage(user_context["username"],user_context["user_profile"]);
                    user_context["bot_messages"].push(product_list_reason_message);
                    let further_proceed = bot_questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
                    user_context["bot_messages"].push(further_proceed);
                    user_context["unanswered_question"] = "preference_status_question";
                }
                else
                {
                    let product_list_reason_message = bot_questions.productListReasonMessage(user_context["username"],user_context["user_profile"]);
                    let further_proceed = bot_questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
                    user_context["bot_messages"].push(further_proceed);
                    user_context["unanswered_question"] = "preference_status_question";
                }
                sessions.storeContext(sessionId, user_context);
                sendBotMessages(sessionId);
            });
        }
        else
        {
            console.log("in helper makeTagReasons body concerns else function");
            let product_list_reason_message = bot_questions.productListReasonMessage(user_context["username"],user_context["user_profile"]);
            user_context["bot_messages"].push(product_list_reason_message);
            let further_proceed = bot_questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
            user_context["bot_messages"].push(further_proceed);
            user_context["unanswered_question"] = "preference_status_question";
            sendBotMessages(sessionId);  
        }
    },
    refineListQuestion: function(sessionId,  answer_keys, selected_option_details)
    {
        console.log("refineListQuestion 1st step");
        let user_context = sessions.getContext(sessionId);
        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
        let last_question_asked = user_context.unanswered_question_refine;
        let new_questions_to_add_to_queue = [];
        let adjective_questions_count_status = true;

        selected_option_details["last_question_asked"] = last_question_asked;
        selected_option_details["included_values_in_context"] = [];
        for(let i=0;i<answer_keys.length;i++)
        {
            let answer_key = answer_keys[i];
            let new_questions_key = last_question_asked + "_" + answer_key;
            console.log("last_question_asked :",last_question_asked)
            // Adding the benefit/adjective associated with the answer to context
            let last_question_object = conversationGraph.questions[product_line][last_question_asked];
            let attribute_type = last_question_object["attribute"];
            let adjective_to_be_added = last_question_object['options'][answer_key]['adjective'];
            let benefit_to_be_added = last_question_object['options'][answer_key]['benefit'];
            
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
        Array.prototype.unshift.apply(user_context['question_queue'], new_questions_to_add_to_queue);
        selected_option_details["current_question_queue"] = user_context["question_queue"].concat();
        if(selected_option_details["from"]!="undo")
            user_context["previous_user_messages"].push(selected_option_details);
        sessions.storeContext(sessionId,  user_context);

        helper.getTotalProducts(sessionId, function(total_products){
            let check_list_status = false;

            displayReasonMessages(sessionId, total_products, check_list_status);
            if(total_products<=30)
            {
                user_context["is_flow_complete"] = true;
                foundLessProducts(sessionId, total_products);
            }
            else
            {
                askRefineListQuestion(sessionId);
            }
        });
    }
};
function removeEntitiesFromContext(user_context, entities)
{
    if(entities.hasOwnProperty("broad_occasion"))
    {
        user_context.broad_occasion = undefined;
        delete user_context["broad_occasion"];
        let broad_occasion_benefit = entities["broad_occasion"]["benefit_entity_key"];
        let benefit_index = user_context["priority_values"]["benefits"].indexOf(broad_occasion_benefit);
        if(benefit_index!=-1)
        {
            user_context["priority_values"]["benefits"].splice(benefit_index, 1);   
        }
    }
    if(entities.hasOwnProperty("occasion"))
    {
        user_context.occasion = undefined;
        delete user_context["occasion"];
        user_context["occasion_status"] = false;
        let occasion_benefit = entities["occasion"]["benefit_entity_key"];
        let benefit_index = user_context["priority_values"]["benefits"].indexOf(occasion_benefit);
        if(benefit_index!=-1)
        {
            user_context["priority_values"]["benefits"].splice(benefit_index, 1);   
        }
    }
    
    let context_filters = user_context["filters"].concat();
    if(entities.hasOwnProperty("attribute_values"))
    {
        let entities_attribute_values = entities["attribute_values"];
        
        for(let i in entities_attribute_values)
        {
            if(user_context["adjective_attributes"].hasOwnProperty(entities_attribute_values[i].db_key))
                delete user_context["adjective_attributes"][entities_attribute_values[i].db_key];
            let obj = {};
            obj["product_filter."+entities_attribute_values[i].db_key] = entities_attribute_values[i].key;
            let removed_index = 0;
            for(let j in context_filters)
            {
                let a = context_filters[j];
                if(JSON.stringify(a)==JSON.stringify(obj))
                {
                    user_context["filters"].splice(j-removed_index, 1);
                    removed_index++;
                }
            }
        }
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
                range_query.range["product_filter.discount_price"]["gte"] = number[0];
            }
            else if(range=="under")
            {
                range_query.range["product_filter.discount_price"]["lte"] = number[0];
            }
            else if(range=="between")
            {
                if(number[0]>number[1])
                {
                    let temp = number[0];
                    number[0] = number[1];
                    number[1] = temp;
                }
                range_query.range["product_filter.discount_price"] = { 
                    "gte" : number[0],
                    "lte" : number[1]
                };
            }
            for(let i in context_filters)
            {
                if(JSON.stringify(context_filters[i])===JSON.stringify(range_query))
                {
                    user_context["filters"].splice(i, 1);
                }
            }
        }
    }
    if(entities.hasOwnProperty("adjectives"))
    {
        let adjectives = entities["adjectives"];
        for(let i in adjectives)
        {
            let adjective = adjectives[i]["entity_key"];
            let adj_index = user_context["priority_values"]["adjectives"].indexOf(adjective);
            if(adj_index != -1)
            {
                user_context["adjective_questions_count"]--;
                user_context["priority_values"]["adjectives"].splice(adj_index, 1);
            }
            let adj_attribute = adjectives[i]["attribute_key"];
            
            delete user_context["adjective_attributes"][adj_attribute];
        }
    }
    if(entities.hasOwnProperty("entity_benefits"))
    {
        let entity_benefits = entities["entity_benefits"];
        for(let i in entity_benefits)
        {
            let benefit = entity_benefits[i]["entity_key"];
            let benefit_index = user_context["priority_values"]["benefits"].indexOf(benefit);
            if(benefit_index!=-1)
            {
                user_context["priority_values"]["benefits"].splice(benefit_index, 1);
            }
        }
    }
    if(entities.hasOwnProperty("age"))
    {
        user_context["age"] = entities["age"];
        let age_benefit = entities["age"]["entity_key"];
        let benefit_index = user_context["priority_values"]["benefits"].indexOf(age_benefit);
        if(benefit_index!=-1)
            user_context["priority_values"]["benefits"].splice(benefit_index, 1);
    }
    if(entities.hasOwnProperty("height"))
    {
        user_context["height"] = entities["height"];
        let height_benefit = entities["height"]["entity_key"];
        let benefit_index = user_context["priority_values"]["benefits"].indexOf(height_benefit);
        if(benefit_index!=-1)
            user_context["priority_values"]["benefits"].splice(benefit_index, 1);
    }
    if(entities.hasOwnProperty("skintone"))
    {
        user_context["skintone"] = entities["skintone"];
        let skintone_benefit = entities["skintone"]["entity_key"];
        let benefit_index = user_context["priority_values"]["benefits"].indexOf(skintone_benefit);
        if(benefit_index!=-1)
            user_context["priority_values"]["benefits"].splice(benefit_index, 1);
    }
    if(entities.hasOwnProperty("bodyshape"))
    {
        user_context["bodyshape"] = entities["bodyshape"];
        let bodyshape_benefit = entities["bodyshape"]["entity_key"];
        let benefit_index = user_context["priority_values"]["benefits"].indexOf(bodyshape_benefit);
        if(benefit_index!=-1)
            user_context["priority_values"]["benefits"].splice(benefit_index, 1);
    }
    if(entities.hasOwnProperty("body_concerns"))
    {
        let body_concerns = entities["body_concerns"];
        user_context["body_concerns"] = body_concerns.map(function(cn){return cn["key"];});
        for(let i in body_concerns)
        {
            let concern_benefit = body_concerns[i]["benefit_key"];
            let benefit_index = user_context["priority_values"]["benefits"].indexOf(concern_benefit);
            if(benefit_index!=-1)
                user_context["priority_values"]["benefits"].push(benefit_index, 1);
        }
    }
    if(entities.hasOwnProperty("greet") && Object.keys(entities).length==1)
    {
        user_context.greet = undefined;
        delete user_context.greet;
    }
    if(entities.hasOwnProperty("deals"))
    {
        user_context["deals"] = undefined;
        delete user_context.deals;
    }
    if(entities.hasOwnProperty("product_line"))
    {
        delete user_context["product_line"];
    }
    return user_context;
}
/*
* this function is used to send the reason messages
*/
function displayReasonMessages(sessionId, total_products, check_list_status)
{
    let user_context = sessions.getContext(sessionId);
    let reasons_messages_length = user_context["reason_messages"].length;
    if(reasons_messages_length>0 || (!user_context["occasion_status"] && !user_context["user_profile"]["profile_status"] && !user_context["conflict_status"]) || user_context.hasOwnProperty("deals") || user_context["go_as_per_my_likes"])
    {
        user_context["go_as_per_my_likes"] = false;
        let reason_msg = helper.getReasonMessage(sessionId, total_products);
        if(reason_msg!="")
        {
            let reason_message_info = bot_questions.textMessages(reason_msg);
            user_context["bot_messages"].push(reason_message_info);
            // if(total_products >= 30 && (user_context["filters_status"] && (!user_context.hasOwnProperty("deals") || reasons_messages_length>0)) && check_list_status)
            // {
            //     let reason_message_buttons = bot_questions.displayReasonMessage("How do you want to proceed further?",sessionId, user_context["occasion_status"], user_context["user_profile"]["profile_status"],user_context["user_profile"]["concern_status"]);
            //     user_context["bot_messages"].push(reason_message_buttons);
            // }
        }
        sessions.storeContext(sessionId, user_context);
    }
}
/*function getAttributeReason(product_line, attribute, all_benefits)
{
    console.log("In getAttributeReason Function");
    let reason;
    let attribute_to_profile_mapping = require("./public/attribute_to_body_profile_mapping.json");
    if(attribute_to_profile_mapping.hasOwnProperty(product_line))
    {
        let profile_attribute_reasons = [];
        all_benefits.forEach(function(a){
            if(attribute_to_profile_mapping[product_line].hasOwnProperty(a))
            {
                let profile_data = attribute_to_profile_mapping[product_line][a];
                if(profile_data.hasOwnProperty(attribute))
                {
                    if(profile_data[attribute]["reason"]!="" && profile_data[attribute]["priority"]!=0)
                        profile_attribute_reasons.push(profile_data[attribute]);
                }
            }
        });
        console.log("reasons length : ", profile_attribute_reasons.length);
        if(profile_attribute_reasons.length>0)
        {
            try{
                profile_attribute_reasons = profile_attribute_reasons.sort(function(a, b){
                    return a["priority"] - b["priority"];
                });
            }catch(e){}
            return profile_attribute_reasons[0]["reason"];
        }
    }
    return reason;
}*/
function getAttributeReason(product_line, attribute, user_profile)
{
    console.log("In getAttributeReason Function");
    let reason;
    let attribute_to_profile_mapping = require("./public/attribute_to_body_profile_mapping.json");
    if(attribute_to_profile_mapping.hasOwnProperty(product_line))
    {
        let user_profile_values = ["age", "height", "skintone", "bodyshape"];

        let user_profile_keys = user_profile_values.filter(function(a){return user_profile.hasOwnProperty(a);});
        console.log("User profile values ", user_profile_keys);
        let profile_attribute_reasons = [];
        user_profile_keys.forEach(function(a){
            let profile_data = attribute_to_profile_mapping[product_line][user_profile[a]];
            console.log(attribute, a);
            if(profile_data.hasOwnProperty(attribute))
            {
                if(profile_data[attribute]["reason"]!="")
                    profile_attribute_reasons.push(profile_data[attribute]);
            }
        });
        console.log("reasons length : ", profile_attribute_reasons.length);
        if(profile_attribute_reasons.length>0)
        {
            try{
                profile_attribute_reasons = profile_attribute_reasons.sort(function(a, b){
                    return b["priority"] - a["priority"];
                });
            }catch(e){}
            return profile_attribute_reasons[0]["reason"];
        }
    }
    return reason;
}
function foundLessProducts(sessionId, total_products)
{
    console.log("In lessProducts function")
    let user_context = sessions.getContext(sessionId);
    if(total_products==0)
    {
        let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
        functions.checkForConflict(sessionId, function(filters, occasion, conflict_benefit){
            console.log(filters, occasion, conflict_benefit);
            if(filters && occasion)
            {
                filter_list.getRecommendedPreferences(product_line, user_context["filters"], conflict_benefit, function(filter_result)
                {
                    user_context["unanswered_question"] = "occasionFilterConflictQuestion";
                    user_context["filter_occasion_conflict_values"] = {"filters":filters, "occasion":occasion};
                        
                    if(filter_result.length>0)
                    {
                        let error_messages = [];
                        let recommend_messages = [];
                        let filter_messages = filter_result.forEach(function(a){
                            error_messages.push(a["key"]+": "+a["values"].join(", "));
                            recommend_messages.push(a["key"]+": "+a["recommend"].join(", "))
                        });
                        let ben_name = helper.getBenefitname(conflict_benefit, product_line, "benefits");
                        let ben_value = word_mapping[product_line]["benefits"][ben_name];

                        let sentence = "Oops, you have gone for "+error_messages.join(" ")+". But I recommend you to go for "+recommend_messages.join(" ")
                            +". These are suitable for "+occasion;
                        user_context["bot_messages"].push(bot_questions.textMessages(sentence));
                        let filter_occasion_conflict_question = bot_questions.filterOccasionConflictQuestion();
                        user_context["bot_messages"].push(filter_occasion_conflict_question);
                    }
                    else
                    {
                        let no_products_message = bot_questions.textMessages("Oops, I didn't find anything suiting "+occasion+" from your selected list. I can recommend a different list for "+occasion+".");
                        user_context["bot_messages"].push(no_products_message);

                        let filter_occasion_conflict_question = bot_questions.filterOccasionConflictQuestion();
                        user_context["bot_messages"].push(filter_occasion_conflict_question);
                    }
                    sendBotMessages(sessionId);
                });
            }
            else
            {
                user_context["unanswered_question"] = "conversation_completed"
                user_context["is_flow_complete"] =true;
                let no_products_message = bot_questions.noProductFoundMessage();
                let check_trends = bot_questions.checkTrendsQuestion(sessionId);
                user_context["bot_messages"].push(no_products_message);
                user_context["bot_messages"].push(check_trends);
                sessions.storeContext(sessionId,user_context);
                sendBotMessages(sessionId);
            }
        });
    }
    else
    {
        user_context["unanswered_question"] = "conversation_completed"
        user_context["is_flow_complete"] =true;
        let less_products_message = bot_questions.lessProducts(sessionId, total_products);
        user_context["bot_messages"].push(less_products_message);
        sessions.storeContext(sessionId,user_context);
        sendBotMessages(sessionId);
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
    user_context["unanswered_question"] = "refineListQuestion";
    if(user_context['question_queue'].length == 0) // checking the conversation flow is completed or not
    {
        user_context["unanswered_question"] = "conversation_completed"
        user_context["is_flow_complete"] = true;
        let conversation_completed_message = bot_questions.conversationCompleteMessage(sessionId);
        user_context["bot_messages"].push(conversation_completed_message);  
        sessions.storeContext(sessionId,user_context);    
        sendBotMessages(sessionId);
    }
    else
    {
        user_context["is_flow_complete"] = false;
        user_context["prev_questions_queue"] = user_context["question_queue"].concat();
        let next_question = user_context['question_queue'].shift();
        user_context["unanswered_question_refine"] = next_question;
        sessions.storeContext(sessionId,user_context);
        let question = conversationGraph.questions[product_line][next_question];
        helper.processConversationQuestion(sessionId, next_question, question, function(response){
            let attribute_name = response["attribute"];
            let response_info = bot_questions.textMessages(response.text+" (Select \"select multiple\" to choose more than one option)");
            user_context["bot_messages"].push(response_info);

            if(response["question_type"]=="customize")
            {
                let send_customize_question = bot_questions.customizeQuestion(response,sessionId);
                user_context["bot_messages"].push(send_customize_question);
            }
            else
            {
                let all_benefits = user_context["priority_values"]["benefits"].concat();
                all_benefits = all_benefits.concat(user_context["benefits"]);
                //let attribute_reason = getAttributeReason(product_line, attribute_name, all_benefits);

                let attribute_reason = getAttributeReason(product_line, attribute_name, user_context["user_profile"]);
                if((!attribute_reason || attribute_reason=="") && !user_context["user_profile"]["skip_status"])
                {
                    attribute_reason = "For your body profile, any "+attribute_name.split("_").join(" ")+" will look good. Go ahead and choose what you like";
                }
                if(attribute_reason)
                {
                    let reason_array = attribute_reason.split(".");
                    reason_array = reason_array.map(function(a)
                    {
                        a = a.trim();
                        a = helper.titleCase(a);
                        return a;
                    });
                    let attribute_reason_message = bot_questions.textMessages("My Tip: "+reason_array.join(" "));
                    user_context["bot_messages"].push(attribute_reason_message);
                }
                let send_adj_module_question = bot_questions.makeAdjModuleQuestion(response,user_context["product_line"], sessionId);
                user_context["bot_messages"].push(send_adj_module_question);
            }
            sessions.storeContext(sessionId, user_context);
            sendBotMessages(sessionId);
        });
    }
}

function processBotUnderStoodModule(sessionId, entities, message, cleaned_message)
{
    console.log("processBotUnderStoodModule");
    let user_context = sessions.getContext(sessionId);
    let message_delay = user_context["message_delay"];
    console.log(user_context["bot_understood_message_status"],"bot_understood_message_status")
    if(Object.keys(entities).length>0 && !user_context["bot_understood_message_status"])
    {
        let templates = getBotUnderstoodTemplate(entities);
        cleaned_message = entity_bot.processMessageWithEntities(cleaned_message, entities);
        cleaned_message = cleaned_message.trim();
        console.log("Cleaned Message : ",cleaned_message);
        if(templates.length>0)
        {
            let bot_understood_message = bot_questions.textMessages("I understood it as \""+templates[0]+"\"");
            user_context["bot_messages"].push(bot_understood_message);
            user_context["bot_understood_message_status"] = true;
            sessions.storeContext(sessionId, user_context);
            if(cleaned_message!="")
            {
                let cleaned_message_array = cleaned_message.split(" ");
                let require_values = entity_bot.requireValues(cleaned_message_array, message);
                user_context["unanswered_question"]="someIdentifiedQuestion";
                let some_identified_question = bot_questions.someIdentifiedQuestion(require_values.message);
                user_context["bot_messages"].push(some_identified_question);
                user_context["bot_understood_conflict"] = true;
                sessions.storeContext(sessionId,user_context);
            }
        }
        else
        {
            let no_entities_message = bot_questions.textMessages("Sorry, I did not understand your message. Try changing your question and please make it simpler.");
            user_context["is_flow_complete"] = true;
            user_context["bot_messages"].push(no_entities_message);
            user_context["bot_understood_conflict"] = true;
        }
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
        user_context["unanswered_question"]="occasionProductlineQuestion";
        let occasion_msg = bot_questions.occasionProductlineQuestion(occasion, values);
        user_context["bot_messages"].push(occasion_msg);
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
        user_context["bot_messages"].push(suggestion_message);
    }
    if(user_context.hasOwnProperty("deals"))
    {
        let ask_product_line = bot_questions.askProductLineMessage();
        user_context["bot_messages"].push(ask_product_line);
    }
    sendBotMessages(sessionId);
}
/*
* this function is used to check the user context is already have the user profile data or not
* @param {string} sessionId
*/
function checkUserProfileStatus(sessionId)
{
    let user_context = sessions.getContext(sessionId);
    let profile_values = ["age", "height", "bodyshape", "skintone"];
    let unanswered_profile_values = profile_values.filter(function(pv){
        return !user_context["user_profile"].hasOwnProperty(pv);
    });
    //console.log(unanswered_profile_values.length);
    if(unanswered_profile_values.length==0)
    { 
        let profile_info_message = bot_questions.profileInfoMessage();
        user_context["bot_messages"].push(profile_info_message);

        let profile_summary_question = bot_questions.profileSummaryQuestion(user_context["user_profile"]);
        user_context["bot_messages"].push(profile_summary_question);

        user_context["unanswered_question"]="userProfileStatusQuestion";
        let profile_confirmation_question = bot_questions.profileConfirmationQuestion(user_context["user_profile"])
        user_context["bot_messages"].push(profile_confirmation_question);

        sessions.storeContext(sessionId, user_context);
        sendBotMessages(sessionId);
    }
    else
    {
        if(!user_context["profile_intrest_staus"])
            askUserProfileIntrestedQuestion(sessionId);
        else
            askUserProfileQuestion(sessionId)
    }
}
function askUserProfileIntrestedQuestion(sessionId)
{
    let user_context = sessions.getContext(sessionId);
    // let before_further_profile = bot_questions.textMessages("Before proceeding further on "+user_context["product_line"]+", let me know about your body profile, as it will help me suggest better ")
    // user_context["bot_messages"].push(before_further_profile);
    user_context["unanswered_question"]="profile_intrest"
    let yes_or_no_question = bot_questions.yesOrNoQuestion("Ok! I can make better recommendations if I know your Body Profile. Shall I proceed?");
    user_context["bot_messages"].push(yes_or_no_question);
    sessions.storeContext(sessionId,user_context);
    sendBotMessages(sessionId);
}
function askUserProfileQuestion(sessionId)
{
    let user_context = sessions.getContext(sessionId);
    let profile_values = {
        "age"       : [bot_questions.bodyProfileAgeQuestion(user_context["username"])],
        "height"    : [bot_questions.bodyProfileHeightQuestion()],
        "skintone"  : [bot_questions.bodyProfileSkinTone()],
        "bodyshape" : [bot_questions.bodyProfileShapeMessage(), bot_questions.bodyProfileShapeQuestion()]
    };
    let unanswered_values = Object.keys(profile_values).filter(function(value){
        return !user_context["user_profile"][value+"_status"];
    });
    if(unanswered_values.length>0 )
    {
        console.log("User Messages : ", user_context["bot_messages"]);
        user_context["user_profile"]["profile_status"] = false;
        let question_length = user_context["user_profile"]["concern_status"]?unanswered_values.length:(unanswered_values.length+1);
        if(unanswered_values[0]=="age" && !user_context["age_again"])
        {
            let sentence;
            if(!user_context["user_profile"]["available"])
            {
                sentence = "Great! I will ask "+question_length+" questions about you.";
               
            }
            else
            {
                sentence = "Oh, ok. Kindly answer these "+question_length+" questions about yourself. This will help me understand you better.";
            }
            let user_profile_info_message = bot_questions.textMessages(sentence);
            user_context["bot_messages"].push(user_profile_info_message);
        }
        console.log("User Messages : ", user_context["bot_messages"].length);
        let profile_questions = profile_values[unanswered_values[0]];
        user_context["bot_messages"] = user_context["bot_messages"].concat(profile_questions);
        user_context["unanswered_question"] = unanswered_values[0]+"Question";
        sendBotMessages(sessionId);
    }
    else
    {
        user_context["user_profile"]["profile_status"] = true;
        askBodyConcernQuestion(sessionId);
    }
}

/*
* this function is used to ask the body concerns question
* @param {string} sessionId
*/
function askBodyConcernQuestion(sessionId)
{
    console.log("in askBodyConcernQuestion Function");
    let user_context = sessions.getContext(sessionId);
    let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
    console.log("product line",product_line);
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
        let body_concerns_message = bot_questions.askBodyConcernsQuestion("Lastly, Any body concerns that I should be aware of?",sessionId);
        user_context["bot_messages"].push(body_concerns_message);
        user_context["unanswered_question"] = "bodyConcernQuestion"
    }
    else
    {
        let further_proceed = bot_questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
        user_context["bot_messages"].push(further_proceed);
        user_context["unanswered_question"] = "preference_status_question";
        sessions.storeContext(sessionId, user_context);
    }
    sendBotMessages(sessionId);
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
    if(!user_context["is_user_wants_occasion"])
    {
        let occasion_info_question = bot_questions.occasionInfoMessage();
        user_context["bot_messages"].push(occasion_info_question);
        //user_context["continue_chat_status"] = false;
        user_context["unanswered_question"]="occasionStatusQuestion";
        let occasion_in_mind_message = bot_questions.yesOrNoQuestion("Do you have an occasion in mind?");
        user_context["bot_messages"].push(occasion_in_mind_message);
    }
    else if(user_context.hasOwnProperty("broad_occasion")) // checking the broad occasion is exists in the context or not
    {
        user_context["unanswered_question"]="occasionQuestion";
        let broad_occasion_value = user_context["broad_occasion"]["key"];
        console.log(product_line)
        let sub_occasions = word_mapping[product_line]["broad_occasions"][broad_occasion_value]["occasion_map"];
        if(sub_occasions.length!=0)
        {
            let occasion_question = bot_questions.occasionQuestion(broad_occasion_value, sub_occasions);
            user_context["bot_messages"].push(occasion_question);   
        }
        else
        {
            askUserProfileIntrestedQuestion(sessionId);   
        }
        
    }
    else
    {
        user_context["unanswered_question"]="broadOccasionQuestion";
        let broad_occasions = word_mapping[product_line]["broad_occasions"];
        let broad_occasion_keys = Object.keys(broad_occasions);
        let broad_occasion_question = bot_questions.broadOccasionQuestion(user_context["product_line"], broad_occasion_keys);
        user_context["bot_messages"].push(broad_occasion_question);
    }
    sessions.storeContext(sessionId, user_context);
    sendBotMessages(sessionId);
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
    let filter_message_status = true;
    if(Object.keys(entities).length==0)
    {
        let no_entities_message;
        if(!user_context["not_text_message"])
            no_entities_message = bot_questions.noEntitiesMessage();
        else
            delete user_context["not_text_message"]
        // if(user_context["unanswered_question"]=="occasionQuestion")
        // {
        //     user_context["occasion_status"] = false;
        //     sessions.storeContext(sessionId, user_context);
        // }
        user_context["no_entities_status"] = true;
        user_context["bot_messages"].push(no_entities_message);
        return;
    }
    user_context["no_entities_status"] = false;
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
                user_context["previous_user_messages"] = [];
                sessions.storeContext(sessionId, user_context);
            }
            filter_message_status = false;
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
        console.log("Braod occasion status : ",user_context.hasOwnProperty("broad_occasion") && user_context["broad_occasion"])
        if(user_context.hasOwnProperty("broad_occasion") && user_context["broad_occasion"])
        {
            if(user_context["broad_occasion"]["key"]!=entities["broad_occasion"]["key"])
            {
                offline_bot.sendMessage("clear_chat", {}, sessionId);
                let context_product_line = user_context["product_line"];
                user_context = sessions.clearContext(sessionId);
                user_context["product_line"] = context_product_line;
                sessions.storeContext(sessionId, user_context);
            }
        }
        user_context["continue_chat_status"] = false;
        user_context["broad_occasion"] = entities['broad_occasion'];
        user_context["conflict_status"] = false;
        user_context["is_user_wants_occasion"] = true;
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
                user_context["product_line"] = context_product_line;
                sessions.storeContext(sessionId, user_context);
            }
        }
        user_context["continue_chat_status"] = false;
        user_context["occasion"] = entities["occasion"];
        user_context["occasion_status"] = true;
        user_context["conflict_status"] = false;
        user_context["is_user_wants_occasion"] = true;
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
            if(entities_attribute_values[i].db_key=="brand")
                user_context["brand_status"] = true;
            let obj = {};
            obj["product_filter."+entities_attribute_values[i].db_key] = entities_attribute_values[i].key;
            user_context["filters"].push(obj);
        }
        /*if(product_line && filter_message_status)
        {
            let filter_message = bot_questions.inBetweenChatMessage(filter_values.join(" ")+" "+user_context["product_line"]);
            user_context["bot_messages"].push(filter_message)
        }*/
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
            console.log("Range ", Object.keys(range_query.range["product_filter.discount_price"]).length);
            if(Object.keys(range_query.range["product_filter.discount_price"]).length>0)
            {
                user_context["price_status"] = true;
                user_context["filters"].push(range_query);
                sessions.storeContext(sessionId, user_context);
            }
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
        /*if(product_line && filter_message_status)
        {
            let filter_message = bot_questions.inBetweenChatMessage(adjective_values.join(" ")+" "+user_context["product_line"]);
            user_context["bot_messages"].push(filter_message);
        }*/
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
        user_context["user_profile"]["age_status"] = true;
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
        user_context["user_profile"]["height_status"] = true;
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
        user_context["user_profile"]["skintone_status"] = true;
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
        user_context["user_profile"]["bodyshape_status"] = true;
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
    user_context["help_status"] = false;
    if(entities.hasOwnProperty("help"))
    {
        let help_message = bot_questions.helpMessage();
        user_context["bot_messages"].push(help_message);
        user_context["help_status"] =  true;
        //delete user_context["help"];
        sessions.storeContext(sessionId, user_context);
    }
    if(entities.hasOwnProperty("body_concerns"))
    {
        let body_concerns = entities["body_concerns"];
        user_context["user_profile"]["concern_status"] = true;
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
    if(entities.hasOwnProperty("brand_deal_values"))
    {
        user_context["brand_deal_values"] = entities["brand_deal_values"];
        user_context["deals"] = false;
    }
    user_context["message_delay"] = message_delay;
    sessions.storeContext(sessionId,  user_context);
}
function askBrandDealsQuestion(sessionId)
{
    let user_context = sessions.getContext(sessionId);
    if(!user_context["brand_status"])
    {
        user_context["unanswered_question"] = "brand_deals_question";
        let brand_deals_status_message = bot_questions.brandDealsStatusQuestion(sessionId, "You can check your deals (or) I can further narrow down based on your brand preference","continue chat");
        user_context["bot_messages"].push(brand_deals_status_message);
        sessions.storeContext(sessionId, user_context);
        sendBotMessages(sessionId);
    }
    else if(!user_context["price_status"])
    {
        user_context["unanswered_question"] = "ask_price_question";
        let brand_deals_status_message = bot_questions.brandDealsStatusQuestion(sessionId, "You can check your deals (or) I can further narrow down based on your budget", "continue chat");
        user_context["bot_messages"].push(brand_deals_status_message);
        sessions.storeContext(sessionId, user_context);
        sendBotMessages(sessionId);
    }
    else
    {
        if(!user_context["occasion_status"]) // checking the user is already answered the occasion question or not
        {
            askOccasionQuestion(sessionId);
        } 
        else if(!user_context["user_profile"]["profile_status"]) // checking the user profile question is answered or not
        {
            checkUserProfileStatus(sessionId);3
        }
        else if(!user_context["user_profile"]["concern_status"]) // checking the body concern question is answered or not
        {
            askBodyConcernQuestion(sessionId);
        }
        else
        {
            console.log("in helper");
            user_context["is_flow_complete"] = true;
            let conversation_completed_message = bot_questions.conversationCompleteMessage(sessionId);
            user_context["bot_messages"].push(conversation_completed_message);
            sessions.storeContext(sessionId, user_context);
            sendBotMessages(sessionId);
        }
    }
}
/*
* this function used to get bot understood templete based on templates
*/
function getBotUnderstoodTemplate(entities)
{   
    let msg_entities = JSON.parse(JSON.stringify(entities));
    delete msg_entities["greet"];
    delete msg_entities["help"];
    if(msg_entities.hasOwnProperty("broad_occasion"))
    {
        msg_entities["broad_occasion"] = msg_entities["broad_occasion"]["key"];
    }
    if(msg_entities.hasOwnProperty("occasion"))
    {
        msg_entities["occasion"] = msg_entities["occasion"]["key"];
    }
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
    if(msg_entities.hasOwnProperty("adjectives"))
    {
        msg_entities["adjectives"] = msg_entities["adjectives"].map(function(a){return a["key"];});
    }
    
    let profile_keys = ["age","height","skintone","bodyshape"];
    profile_keys.forEach(function(a){
        if(msg_entities.hasOwnProperty(a))
        {
            msg_entities[a] = msg_entities[a]["key"];
        }
    });
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
/* 
* getting age range from user input
*/
function getAgeRange(number)
{
    if(number>=18&&number<=27)
    {
        return "18-27";
    }
    else if(number>=28&&number<=38)
    {
        return "28-38";
    }
    else if(number>=39)
    {
        return "39+";
    }
    else
    return "18-27";
}
function sendBotMessages(sessionId)
{
    let user_context = sessions.getContext(sessionId);
    let bot_messages = user_context["bot_messages"];
    let getMessage = function(bot_messages, index)
    {
        let message = bot_messages[index];
        //console.log(message);
        FB.sendRequest(sessionId, message);
        index++;
        if(index<bot_messages.length)
        {
            setTimeout(function(){
                FB.sendBubble(sessionId);
            },100);
            setTimeout(function(){
                getMessage(bot_messages, index);
            },2000);
        }
        else
            return;
    };
    if(bot_messages.length>0)
    {
        user_context["question_number"]++;
        getMessage(bot_messages, 0);
    }
    user_context["bot_messages"] = [];
    sessions.storeContext(sessionId, user_context);
}
function welcomeMessage(sessionId,name)
{
    let message_delay = 100;
    console.log("session is not exist");
    let user_context=sessions.getContext(sessionId);
    user_context["username"] = name;
    user_context["bot_messages"] = [];
    let intro_message = bot_questions.introductionMessage(name);
    user_context["bot_messages"].push(intro_message)
    let about_me_question = bot_questions.okButtonQuestion("Before we begin, there are a few things you need to know about me. Ok?");
    user_context["bot_messages"].push(about_me_question);
    // let after_suggestions_message = bot_questions.afterSuggestionsMessage();
    // user_context["bot_messages"].push(after_suggestions_message);
    user_context["unanswered_question"] = "about_me";
    sessions.storeContext(sessionId, user_context);
    sendBotMessages(sessionId);
  //status = false;
}
module.exports = 
{
    foundLessProducts : foundLessProducts,
    sendBotMessages : sendBotMessages,
    processingMessage: processingMessage,
    processingUserAnswer: processingUserAnswer,
    getBotUnderstoodTemplate: getBotUnderstoodTemplate,
    checkUserProfileStatus : checkUserProfileStatus,
    askUserProfileQuestion : askUserProfileQuestion,
    askBodyConcernQuestion : askBodyConcernQuestion,
    getAgeRange : getAgeRange,
    askOccasionQuestion : askOccasionQuestion,
    welcomeMessage : welcomeMessage,
    askRefineListQuestion : askRefineListQuestion,
    previous_question_actions : previous_question_actions,
    askUserProfileIntrestedQuestion : askUserProfileIntrestedQuestion,
}