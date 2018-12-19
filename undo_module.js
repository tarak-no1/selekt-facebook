const Offline_Bot = require("./offline_bot.js");
const Sessions = require("./public/sessions.js");
const Bot_Questions = require("./bot_questions.js");
const Fashion_Bot = require("./fashion_bot.js");
const Mapping = require("./public/mapping.js");
let helper = require('./helper');
let mapping = require('./public/mapping');
const fs = require("fs");
const FB = require("./facebook.js");
const word_mapping = JSON.parse(fs.readFileSync("./public/word_mapping.json"));

function getUndoState(sessionId)
{
	let user_context = Sessions.getContext(sessionId);
	console.log("Current Question Number : ", user_context["question_number"]);
	//console.log("Context",user_context);
	console.log(JSON.stringify(user_context["previous_user_messages"], null, 2));
    let length_of_previous_messages = user_context["previous_user_messages"].length;
    if(length_of_previous_messages>0)
    {
    	let previous_message = user_context["previous_user_messages"].pop();
    	console.log("Length : ", user_context["previous_user_messages"].length);
    	user_context["question_number"]--;
    	let event_time = new Date().getTime();
    	length_of_previous_messages = user_context["previous_user_messages"].length;
    	console.log("Previous Message : ",previous_message);
        user_context["unanswered_question"] = previous_message["type"];

    	if(previous_message["type"]=="user_typed_message")
    	{
    		user_context = removeEntitiesFromContext(user_context, previous_message["entities"]);
    		Sessions.storeContext(sessionId, user_context);
    		console.log("user_typed_message")
    		if(length_of_previous_messages>0)
    		{
    			let last_message = user_context["previous_user_messages"].pop();
    			console.log("last_message",last_message);
    			if(last_message.type=="user_typed_message")
    			{
    				let user_message = last_message["message"];
                    if(last_message["entities"][0]=="clear")
                    {
                        let first_message = bot_questions.textMessages("Your session is reset");
                        user_context["bot_messages"].push(first_message);
                        let after_suggestions_message = bot_questions.afterSuggestionsMessage();
                        user_context["bot_messages"].push(after_suggestions_message);
                        Sessions.storeContext(sessionId, user_context);
                        Fashion_Bot.sendBotMessages(sessionId);
                    }
                    else if(last_message["entities"][0]=="help")
                    {
                        let help_message = bot_questions.textMessages("- if you want to reset/refresh your chat, just type \"clear\" \n\n- if you want to go back to the previous question type \"undo\".")
                        user_context["bot_messages"].push(help_message);
                        user_context["previous_user_messages"].push({"type":"user_typed_message", "message" :user_message, "entities": ["help"]});
                        Sessions.storeContext(sessionId, user_context);
                        Fashion_Bot.sendBotMessages(sessionId);
                    }
                    else
    				    Fashion_Bot.processingMessage(sessionId, user_message);
    				return;
    			}
    			else if(last_message.type=="someIdentifiedQuestion")
    			{
    				last_message = user_context["previous_user_messages"].pop();
    				let user_message = last_message["message"];
    				Fashion_Bot.processingMessage(sessionId, user_message);
    				return;
    			}
                else if(last_message.type=="continueStatusQuestion")
                {
                    user_context["previous_user_messages"].push(last_message);
                    Sessions.storeContext(sessionId, user_context);
                    Fashion_Bot.askOccasionQuestion(sessionId);
                    return;
                }
    			else if(last_message["type"]=='ask_suggestions')
    			{
    				let user_message = last_message["answers"];
    				user_context["unanswered_question"]=last_message["type"];
                    user_context["previous_question_needed_entities"] = last_message["entities"]
                    Sessions.storeContext(sessionId, user_context);
    				Fashion_Bot.processingMessage(sessionId, user_message);
    				return;
    			}
                else if(last_message["type"]=="occasionStatusQuestion")
                {
                    let user_message = last_message["answers"];
                    user_context["unanswered_question"]=last_message["type"];
                    user_context["previous_question_needed_entities"] = last_message["entities"]
                    Sessions.storeContext(sessionId, user_context);
                    Fashion_Bot.processingMessage(sessionId, user_message)
                    return
                }
                else if(last_message["type"]=="preference_status_question")
                {
                    let user_message = last_message["answers"];
                    user_context["unanswered_question"]=last_message["type"];
                    user_context["previous_question_needed_entities"] = last_message["entities"]
                    Sessions.storeContext(sessionId, user_context);
                    Fashion_Bot.processingMessage(sessionId, user_message);
                    return
                }
                else if(last_message["type"]=="about_me")
                {
                    Fashion_Bot.welcomeMessage(sessionId,user_context["user_name"]);
                }
                else if(last_message["type"]=="filters_question")
                {
                    let user_message = last_message["answers"];
                    user_context["unanswered_question"]=last_message["type"];
                    user_context["previous_question_needed_entities"] = last_message["entities"]
                    Sessions.storeContext(sessionId, user_context);
                    Fashion_Bot.processingMessage(sessionId, user_message);
                    return
                }
    			else
    			{
    				user_context["previous_user_messages"].push(last_message);
    			}
    		}
    	}
    	else if(previous_message["type"]=="user_name_asked")
    	{
    		delete user_context["user_name"];
            Sessions.storeContext(sessionId,user_context);
    		Fashion_Bot.welcomeMessage(sessionId);
            return;
    	}
        else if(previous_message["type"]=="ask_suggestions"||previous_message["type"]=="instructions_to_user")
        {
            let last_message = user_context["previous_user_messages"].pop();
            let answer = last_message["answers"];
            user_context["unanswered_question"] = last_message["type"];
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.processingMessage(sessionId,answer)
        }
    	else if(previous_message["type"]=="filters_question")
    	{
            if(previous_message["answers"]=="no")
            {
                user_context["filters_status"] = false;
                user_context["continue_chat_status"] = false;
                let last_message = user_context["previous_user_messages"].pop();
                console.log(last_message);
                let user_message = last_message["message"];
                user_context["unanswered_question"]=last_message["type"];
                user_context["previous_question_needed_entities"] = last_message["entities"]
                Sessions.storeContext(sessionId, user_context);
                Fashion_Bot.processingMessage(sessionId, user_message);
                return;
            }
            else
            {
                let added_filters = previous_message["remove_filters"];
                let remove_filters = previous_message["added_filters"];
                let context_filters = user_context["filters"].concat();
                if(remove_filters)
                {
                    for(let i in remove_filters)
                    {
                        let attribute = remove_filters[i].key;
                        let values = remove_filters[i].values;
                        if(attribute=="discount_price" || attribute=="discount_percent")
                        {
                            for(let cf in context_filters)
                            {
                                let cf_key = Object.keys(context_filters[cf])[0];
                                if(cf_key=="range")
                                {
                                    if(context_filters[cf]["range"].hasOwnProperty(attribute))
                                    {
                                        context_filters.splice(cf, 1);
                                        break;
                                    }
                                }
                            }
                        }
                        else
                        {
                            for(let j in values)
                            {
                                let val = values[j];
                                for(let cf in context_filters)
                                {
                                    let cf_key = Object.keys(context_filters[cf])[0];
                                    if(cf_key=="product_filter."+attribute && context_filters[cf][cf_key]==val)
                                    {
                                        context_filters.splice(cf, 1);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                let filters = [];
                if(added_filters)
                {
                    for(let i in added_filters)
                    {
                        let key = added_filters[i].key,values = added_filters[i].values;
                        if(key=="discount_price")
                        {
                            let numbers = values[0].match(/[-]{0,1}[\d.]*[\d]+/g);
                            let obj = {"range":{"product_filter.discount_price":{}}};
                            if(numbers.length==2)
                            {
                                obj.range["product_filter.discount_price"].gte = numbers[0];
                                obj.range["product_filter.discount_price"].lte = numbers[1];
                            }
                            else
                            {
                                obj.range["product_filter.discount_price"].gte = numbers[0];
                            }
                            filters.push(obj);
                        }
                        else if(key=="discount_percent")
                        {
                            let percentage = values[0].match(/[-]{0,1}[\d.]*[\d]+/g);
                            let obj = {"range":{"product_filter.discount_percent":{}}};

                            if(values[0].indexOf("more")!=-1)
                            {
                                obj.range["product_filter.discount_percent"].gte = percentage[0];
                            }
                            else
                            {
                                obj.range["product_filter.discount_percent"].lte = percentage[0];
                            }
                            filters.push(obj);
                        }
                        else
                        {
                            for(let j in values)
                            {
                                let obj = {};
                                obj["product_filter."+key] = values[j];
                                filters.push(obj);
                            }
                        }
                    }
                }
                user_context["filters"] = filters.concat(context_filters);
                if(!user_context["filters"]||user_context["filters"].length==0)
                    user_context["filters_status"] = false;
                let last_message = user_context["previous_user_messages"].pop();
                console.log("previous_user_messages",last_message["type"]);
                if(last_message["type"]!="filters_question")
                {
                    //console.log("Filters:",user_context["filters"]);
                    let user_message = last_message["message"];
                    user_context["unanswered_question"]=last_message["type"];
                    user_context["previous_question_needed_entities"] = last_message["entities"]
                    console.log("user_context[unanswered_question]",user_context["unanswered_question"]);
                    Sessions.storeContext(sessionId, user_context);
                    //console.log("context1",user_context);
                    Fashion_Bot.processingMessage(sessionId, user_message);
                    return;
                }
                else
                {
                    user_context["unanswered_question"] = last_message["type"];
                    user_context["previous_question_needed_entities"] = last_message["entities"]
                    user_context["previous_user_messages"].push(last_message);
                    Sessions.storeContext(sessionId, user_context);
                    helper.getTotalProducts(sessionId, function(total_products)
                    {
                        let display_product_count_message = Bot_Questions.displayProductCount(total_products, sessionId);
                        FB.sendRequest(sessionId, display_product_count_message);
                    });
                }
            }
    	}
        else if(previous_message["type"]=="continueStatusQuestion")
        {
            console.log()
            user_context["continue_chat_status"] = false;
           /* user_context["unanswered_question"] = "continueStatusQuestion";*/
            let last_message = user_context["previous_user_messages"].pop();
            user_context["question_number"]--;
            Sessions.storeContext(sessionId, user_context);
            if(last_message.type=="user_typed_message")
            {
                Sessions.storeContext(sessionId, user_context);
                let user_message = last_message["message"];
                console.log("continueStatusQuestion",last_message);
                Fashion_Bot.processingMessage(sessionId, user_message, event_time);
                return;
            }
            else
            {
                user_context["question_number"]++;
                //user_context["previous_question_needed_entities"] = last_message["entities"]
                user_context["previous_user_messages"].push(last_message);
                Sessions.storeContext(sessionId, user_context);
                
            }
        }
        else if(previous_message["type"]=="preference_status_question")
        {
            user_context["continue_chat_status"] = false;
            if(previous_message["answers"]=="add_preferences")
            {
                user_context["question_queue"] = [];
                let further_proceed = Bot_Questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
                user_context["bot_messages"].push(further_proceed);
                user_context["unanswered_question"] = "preference_status_question";
                user_context["previous_question_needed_entities"] = previous_message["entities"]
                Sessions.storeContext(sessionId, user_context);
                Fashion_Bot.sendBotMessages(sessionId);   
            }
            else if(previous_message["answers"]=="check_deals")
            {
                let further_proceed = Bot_Questions.proceedFurtherQuestion(sessionId, user_context.hasOwnProperty("deals"));
                user_context["bot_messages"].push(further_proceed);
                user_context["unanswered_question"] = "preference_status_question";
                user_context["previous_question_needed_entities"] = previous_message["entities"]
                Sessions.storeContext(sessionId, user_context);
                Fashion_Bot.sendBotMessages(sessionId);
            }
            return;
        }
        else if(previous_message["type"]=="profile_intrest")
        {
            user_context["user_profile"]["available"] = false;
            user_context["user_profile"]["profile_status"] = false;
            user_context["user_profile"]["concern_status"] = false;
            if(previous_message["message"]=="no")
            {
                user_context["user_profile"]["skip_status"] = false;    
            }
            user_context["previous_question_needed_entities"] = previous_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.askUserProfileIntrestedQuestion(sessionId);
            return;
        }
        else if(previous_message["type"]=="occasionStatusQuestion")
        {
            user_context["is_user_wants_occasion"] = false;
            if(previous_message["answers"]=="no")
            {
                user_context["occasion_status"] = false;
            }
            user_context["previous_question_needed_entities"] = previous_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.askOccasionQuestion(sessionId)
            return;
        }
        else if(previous_message["type"]=="ageQuestion")
        {
            let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
            let age_profile_value = user_context["user_profile"]["age"];

            user_context["user_profile"]["available"] = false;
            user_context["user_profile"]["age_status"] = false;

            let age_benefit = word_mapping[product_line]["age"][age_profile_value]["entity_key"];
            let benefit_index = user_context["benefits"].indexOf(age_benefit);
            if(benefit_index!=-1)
                user_context["benefits"].splice(benefit_index, 1);
            user_context["previous_question_needed_entities"] = previous_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.askUserProfileQuestion(sessionId);
            return;
        }
        else if(previous_message["type"]=="heightQuestion")
        {
            let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
            let height_value = user_context["user_profile"]["height"];
            let height_benefit = word_mapping[product_line]["height"][height_value]["entity_key"];
            let benefit_index = user_context["benefits"].indexOf(height_benefit);
            user_context["user_profile"]["height_status"] = false;
            if(benefit_index!=-1)
                user_context["benefits"].splice(benefit_index, 1);
            user_context["previous_question_needed_entities"] = previous_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.askUserProfileQuestion(sessionId);
            return;
        }
        // else if(previous_message["type"]=="about_me")
        // {
        //     Fashion_Bot.welcomeMessage(sessionId,user_context["username"]);
        // }
        else if(previous_message["type"]=="skintoneQuestion")
        {
            let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
            let skintone_value = user_context["user_profile"]["skintone"];
            let skintone_benefit = word_mapping[product_line]["skintone"][skintone_value]["entity_key"];
            let benefit_index = user_context["benefits"].indexOf(skintone_benefit);
            user_context["user_profile"]["skintone_status"] = false;
            if(benefit_index!=-1)
                user_context["benefits"].splice(benefit_index, 1);
            user_context["previous_question_needed_entities"] = previous_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.askUserProfileQuestion(sessionId);
            return;
        }
        else if(previous_message["type"]=="bodyshapeQuestion")
        {
            let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
            let bodyshape_value = user_context["user_profile"]["bodyshape"];
            let bodyshape_benefit = word_mapping[product_line]["bodyshape"][bodyshape_value]["entity_key"];
            let benefit_index = user_context["benefits"].indexOf(bodyshape_benefit);
            user_context["user_profile"]["bodyshape_status"] = false;
            if(benefit_index!=-1)
                user_context["benefits"].splice(benefit_index, 1); 
            user_context["previous_question_needed_entities"] = previous_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.askUserProfileQuestion(sessionId);
            return;
        }
        else if(previous_message["type"]=="bodyConcernQuestion")
        {
            removeBodyConcernDetailsFromContext(sessionId, previous_message["answers"])
            user_context["user_profile"]["concern_status"] = false;
            user_context["previous_question_needed_entities"] = previous_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.askBodyConcernQuestion(sessionId);
            return;
        }
    	else if(previous_message["type"]=="userProfileStatusQuestion")
    	{
    		processUserProfileStatusQuestion(sessionId, previous_message["answers"][0]);
            user_context["previous_question_needed_entities"] = previous_message["entities"]
            Sessions.storeContext(sessionId, user_context);
    		Offline_Bot.sendProductsToUser(sessionId);
            //Offline_Bot.sendBenefitsToUser(sessionId);
            Offline_Bot.sendAppliedValues(sessionId);

    		Fashion_Bot.checkUserProfileStatus(sessionId);
    		return;
    	}
    	else if(previous_message["type"]=="broadOccasionQuestion" || previous_message["type"]=="occasionQuestion")
    	{
    		user_context["occasion_status"] = false;
            console.log()
    		let last_message = user_context["previous_user_messages"].pop();
    		if(last_message.type=="occasionStatusQuestion" || last_message.type=="broadOccasionQuestion")
    		{
    			let user_message = last_message["message"];
                user_context["unanswered_question"]=last_message["type"];
                user_context["previous_question_needed_entities"] = last_message["entities"]
                Sessions.storeContext(sessionId, user_context);
    			Fashion_Bot.processingMessage(sessionId, user_message);
    			return;
    		}
    		else
    		{
    			user_context["previous_user_messages"].push(last_message);
    		}
    	}
    	else if(previous_message["type"]=="preEndQuestion")
    	{
    		processPreEndQuestion(sessionId, previous_message["answers"][0]);
    		Fashion_Bot.askPreEndQuestion(sessionId);
    		return;
    	}
    	else if(previous_message["type"]=="refineListQuestion")
        {
            processRefineList(sessionId, previous_message);

            let last_message = user_context["previous_user_messages"].pop();
            console.log(last_message["type"]);
            if(last_message["type"]=="refineListQuestion")
            {
                processRefineList(sessionId, last_message);
                let selected_option_details =
                {
                    type : "refineListQuestion",
                    answers : last_message["answers"],
                    entities : last_message["entities"]
                };
                user_context["previous_question_needed_entities"] = last_message["entities"];
                console.log("Current Question Queue : ", user_context["question_queue"]);
                Sessions.storeContext(sessionId, user_context);
                Fashion_Bot.processingUserAnswer["refineListQuestion"](sessionId, last_message["answers"], selected_option_details);
            }
            else
            {
                user_context["previous_user_messages"].push(last_message);
                user_context["prev_questions_queue"] = ["customize"];
                user_context["previous_question_needed_entities"] = last_message["entities"];
                let message = last_message["answers"];
                Sessions.storeContext(sessionId, user_context);
                let selected_option_details = {"type":"preference_status_question", answers:message,entities:last_message["entities"]};
                Fashion_Bot.previous_question_actions["preference_status_question"](sessionId, message);
            }
            return;
        }
        else if(previous_message["type"]=="brand_deals_question")
        {
            if(previous_message["answers"]!="continue chat")
            {
                delete user_context["brand_deal_values"];
                user_context["unanswered_question"] = "brand_deals_question";
                user_context["deals"] = true;
            }
            let brand_deals_status_message = Bot_Questions.brandDealsStatusQuestion(sessionId, "You can check your deals (or) I can further narrow down based on your brand preference","continue chat");
            user_context["bot_messages"].push(brand_deals_status_message);
            user_context["previous_question_needed_entities"] = previous_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.sendBotMessages(sessionId);
            return;
        }
    }
	Sessions.storeContext(sessionId, user_context);
	if(length_of_previous_messages==0)
	{
		let suggestion_message = Bot_Questions.sendSuggestionsMessage();
		FB.sendRequest(sessionId, suggestion_message);
        //Fashion_Bot.welcomeMessage(sessionId,user_context["username"]);
	}
	else
	{
		let last_message = user_context["previous_user_messages"][length_of_previous_messages-1];
		console.log("Before Previous : ",last_message);
		if(last_message["type"]=="userProfileStatusQuestion")
		{
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
			Offline_Bot.sendProductsToUser(sessionId);
			Offline_Bot.sendAppliedValues(sessionId);
			Fashion_Bot.processingUserAnswer["userProfileStatusQuestion"](sessionId, last_message["answers"]);
		}
		else if(last_message["type"]=="profile_question")
		{
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
			Fashion_Bot.processingUserAnswer["bodyProfileQuestion"](sessionId, user_context["user_profile"]);
		}
		else if(last_message["type"]=="body_concerns_question")
		{
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
			Fashion_Bot.processingUserAnswer["bodyConcernQuestion"](sessionId, user_context["user_profile"]["body_concerns"]);
		}
		else if(last_message["type"]=="broadOccasionQuestion" || last_message["type"]=="occasionQuestion")
		{
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
			Offline_Bot.sendProductsToUser(sessionId);
			Offline_Bot.sendAppliedValues(sessionId);
			Fashion_Bot.checkUserProfileStatus(sessionId);
		}
		else if(last_message["type"]=="preEndQuestion")
		{
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
			Offline_Bot.sendProductsToUser(sessionId);
			Offline_Bot.sendAppliedValues(sessionId);
			Fashion_Bot.processingUserAnswer["preEndQuestion"](sessionId, last_message["answers"]);
		}
		else if(last_message["type"]=="refineListQuestion")
		{
			processRefineList(sessionId, last_message);
			let selected_option_details = {
	            type : "refineListQuestion",
	            answers : last_message["answers"],
                entities : last_message["entities"],
	            from : "undo"
	        };
			Fashion_Bot.processingUserAnswer["refineListQuestion"](sessionId, last_message["answers"], selected_option_details);
		}
        else if(last_message["type"]=="brand_deals_question")
        {
            let answer = last_message["answers"];
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.previous_question_actions["brand_deals_question"](sessionId, answer);
        }
        else if(last_message["type"]=="ask_price_question")
        {
            let answer = last_message["answers"];
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.previous_question_actions["ask_price_question"](sessionId, answer);
        }
        else if(last_message["type"]=="profile_intrest" || last_message["type"]=="bodyConcernQuestion")
        {
            let answer = last_message["answers"];
            user_context["unanswered_question"] = last_message["type"];
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.previous_question_actions["profile_intrest"](sessionId, answer);
        }
        else if(last_message["type"]=="continueStatusQuestion")
        {
            let answer = last_message["answers"];
            user_context["unanswered_question"] = last_message["type"];
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.previous_question_actions["continueStatusQuestion"](sessionId, answer);
            //Fashion_Bot.processingUserAnswer["continueStatusQuestion"](sessionId, last_message["answers"]);
        }
        else if(last_message["type"]=="occasionStatusQuestion")
        {
            let answer = last_message["answers"];
            user_context["unanswered_question"] = last_message["type"];
            user_context["previous_question_needed_entities"] = last_message["entities"]
            Sessions.storeContext(sessionId, user_context);
            Fashion_Bot.previous_question_actions["occasionStatusQuestion"](sessionId, answer);
            //Fashion_Bot.processingUserAnswer["continueStatusQuestion"](sessionId, last_message["answers"]);
        }
        else if(last_message["type"]=="ageQuestion"||last_message["type"]=="bodyshapeQuestion"||last_message["type"]=="heightQuestion"||last_message["type"]=="skintoneQuestion")
        {
            Fashion_Bot.askUserProfileQuestion(sessionId);
        }
        // else if(last_message["type"]=="filters_question")
        // {

        //     if(last_message["answers"]=="no")
        //     {
        //         user_context["filters_status"] = false;
        //         user_context["continue_chat_status"] = false;
        //         //last messages and last message is same because last message is not poped and 
        //         let last_messages = user_context["previous_user_messages"].pop();   
        //         let user_message = last_messages["answers"];
        //         user_context["unanswered_question"]=last_messages["type"];
        //         Sessions.storeContext(sessionId, user_context);
        //         Fashion_Bot.processingMessage(sessionId, user_message);
        //         return;
        //     }
        //     else
        //     {
        //         let added_filters = last_message["remove_filters"];
        //         let remove_filters = last_message["added_filters"];
        //         let context_filters = user_context["filters"].concat();
        //         if(remove_filters)
        //         {
        //             for(let i in remove_filters)
        //             {
        //                 let attribute = remove_filters[i].key;
        //                 let values = remove_filters[i].values;
        //                 if(attribute=="discount_price" || attribute=="discount_percent")
        //                 {
        //                     for(let cf in context_filters)
        //                     {
        //                         let cf_key = Object.keys(context_filters[cf])[0];
        //                         if(cf_key=="range")
        //                         {
        //                             if(context_filters[cf]["range"].hasOwnProperty(attribute))
        //                             {
        //                                 context_filters.splice(cf, 1);
        //                                 break;
        //                             }
        //                         }
        //                     }
        //                 }
        //                 else
        //                 {
        //                     for(let j in values)
        //                     {
        //                         let val = values[j];
        //                         for(let cf in context_filters)
        //                         {
        //                             let cf_key = Object.keys(context_filters[cf])[0];
        //                             if(cf_key=="product_filter."+attribute && context_filters[cf][cf_key]==val)
        //                             {
        //                                 context_filters.splice(cf, 1);
        //                                 break;
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //         let filters = [];
        //         if(added_filters)
        //         {
        //             for(let i in added_filters)
        //             {
        //                 let key = added_filters[i].key,values = added_filters[i].values;
        //                 if(key=="discount_price")
        //                 {
        //                     let numbers = values[0].match(/[-]{0,1}[\d.]*[\d]+/g);
        //                     let obj = {"range":{"product_filter.discount_price":{}}};
        //                     if(numbers.length==2)
        //                     {
        //                         obj.range["product_filter.discount_price"].gte = numbers[0];
        //                         obj.range["product_filter.discount_price"].lte = numbers[1];
        //                     }
        //                     else
        //                     {
        //                         obj.range["product_filter.discount_price"].gte = numbers[0];
        //                     }
        //                     filters.push(obj);
        //                 }
        //                 else if(key=="discount_percent")
        //                 {
        //                     let percentage = values[0].match(/[-]{0,1}[\d.]*[\d]+/g);
        //                     let obj = {"range":{"product_filter.discount_percent":{}}};

        //                     if(values[0].indexOf("more")!=-1)
        //                     {
        //                         obj.range["product_filter.discount_percent"].gte = percentage[0];
        //                     }
        //                     else
        //                     {
        //                         obj.range["product_filter.discount_percent"].lte = percentage[0];
        //                     }
        //                     filters.push(obj);
        //                 }
        //                 else
        //                 {
        //                     for(let j in values)
        //                     {
        //                         let obj = {};
        //                         obj["product_filter."+key] = values[j];
        //                         filters.push(obj);
        //                     }
        //                 }
        //             }
        //         }
        //         user_context["filters"] = filters.concat(context_filters);
        //         if(!user_context["filters"]||user_context["filters"].length==0)
        //             user_context["filters_status"] = false;
        //         let last_messages = user_context["previous_user_messages"].pop();
        //         console.log("previous_user_messages",last_message["type"])
        //         if(last_messages["type"]!="filters_question")
        //         {
        //             //console.log("Filters:",user_context["filters"]);
        //             let user_message = last_messages["message"];
        //             user_context["unanswered_question"]=last_messages["type"];
        //             console.log("user_context[unanswered_question]",user_context["unanswered_question"]);
        //             Sessions.storeContext(sessionId, user_context);
        //             //console.log("context1",user_context);
        //             Fashion_Bot.processingMessage(sessionId, user_message);
        //             return;
        //         }
        //         else
        //         {
        //             user_context["unanswered_question"] = last_messages["type"];
        //             user_context["previous_user_messages"].push(last_messages);
        //             Sessions.storeContext(sessionId, user_context);
        //             helper.getTotalProducts(sessionId, function(total_products)
        //             {
        //                 let display_product_count_message = Bot_Questions.displayProductCount(total_products, sessionId);
        //                 FB.sendRequest(sessionId, display_product_count_message);
        //             });
        //         }
        //     }
        // }
	}
}
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
function removeProfileDetailsFromContext(sessionId, profile_values)
{
	let user_context = Sessions.getContext(sessionId);
	let product_line = Mapping.product_line_to_db_keys[user_context["product_line"]];
	let product_line_words = word_mapping[product_line];
	user_context["user_profile"]["profile_status"] = false;
	profile_values.forEach(function(a){
		let benefit_value = product_line_words[a][user_context["user_profile"][a]]["entity_key"];
		let benefit_index = user_context["benefits"].indexOf(benefit_value);
		if(benefit_index!=-1)
			user_context["benefits"].splice(benefit_index, 1);
	});
	Sessions.storeContext(sessionId, user_context);
}
function removeBodyConcernDetailsFromContext(sessionId, body_concerns)
{
	let user_context = Sessions.getContext(sessionId);
	let product_line = Mapping.product_line_to_db_keys[user_context["product_line"]];
	let product_line_words = word_mapping[product_line];
	user_context["user_profile"]["concern_status"] = false;
	body_concerns.forEach(function(a){
		a = a.toLowerCase();
		try{
			let benefit_value = product_line_words["body_concern"][a]["benefit_key"];
			let benefit_index = user_context["benefits"].indexOf(benefit_value);
			console.log(benefit_index)
			if(benefit_index!=-1)
				user_context["benefits"].splice(benefit_index, 1);
		}catch(e){};
	});
	Sessions.storeContext(sessionId, user_context);
}
function processUserProfileStatusQuestion(sessionId, answer)
{
	let user_context = Sessions.getContext(sessionId);
	if(answer =="its_me")
	{
		user_context["user_profile"]["profile_status"] = false;
		user_context["user_profile"]["concern_status"] = false;
		let user_profile = JSON.parse(JSON.stringify(user_context["user_profile"]));
		let body_concerns = user_profile["body_concerns"].concat();
		delete user_profile["body_concerns"];
		delete user_profile["profile_status"];
		delete user_profile["concern_status"];
		delete user_profile["status"];

		let profile_values = Object.keys(user_profile);
		removeProfileDetailsFromContext(sessionId, profile_values);
		removeBodyConcernDetailsFromContext(sessionId, body_concerns);
	}	
	else if(answer=="not_me")
	{

	}
	else
	{
		user_context["user_profile"]["profile_status"] = false;
		user_context["user_profile"]["concern_status"] = false;
	}
	Sessions.storeContext(sessionId, user_context);
}
function processPreEndQuestion(sessionId, answer)
{
	let user_context = Sessions.getContext(sessionId);
	if(answer=="refine_the_list")
	{
		user_context["is_flow_completed"] = false;
		user_context["question_queue"] = [];
		user_context["prev_questions_queue"] = [];
	}
	else if(answer=="give_feed_back")
	{

	}
	Sessions.storeContext(sessionId, user_context);
}
function processRefineList(sessionId, previous_message)
{
    let user_context = Sessions.getContext(sessionId);
    console.log(JSON.stringify(previous_message, null, 2));
    let last_question_asked = previous_message["last_question_asked"];
    let previous_question_queue = previous_message["previous_question_queue"];
    user_context["unanswered_question_refine"] = last_question_asked;
    user_context["question_queue"] = previous_question_queue;
    if(last_question_asked=="customize")
        user_context["question_queue"] = ["customize"];
    let included_values = previous_message["included_values_in_context"];
    for(let i in included_values)
    {
        let obj = included_values[i];
        if(obj["type"]=="adjective")
        {
            let adjective_value = obj["value"];
            let adjective_questions_count_status = obj["adjective_questions_count_status"];
            let adj_index = user_context["adjectives_new"].indexOf(adjective_value);
            if(adjective_questions_count_status)
            {
                user_context["adjective_questions_count"]--;
            }
            if(adj_index!=-1)
                user_context["adjectives_new"].splice(adj_index, 1);
        }
        else
        {
            let benefit_value = obj["value"];
            let benefit_index = user_context["benefits"].indexOf(benefit_value);
            if(benefit_index!=-1)
            {
                user_context["benefits"].splice(benefit_index, 1);
            }
        }
    }
    Sessions.storeContext(sessionId, user_context);
}
module.exports = {
	getUndoState : getUndoState,
    removeEntitiesFromContext : removeEntitiesFromContext
};