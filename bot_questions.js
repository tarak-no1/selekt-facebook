const Config = require('./const.js');
module.exports = {
	textMessages: function(txt){
		let message =
		{
			text: txt
		};
		return message;
	},
	getStarted: function()
	{
		let get_started =
		{
			"get_started":{
				"payload":"hi"
			}
		};
		return get_started;
	},
	welcomeBackMessage :function(name)
	{
		let greet_message = {
			"text":"Welcome back "+titleCase(name)+". Hope you are doing well."
		}
		return greet_message;
	},
	introductionMessage: function(name)
	{
		let message = {
			"text":"Hi "+name+". I am Selekt, your Fashion Shopping Assistant. I can assist you in buying women's western wear"
		}
		return message;
	},
	greetMessage : function()
	{
		let greet_message = {
	      "text":"Hello "
	    };
	    return greet_message;
	},
	askNameMessage : function(message_status)
	{
		let ask_name = {
	      text : "What's your name?"
	    };
	    return ask_name;
	},
	beforeSuggestionsMessage : function(user_name)
	{
		let message = {
		 text : "Nice to meet you "+titleCase(user_name)+"! "
		}
		return message; 
	},
	sendSuggestionsMessage : function()
	{
		// let message = {
		// 	text : "You can ask me queries like \n\n- Tops\n- Best deals in dresses\n- Jeans under 999\n- Dresses for women with tummy\n- Pastel color tshirts\n- Need a skirt for a date"
  //          };
		// let message = {
		// 	text : "I can help you buy women tops. You can ask me queries like \n\n- Tops\n- Best deals in Tops\n- Tops under 999\n- Tops for women with tummy\n- Pastel color Tops\n- Need a Top for a date"
  //       };
        let message = {
			text : "I can help you buy women tops. You can ask me queries like \n\n- Tops\n- Tops under 999\n- Tops for women with tummy\n- Pastel color Tops\n- Need a Top for a date"
        };

        return message;
	},
	afterSuggestionsMessage : function()
	{
		let message = {
			text : "What do you want to shop today?"
		}
		return message;
	},
	noIndianWearMessage: function(){
		// let message = { 
		// 	text: "Sorry, we only assist for women western wear at present. We will include indian wear soon.\n\nWhat do you want to shop in women western wear?"
		// };
		let message = { 
			text: "Sorry, I can only help you buy Women Tops. We will include other categories soon.\n\nWhat do you want to shop in Women Tops?"
		};
		return message;
	},
	thankMessage : function(user_name){
		let message ={
			text : "Thanks a lot for providing these details "+titleCase(user_name)
		}
	},
	dealsMessage : function(product_line)
	{
		let sentence = "I am showing you the best deals in "+titleCase(product_line)+" considering the price history where the products' current price is equal to its lowest price till date and is also with high discounts";
		sentence = sentence+"\n\nTap on deal tag on product to know more.";
		let message = {
			text : sentence
		}
		return message;
	},
	helpMessage : function()
	{
		let sentence = "You can type \"clear\" or \"start again\" to start a new session.\n\nKindly follow the options in each question to help me understand better."
		let message = {
			text : sentence
		}
		return message;
	},
	resetMessage: function()
	{
		let message = {
			"text": "Ok, we will start again"
		};
		return message;
	},
	inBetweenChatMessage : function(require_message)
	{
		let sentence = "Ok, I am showing you the "+require_message+" in your present list";
		let message = {
			text : sentence
		}
		return message;
	},
	dealsMessage : function(product_line)
	{
		let sentence = "I am showing you the best deals in "+titleCase(product_line)+" considering the price history where the products' current price is equal to its lowest price till date and is also with high discounts";
		sentence = sentence+"\n\nTap on deal tag on product to know more.";
		let message ={
			text : sentence
		}
		return message;
	},
	askProductLineMessage : function() {
		let sentence = "Which clothing line are you are you looking for? \n(Eg: Dresses, Tops etc)";
		let message ={
			text : sentence
		}
		return message;
	},
	noEntitiesMessage: function()
	{
		let sorry_messages = [
			"Sorry, I did not understand your message. Let's try again",
			"Oops, I did not get your message. Let's try again",
			"Sorry, I did not get that. Let's try again"
		];
		let sentence = sorry_messages[random(0,sorry_messages.length-1)];
		let message ={
			text : sentence
		}
		return message;
	},
	profileSummaryQuestion : function(profile)
	{
		let message = {
			"text": "Here is your profile summary\nAge: "+profile.ageInYears+"\nBody Shape: "+profile.bodyshape+"\nSkin Tone: "+profile.skintone+"\nHeight: "+profile.height+"\nBody Concerns: "+profile["body_concerns"].join(',')
		}
		return message;
	},
	profileConfirmationQuestion : function()
	{
		let messageData =
		{
			"attachment":{
		    	"type":"template",
		      	"payload":{
			        "template_type":"button",
			        "text":"Is this you?",
			        "buttons":[
			           {
			              "type" : "postback",
			              "title": "It's me",
			              "payload":"its_me"
			            },
			            
			              {
			              "type" : "postback",
			              "title": "Not me",
			              "payload":"not_me"
			            },
			              {
			              "type" : "postback",
			              "title": "Skip",
			              "payload":"skip"
			            },
			        ]
			    }
		    }
		}
		return messageData;
	},
	occasionInfoMessage: function(products_count,user_name)
	{
		let sentence = "Alright! Help me with a few answers and I can recommend some great Styles.";
        let message ={
			text : sentence
		}
		return message;
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
		
			
		let text = "Choose a clothing line for "+occasion
			
		return this.sendQuickRepliesMessage(text,values);
	},
	productListReasonMessage: function(user_name,user_profile)
	{
		let sentence = "";
		if(((!user_profile.hasOwnProperty("age") && !user_profile.hasOwnProperty("height") && !user_profile.hasOwnProperty("skintone") && !user_profile.hasOwnProperty("bodyshape")) && user_profile["body_concerns"].length==0)||(user_profile.skip_status))
		{
			sentence = "Thanks "+ titleCase(user_name) +"!"; 
		}
		else
		{
			sentence = "Thanks "+ titleCase(user_name) +"! I have picked suitable styles and sorted them based on your Body Profile.";
		}
		// if(((!user_profile.hasOwnProperty("age") && !user_profile.hasOwnProperty("height") && !user_profile.hasOwnProperty("skintone") && !user_profile.hasOwnProperty("bodyshape")) && user_profile["body_concerns"].length==0)||(user_profile.skip_status))
		// {
		// 	sentence = "Thanks for providing these details "+user_name+". Your list is sorted based on given needs. You can check your list\n or \nNow that I know about you, I can help you in selecting filters to further narrow down.";
		// }
		// else if((user_profile.hasOwnProperty("age") || user_profile.hasOwnProperty("height") || user_profile.hasOwnProperty("bodyshape") || user_profile.hasOwnProperty("skintone")) && user_profile["body_concerns"].length==0)
		// {
		// 	sentence = "Thanks for providing these details "+user_name+". Your list is sorted based on body profile and other needs given. You can check your list\n or \nNow that I know about you, I can help you in selecting filters to further narrow down.";
		// }
		// else if(((!user_profile.hasOwnProperty("age") && !user_profile.hasOwnProperty("height") && !user_profile.hasOwnProperty("skintone") && !user_profile.hasOwnProperty("bodyshape")) && user_profile["body_concerns"].length>0)||(user_profile.skip_status&&user_profile["body_concerns"].length>0))
  //   	{
  //   		sentence = "Thanks for providing these details  "+user_name+". Your list is sorted based on body concerns and other needs given. You can check your list\n or \nNow that I know about you, I can help you in selecting filters to further narrow down.";
  //   	}
  //   	else
  //   	{
  //   		sentence = "Thanks for providing these details  "+user_name+". Your list is sorted based on both body profile and concerns. You can check your list\n or \nNow that I know about you, I can help you in selecting filters to further narrow down.";
  //   	}
		let message ={
			text : sentence
		}
		return message;
	},
	conversationCompleteMessage: function(sessionId)
	{
		let sentence = "We are done!\nPlease view my recommended products!";
		let message ={
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":sentence,
		        "buttons":[
		            {
		              "type" : "web_url",
		              "title": "Check list",
		              "url":" https://www.prodx.in/fashion_bot/products_list?id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            },
		            {
		            	"type" : "postback",
		            	"title" : "Give Feedback",
		            	"payload" : "feedback"  
		            }
		        ]
		      }
		    }
		}
		return message;
	},
	noProductFoundMessage: function()
	{
		let no_product_message = "Sorry! I didn't find any styles matching your request.";
		let message ={
			text : no_product_message
		}
		return message;
	},
	lessProducts: function(sessionId, products_count)
	{
		let less_products_message = "Sorry, I can not assist you further as there are only "+products_count+" products as per your need";
		let message ={
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":less_products_message,
		        "buttons":[
		            {
		              "type" : "web_url",
		              "title": "Check list",
		              "url":" https://www.prodx.in/fashion_bot/products_list?id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            },
		            {
		              "type" : "web_url",
		              "title": "Check Latest Trends",
		              "url":" https://www.prodx.in/fashion_bot/trends?id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            },
		            {
		            	"type" : "postback",
		            	"title" : "Give Feedback",
		            	"payload" : "feedback"  
		            }
		        ]
		      }
		    }
		}
		return message;
	},
	occasionConflictQuestionText : function(product_line, occasion)
	{
		let sentence = "I am sorry, I usually don't recommend "+product_line+" for "+occasion+".";
		let message ={
			text : sentence
		} 
		return message;
	},
	occasionFilterConflictQuestionText : function(filters, occasion, product_line)
	{
		let sentence = "I am sorry, I usually don't recommend "+filters+" "+product_line+" for "+occasion+".";
		let message ={
			text : sentence
		} 
		return message;
	},
	occasionFilterConflictQuestionButton : function(filters, occasion, product_line)
	{
		
		let	text= "Do you want to see product for?"
		let options = [filters + " " +product_line,occasion + " " +product_line]
		return this.sendButtonMessage(text,options);
	},
	occasionConflictQuestionButton : function(product_line,occasion)
	{
		let text = "Do you want to see product for?";
		//belongs : "occasionConflictQuestion",
		let options = [product_line,occasion]
		return this.sendButtonMessage(text,options);
	},
	occasionQuestion : function(broad_occasion,sub_occasions){
		let is_there = false;
		for(i=0;i<sub_occasions.length;i++)
		{
			if(sub_occasions[i]=="Nothing")
				is_there = true;
		}
		if(!is_there)
			sub_occasions.push("Nothing")
		// let nothing_option = {
		// 	key: "nothing",
		// 	value: "Nothing"
		// };
		// sub_occasions.push(nothing_option);
		console.log(sub_occasions)
		let text = "Anything specific in "+broad_occasion+"?";
		return this.sendQuickRepliesMessage(text,sub_occasions);
	},
	checkTrendsQuestion : function(sessionId)
	{
		let messageData = {
		    "attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":"I have picked the latest trends for you. Check those. In case you want to reset the chat. type \"clear\"",
		        "buttons":[
		            {
		              "type" : "web_url",
		              "title": "Check Trends",
		              "url":" https://www.prodx.in/fashion_bot/trends?id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            },
		            {
		            	"type" : "postback",
		            	"title" : "Give Feedback",
		            	"payload" : "feedback"  
		            }
		        ]
		      }
		    }
		  }
		return messageData;
	},
	filterOccasionConflictQuestion : function(filters, occasion, product_line)
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":"How would you like to proceed?",
		        "buttons":[
		           {
		              "type" : "postback",
		              "title": "Show Recommendations",
		              "payload":"suggest_recommended"
		            },
		            
		              {
		              "type" : "postback",
		              "title": "Go as per my likes",
		              "payload":"go_as_per_my_likes"
		            }
		        ]
		      }
		    }
		}
		return messageData;
	},
	yesOrNoQuestion : function(text)
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":text,
		        "buttons":[
		           {
		              "type" : "postback",
		              "title": "YES",
		              "payload":"yes"
		            },
		            
		              {
		              "type" : "postback",
		              "title": "NO",
		              "payload":"no"
		            }
		        ]
		      }
		    }
		}
		return messageData;
	},
	askFiltersQuestion: function(sessionId)
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":"Do you want to filter certain styles?",
		        "buttons":[
		           {
		              "type" : "web_url",
		              "title": "Yes! Add Filters",
		              "url":" https://www.prodx.in/fashion_bot/add_filters?session_id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            },
		            
		              {
		              "type" : "postback",
		              "title": "Style Me",
		              "payload":"no"
		            },
		            {
		              "type" : "web_url",
		              "title": "Check the list first",
		              "url":" https://www.prodx.in/fashion_bot/products_list?id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            },
		        ]
		      }
		    }
		}
		return messageData;
	},
	displayProductCount : function(count,sessionId)
	{
		let messageData = {
		    "attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":"I have got "+ count +" styles matching your request. Check your list.\nContinue Chat in case you want Style Recommendations",
		        "buttons":[
		            {
		              "type" : "postback",
		              "title": "Continue Chat",
		              "payload":"continue_chat"
		            },
		            {
		              "type" : "web_url",
		              "title": "Check list",
		              "url":" https://www.prodx.in/fashion_bot/products_list?id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            },
		            {
		              "type" : "web_url",
		              "title": "Add more Filters",
		              "url":" https://www.prodx.in/fashion_bot/add_filters?session_id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            }
		        ]
		      }
		    }
		  }
		return messageData;
	},
	profileInfoMessage: function()
	{
		let info_message = "I can further sort the list based on your Body Profile.";
        let message ={
			text : info_message
		} 
		return message;
	},
	bodyProfileAgeQuestion : function(user_name)
	{
		let age_message =  "How old are you "+user_name+"? (Give me a number in years)";
		 let message ={
			text : age_message
		} 
		return message;
	},
	bodyProfileHeightQuestion : function()
	{
		let height_message = "What do you feel about your height?";
		let options = ["Short","Tall","Average","Skip"];
			
		return this.sendQuickRepliesMessage(height_message,options)
	},
	bodyProfileSkinTone : function()
	{
		let values = ["Fair","Wheatish","Dusky","Skip"];
		let text ="What is your Skin Tone?";
		return this.sendQuickRepliesMessage(text,values); 
	},
	bodyProfileSkinToneMessage : function()
	{
		let message = {
			"text" : "What is your Skin Tone?"
		}
		return message;
	},
	bodyProfileSkinToneQuestion :function()
	{
		let messageData = {
	    "attachment":{
	      "type":"template",
	      "payload":{
	        "template_type":"generic",
	        "elements":[
	           {
	            "title":"Fair",
	            "image_url": "https://www.prodx.in/fashion_bot/client/fair.jpg",
	            //"subtitle": "that are curvy looking to give a curvy appearance to your body shape",
	            //"image_aspect_ratio":"square",
	            "buttons":[
	              {
	              "type" : "postback",
	              "title": "Fair",
	              "payload":"fair"
	              }      
	            ]      
	          },
	          {
	            "title":"Wheatish",
	            "image_url": "https://www.prodx.in/fashion_bot/client/wheatish.jpg",
	            //"subtitle": "with detailing and bright colors that will take away the attention from mid section",
	            "buttons":[
	               {
	                "type" : "postback",
	                "title": "Wheatish",
	                "payload":"wheatish"
	               }     
	            ]     
	          },
	          {
	            "title":"Dusky",
	             "image_url": "https://www.prodx.in/fashion_bot/client/dusky.jpg",
		           //"subtitle": "that are curvy looking to give a curvy appearance to your body shape",
				       "buttons":[
	               {
	                "type" : "postback",
	                "title": "Dusky",
	                "payload":"dark"
	               }     
	            ]     
	          },
	          {
	            "title":"Skip",
	             "image_url": "http://3nw94z2pgadc432nw33p8qg5.wpengine.netdna-cdn.com/wp-content/uploads/2012/11/wrap-dress.jpg",
	             //"subtitle": "that will lengthen the leg line, giving a vertical appearance. thus highlighting the curves better",
	             "buttons":[
	               {
	                "type" : "postback",
	                "title": "Skip",
	                "payload":"skip"
	               }     
	            ]     
	          }
	        ]
	      }
	    }
	  }
	  return messageData;
	},
	displayReasonMessage: function(text,sessionId, occasion_status, profile_status,concern_status)
	{
		let messageData =
		{
		    "attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "elements":
		        [
			        {
			          "title":text,
			          "buttons":[
			            {
			              "type" : "web_url",
			              "title": "Check list",
			              "url":" https://www.prodx.in/fashion_bot/products_list?id="+sessionId,
			              "webview_height_ratio": "full",
			              "messenger_extensions": true,
			            } 
			          ]
			        }
			    ]
		      }
		    }
		};
		console.log(occasion_status, profile_status)
		if(!occasion_status || (occasion_status && !profile_status))
		{
		  	messageData.attachment.payload.elements[0].buttons.unshift({
		                "type" : "postback",
		                "title": "Continue Chat",
		                "payload":"continue_chat"
		    });
		}
		return messageData;
	},
	continueStatusQuestion : function (sessionId)
	{
		let messageData =
		{
		    "attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "elements":
		        [
			        {
			          "title":"How do you want to proceed further?",
			          "buttons":[
			            {
			              "type" : "web_url",
			              "title": "Check list",
			              "url":" https://www.prodx.in/fashion_bot/products_list?id="+sessionId,
			              "webview_height_ratio": "full",
			              "messenger_extensions": true,
			            },
			            {
			            	"type" : "postback",
			                "title": "Continue Chat",
			                "payload":"continue_chat"
			            } 
			          ]
			        }
			    ]
		      }
		    }
		};
		return messageData;
	},
	proceedFurtherQuestion : function(sessionId, deals_status)
	{
		let messageData = {
		    "attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":"If you further want to refine your list, click on \"Continue Chat\".",
		        "buttons":[
		        	{
		              "type" : "web_url",
		              "title": "Check list",
		              "url":"https://www.prodx.in/fashion_bot/products_list?id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            },
		            {
		              "type" : "postback",
		              "title": "Continue Chat",
		              "payload" : "add_preferences"
		            }
		            
		        ]
		      }
		    }
		  };
		// if(!deals_status)
		// {
		// 	let obj = {
		// 		"type" : "postback",
		// 		"title": "Check Deals in list",
		// 		"payload":"check_deals"
  //           };
  //           messageData.attachment.payload.buttons.push(obj);
		// }
		return messageData;
	},
	bodyProfileShapeMessage : function()
	{
		let message = {
			"text" : "What Body Shape describes you best?"
		}
		return message;
	},
	makeAdjModuleQuestion : function(response,product_line,sessionId)
	{
		let options = response["options"];
		let elements_array=[];
		options.forEach(function(value){
			if(value.products_count>0)
			{
				elements_array.push({
		            "title":value.value+' ('+value.products_count+')',
		            //"image_url":value.image_url,
		            //"image_aspect_ratio":"square",
		            "buttons":[
		            	{
		               		"type" : "web_url",
							"title": "Learn more",
							"url":"https://www.prodx.in/fashion_bot/adjective_reason?product_line="+product_line+"&&adjective_value="+value.adjective_value,
							"webview_height_ratio": "tall",
							"messenger_extensions": true,
		               },    
		               {
			              "type" : "postback",
			              "title": value.value,
			              "payload":value.key
		               }
		                 
		            ]      
				});
			}
		});
		let select_multiple = {
	            "title":"Select multiple",
	            //"image_url":"https://www.whitehouseblackmarket.com/Product_Images/570215271_001.jpg?output-quality=85",
	            //"image_aspect_ratio":"square",
	            "buttons":[
	            	{
	               		"type" : "web_url",
			            "title": "Select multiple",
			            "url":"https://www.prodx.in/fashion_bot/refine_the_list?id="+sessionId+"&&type=adjective_module",
			            "webview_height_ratio": "tall",
			            "messenger_extensions": true
	               }
	            ]
			}
		elements_array.push(select_multiple);
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "image_aspect_ratio":"square",
		        "elements":elements_array
		      }
		    }
		 }
		 return messageData;
	},
	bodyProfileShapeQuestion : function()
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "image_aspect_ratio":"square",
		        "elements":[
		           {
		            "title":"What is Hourglass Shape?",
		            //"image_url": "https://www.prodx.in/fashion_bot/client/hourglass_cut.png",
		            "subtitle": "The bust and hips are basically the same size and your waist is well defined",
		            //"image_aspect_ratio":"square",
		            "buttons":[
		              {
		              "type" : "postback",
		              "title": "Hour glass",
		              "payload":"hourglass"
		              }      
		            ]      
		          },
		          {
		            "title":"What is Apple Shape?",
		            //"image_url": "https://www.prodx.in/fashion_bot/client/apple_cut.jpg",
		            "subtitle": "Waist is larger than bust and hips. The hips are narrow compared to shoulders",
		            "buttons":[
		               {
		                "type" : "postback",
		                "title": "Apple",
		                "payload":"apple"
		               }     
		            ]     
		          },
		          {
		             "title":"What is a Rectangle Shape?",
		             //"image_url": "https://www.prodx.in/fashion_bot/client/rectangle_cut.png",
			           "subtitle": "Bust and hips are basically the same size. Waist is only slightly slimmer",
					       "buttons":[
		               {
		                "type" : "postback",
		                "title": "Rectangle",
		                "payload":"rectangle"
		               }     
		            ]     
		          },
		          {
		             "title":"What is Pear Shape?",
		             //"image_url": "https://www.prodx.in/fashion_bot/client/pear_body_cut.png",
		             "subtitle": "Hips are larger than busts, and the waist gradually slopes out to the hips",
		             "buttons":[
		               {
		                "type" : "postback",
		                "title": "Pear",
		                "payload":"pear"
		               }     
		            ]     
		          },
		          {
		             "title":"Skip",
		             //"image_url": "https://www.prodx.in/fashion_bot/client/pear_body_cut.png",
		             //"subtitle": "The hips are larger than the bust, and the waist gradually slopes out to the hips",
		             "buttons":[
		               {
		                "type" : "postback",
		                "title": "Skip",
		                "payload":"skip"
		               }     
		            ]     
		          }
		        ]
		      }
		    }
		 }
		 return messageData;
	},
	broadOccasionQuestion : function(product_line, broad_occasions)
	{
		// let nothing_option = {
		// 	key: "nothing",
		// 	value: "No occasion in my mind"
		// };
		// broad_occasions.push(nothing_option);
		let text = "What occasion are you buying this for?";
		
		return this.sendQuickRepliesMessage(text,broad_occasions);
	},
	makeButtonOptions : function(values,type,sessionId)
	{
		let options = [];
		let if_type = {
			"type" : "web_url",
            "title": "select multiple",
            "url":"https://www.prodx.in/fashion_bot/refine_the_list?id="+sessionId+"&&type=adjective_module",
            "webview_height_ratio": "tall",
            "messenger_extensions": true,
		}
		console.log(sessionId);
		console.log("values",values);
		for (x in values)
		{
			var option ;
			if(values[x])
			{
				if(!values[x].key)
				{
					option = {
						"type" : "postback", 
						"title": values[x],
						"payload": values[x]
					}
				}
				else
				{
					option = {
						"type" : "postback", 
						"title": values[x].value,
						"payload": values[x].key
					}
				}
			}
			if(option!=undefined)
			{
				options.push(option)
			}
			console.log("option",option)
		}
		if(type=="multi_select")
		{
			console.log("if_type",if_type)
			options.push(if_type);
		}
		
		console.log("options",options)
		return options;
	},
	makeQuickRepliesOptions : function (values)
	{
		let options = [];
		values = values.slice(0,11)
		options = values.map(function(val){

			if(!val.key)
			{
				return {
					"content_type" : "text", 
					"title": val,
					"payload": val
				}
			}
			else
			{
				return {
					"content_type" : "text", 
					"title": val.value,
					"payload": val.key
				}
			}
		});
		return options;
	},
	sendButtonMessage : function(text,values)
	{
		 let messageData = {
		    "attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":text,
		        "buttons": this.makeButtonOptions(values)
		      }
		    }
		  }
	 return messageData;
	},
	okButtonQuestion : function(text)
	{
		let values = [{
			key :"ok",
			value : "OK"
		}]
		let messageData = this.sendButtonMessage(text,values)
		return messageData;
	},
	feedBackQuestion : function()
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":"How was your experience?",
		        "buttons":[
		           {
		              "type" : "postback",
		              "title": "Loved it",
		              "payload":"loved_it"
		            },
		            
		              {
		              "type" : "postback",
		              "title": "Bad",
		              "payload":"bad"
		            },
		              {
		              "type" : "postback",
		              "title": "Other",
		              "payload":"other"
		            },
		        ]
		      }
		    }
		}
		return messageData;
	},
	preEndQuestion : function()
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":"Do you want to:",
		        "buttons":[
		           {
		              "type" : "postback",
		              "title": "Refine list",
		              "payload":"refine_the_list"
		            },
		            
		              {
		              "type" : "postback",
		              "title": "Give feedback",
		              "payload":"give_feed_back"
		            }
		        ]
		      }
		    }
		}
		return messageData;
	},
	bodyProfileQuestionReason : function(profile_question_object)
	{
		let messageData = {
            text:profile_question_object
        };
        return messageData;
	},
	sendQuickRepliesMessage : function(text,values)
	{
		let messageData ={
		    "text": text,
		    "quick_replies": this.makeQuickRepliesOptions(values)
		  }
		return messageData;
	},
	askBodyConcernsQuestion : function(text,sessionId)
	{
		let messageData = {
		    "attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "image_aspect_ratio":"square",
		        "elements":
		        [{
		          "title":text,
		          "buttons":[
		            {
		              "type" : "web_url",
		              "title": "Give Body Concerns",
		              "url":"https://www.prodx.in/fashion_bot/bodyconcern?id="+sessionId,
		              "webview_height_ratio": "full",
		              "messenger_extensions": true,
		            },
		            {
		              "type":"postback",
		              "title":"No",
		              "payload":"skip"
		            }
		          ]
		        }]
		      }
		    }
		  }
		 return messageData;
	},
	bodyConcernReasons: function(reasons)
	{
		let message = {      
            text: "Based on your body concerns\n\n"+reasons
        };
        return message;
	},
	customizeQuestion : function(response,sessionId)
	{
		var tile_length = Object.keys(response.options).length;
		var options = response.options.map(function(option){
			console.log("customizeQuestion",option.value)
			return {
				"title" : option.value,
				"buttons" : [
				{
					"type" : "postback",
		            "title": option.value,
		            "payload":option.key
	        	}]
			}
		});
		options.push({
			"title" : "select multiple",
			"buttons" : [
			{
				"type" : "web_url",
	            "title": "select multiple",
	            "url":"https://www.prodx.in/fashion_bot/refine_the_list?id="+sessionId+"&&type=adjective_module",
	            "webview_height_ratio": "tall",
	            "messenger_extensions": true,
        	}]
		});
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "image_aspect_ratio":"square",
		        "elements": options
		      }
		    }
		 }
		 return messageData;
	},
	makeQuestion : function(response,sessionId){
		var type = response.type;
		var button_length = Object.keys(response.options).length;
		var options=[];
		var k=0;
		let messageData;
		console.log("button_length,type",button_length,type)
		for(var i=0;i<=Math.ceil(button_length/3);i++)
		{
			if(k<button_length)
			{
				var len=3;
				var j=0;
			 	options[i]=[];
			 	if(k+3>=button_length)
			 		len=button_length-k;
				for(j;j<len;j++)
				{
					if(k<button_length)
					{
						console.log("k length",k)
					    options[i][j]=response.options[k]
					    k=k+1;
					}
					else
						break;
				}
			}
			else
				break;
		}
		console.log("sessionId in makeQuestion",sessionId);
		console.log(JSON.stringify(options,null,2))
		if(type=="multi_select" )
		{
			if(button_length<3)
			{
				console.log("multi 3")
				messageData=this.threeButtonsMessage(response.text,options,type,sessionId);
			}
			else if(button_length<6 && button_length>=3)
			{
				console.log("multi 6")
				messageData=this.sixButtonsMessage(response.text,options,type,sessionId);
			}
			else if(button_length<9 && button_length>=6)
			{
				console.log("multi 9")
				messageData=this.nineButtonsMessage(response.text,options,type,sessionId);
			}
		}
		else
		{
			if(button_length<=3)
			{
				console.log("single 3")
				messageData=this.threeButtonsMessage(response.text,options,type);
			}
			else if(button_length<=6 && button_length>3)
			{
				console.log("single 6")
				messageData=this.sixButtonsMessage(response.text,options,type);
			}
			else if(button_length<=9 && button_length>6)
			{
				console.log("single 9")
				messageData=this.nineButtonsMessage(response.text,options,type);
			}
		}
		console.log(messageData)
		return messageData;

	},
	threeButtonsMessage : function(text,options,type,sessionId)
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "elements":[
		           {
		            "title":"choose your favourite",
		            "buttons":this.makeButtonOptions(options[0],type,sessionId)  
		          }
		        ]
		      }
		    }
		}
		return messageData;
	},
	sixButtonsMessage : function(text,options,type,sessionId)
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "elements":[
		           {
		            "title":"Swipe left",
		            "buttons":this.makeButtonOptions(options[0],"",sessionId)  
		          },
		          {
		            "title":"Swipe right",
		            "buttons":this.makeButtonOptions(options[1],type,sessionId)  
		          },
		        ]
		      }
		    }
		}
		return messageData;
	},
	nineButtonsMessage : function(text,options,type,sessionId)
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "elements":[
		           {
		            "title":"Swipe left",
		            "buttons":this.makeButtonOptions(options[0],"",sessionId)  
		          },
		          {
		            "title":"Swipe left/right",
		            "buttons":this.makeButtonOptions(options[1],"",sessionId)  
		          },
		          {
		            "title":"Swipe right",
		            "buttons":this.makeButtonOptions(options[2],type,sessionId)  
		          },
		        ]
		      }
		    }
		}
		return messageData;
	},
	someIdentifiedQuestion: function(user_message){
		let messageData = {
		    "attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"button",
		        "text":"Have I understood it right?",
		        "buttons":
		        [
		            {
						"type" : "postback", 
						"title": "Yes",
						"payload": user_message
					},
					{
						"type" : "postback", 
						"title": "No",
						"payload": "no"
					}
			   ]
		      }
		    }
		  }
	 return messageData;
	},
	brandDealsStatusQuestion : function(sessionId,deals_text,deals_option)
	{
		let messageData =
		{
		    "attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "elements":
		        [
			        {
			          "title":deals_text,
			          "buttons":[
			            {
			              "type" : "web_url",
			              "title": "Check list",
			              "url":" https://www.prodx.in/fashion_bot/products_list?id="+sessionId,
			              "webview_height_ratio": "full",
			              "messenger_extensions": true,
			            },
			            {
			          		"type" : "postback",
			                "title": deals_option,
			                "payload":deals_option
			          	}
			          ]
			        }
			    ]
		      }
		    }
		}
		return messageData;
	},
	brandDealsQuestion : function(sessionId)
	{
		let messageData = {
			"attachment":{
		      "type":"template",
		      "payload":{
		        "template_type":"generic",
		        "elements":[
		           {
		            "title":"Premium brands",
		            "subtitle": "eg: And, Vero moda, Mango etc",
		            "buttons":[
		              {
		              "type" : "postback",
		              "title": "Premium brands",
		              "payload":"premium brands"
		              }      
		            ]      
		          },
		          {
		            "title": "High end brands",
		            "subtitle": "eg: Biba, Forever 21, 109f etc.",
		            "buttons": [
		               {
		                "type" : "postback",
		                "title": "High end brands",
		                "payload":"high end brands"
		               }     
		            ]     
		          },
		          {
		            "title":"All brands",
		            "subtitle": "Will consider all brands",
			        "buttons":[
		               {
		                "type" : "postback",
		                "title": "Any brand",
		                "payload":"all brands"
		               }     
		            ]     
		          },
		          {
		            "title":"Select multiple",
		            "subtitle": "Will consider your selections",
			        "buttons":[
		               {
		                "type" : "web_url",
			            "title": "Select multiple",
			            "url":" https://www.prodx.in/fashion_bot/refine_the_list?id="+sessionId+"&&type=deals",
			            "webview_height_ratio": "full",
			            "messenger_extensions": true,
		               }     
		            ]     
		          }
		        ]
		      }
		    }
		}
		return messageData;
	},
	brandDealsReasonMessage : function(selected_values, product_line)
	{
		let sentence = "Ok, I have filtered "+selected_values.join(", ")+" from today's best deals in Myntra, Jabong, Voonik "+titleCase(product_line);
		let message =  this.textMessages(sentence);
		return message;
	},
	setupGetStartedButton : setupGetStartedButton,
	random : random,
};
function setupGetStartedButton(res){
        var messageData = {
                "get_started":[
                {
                    "payload":"GET_STARTED_PAYLOAD"
                }
               ]
        };
         request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ Config.PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            form: messageData
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                res.send(body);

            } else { 
                // TODO: Handle errors
                res.send(body);
            }
        });
    }
function random(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
function titleCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}