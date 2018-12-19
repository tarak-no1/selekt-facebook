module.exports = {
	textMessages: function(message)
	{
		let text_message = 
		{
			type : "text",
			reason_status : false,
			gif_status : true,
			message: message
		}
		return text_message;
	},
	noEntitiesMessage: function()
	{
		let sorry_messages = [
			"Sorry, I did not understand your message",
			"Oops, I did not get your message",
			"Sorry, did not get that"
		];
		let sentence = sorry_messages[random(0,sorry_messages.length-1)];
		let message = this.textMessages(sentence);
		message["gif_status"] = false;
		return message;
	},
	makeOptions : function(values)
	{
		let options = [];
		options = values.map(function(val){
			return {
				"key":val,
				"value":val
			}
		});
		return options;
	},
	sendSuggestionsMessage : function()
	{
		let message = this.textMessages("Quick suggestions :"
                    +"\n\t- Tops"
                    +"\n\t- Best deals in dresses"
                    +"\n\t- Jeans under 999"
                    +"\n\t- Dresses for women with tummy"
                    +"\n\t- Pastel color tshirts"
                    +"\n\t- Need a skirt for a date");
        message["question_number"] = 0;
        message.gif_status = false;
        message["end_of_chat"] = false;
        return message;
	},
	inBetweenChatMessage : function(require_message)
	{
		let sentence = "Ok, I am showing you the "+require_message+" in your present list";
		let message = this.textMessages(sentence);
		return message;
	},
	dealsMessage : function(product_line)
	{
		let sentence = "I am showing you the best deals in "+product_line+" considering the price history where the products' current price is equal to its lowest price till date and is also with high discounts";
		sentence = sentence+"\n\nTap on deal tag on product to know more.";
		let message = this.textMessages(sentence);
		return message;
	},
	askProductLineMessage : function() {
		let message = this.textMessages("Which clothing line are you are you looking for? \n(Eg: Dresses, Tops etc)");
		message.gif_status = false;
		return message;
	},
	occasionQuestion : function (broad_occasion, sub_occasions)
	{
		let options = this.makeOptions(sub_occasions);
		let nothing_option = {
			key: "nothing",
			value: "Nothing"
		};
		options.push(nothing_option);

		let question = {
			type: "single_select",
			multi_select: false,
			text: "Anything specific in "+broad_occasion+"?",
			belongs : "occasionQuestion",
			gif_status : false,
			options: options
		}
		return question;
	},
	occasionInfoMessage: function()
	{
		let occasion_info_question = this.textMessages("I can further narrow down your list based on your occasion.");
        return occasion_info_question;
	},
	broadOccasionQuestion : function(product_line, broad_occasions)
	{
		let options = this.makeOptions(broad_occasions);
		let nothing_option = {
			key: "nothing",
			value: "No occasion in my mind"
		};
		options.push(nothing_option);

		let question = {
			type: "single_select",
			multi_select: false,
			text: "Which occasion are you planning to buy "+product_line+" for?",
			belongs : "broadOccasionQuestion",
			gif_status : false,
			options: options
		}
		return question;
	},
	bodyProfileQuestion : function(profile_question_object)
	{
		let question = {
            type : "profile_question",
            text : "Tell us about yourself:",
            belongs : "bodyProfileQuestion",
            gif_status : false,
            options:profile_question_object
        };
        return question;
	},
	bodyProfileReasons: function(reasons)
	{
		let profile_reasons = {
            type: "profile_reasons",
            text: "Your list has been sorted based on profile priority.",
            belongs: "",
            reason_status: false,
            gif_status : true,
            options : reasons
        };
        return profile_reasons;
	},
	bodyConcernQuestion : function(body_concerns_array){
		let question = {
            type : "body_concerns_question",
            text: "Any body concerns that I should be aware of? So that, I can include them to prioritize the list",
            belongs : "bodyConcernQuestion",
            gif_status : false,
            options : body_concerns_array
        };
        return question;
	},
	bodyConcernReasons: function(reasons)
	{
		let concern_reasons = {
            type : "profile_reasons",
            text: "Based on your body concerns",
            belongs: "",
            gif_status : true,
            options : reasons
        };
        return concern_reasons;
	},
	preEndQuestion : function()
	{
		let question = {
	        type: "single_select",
			multi_select: false,
	        text: "Do you want to:",
	        gif_status : false,
	        belongs : "preEndQuestion",
	        options: 
	        [
	            {
	                key:"refine_the_list",
	                value:"Further refine the list"
	            },
	            {
	                key:"give_feed_back",
	                value:"Give feedback"
	            }
	        ]
	    };
	    return question;
	},
	feedbackQuestion: function()
	{
		let feedback_question = 
        {
            type : "feedback_question",
            text : "How was your experience?",
            belongs: "feedbackQuestion",
            gif_status : false,
            options:[
                {
                    "key": "Loved it",
                    "value": "Loved it",
                    "icon_number" : 1 // heart
                },
                {
                    "key": "Bad",
                    "value": "Bad",
                    "icon_number" : 2 // unlike
                },
                {
                    "key": "",
                    "value": "Other",
                    "icon_number" : 3 // edit
                }
            ]
        };
        return feedback_question;
	},
	profileInfoMessage: function()
	{
		let info_message = this.textMessages("I can further prioritize list based on your body profile and body concerns.");
        return info_message;
	},
	userProfileStatusQuestion : function(user_profile)
	{
		let profile_status_question =
        {
            type : "display_body_profile",
            header: "Your profile",
            body : "Age: "+user_profile["age"]+"\nHeight: "+user_profile["height"]+"\nBody Shape: "+user_profile["bodyshape"]+"\nSkintone: "+user_profile["skintone"]+"\nBody concerns: "+(user_profile["body_concerns"].length>0?user_profile["body_concerns"].join(", "):"Nothing"),
            belongs:"userProfileStatusQuestion",
            gif_status : false,
            options : [
                {
                    key:"its_me",
                    value:"It's me!"
                },
                {
                    key:"not_me",
                    value:"Not me"
                },
                {
                    key:"skip",
                    value:"Skip profile"
                }
            ]
        };
        return profile_status_question
	},
	productListReasonMessage: function(user_profile)
	{
		let message = "";
		if((!user_profile.hasOwnProperty("age") && !user_profile.hasOwnProperty("height") && !user_profile.hasOwnProperty("skintone") && !user_profile.hasOwnProperty("bodyshape")) && user_profile["body_concerns"].length==0)
		{
			message = "Done. Your list is sorted based on given needs. You can now check your list";
		}
		else if((user_profile.hasOwnProperty("age") || user_profile.hasOwnProperty("height") || user_profile.hasOwnProperty("bodyshape") || user_profile.hasOwnProperty("skintone")) && user_profile["body_concerns"].length==0)
		{
			message = "Done. Your list is sorted based on body profile and other needs given. You can now check your list";
		}
		else if((!user_profile.hasOwnProperty("age") && !user_profile.hasOwnProperty("height") && !user_profile.hasOwnProperty("skintone") && !user_profile.hasOwnProperty("bodyshape")) && user_profile["body_concerns"].length>0)
    	{
    		message = "Done. Your list is sorted based on body concerns and other needs given. You can now check your list";
    	}
    	else
    	{
    		message = "Done. Your list is sorted based on both body profile and concerns. You can now check your list";
    	}
		let reason_message = this.textMessages(message);
		return reason_message;
	},
	conversationCompleteMessage: function()
	{
		let conversation_message = this.textMessages("We are done!\nPlease view my recommended products!");
		conversation_message.gif_status = false;
		return conversation_message;
	},
	occasionProductlineQuestion: function(occasion, product_lines)
	{
		let values = product_lines.map(function(val)
		{
			return {
				key: occasion+" "+val,
				value: val
			};
		});
		let question = {
			type: "single_select",
			multi_select: false,
			text: "Choose a clothing line for "+occasion,
			gif_status : false,
			belongs : "occasionProductlineQuestion",
			options: values
		};
		return question;
	},
	noProductFoundMessage: function()
	{
		let no_product_message = this.textMessages("Sorry, I have not found any products as per your need.");
		no_product_message.gif_status = false;
		return no_product_message;
	},
	lessProducts: function(products_count)
	{
		let less_products_message = this.textMessages("Sorry, I can not assist you further as there are only "+products_count+" products as per your need");
		less_products_message.gif_status = false;
		return less_products_message;
	},
	noIndianWearMessage: function(){
		let no_indianwear_message = this.textMessages("Sorry, we only assist for women western wear at present. We will include indian wear soon.\n\nWhat do you want to shop in women western wear?");
		no_indianwear_message["gif_status"] = false;
		return no_indianwear_message;
	},
	someIdentifiedQuestion: function(user_message){
		let question = {
			type: "single_select",
			multi_select: false,
			gif_status : false,
			text: "Have I understood it right?",
			belongs : "someIdentifiedQuestion",
			options: [
				{
					key : user_message,
					value : "Yes"
				},
				{
					key : "no",
					value : "No"
				}
			]
		};
		return question;
	},
	occasionConflictQuestion : function(product_line, occasion)
	{
		let conflict_question = {
			type: "single_select",
			multi_select: false,
			gif_status : false,
			text: "I am sorry, I usually don't recommend "+product_line+" for "+occasion+".\nDo you want to see product for?",
			belongs : "occasionConflictQuestion",
			options: [
				{
					key : occasion,
					value : occasion
				},
				{
					key : product_line,
					value : product_line
				},
				{
					key : "restart_chat",
					value : "Restart chat"
				}
			]
		};
		return conflict_question;
	},
	occasionFilterConflictQuestion : function(filters, occasion, product_line)
	{
		let conflict_question = {
			type: "single_select",
			multi_select: false,
			gif_status : false,
			text: "I am sorry, I usually don't recommend "+filters+" "+product_line+" for "+occasion+".\n\nDo you want to see product for?",
			belongs : "occasionFilterConflictQuestion",
			options: [
				{
					key : filters + " " +product_line,
					value : filters + " " +product_line
				},
				{
					key : occasion + " " +product_line,
					value : occasion + " " +product_line
				},
				{
					key : "restart_chat",
					value : "Restart chat"
				}
			]
		};
		return conflict_question;
	},
	greetMessage : function(){
		let greet_message = this.textMessages("Hi, I am your fashion assistant. I can help you in shortlisting clothes as per your need.");
		return greet_message;
	}
};
function random(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}