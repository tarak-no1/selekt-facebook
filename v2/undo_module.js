const Offline_Bot = require("./offline_bot.js");
const Sessions = require("../public/sessions.js");
const Bot_Questions = require("./bot_questions.js");
const Fashion_Bot = require("./fashion_bot.js");
const Mapping = require("../public/mapping.js");

const fs = require("fs");
const word_mapping = JSON.parse(fs.readFileSync("./public/word_mapping.json"));

function getUndoState(sessionId)
{
	let user_context = Sessions.getContext(sessionId);
	console.log("Current Question Number : ", user_context["question_number"]);
	//console.log(JSON.stringify(user_context["previous_user_messages"], null, 2));
	let previous_message = user_context["previous_user_messages"].pop();
	console.log("Length : ", user_context["previous_user_messages"].length);
	user_context["question_number"]--;
	let event_time = new Date().getTime();
	let length_of_previous_messages = user_context["previous_user_messages"].length;
	console.log("Previous Message : ",previous_message);
	if(previous_message["type"]=="user_typed_message")
	{
		user_context = removeEntitiesFromContext(user_context, previous_message["entities"]);
		Sessions.storeContext(sessionId, user_context);
		if(length_of_previous_messages>0)
		{
			let last_message = user_context["previous_user_messages"].pop();
			if(last_message.type=="user_typed_message")
			{
				let user_message = last_message["message"];
				Fashion_Bot.processingMessage(sessionId, user_message, event_time);
				return;
			}
			else if(last_message.type=="someIdentifiedQuestion")
			{
				last_message = user_context["previous_user_messages"].pop();
				let user_message = last_message["message"];
				Fashion_Bot.processingMessage(sessionId, user_message, event_time);
				return;
			}
			else
			{
				user_context["previous_user_messages"].push(last_message);
			}
		}
	}
	else if(previous_message["type"]=="userProfileStatusQuestion")
	{
		processUserProfileStatusQuestion(sessionId, previous_message["answers"][0]);

		Offline_Bot.sendProductsToUser(sessionId);
        //Offline_Bot.sendBenefitsToUser(sessionId);
        Offline_Bot.sendAppliedValues(sessionId);

		Fashion_Bot.checkUserProfileStatus(sessionId);
		return;
	}
	else if(previous_message["type"]=="profile_question")
	{
		removeProfileDetailsFromContext(sessionId, previous_message["selected_profile_values"]);
		Fashion_Bot.askUserProfileQuestion(sessionId);
		return;
	}
	else if(previous_message["type"]=="body_concerns_question")
	{
		removeBodyConcernDetailsFromContext(sessionId, previous_message["selected_body_concern_values"]);
		Fashion_Bot.askBodyConcernQuestion(sessionId);
		return;
	}
	else if(previous_message["type"]=="broadOccasionQuestion" || previous_message["type"]=="occasionQuestion")
	{
		user_context["occasion_status"] = false;
		let last_message = user_context["previous_user_messages"].pop();
		if(last_message.type=="user_typed_message")
		{
			let user_message = last_message["message"];
			Fashion_Bot.processingMessage(sessionId, user_message, event_time);
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
		if(last_message["type"]=="refineListQuestion")
		{
			processRefineList(sessionId, last_message);
			let selected_option_details = {
	            type : "refineListQuestion",
	            answers : last_message["answers"]
	        };
	        console.log("Current Question Queue : ", user_context["question_queue"]);
			Fashion_Bot.processingUserAnswer["refineListQuestion"](sessionId, last_message["answers"], selected_option_details);
		}
		else
		{
			user_context["previous_user_messages"].push(last_message);
			user_context["prev_questions_queue"] = ["customize"];
			user_context["unanswered_question"] = undefined;
			Fashion_Bot.askPreEndQuestion(sessionId);
		}
		return;
	}
	Sessions.storeContext(sessionId, user_context);
	if(length_of_previous_messages==0)
	{
		
		let suggestion_message = Bot_Questions.sendSuggestionsMessage();
		suggestion_message["gif_status"] = false;
		Offline_Bot.sendMessage("suggestions", suggestion_message, sessionId);
	}
	else
	{
		let last_message = user_context["previous_user_messages"][length_of_previous_messages-1];
		console.log("Before Previous : ",last_message);
		if(last_message["type"]=="userProfileStatusQuestion")
		{
			Offline_Bot.sendProductsToUser(sessionId);
			Offline_Bot.sendAppliedValues(sessionId);
			Fashion_Bot.processingUserAnswer["userProfileStatusQuestion"](sessionId, last_message["answers"]);
		}
		else if(last_message["type"]=="profile_question")
		{
			Fashion_Bot.processingUserAnswer["bodyProfileQuestion"](sessionId, user_context["user_profile"]);
		}
		else if(last_message["type"]=="body_concerns_question")
		{
			Fashion_Bot.processingUserAnswer["bodyConcernQuestion"](sessionId, user_context["user_profile"]["body_concerns"]);
		}
		else if(last_message["type"]=="broadOccasionQuestion" || last_message["type"]=="occasionQuestion")
		{
			Offline_Bot.sendProductsToUser(sessionId);
			Offline_Bot.sendAppliedValues(sessionId);
			Fashion_Bot.checkUserProfileStatus(sessionId);
		}
		else if(last_message["type"]=="preEndQuestion")
		{
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
	            from : "undo"
	        };
			Fashion_Bot.processingUserAnswer["refineListQuestion"](sessionId, last_message["answers"], selected_option_details);
		}

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
	user_context["unanswered_question"] = last_question_asked;
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
	getUndoState : getUndoState
};