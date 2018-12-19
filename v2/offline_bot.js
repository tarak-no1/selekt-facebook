const global = require('../public/global.js');
const helper = require('./helper');
const sessions = require('../public/sessions');
const mapping = require('../public/mapping');
const elasticSearch = require('../db_config/elasticSearch');
const mongo = require('../db_config/mongoQueries');
const functions = require('./functions');
const filterList = require('./filter-list');
const mysql = require("mysql");
const entity_bot = require("./entity_bot");
const conversationGraph = require('../public/conversationGraphs');
const fs = require("fs");
const word_mapping = JSON.parse(fs.readFileSync("./public/word_mapping.json"));
const benefit_tagging = JSON.parse(fs.readFileSync("./public/benefits_mapping.json"));
const bot_questions = require("./bot_questions.js");

let db_config = {
    host : 'localhost',
    user : 'root',
    password : 'selekt.in'
};
let connection;
function handleDisconnect() {
    connection = mysql.createConnection(db_config);
    connection.connect(function(err) {
        if(err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        }
    });

    connection.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}
handleDisconnect();
function updateProductList(sessionId) {
    let context = sessions.getContext(sessionId);
    let remove_tags = context.remove_tags;
    for(let i in remove_tags)
    {
        let removed_value = remove_tags[i].value;
        let ben_index = context["benefits"].indexOf(removed_value);
        let adj_index = context["adjectives_new"].indexOf(removed_value);
        let pri_ben_index = context["priority_values"]["benefits"].indexOf(removed_value);
        let pri_adj_index = context["priority_values"]["adjectives"].indexOf(removed_value);
        if(ben_index!=-1)
        {
            context["benefits"].splice(ben_index, 1);
        }
        if(adj_index!=-1)
        {
            context["adjectives_new"].splice(adj_index, 1);
        }
        if(pri_ben_index!=-1)
            context["priority_values"]["benefits"].splice(pri_ben_index,1);
        if(pri_adj_index!=-1)
            context["priority_values"]["adjectives"].splice(pri_adj_index,1);
    }
    sessions.storeContext(sessionId,context);
    //Send products
    sendProductsToUser(sessionId);
    sendAppliedValues(sessionId);
    //sendBenefitsToUser(sessionId);
}
function sendProductsToUser(sessionId)
{
    let context = sessions.getContext(sessionId);

    console.log("Fetching Products");
    if(!context.hasOwnProperty("deals"))
    {
        getProducts(sessionId, function(result_list)
        {
            console.log("--------------------- * ------------------------");

            let result_length = result_list[0].total;
            let flow_state = result_list[0].is_flow_complete;

            console.log(result_list[0]);
            console.log("question_number : ", context["question_number"]);
            result_list = result_list.slice(1,result_list.length);

            console.log("Sort Type :", context["sort_type"]);
            if(!context["sort_type"] || context["sort_type"]=="match_score")
            {
                result_list = helper.sort_by_benefit_length(result_list);
            }
            //Products Sending
            let product_data = {};
            product_data.type = "product_list";
            if(context["list_type"]!='inspiration')
            {
                product_data.parent = "suggestion";
            }
            else
            {
                product_data.parent = "inspiration";
                context["list_type"] = "suggestions";
            }
            product_data.product_line = context.product_line;
            product_data.sort_type = (context["sort_type"]?context["sort_type"]:((context["benefits"].length>0 || context["priority_values"]["benefits"].length>0)?"match_score":"no_sort"));
            if(context["broad_occasion"])
                product_data.occasion = context["broad_occasion"].key;
            else
                product_data.occasion = "";
            product_data.current_page = context.from;
            product_data.total_length = result_length;
            product_data.list = result_list;
            sendMessage("browse", product_data, sessionId);
        });
    }
    else
    {
        helper.sendDealsList(sessionId, function(product_list_details){
            context["is_flow_complete"] = true;
            let message_delay = context["message_delay"];
            if(product_list_details.list.length>0)
            {
                if(context["from"]==0 && context["deals"])
                {
                    context["deals"] = false;
                    let found_products_message = bot_questions.dealsMessage(context["product_line"]);
                    //found_products_message["gif_status"] = false;
                    setTimeout(function(){
                        sendMessage("chat", found_products_message, sessionId);
                    },message_delay-500);
                }
                sendMessage("browse",product_list_details, sessionId);
            }
            else if(context["from"]==0)
            {
                let no_deals_message = bot_questions.textMessages("Sorry I could not find good deals");
                no_deals_message["gif_status"] = false;
                setTimeout(function(){
                    sendMessage("chat", no_deals_message, sessionId);
                },message_delay-500);
            }
        });
    }
}
//sending benefits and adjectives to user
function sendBenefitsToUser(sessionId)
{
    let context = sessions.getContext(sessionId);
    if(context.product_line!=""){
        let product_line = mapping.product_line_to_db_keys[context.product_line];
        fetchAllProductlineBenefits(sessionId, product_line,function(all_benefits){
            let result_list = {};
            result_list["all_benefits"] = all_benefits;
            let benefit_data = {};
            benefit_data.type = "benefit_list";
            benefit_data.all_benefits = all_benefits;
            sendMessage("browse",benefit_data, sessionId);
        });
    }
}
function sendAppliedValues(sessionId)
{
    let context = sessions.getContext(sessionId);
    let applied_benefits = [];
    if(context.product_line!=""){
        let product_line = mapping.product_line_to_db_keys[context.product_line];
        let benefit_tags = benefit_tagging[product_line];
        let benefits = context["benefits"].concat();
        let adjectives = context["adjectives_new"].concat();
        adjectives = adjectives.concat(context["priority_values"]["adjectives"]);

        let priority_benefits = context.priority_values.benefits;
        for(let i in priority_benefits){
            let value = priority_benefits[i];
            let display_name = helper.getBenefitname(value, product_line,"benefits");
            let priority = 0;
            if(context["sort_type"]=="priority")
            {
                if(context["sort_priority_values"][0])
                {
                    if(context["sort_priority_values"][0].value==value)
                    {
                        priority = context["sort_priority_values"][0].priority;
                    }
                }
                if(context["sort_priority_values"][1])
                {
                    if(context["sort_priority_values"][1].value==value)
                    {
                        priority = context["sort_priority_values"][1].priority;
                    }
                }
            }
            else
            {
                if(benefit_tags[value]=="occasions")
                    priority = 1;
                else if(benefit_tags[value]=="broad_occasions")
                    priority = 2;
                if(priority_benefits.length==1)
                    priority = 1;
            }
            if(checkObjExist(applied_benefits, {"type":"benefit","value" : value, "display_name": display_name}))
                applied_benefits.push({"type":"benefit","value" : value, "display_name": display_name, "priority" : priority});
        }
        for(let i in benefits){
            let value = benefits[i];
            let display_name = helper.getBenefitname(value, product_line,"benefits");
            let priority = 0;
            if(context["sort_type"]=="priority")
            {
                if(context["sort_priority_values"][0])
                {
                    if(context["sort_priority_values"][0].value==value)
                    {
                        priority = context["sort_priority_values"][0].priority;
                    }
                }
                if(context["sort_priority_values"][1])
                {
                    if(context["sort_priority_values"][1].value==value)
                    {
                        priority = context["sort_priority_values"][1].priority;
                    }
                }
            }
            if(checkObjExist(applied_benefits, {"type":"benefit","value" : value, "display_name": display_name}))
                applied_benefits.push({"type":"benefit","value" : value, "display_name": display_name, "priority" : priority});
        }

        //adjective type
        for(let i in adjectives){
            let value = adjectives[i];
            let display_name = helper.getBenefitname(value, product_line, "adjectives");
            let priority = 0;
            if(context["sort_type"]=="priority")
            {
                if(context["sort_priority_values"][0])
                {
                    if(context["sort_priority_values"][0].value==value)
                    {
                        priority = context["sort_priority_values"][0].priority;
                    }
                }
                if(context["sort_priority_values"][1])
                {
                    if(context["sort_priority_values"][1].value==value)
                    {
                        priority = context["sort_priority_values"][1].priority;
                    }
                }
            }
            if(checkObjExist(applied_benefits, {"type":"adjective","value" : value, "display_name": display_name}))
                applied_benefits.push({"type":"adjective","value" : value, "display_name": display_name,"priority" : priority});
        }
    }
    let data = 
    {
        type : "applied_data",
        applied_benefits : applied_benefits
    };
    sendMessage("applied_data",data,sessionId);
    let benefits_applied_event = {
        type : "applied_benefits",
        time : new Date().getTime(),
        applied_benefits : applied_benefits
    };
    helper.logger_api_call(sessionId, benefits_applied_event);
}
//Fetches all the benefits related to a product line regardless of user preferences
function fetchAllProductlineBenefits(session_id,product_line, callback)
{
    let context = sessions.getContext(session_id);
    let result = [];
    let benefit_type = {};
    let total_benefits = word_mapping[product_line]["benefits"];
    let benefits = Object.keys(total_benefits);
    for(let i in benefits)
    {
        let ben_display_name = benefits[i];
        let ben_object = total_benefits[ben_display_name];
        if(!benefit_type.hasOwnProperty(ben_object.type_display_name))
        {
            benefit_type[ben_object.type_display_name] = {};
            benefit_type[ben_object.type_display_name]["type"] = ben_object.type;
        }
        if(!benefit_type[ben_object.type_display_name].hasOwnProperty("benefits"))
        {
            benefit_type[ben_object.type_display_name]["benefits"] = [];
        }
        benefit_type[ben_object.type_display_name]["benefits"].push({"type":"benefit","value":ben_object.entity_key, "display_name":ben_display_name})
    }
    let benefit_keys = Object.keys(benefit_type);
    for(let i in benefit_keys)
    {
        let display_name = benefit_keys[i];
        let type = benefit_type[display_name].type;
        let ben = benefit_type[display_name].benefits;
        result.push({"display_name":display_name, "key" : type, "values" : ben});
    }
    callback(result)
}

//currently not using this function
function sendFiltersToUser(session_id) {
    let context = sessions.getContext(session_id);
    let product_line = mapping.product_line_to_db_keys[context['product_line']];
    /*filterList.get_product_line_filters(product_line, function (result) {
        let data = {};
        data.type = "filter_list";
        data.options = result;
        data.applied_filters = [];
        sendMessage("browse", data, session_id);
    });*/
    filterList.getFilterCount(product_line,context["filters"],context["priority_values"], context["benefits"], context["adjectives_new"], context["remove_tags"],function(filter_result)
    {
        let data = {};
        data.type = "filter_list";
        data.options = filter_result;
        sendMessage("filter_list", data, session_id);
    });
}
// This function will fetch the products from elasticsearch and prepares display image, adjectives and benefits
function getProducts(session_id, callback) {

    let context = sessions.getContext(session_id);
    let product_line = mapping.product_line_to_db_keys[context.product_line];
    let benefits = context['benefits'].concat();

    let adjectives = context['adjectives_new'].concat();
    let filters = context['filters'];
    let from = context['from'];
    let is_flow_complete = context.is_flow_complete;
    let result_product_line = context.product_line, result_occasion;

    let products_query = helper.buildQuery(product_line, filters, context["priority_values"],from, benefits, adjectives, context["remove_tags"], context["sort_type"],context["sort_priority_values"]);
    console.log(products_query.body.sort);

    benefits = benefits.concat(context["priority_values"]["benefits"]);
    adjectives = adjectives.concat(context["priority_values"]["adjectives"]);
    let sort_priority_benefits=[];
    if(context["sort_type"])
    {
        if(context["sort_type"]=="priority")
        {
            sort_priority_benefits = context["sort_priority_values"].map(function(obj)
            {
                let value = obj.value;
                if(obj.type=="benefit")
                {
                    value = helper.getBenefitname(value,product_line,"benefits");
                }
                else
                {
                    value = helper.getBenefitname(value,product_line,"adjectives");
                }
                return value;
            });
        }
    }
    else
    {
        let benefit_tags = benefit_tagging[product_line];
        let priority_benefit_values = context["priority_values"]["benefits"];
        for(let ben in priority_benefit_values)
        {
            if(benefit_tags[priority_benefit_values[ben]]=="broad_occasions" || benefit_tags[priority_benefit_values[ben]]=="occasions")
            {
                let ben_name = helper.getBenefitname(priority_benefit_values[ben],product_line,"benefits");
                if(sort_priority_benefits.indexOf(ben_name)==-1)
                    sort_priority_benefits.push(ben_name);
            }
        }
    }

    
    console.log("Sending to elasticsearch");
    // Fetching products
    elasticSearch.runQuery(products_query, function (es_result,total,err)
    {
        let result = [];
        if(context.broad_occasion && context["broad_occasion"].key!="")
            result_occasion = context.broad_occasion.key;
        result.push({"total":total,"is_flow_complete":is_flow_complete, "product_line": result_product_line, "occasion": result_occasion});
        if(err==null && total>0)
        {
            helper.getMongoProductDetails(context, es_result, adjectives, benefits, sort_priority_benefits, function(mongo_product_list){
                result = result.concat(mongo_product_list);
                callback(result);
            });
        }
        else
        {
            callback(result);
        }
    });
}
function checkObjExist(main_obj, obj)
{
    for(let j in main_obj)
    {
        if(main_obj[j].type == obj.type && main_obj[j].value == obj.value)
        {
            return false;
        }
    }
    return true;
}

/*
* this is used to send messages to user based on the sessionId
* @param {string} sessionId
* @param {string} channel
* @param {obj} data
*/
function sendMessage(channel, data, sessionId) {
    console.log("Message to user : ", data.type);
    let context = sessions.getContext(sessionId);
    let event_product_line = context["product_line"];
    if(!data.hasOwnProperty("reason_status"))
        data["reason_status"] = false;
    if(channel=="chat" || channel=="")
    {
        data["product_line_status"] = false;
        if(event_product_line)
            data["product_line_status"] = true;
    }
    data["question_number"] = context["question_number"];
    data["end_of_chat"] = context["is_flow_complete"];
    //======================= Event Storing into Log file ==========================
    let details = JSON.parse(JSON.stringify(data));
    if(details.type=="product_list")
    {
        for(let i in details.list)
        {
            let product_details ={};
            product_details["_id"] = details.list[i]._id;
            product_details["product_line"] = details.list[i].product_line;
            product_details["benefit_percentage"] = details.list[i].benefit_percentage;
            details.list[i] = product_details;
        }
    }
    let event = {"type":data["type"], "time":new Date().getTime(), "chat_id":context.chat_id, "end_of_chat":context["is_flow_complete"],"details":details};
    helper.logger_api_call(sessionId, event);
    //==============================================================================
    let socket = global.getUserSocket(sessionId);
    if(socket) {
        socket.emit(channel, data);
    }
}

module.exports = {
    updateProductList : updateProductList,
    sendProductsToUser: sendProductsToUser,
    sendBenefitsToUser: sendBenefitsToUser,
    sendAppliedValues: sendAppliedValues,
    sendMessage :sendMessage
};