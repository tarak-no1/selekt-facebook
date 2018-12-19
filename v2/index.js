const express = require('express');
const Sessions = require('../public/sessions.js');
const global = require('../public/global.js');
const mapping = require('../public/mapping.js');
const elasticSearch = require('../db_config/elasticSearch.js');
const mongo = require('../db_config/mongoQueries');
const filterList = require('./filter-list.js');
const helper = require('./helper.js');
const conversationGraph = require('../public/conversationGraphs');
const offline = require('./offline_bot.js');
const fs = require("fs");
const word_mapping = JSON.parse(fs.readFileSync("./public/word_mapping.json"));
const fashion_bot = require("./fashion_bot.js");
const entity_bot = require("./entity_bot.js");
const autocomplete_es = require("../db_config/autoComplete_ES.js");
const bot_questions = require("./bot_questions.js");
const undo_module = require("./undo_module.js");

module.exports = function(io)
{
    let api = express.Router();

    api.use(function(req, res, next) {
       res.header("Access-Control-Allow-Origin", "*");
       res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
       next();
    });
    global.io = io;
    global.io.on('connection', function (socket) {
        console.log("New socket connection from user in Version 2");
        // new user request from android
        socket.on('add_user', function (data)
        {
            console.log("In Version 2")
            data = JSON.parse(data);
            //console.log("Message on Add User: ", data);
            let sessionId = data["session_id"];
            let deviceId = data["device_id"];
            let username = data["user_name"];
            let user_id = data["user_id"];
            let context = null;
            if(!Sessions.isAndroidSessionExists(sessionId)) 
            {
                socket.emit("clear_chat",{});
                Sessions.CreateSessionAndroid(sessionId, deviceId);
                context = Sessions.getContext(sessionId);
                let user_details = {};
                user_details["device_id"] = deviceId;
                user_details["session_id"] = sessionId;
                user_details["user_id"] = user_id;
                Sessions.createAppSessions(sessionId, user_details);

                //getting inspirations
                helper.get_inspirations(function(result)
                {
                    let data =
                    {
                        type:"inspirations",
                        list : result
                    };
                    console.log("sending Inspiration");
                    socket.emit("browse",data);
                    // Event Storing ========================
                    let insp_result = result.map(function(a){ return a["id"];});
                    let app_event = {"type":"inspiration_response", time : new Date().getTime(), details : insp_result}
                    helper.logger_api_call(sessionId, app_event);
                });
                // Event Storing ========================
                let msg = bot_questions.sendSuggestionsMessage();
                msg["question_number"] = 0;
                socket.emit('suggestions', msg);

                let app_event = {"type":"text","time":new Date().getTime(), chat_id : context["chat_id"]};
                app_event["details"] = msg;
                helper.logger_api_call(sessionId,app_event);
            }
            context = Sessions.getContext(sessionId);

            let user_details = Sessions.getAppSession(sessionId);
            if(Object.keys(user_details).length==0)
            {
                user_details["device_id"] = deviceId;
                user_details["session_id"] = sessionId;
                user_details["user_id"] = user_id;
                Sessions.createAppSessions(sessionId, user_details);
            } 
            else
            {
                if(!user_details.hasOwnProperty("user_id") && !user_id)
                {
                    user_details["user_id"] = user_id;
                    Sessions.createAppSessions(sessionId, user_details);
                }
            }

            global.storeUserSocket(sessionId, socket);
        });
        //new message from the user
        socket.on('user_message', function (data)
        {
            let event_time = new Date().getTime();
            data = JSON.parse(data);
            console.log("============= Message received in v2:============");
            // console.log(data);
            // console.log("=======================================================");

            let sessionId = data['session_id'];
            let deviceId = data["device_id"];
            let user_id = data["user_id"];
            let message = data["message"];
            let type = data["type"];
            if (!Sessions.isAndroidSessionExists(sessionId)) {
                Sessions.CreateSessionAndroid(sessionId, deviceId);   
            }
            global.storeUserSocket(sessionId, socket);

            let context = Sessions.getContext(sessionId);
            context["question_number"]++;
            if(type=="inspiration")
            {
                context = Sessions.clearContext(sessionId);
                context["previous_user_messages"] = [];
            }
            context["list_type"] = type;
            Sessions.storeContext(sessionId, context);

            if(context["unanswered_question"]=="take_feedback")
            {
                fashion_bot.processingUserAnswer["feedbackQuestion"](sessionId, [message]);
                context["unanswered_question"] = undefined;
            }
            else
            {
                fashion_bot.processingMessage(sessionId, message, event_time);  
            }
        });
        //question flow
        socket.on("question_flow",function(data)
        {
            data = JSON.parse(data);
            console.log("User answer");
            //console.log(JSON.stringify(data, null, 2));
            let sessionId = data['session_id'];
            let deviceId = data['device_id'];

            let previous_quesiton_belongs = data["belongs"];
            let answer_keys = data['keys'];

            //storing the current socket of the user
            global.storeUserSocket(sessionId, socket);
            let selected_option_details = {
                type : previous_quesiton_belongs,
                answers : answer_keys
            };
            let context = Sessions.getContext(sessionId);
            console.log("Previous Question number : ", context["question_number"]);
            context["question_number"]++;
            Sessions.storeContext(sessionId, context);
            console.log("Question number : ", context["question_number"]);
            fashion_bot.processingUserAnswer[previous_quesiton_belongs](sessionId, answer_keys, selected_option_details);
        });
        socket.on("update_user_profile", function(data){
            let event_time = new Date().getTime();
            console.log("Updated user profile ------------------------------");
            data = JSON.parse(data);
            //console.log(data);

            let sessionId = data["session_id"];
            global.storeUserSocket(sessionId, socket);

            let type = data["type"];
            let user_profile = {};
            if(data.hasOwnProperty("body_shape") && data["body_shape"]!="")
            {
                let body_shape_value = data["body_shape"].toLowerCase()
                if(body_shape_value!="not provided")
                    user_profile.bodyshape = body_shape_value;
            }
            if(data.hasOwnProperty("skin_color") && data["skin_color"]!="")
            {
                let skin_color_value = data["skin_color"].toLowerCase();
                if(data["skin_color"]!="not provided")
                    user_profile.skintone = skin_color_value;
            }
            if(data.hasOwnProperty("age") && data["age"]!="")
            {
                let age_value = data["age"].toLowerCase();
                if(data["age"]!="not provided")
                    user_profile.age = age_value;
            }
            if(data.hasOwnProperty("height") && data["height"]!="")
            {
                let height_value = data["height"].toLowerCase();
                if(data["height"]!="not provided")
                user_profile.height = height_value;
            }
            if(data.hasOwnProperty("body_concerns") && type!="profile_question")
            {
                try{
                    data["body_concerns"] = data["body_concerns"].map(function(a){return a.toLowerCase();});
                }catch(e){}
                user_profile.body_concerns = data["body_concerns"];
            }

            let context = Sessions.getContext(sessionId);
            if(type=="already_existed")
            {
                user_profile["status"] = true;
                context.user_profile = user_profile;
            }
            else if(type=="profile_question")
            {
                context["question_number"]++;
                delete context["user_profile"]["age"];
                delete context["user_profile"]["height"];
                delete context["user_profile"]["bodyshape"];
                delete context["user_profile"]["skintone"];
                let user_profile_keys = Object.keys(user_profile);
                context["previous_user_messages"].push({"type":type, "selected_profile_values":user_profile_keys});

                let user_selected_profile_values = "";
                for(let i in user_profile_keys)
                {
                    let profile_value = user_profile_keys[i];
                    context["user_profile"][profile_value] = user_profile[profile_value];
                    user_selected_profile_values += profile_value+" : "+user_profile[profile_value]+"\n";
                }
                if(user_selected_profile_values.trim()=="")
                    user_selected_profile_values=="Skip profile";
                fashion_bot.storeUserSelectedOptionEvent(sessionId, event_time, user_selected_profile_values);
                context["user_profile"]["profile_status"] = true;
                Sessions.storeContext(sessionId, context);
                fashion_bot.processingUserAnswer["bodyProfileQuestion"](sessionId, user_profile);
            }
            else if(type=="body_concerns_question")
            {
                context["question_number"]++;
                context["user_profile"]["concern_status"] = true;
                context["user_profile"]["body_concerns"] = user_profile["body_concerns"];
                context["previous_user_messages"].push({"type":type, "selected_body_concern_values":user_profile["body_concerns"]});
                let user_selected_body_concern_values  = "";
                if(user_profile["body_concerns"].length>0)
                    user_selected_body_concern_values = "Body Concerns : \n\t"+user_profile["body_concerns"].join(", ");
                else
                    user_selected_body_concern_values = "Skip Body Concerns";
                fashion_bot.storeUserSelectedOptionEvent(sessionId, event_time, user_selected_body_concern_values);
                Sessions.storeContext(sessionId,context);
                fashion_bot.processingUserAnswer["bodyConcernQuestion"](sessionId, user_profile["body_concerns"]);
            }
            Sessions.storeContext(sessionId,context);
        });

        socket.on("update_products",function(data)
        {
            let event_time = new Date().getTime();
            data = JSON.parse(data);
            console.log("================== Update Products List ===================\n");
            console.log(JSON.stringify(data,null,2));

            let sessionId = data["session_id"];
            let userId = data["user_id"];
            let type = data["type"];
            global.storeUserSocket(sessionId, socket);

            if(userId)
            {
                let app_details = Sessions.getAppSession(sessionId);
                app_details["user_id"] = userId;
                Sessions.createAppSessions(sessionId, app_details);
            }
            let context = Sessions.getContext(sessionId);
            context["from"] = 0;
            if(type=="remove")
            {
                // Event storing =============================
                let app_event = {
                    type : "benefit_removed",
                    time:event_time,
                    details : data
                };
                helper.logger_api_call(sessionId, app_event);
                //============================================
                let benefit_to_be_remove = data["benefit_to_be_removed"];
                context.remove_tags.push(benefit_to_be_remove);
                Sessions.storeContext(sessionId, context);
                //update product list
                offline.updateProductList(sessionId);
            }
            else if(type=="clear_all")
            {
                // Event storing =============================
                let app_event = {
                    type : "filters_cleared",
                    time : event_time,
                    details : data
                };
                helper.logger_api_call(sessionId, app_event);
                //============================================

                context["filters"] = [];
                Sessions.storeContext(sessionId, context);
                offline.updateProductList(sessionId);
            }
            else if(type=="filters")
            {
                // Event storing =============================
                let app_event = {
                    type : "filters_applied",
                    time: event_time,
                    details : data
                };
                helper.logger_api_call(sessionId, app_event);
                //============================================

                let added_filters = data["add_filters"];
                let remove_filters = data["remove_filters"];
                // console.log("Added Filters :",JSON.stringify(added_filters, null, 2));
                // console.log("Removed Filters :",JSON.stringify(remove_filters, null,2));

                let context_filters = context["filters"].concat();
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
                context["filters"] = filters.concat(context_filters);
                Sessions.storeContext(sessionId, context);
                offline.updateProductList(sessionId);
            }
            else if(type="sort")
            {
                // Event storing =============================
                let app_event = {
                    type : "sort_applied",
                    time: event_time,
                    details : data
                };
                helper.logger_api_call(sessionId, app_event);
                //============================================
                context["sort_type"] = data["sort_type"];
                if(data["sort_type"]=="priority")
                {
                    context["sort_priority_values"] = data["priority_values"];
                }
                Sessions.storeContext(sessionId, context);
                offline.updateProductList(sessionId);
            }
        });
        //show more
        socket.on("show_more",function(data)
        {
            data = JSON.parse(data);
            console.log("================= Show More ===================");
            let sessionId = data["session_id"];
            let page_no = data["page_no"];
            global.storeUserSocket(sessionId, socket);

            let context = Sessions.getContext(sessionId);
            context.from = page_no;
            Sessions.storeContext(sessionId, context);
            offline.updateProductList(sessionId);
        });
        socket.on("inspirations",function(data)
        {
            let event_time = new Date().getTime();
            console.log("==== Got Inspiration Id === ");
            data = JSON.parse(data);
            let sessionId = data["session_id"];
            let deviceId =data["device_id"];
            let inspiration_id = data["id"];
            global.storeUserSocket(sessionId, socket);
            helper.get_insp_by_id(inspiration_id,function(result)
            {
                //Getting products from the inspiration
                helper.get_products(result["_source"],function(resp)
                {
                    console.log("sending Inspiration Results");
                    let product_data = {};
                    product_data.type = "product_list";
                    product_data.parent = "inspiration";
                    product_data.current_page = 0;
                    product_data.show_message = true;
                    product_data.send_feedback = false;
                    product_data.list = resp;
                    product_data.end_of_chat = false;
                    product_data.message = {"type":"text","message":""};
                    socket.emit("browse", product_data);
                });
            });
        });
        socket.on("reset",function(data){
            console.log("====Reset request received====\n",data);
            let sessionId = data['session_id'];
            let deviceId = data["device_id"];
            let reset_category = data["category"];
            global.storeUserSocket(sessionId, socket);
            socket.emit("clear_chat",{status : true});

            let event_time = new Date().getTime();
            let reset_event = {
                "type": "clicked_on_reset_button",
                "time": event_time,
            };
            helper.logger_api_call(sessionId, reset_event);

            let context;
            if (!Sessions.isAndroidSessionExists(sessionId)) {
                Sessions.CreateSessionAndroid(sessionId, deviceId);  
                context = Sessions.getContext(sessionId);
            }
            else
            {
                socket.emit("clear_chat", {});
                //resetting the women category
                context = Sessions.clearContext(sessionId);
                context["previous_user_messages"] = []; 
                Sessions.storeContext(sessionId,context);
            }
            helper.get_inspirations(function(result)
            {
                let data =
                    {
                        type:"inspirations",
                        end_of_chat : false,
                        list : result
                    };
                console.log("sending Inspiration");
                socket.emit("browse",data);
                let insp_result = result.map(function(a){ return a["id"];});
                let app_event = {"type":"inspiration_response", time : new Date().getTime(), details : insp_result}
                helper.logger_api_call(sessionId, app_event);
            });
            //Sending suggestion message to user
            let welcome_message = {
                type:'text',
                reason_status : false,
                end_of_chat : false,
                question_number : 0,
                message:
                'Welcome to Selekt, start sharing your fashion needs here.'
            };
            socket.emit('suggestions',welcome_message);
            let app_event = {
                type : "text",
                time : new Date().getTime(),
                chat_id : context["chat_id"],
                details : welcome_message
            };
            helper.logger_api_call(sessionId, app_event);
            let msg = bot_questions.sendSuggestionsMessage();
            msg["question_number"] = 0;
            socket.emit('suggestions', msg);
            app_event["details"] = msg;
            helper.logger_api_call(sessionId, app_event);
        });
        socket.on("undo", function(data){
            console.log("clicked on undo ===========================");
            socket.emit("undo_previous_message",{});
            data = JSON.parse(data);
            let sessionId = data["session_id"];
            let deviceId = data["device_id"];
            global.storeUserSocket(sessionId, socket);
            
            undo_module.getUndoState(sessionId);
        });
        socket.on('hello', function(data){
            //console.log("Pong received from client", data);
            let sessionId = data["session_id"];
            global.storeUserSocket(sessionId, socket);
        });
    });
    setTimeout(sendHeartbeat,25000);
    function sendHeartbeat()
    {
        setTimeout(sendHeartbeat,25000);
        //console.log("wakeup");
        global.io.sockets.emit('wakeup',{ "ping" : "1" });
    }

    api.get('/', function (req, res) {
        res.send('"Only those who will risk going too far can possibly find out how far one can go." - Tarak');
    });
    api.post('/get_filters', function(req, res)
    {
        let data = req.body;
        console.log("In Get Filters Api")
        console.log(data);
        let sessionId = data["session_id"];
        let deviceId = data["device_id"];
        try{
            let context = Sessions.getContext(sessionId);
            let product_line = mapping.product_line_to_db_keys[context["product_line"]];
            let benefits = context["benefits"];
            let context_filters = context["filters"].concat();

            let added_filters = data["add_filters"];
            let remove_filters = data["remove_filters"];
            console.log("Added Filters :",JSON.stringify(added_filters, null, 2));
            console.log("Removed Filters :",JSON.stringify(remove_filters, null,2));
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
                        console.log("Context filters : After removing some filters :");
                        console.log(context_filters);
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
            filters = filters.concat(context_filters);
            filterList.getFilterCount(product_line,filters,context["priority_values"], benefits, context["adjectives_new"], context["remove_tags"],function(filter_result){
                //console.log(JSON.stringify(filter_result[0]));
                let data = {};
                data["type"] = "filter_list";
                data["options"] = filter_result;
                res.send(data);
            });
        }catch(e){
            console.log(e);
            res.send({})}
    });
    api.post('/preferences/', function(req, res){
        let data = req.body;
        let event_time = new Date().getTime();
        console.log("====================== In preferences")
        console.log(data);
        let sessionId = data["session_id"];
        let deviceId = data["device_id"];
        let type = data["type"];
        let added_filters = data["add_filters"];
        let remove_filters = data["remove_filters"];

        let context = Sessions.getContext(sessionId);
        let product_line = mapping.product_line_to_db_keys[context["product_line"]];
        let benefits = context["benefits"];
        let profile_benefits = offline.getProfileBenefits(sessionId);
        benefits = benefits.concat(profile_benefits);
        let context_filters = context["filters"].concat();
        let filters = [];

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
                    console.log("Context filters : After removing some filters :");
                    console.log(context_filters);
                }
            }
        }
        if(added_filters)
        {
            for(let i in added_filters)
            {
                let key = added_filters[i].key,values = added_filters[i].values;
                if(key=="discount_price")
                {
                    let c_filters = context_filters.concat();
                    for(let cf in c_filters)
                    {
                        let att_name = c_filters[cf];
                        if(att_name.hasOwnProperty("range"))
                        {
                            if(att_name["range"].hasOwnProperty("product_filter.discount_price"))
                            {
                                context_filters.splice(cf, 1);
                            }
                        }
                    }
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
                    for(let cf in c_filters)
                    {
                        let att_name = c_filters[cf];
                        if(att_name.hasOwnProperty("range"))
                        {
                            if(att_name["range"].hasOwnProperty("product_filter.discount_percent"))
                            {
                                context_filters.splice(cf, 1);
                            }
                        }
                    }
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
            filters = filters.concat(context_filters);
        }
        if(type=="add_preferences")
        {
            context["added_filters"] = added_filters;
            context["filters"] = filters;
            console.log("Context Filters : ",context["filters"]);
            Sessions.storeContext(sessionId, context);
            offline.preferencesFlow(sessionId, "check_products_count");
            res.send({});
        }
        /*else if(type=="remove_preferences")
        {
            context["remove_filters"] = remove_filters;
            context["preference1_status"] = false;
            offline.preferencesFlow(sessionId, "check_products_count");
        }*/
        else if(type=="changed_preferences")
        {
            context["added_filters"] = added_filters;
            context["remove_filters"] = remove_filters;

            context["filters"] = filters;
            console.log("Context Filters : ",context["filters"]);
            Sessions.storeContext(sessionId, context);
            offline.preferencesFlow(sessionId, "ask_user_profile_status");
            res.send({});
        }
        else if(type=="no_need")
        {
            let event = {
                "type":"user_selected_message",
                "chat_id":context["chat_id"],
                "time":event_time,
                "product_line":context["product_line"]
            };
            
            console.log("Clicked on No Need");
            console.log(context["preference_question_type"])
            if(context["preference_question_type"]=="add_preferences")
            {
                setTimeout(function(){
                    // Event Storing ====================
                    event["details"] = "Nothing in my mind";
                    helper.logger_api_call(sessionId, event);
                    // =================================
                },1);
                offline.preferencesFlow(sessionId, "check_products_count");
            }
            else if(context["preference_question_type"]=="check_products_count")
            {
                setTimeout(function(){
                    // Event Storing ====================
                    event["details"] = "No, I don't want to";
                    helper.logger_api_call(sessionId, event);
                    // =================================
                },1);
                offline.preferencesFlow(sessionId,  "profile_question");
            }
            else if(context["preference_question_type"] == "profile_question" || context["preference_question_type"] == "recommend_profile_filters")
            {
                setTimeout(function(){
                    // Event Storing ====================

                    //helper.logger_api_call(sessionId, event);
                    // =================================
                },1);
                offline.preferencesFlow(sessionId, "body_concerns_question");
            }
            else if(context["preference_question_type"] == "body_concerns_question" || context["preference_question_type"] == "recommend_bodyconcern_filters")
            {
                //offline.preferencesFlow(sessionId, "last_message");
            }
            res.send({});
        }
        else if(type=="recommend_preferences")
        {
            let conflict_benefits = context["conflict_benefits"];
            filterList.getFilterCount(product_line, filters, context["priority_values"], benefits, context["adjectives_new"], context["remove_tags"], function(result)
            {
                filterList.getRecommendedPreferences(product_line, result, conflict_benefits, function(filter_result)
                {
                    let filter_data = {};
                    filter_data.type = "filter_list";
                    filter_data.product_line = product_line;
                    filter_data.options = filter_result;
                    res.send(filter_data);
                });
            });
        }
        else if(type=="applied_recommend_preferences")
        {
            context["added_filters"] = added_filters;
            context["remove_filters"] = remove_filters;

            context["filters"] = filters;
            Sessions.storeContext(sessionId, context);
            offline.preferencesFlow(sessionId, "body_concerns_question");
            res.send({});
        }
        else
        {
            filterList.getFilterCount(product_line, filters, context["priority_values"], benefits, context["adjectives_new"], context["remove_tags"], function(result)
            {
                console.log("---------------------------");
                let filter_data = {};
                filter_data.type = "filter_list";
                filter_data.product_line = product_line;
                filter_data.options = result;
                let response_time = new Date().getTime();
                /*setTimeout(function(){
                    // Event Storing =================================
                    let events = {
                        type:"filters_response",
                        request_type : type,
                        time : response_time,
                        chat_id : context["chat_id"], 
                        details: data
                    };
                    helper.logger_api_call(sessionId, events);
                    //================================================
                }, 1);*/
                console.log("Returning api ------------------>");
                res.send(filter_data);
            });
        }
    });
    api.post('/autocomplete', function(req, res)
    {
        let body = req.body;
        let message = body.message;
        //console.log(message)
        message = message.toLowerCase();
        message = message.trim();

        let event_time = new Date().getTime();
        let sessionId = body["session_id"];

        let autocomplete_event = {
            type : "autocomplete_message",
            message : message,
            time : event_time
        };
        let suggestions = {};
        suggestions["interpreted_question"] = "";
        suggestions["suggestions"] = [];
        let query = 
        {
            index : "autocomplete_main",
            body : {
                "query": {
                    "function_score": {
                        "query":
                        {
                            "bool": {
                                "should": [
                                    {
                                        "match":{
                                            "ngram_sentences":{
                                                "query": message,
                                                "analyzer":"autocomplete"
                                            }
                                        }
                                    },
                                    {
                                        "match": {
                                            "phrase_match_sentences": {
                                                "query": message,
                                                "operator": "and"
                                            }
                                        }
                                    },
                                    {
                                        "prefix":{
                                            "phrase_match_sentences":message
                                        }
                                    },
                                    {
                                        "match_phrase":{
                                            "product_status": {
                                                "query":true,
                                                "boost":8
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        "field_value_factor":
                        { 
                           "field":  "priority",
                           "factor": 2,
                           "modifier": "log1p"
                        }
                    }
                }
            }
        };
        autocomplete_es.runQuery(query, function (resp, total, err) {
            //console.log(err);
            if(!err)
            {
                let hits = resp;
                hits = hits.splice(0,4);
                hits = hits.map(function(a){
                    return a["_source"]["sentence"];
                });
                let obj = 
                {
                    highlight : hits,
                    rest : ""
                };
                suggestions["suggestions"].push(obj);
                entity_bot.getEntities(message, undefined, function(entities){
                	let templates = fashion_bot.getBotUnderstoodTemplate(entities);
                	if(templates.length>0)
                	{
                		obj = {highlight:"",rest:""};
    	                suggestions["suggestions"].push(obj);
    	                obj = {highlight:templates[0],rest:""};
    	                suggestions["suggestions"].push(obj);
                	}
                	else
                	{
                		obj = {highlight:"",rest:""};
    	                suggestions["suggestions"].push(obj);
    	                obj = {highlight:"",rest:""};
    	                suggestions["suggestions"].push(obj);
                	}
                	autocomplete_event["suggestions"] = suggestions;
    	            //storing event
    	            if(sessionId)
    	            {
    	            	helper.logger_api_call(sessionId, autocomplete_event);
    	            }
                    //console.log("Response time : ", new Date().getTime()-event_time);
    	            res.send(suggestions);
                });
            }
        });
    });
    api.post("/signup",function(req,res)
    {
        let body = req.body;
        let sessionId = body["session_id"];

        let resp_obj =
        {
            "status":false,
            "data" :{},
            "error" : ""
        };
        console.log("In Signup");
        console.log(req.body);
        let state = true;
        let string = "";
        let username = body.username;
        let email = body.email;
        let mobile_no = body.mobile_number;
        let password = body.password;
        if(username.length==0)
        {
            state = false;
            string ="Username Empty";
        }
        else if(email.length==0)
        {
            state = false;
            string = "Email Empty";
        }
        if(!state)
        {
            resp_obj.status = false;
            resp_obj.error = string;
            if(sessionId)
            {
                let app_event = {
                    type : "signup_response",
                    time : new Date().getTime(),
                    details : resp_obj
                };
                helper.logger_api_call(sessionId, app_event);
            }
            res.send(resp_obj);
        }
        else
        {
            let query = "select * from users where email='"+email+"'";
            helper.get_result(query,"selekt",function(data)
            {
                console.log(data);
                if(data.length==0)
                {
                    let insert_query = "insert into users(username,email,mobile_number,password) values('"+email+"','"+email+"','"+mobile_no+"','"+password+"')"
                    helper.get_result(insert_query,"selekt",function(result)
                    {
                        let getting_info = "select * from users where email='"+email+"' and password='"+password+"' and mobile_number='"+mobile_no+"';";
                        helper.get_result(getting_info,"selekt",function(user_info)
                        {
                            resp_obj = get_obj(user_info[0]);
                            if(sessionId)
                            {
                                let app_details = Sessions.getAppSession(sessionId);
                                app_details["user_id"] = resp_obj["user_id"];
                                Sessions.createAppSessions(sessionId, app_details);
                                let app_event = {
                                    type : "signup_response",
                                    time : new Date().getTime(),
                                    details : resp_obj
                                };
                                helper.logger_api_call(sessionId, app_event);
                            }
                            res.send(resp_obj);
                        });

                    });
                }
                else
                {
                    resp_obj.status= false;
                    resp_obj.error = "Email is already registered."
                    if(sessionId)
                    {
                        let app_event = {
                            type : "signup_response",
                            time : new Date().getTime(),
                            details : resp_obj
                        };
                        helper.logger_api_call(sessionId, app_event);
                    }
                    res.send(resp_obj);
                }
            });
        }
    });
    api.post('/favourites',function (req, res) {
        let body = req.body;
        console.log("Body is "+JSON.stringify(body,null,2));
        let app_event = 
        {
            type : "favorites",
            time : new Date().getTime(),
            details : body
        };
        let user_id = body.user_id;
        let product_line = body.product_line;
        let product_id = body.product_id;
        let request_type = body.request_type;
        let sessionId = body.sessionId;
        if(sessionId)
        {
            helper.logger_api_call(sessionId, app_event);
        }
        let query = "";
        if(request_type=="add")
        {
            query = "INSERT INTO favorites(user_id,product_line,product_id)VALUES('"+user_id+"','"+product_line+"','"+product_id+"')";
        }
        else
        {
            query = "DELETE FROM favorites WHERE user_id='"+user_id+"' AND product_line='"+product_line+"' AND " +
                "product_id='"+product_id+"'";
        }
        //insert or delete product_id
        helper.get_result(query,"selekt",function (data) {
            console.log("Sending favorites status");
            res.send({"status":true});
        });
    });
    api.post('/getfavourites',function(req,res)
    {
        let event_time = new Date().getTime();
        let data = req.body;
        console.log("================ Favorites API ===================");
        //console.log(JSON.stringify(data, null, 2));
        let user_id = data["user_id"];
        let result_type = data["result_type"];
        let sessionId = data["session_id"];
        console.log("USER ID : ",user_id);
        let product_list = [];
        if(user_id)
        {
            let query = "select * from favorites where user_id = '"+user_id+"'";
            console.log(query);
            helper.get_result(query,"selekt",function (result) {
                console.log("Result length : ",result.length);
                let count=0;
                let favorite_obj = {};
                if(result.length>0)
                {
                    let fav_data = {};
                    let remove_count = 0;
                    let fav_result = result.concat();
                    for(let i in result)
                    {
                        //removing duplicates
                        let product_line = result[i].product_line;
                        let product_id = result[i].product_id;
                        
                        if(!fav_data.hasOwnProperty(product_line))
                        {
                            fav_data[product_line] = [];
                        }
                        if(fav_data[product_line].indexOf(product_id)==-1)
                            fav_data[product_line].push(product_id);
                        else
                        {
                            fav_result.splice(i - remove_count, 1);
                            remove_count++;
                        }
                    }
                    fav_result = fav_result.filter(function(a){
                        let entity_product_line = a.product_line;
                        let product_line = mapping.product_line_to_db_keys[entity_product_line];
                        if(!product_line)
                            return false
                        return true;
                    });
                    for(let i in fav_result)
                    {
                        let entity_product_line = fav_result[i].product_line;
                        let product_id = fav_result[i].product_id;
                        
                        let product_line = mapping.product_line_to_db_keys[entity_product_line];
                        if(result_type!="favorites")
                        {
                            /*let products_query = {
                                "index": 'product_data',
                                "type": product_line,
                                "body":
                                    {"query":{"term":{"_id":product_id}}}
                            };*/
                            let mongo_query = {es_mysql_id:parseInt(product_id)};
                            //helper.get_products_by_query(products_query,product_line,function (data) {
                            mongo.runQuery("product_data",product_line, mongo_query, function(data, err){
                                count++;
                                if(!err)
                                {
                                    data.forEach(function(source_data){
                                        source_data["_id"] = source_data["es_mysql_id"];
                                        source_data["product_filter"]["product_line"] = entity_product_line;
                                    });
                                    product_list = product_list.concat(data);
                                }
                                if(count==fav_result.length)
                                {
                                    if(sessionId)
                                    {
                                        // Event Storing ====================
                                        let app_event = {
                                            type : "favorites_response",
                                            time : new Date().getTime(),
                                            details : product_list
                                        };
                                        helper.logger_api_call(sessionId, app_event);
                                    }
                                    console.log("sending favorites");
                                    res.send({"product_list":product_list});
                                }
                            });
                        }
                        else
                        {
                            if(!favorite_obj.hasOwnProperty(product_line))
                                favorite_obj[product_line] = [];
                            favorite_obj[product_line].push(product_id);
                        }
                    }
                    if(result_type=="favorites")
                    {
                        if(sessionId)
                        {
                            // Event Storing ====================
                            let app_event = {
                                type : "favorites_response",
                                time : new Date().getTime(),
                                details : favorite_obj
                            };
                            helper.logger_api_call(sessionId, app_event);
                        }
                        res.send({"favorites":favorite_obj});
                    }
                }
                else
                {
                    console.log("No favorites found");
                    if(sessionId)
                    {
                        // Event Storing ====================
                        let app_event = {
                            type : "favorites_response",
                            time : new Date().getTime(),
                            details : []
                        };
                        helper.logger_api_call(sessionId, app_event);
                    }
                    res.send({"product_list":[]});
                }
            });
        }
        else
        {
            console.log("No favorites found");
            if(sessionId)
            {
                // Event Storing ====================
                let app_event = {
                    type : "favorites_response",
                    time : new Date().getTime(),
                    details : []
                };
                helper.logger_api_call(sessionId, app_event);
            }
            res.send({"product_list":[]});
        }
    });
    api.post('/events',function (req,res) {
        let event = req.body;
        var ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : null);
        
        event["ip_address"] = ip;
        console.log("Got the event ==========================")
        //console.log(event);
        console.log("ip address : ", ip);
        try{
            let sessionId = event["session_id"];
            let deviceId = event["device_id"];
            let user_id = event["user_id"];
            let user_details = Sessions.getAppSession(sessionId);
            if(Object.keys(user_details).length==0)
            {
                user_details = 
                {
                    device_id : deviceId,
                    session_id : sessionId,
                    user_id : user_id
                };
                Sessions.createAppSessions(sessionId,user_details); 
            }
            else
            {
                if(!user_details.hasOwnProperty("user_id") && !user_id)
                {
                    user_details["user_id"] = user_id;
                    Sessions.createAppSessions(sessionId, user_details);
                }
            }
            if(Sessions.isAndroidSessionExists(sessionId))
            {
                let context = Sessions.getContext(sessionId);
                event.chat_id = context.chat_id;
            }
            helper.logger_api_call(sessionId,event);
            res.send({status : true});
        }
        catch(e){
            console.log("Error while events saving : ",e);
            res.send({status : false});
        }  
    });
    api.post("/login",function(req,res)
    {
        let resp_obj = {status:false,data:{},error:""};
        let query="";
        let source_body = req.body;
        console.log("Source Body : ",source_body);
        let sessionId = source_body["session_id"];
        let request_type = source_body.request_type;
        if(request_type=="google")
        {
            //google login
            let status = true;
            console.log("Request : Google Login");
            let google_data = source_body.google_data;
            let email = google_data.email
            let google_id = google_data.google_id;
            let username = google_data.username;
            let profile_pic = google_data.profile_pic;
            if(email==undefined || email=="")
            {
                status = false;
                resp_obj.status = false;
                resp_obj.error = "Email is empty";
                if(sessionId)
                {
                    // Event Storing ====================
                    let app_event = {
                        type : "login_response",
                        login_type : "google",
                        time : new Date().getTime(),
                        details : resp_obj
                    };
                    helper.logger_api_call(sessionId, app_event);
                }
                res.send(resp_obj);
            }
            if(status)
            {
                query = "select * from users where email='"+email+"'";
                helper.get_result(query,"selekt",function(data)
                {
                    console.log("User Data length : ",data.length);
                    if(data.length>0)
                    {
                        let user_id = data[0].user_id;
                        console.log(user_id);
                        //=======================================================================
                        let google_query = "select * from google_users where user_id='"+user_id+"'";
                        helper.get_result(google_query,"selekt",function(google_resp)
                        {
                            if(google_resp.length==0)
                            {
                                let insert_google_users = "insert into google_users(user_id,google_id,email,username,profile_pic) values('"+user_id+"','"+google_id+"','"+email+"','"+username+"','"+profile_pic+"')";
                                helper.get_result(insert_google_users,"selekt",function(google_insert_resp)
                                {
                                    console.log("New Google User added.");
                                });
                            }
                        });

                        resp_obj = get_obj(data[0]);
                        if(sessionId)
                        {
                            let app_details = Sessions.getAppSession(sessionId);
                            app_details["user_id"] = user_id;
                            Sessions.createAppSessions(sessionId, app_details);
                           
                            // Event Storing ====================
                            let app_event = {
                                type : "login_response",
                                login_type : "google",
                                time : new Date().getTime(),
                                details : resp_obj
                            };
                            helper.logger_api_call(sessionId, app_event);
                        }
                        res.send(resp_obj);
                    }
                    else
                    {
                        let user_insert_query = "insert into users(username,email) values('"+username+"','"+email+"')";
                        helper.get_result(user_insert_query,"selekt",function(user_insert_resp)
                        {
                            let userid_query = "select * from users where email='"+email+"';";
                            helper.get_result(userid_query,"selekt",function(query_resp)
                            {
                                let user_id = query_resp[0].user_id;
                                let insert_google_users = "insert into google_users(user_id,google_id,email,username,profile_pic) values('"+user_id+"','"+google_id+"','"+email+"','"+username+"','"+profile_pic+"')";
                                helper.get_result(insert_google_users,"selekt",function(google_insert_resp)
                                {
                                    console.log("New Google User added.", sessionId);
                                    helper.get_result("select * from users where user_id='"+user_id+"';","selekt",function(response)
                                    {
                                        resp_obj = get_obj(response[0]);
                                        if(sessionId)
                                        {
                                            // Event Storing ====================
                                            let app_event = {
                                                type : "login_response",
                                                login_type : "google",
                                                time : new Date().getTime(),
                                                details : resp_obj
                                            };
                                            let app_details = Sessions.getAppSession(sessionId);
                                            app_details["user_id"] = user_id;
                                            Sessions.createAppSessions(sessionId, app_details);
                                            helper.logger_api_call(sessionId, app_event);
                                        }
                                        res.send(resp_obj);
                                    });
                                });
                            });
                        });
                    }
                });
            }
        }
        else if(request_type=="fb")
        {
            //facebook login
            console.log("Request : Facebook Login");
            let fb_data = source_body.fb_data;
            let email = fb_data.email;
            let fb_id = fb_data.fb_id;
            let username = fb_data.username;
            let profile_pic = fb_data.profile_pic;

            let status = true;

            if(email==undefined || email=="")
            {
                status = false;
                resp_obj.status = false;
                resp_obj.error = "Email is empty";
                if(sessionId)
                {
                    // Event Storing ====================
                    let app_event = {
                        type : "login_response",
                        login_type : "facebook",
                        time : new Date().getTime(),
                        details : resp_obj
                    };
                    helper.logger_api_call(sessionId, app_event);
                }
                res.send(resp_obj);
            }
            if(fb_id==undefined || fb_id=="")
            {
                status = false;
                resp_obj.status = false;
                resp_obj.error = "Facebook id is empty";
                if(sessionId)
                {
                    // Event Storing ====================
                    let app_event = {
                        type : "login_response",
                        login_type:"facebook",
                        time : new Date().getTime(),
                        details : resp_obj
                    };
                    helper.logger_api_call(sessionId, app_event);
                }
                res.send(resp_obj)
            }
            if(status)
            {
                query = "select * from users where email='"+email+"'";
                helper.get_result(query,"selekt",function(data)
                {
                    if(data.length>0)
                    {
                        let user_id = data[0].user_id;
                        if(sessionId)
                        {
                            let app_details = Sessions.getAppSession(sessionId);
                            app_details["user_id"] = user_id;
                            Sessions.createAppSessions(sessionId, app_details);
                        }
                        let facebook_query = "select * from fb_users where user_id='"+user_id+"'";
                        helper.get_result(facebook_query,"selekt",function(fb_resp)
                        {
                            if(fb_resp.length==0)
                            {
                                let insert_facebook_users = "insert into fb_users(user_id,fb_id,email,username,profile_pic) values('"+user_id+"','"+fb_id+"','"+email+"','"+username+"','"+profile_pic+"')";
                                helper.get_result(insert_facebook_users,"selekt",function(facebook_insert_resp)
                                {
                                    console.log("New Facebook User added.");
                                });
                            }
                        });

                        resp_obj = get_obj(data[0]);
                        if(sessionId)
                        {
                            // Event Storing ====================
                            let app_event = {
                                type : "login_response",
                                login_type:"facebook",
                                time : new Date().getTime(),
                                details : resp_obj
                            };
                            helper.logger_api_call(sessionId, app_event);
                        }
                        res.send(resp_obj);
                    }
                    else
                    {
                        let user_insert_query = "insert into users(username,email) values('"+username+"','"+email+"')";
                        helper.get_result(user_insert_query,"selekt",function(user_insert_resp)
                        {
                            let userid_query = "select * from user where email="+email;
                            helper.get_result(userid_query,"selekt",function(userid_resp)
                            {
                                let user_id = userid_resp[0]["user_id"];
                                if(sessionId)
                                {
                                    //updating user details
                                    let app_details = Sessions.getAppSession(sessionId);
                                    app_details["user_id"] = user_id;
                                    Sessions.createAppSessions(sessionId, app_details);
                                }
                                //=================this is for saving user details in website users table
                                let web_details = "insert into chatapp_websiteusers(name, user_id, date_time)values('"+username+"','"+user_id+"','"+new Date().getTime()+"')";
                                helper.get_result(web_details,"prodx", function(web_resp){console.log(user_id+" inserted into chatapp_websiteusers table...4");});
                                //=======================================================================
                                let insert_facebook_users = "insert into fb_users(user_id,fb_id,email,username,profile_pic) values('"+user_id+"','"+fb_id+"','"+email+"','"+username+"','"+profile_pic+"')";
                                helper.get_result(insert_facebook_users,"selekt",function(facebook_insert_resp)
                                {
                                    helper.get_result("select * from users where user_id='"+user_id+"'","selekt",function(response)
                                    {
                                        resp_obj = get_obj(response[0]);
                                        if(sessionId)
                                        {
                                            // Event Storing ====================
                                            let app_event = {
                                                type : "login_response",
                                                login_type:"facebook",
                                                time : new Date().getTime(),
                                                details : resp_obj
                                            };
                                            helper.logger_api_call(sessionId, app_event);
                                        }
                                        res.send(resp_obj);
                                    });
                                });
                                
                            });
                        });
                    }
                });
            }
        }
        else if(request_type=="manual")
        {
            console.log("Request : Manual Login");
            let manual_data = source_body.manual_data;
            let email = manual_data.email;
            let password = manual_data.password;

            query = "select * from users where email='"+email+"' and password='"+password+"'";
            helper.get_result(query,"selekt",function(result)
            {
                if(result.length>0)
                {
                    let require_res = result[0];
                    let user_id = require_res["user_id"];
                    if(sessionId)
                    {
                        let app_details = Sessions.getAppSession(sessionId);
                        app_details["user_id"] = user_id;
                        Sessions.createAppSessions(sessionId, app_details);
                    }
                    //=================this is for saving user details in website users table
                    let web_details = "insert into chatapp_websiteusers(name, user_id, date_time)values('"+email+"','"+user_id+"','"+new Date().getTime()+"')";
                    helper.get_result(web_details,"prodx", function(web_resp){console.log(user_id+" inserted into chatapp_websiteusers table...5");});
                    //=======================================================================
                    resp_obj = get_obj(require_res);
                    if(sessionId)
                    {
                        // Event Storing ====================
                        let app_event = {
                            type : "login_response",
                            login_type:"manual",
                            time : new Date().getTime(),
                            details : resp_obj
                        };
                        helper.logger_api_call(sessionId, app_event);
                    }
                    res.send(resp_obj);
                }
                else
                {
                    resp_obj.status = false;
                    resp_obj.error = "Invalid Credentials";
                    if(sessionId)
                    {
                        // Event Storing ====================
                        let app_event = {
                            type : "login_response",
                            login_type:"manual",
                            time : new Date().getTime(),
                            details : resp_obj
                        };
                        helper.logger_api_call(sessionId, app_event);
                    }
                    res.send(resp_obj);
                }
            });
        }
    });
    api.get('/contact',function(req,res)
    {
        let message = "sample message";
        let contact_message=
        {
            "message":message,
            "contact_number":"9167822741",
            "contact_email": "contact@prodx.in"
        };
        res.send(contact_message);
    });
    api.post('/appversion',function(req, res)
    {
        let body = req.body;
        console.log(body);
        let latest_app_version = 0.225;
        let prev_app_version = body.version;
        let version_value = prev_app_version.split("-")[0]
        let update_status = false;
        if(latest_app_version>parseFloat(version_value))
            update_status = true;
        console.log("Update Status : ",update_status)
        res.send({"update" : update_status});
    });
    return api;
}
function get_obj(require_res)
{
    let resp_obj = {data:{}};
    resp_obj.status = true;
    resp_obj.data.user_id = require_res["user_id"];
    resp_obj.data.username = require_res["username"];
    resp_obj.data.email = require_res["email"];
    resp_obj.data.age = require_res["age"];
    resp_obj.data.body_shape = require_res["body_shape"];
    resp_obj.data.body_concerns = require_res["body_concerns"];
    resp_obj.data.height = require_res["height"];
    resp_obj.data.skin_colour = require_res["skin_colour"];
    resp_obj.error = "";

    return resp_obj;
}