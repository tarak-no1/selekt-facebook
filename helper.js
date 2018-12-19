const sessions = require('./public/sessions');
const request = require("request");
const winston = require('winston');
const mapping = require('./public/mapping');
const word_mapping = require("./public/word_mapping");
const benefits_mapping = require("./public/benefits_mapping")
const elasticSearch = require('./db_config/elasticSearch');
const mongo = require('./db_config/mongoQueries');
const fs = require('fs');
let conversationGraph = require("./public/conversationGraphs");

const logDir = './log_files';
// Create the log directory if it does not exist
if(!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
}
const tsFormat = () => (new Date()).toLocaleDateString();
const logger = new (winston.Logger)({
    transports:[
        new (require('winston-daily-rotate-file'))({
            filename: `${logDir}/-results_app.log`,
            timestamp:tsFormat,
            datePattern: 'yyyy-MM-dd',
            prepend:true,
            level:'info',
            json:true
        })
    ]
});
const mysql = require("mysql");
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
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}
handleDisconnect();

function get_products(result,callback)
{
    console.log("===========Inspiration PRoducts =================");
    //console.log(JSON.stringify(result,null,2));
    let product_line = result["product_line"];
    let min_price = result["min_price"];
    let max_price = result["max_price"];
    let occasion = result["occasion"];
    let key = result["attributes"][0].key[0];
    let value = result["attributes"][0].value[0];
    //console.log(key, value);
    let query =
        {
            "index": 'product_data',
            "type": product_line,
            "body":
                {"query":{"bool":{"must":[]}},size:60}
        };

    if(product_line!="na" && occasion!="na")
    {
        query.body.query.bool.must.push({match_phrase:{"product_filter.occasion" : occasion}});
    }
    else if(key!="na" && value!="na")
    {
        let attribute = "product_filter."+key;
        let json_query = {};
        json_query[attribute] = value;
        query.body.query.bool.must.push({match_phrase:json_query});
        if(min_price!="na" && max_price!="na")
        {
            query.body.query.bool.must.push({"range":{"product_filter.discount_price":{"gte":min_price,"lte":max_price}}});
        }
    }
    else if(min_price!="na" && max_price!="na")
    {
        query.body.query.bool.must.push({"range":{"product_filter.discount_price":{"gte":parseInt(min_price),"lte":parseInt(max_price)}}});
    }
    get_products_by_query(query,product_line,function (data) {
        callback(data);
    });
}
function get_products_by_query(query, product_line, callback)
{
    elasticSearch.runQuery(query,function(es_result,total,err)
    {
        let total_results = [];
        if(err==null && total>0)
        {
            let mongo_query = es_result.map(function(a){ return {"es_mysql_id":parseInt(a._id)}; });
            mongo.runQuery("product_data",product_line,{$or:mongo_query},function(result_set, mongo_error)
            {
                if(!mongo_error)
                {
                    for(let k in result_set)
                    {
                        let source = {};
                        let result = result_set[k];
                        source["product_line"] = product_line;
                        source["_id"] = result["es_mysql_id"];
                        source["product_filter"] = result["product_filter"];
                        source["style_images"] = result["style_images"];
                        source["landingPageUrl"] = result["pdpData"]["landingPageUrl"];
                        source["benefits"] = [];
                        source["fav_status"] = false;
                        
                        total_results.push(source);
                    }
                }
                callback(total_results);
            });
        }
        else
            callback(total_results);
    });
}
//getting least size image url
let resolutions = function(source)
{
    let image_url = undefined;
    let pixel,min_pixels=2080,require_pixel = 360;
    try{
        image_url = source["imageURL"];
        let image_resolutions = source["resolutions"];
        if(image_resolutions)
        {
            let res_keys = Object.keys(image_resolutions);
            let require_index = 0;
            for(let res in res_keys)
            {
                pixel = parseInt(res_keys[res].split("X")[0]);
                if(pixel>=require_pixel && pixel<min_pixels)
                {
                    min_pixels = pixel;
                    require_index = res;
                }
            }
            image_url = image_resolutions[res_keys[require_index]];
        }
    }catch (e){console.log("Error In resolutions method : ",e);}
    return image_url;
};

function get_inspirations(callback)
{
    const insp_ids =
    [
        26, 34, 68, 101, 125, 137,14, 146, 159, 178, 182, 86, 123, 50
    ];
    let total_results = [];
    let getDetails = function(insp_ids, i)
    {
        get_insp_by_id(insp_ids[i],function(data)
        {
            i++;
            total_results = total_results.concat(data);
            if(i<insp_ids.length)
            {
                getDetails(insp_ids, i);
            }
            else
                callback(total_results);
        });
    }
    getDetails(insp_ids, 0);
}
function get_insp_by_id(id,callback)
{
    let query = {
        index: 'styling_rules',
        type: 'inspiration_tiles',
        body: {
            query:
                {
                    match_phrase:{"_id":""+id}
                }
        }
    };
    elasticSearch.runQuery(query,function (res,total)
    {
        let jsonResult = {};
        jsonResult["id"] = res[0]["_id"];
        jsonResult["heading"] = res[0]["_source"]["inspiration_name"];
        jsonResult["sub_heading"] = "";

        jsonResult["imageUrl"] = res[0]["_source"]["image"];
        if(jsonResult["imageUrl"]==undefined)
            jsonResult["imageUrl"] = "http://assets.myntassets.com/assets/images/1263585/2016/4/6/11459930369265-bebe-Coral-Orange-Sequinned-Swarovski-Elements-Maxi-Dress-5551459930366199-1.jpg";
        jsonResult["_source"] = res[0]["_source"];
        callback(jsonResult);
    });
}

function sendDealsList(sessionId, callback)
{
    let context = sessions.getContext(sessionId);
    let occasion_message = (context.hasOwnProperty("broad_occasion")?context["broad_occasion"]["key"]:"");
    if(context.hasOwnProperty("deals"))
    {
        occasion_message = "best deals in " + occasion_message;
    }
    let product_data = {
        type : "product_list",
        parent : "suggestion",
        current_page : context["from"],
        product_line : context["product_line"],
        occasion : occasion_message,
        sort_type : (context["sort_type"]?context["sort_type"]:"match_score"),
        total_length : 0,
        list : []
    };
    let product_line = mapping.product_line_to_db_keys[context.product_line];
    let benefits = context['benefits'].concat();
    let adjectives = context['adjectives_new'].concat();

    let filters = context['filters'].concat();
    let from = context['from'];

    let discount_percentage_filter = filters.filter(function(a){
        let obj_keys = Object.keys(a);
        if(obj_keys[0]=="range")
        {
            if(a["range"].hasOwnProperty("product_filter.discount_percent"))
                return true;
        }
        return false;
    });
    if(discount_percentage_filter.length==0)
    {
        filters.push({"range":{"product_filter.discount_percent":{"gte":40}}})
    }
    filters.push({"deal" : true});
    if(context.hasOwnProperty("brand_deal_values"))
    {
        let brand_deal_values = context["brand_deal_values"];
        let obj = {};
        if(brand_deal_values.indexOf("premium brands")!=-1)
        {
            obj = {start:0.4}
        }
        if(brand_deal_values.indexOf("high end brands")!=-1)
        {
            if(obj.hasOwnProperty("start"))
                obj["start"] = 0.3
            else
            {
                obj["start"] = 0.3;
                obj["end"] = 0.4;
            }
        }
        if(brand_deal_values.indexOf("medium end brands")!=-1)
        {
            if(obj.hasOwnProperty("start"))
                obj["start"] = 0.2
            else
            {
                obj["start"] = 0.2;
                obj["end"] = 0.3;
            }
        }
        if(brand_deal_values.indexOf("all brands")!=-1)
        {
            obj = {"start":0};
        }
        let range_query = {"range":{"brand_weight":{"gte":obj["start"],"lte":obj["end"]}}};
        filters.push(range_query);
    }
    let product_query = buildQuery(product_line, filters, context.priority_values,from, benefits, adjectives, context.remove_tags, context["sort_type"], context["sort_priority_values"]);
    
    if(product_query.body.sort.length==0 || context["benefits"].length>0)
        product_query.body.sort.unshift({"brand_weight":"desc"});

    console.log(JSON.stringify(product_query.body, null, 2));
    elasticSearch.runQuery(product_query, function (es_result, total, err)
    {
        console.log(total, es_result.length);
        let result = [];
        if(err==null && total>0)
        {
            getMongoProductDetails(context, es_result, adjectives, benefits, [], function(product_list){
                product_data["total_length"] = total;
                product_data["list"] = product_list;
                callback(product_data);
            });
        }
        else
        {
            product_data["total_length"] = total;
            callback(product_data);
        }
    });
}
function getMongoProductDetails(context, es_result, adjectives, benefits, sort_priority_benefits, callback)
{
    let product_line = mapping.product_line_to_db_keys[context["product_line"]];
    let mongo_query = es_result.map(function(a){ return {"es_mysql_id":parseInt(a._id)}; });
    mongo.runQuery("product_data",product_line,{$or:mongo_query},function(result_set, mongo_error)
    {
        let result = []
        if(!mongo_error)
        {
            let elastic_array = es_result.map(function(a){return a._id; });
            result_set = sortBasedonArray(result_set.concat(), elastic_array);
            for(let i in result_set)
            {
                let result_source = result_set[i];
                let source = {};
                source["_id"] = result_source["es_mysql_id"];
                source["priority_benefits"] = sort_priority_benefits;
                source["product_filter"] = result_source["product_filter"];
                source["product_filter"]["product_line"] = context["product_line"];
                source["landingPageUrl"] = result_source["pdpData"]["landingPageUrl"];
                source["product_benefits"] = getElementsNames(result_source["new_updated_benefit"],context["product_line"], "benefits");
                source["product_benefits"] = source["product_benefits"].concat(getElementsNames(result_source["adjectives"],context["product_line"], "adjectives"));
                source["style_images"] = result_source["style_images"];
                source["price_drop_score"] = result_source["price_drop_score"];
                source["min_price"] = result_source["min_price"];
                source["avg_price"] = result_source["avg_price"];

                source["deal"] = false;

                if(result_source["product_filter"]["discount_percent"]>=40 && result_source.hasOwnProperty("deal"))
                {
                    //console.log(result_source["product_filter"]["discount_percent"]);
                    source["deal"] = result_source["deal"];
                }
                // Adding the benefits and adjectives of the product which are asked by user
                source["benefits"] = array_intersection(result_source["new_updated_benefit"], benefits);
                source["benefits"] = getElementsNames(source.benefits,context["product_line"], "benefits");

                let adj = array_intersection(result_source["adjectives"], adjectives);
                adj = getElementsNames(adj,context["product_line"], "adjectives");

                source.benefits = source["benefits"].concat(adj);
                source["benefit_percentage"] = Math.round((source["benefits"].length / (benefits.length+context["adjective_questions_count"]))*100);
                if(!source["benefit_percentage"])
                    source["benefit_percentage"] = 0;
                result.push(source);
            }
        }
        callback(result);
    });
}
function sort_by_benefit_length(result)
{
    result = result.sort(function(a, b){
        return b["benefits"].length - a["benefits"].length;
    });
    return result;
}
function getElementsNames(obj,product_line, type) {
    let obj_names = [];
    product_line = mapping.product_line_to_db_keys[product_line];
    for(let ben in obj)
    {
        let ben_name = getBenefitname(obj[ben],product_line,type);
        if(ben_name==undefined)
        {
            ben_name = obj[ben];
        }
        obj_names.push(ben_name);
    }
    return obj_names;
}
function array_intersection(a, b)
{
    let result = [];
    for(let i in a)
    {
        if(b.indexOf(a[i])!=-1)
        {
            result.push(a[i]);
        }
    }

    return result;
}
/*
* this will helps to saving the logs data
*/
function random(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
function get_reason(reason)
{
    let sentence =
        [
            "Go for styles "+reason+".",
            "Pick the ones "+reason+".",
            "Choose clothes "+reason+"."
        ]
    let get_random_number = random(0,sentence.length);
    return sentence[get_random_number];
}
function get_result(query, database, callback)
{
    connection.query("use "+database);
    connection.query(query,function(error,result)
    {
        if(!error)
        {
            callback(result);
        }
        else console.log(error);
    });
}

let follows = function(a){
    return a.map(function(item, i){
        return [item, follows(a.slice(i+1))];
    });
};
/*
* this function is used to make combinations of array elements
*/
let combinations = function(a){
    let combs = function(prefix, trie, result){
        trie.forEach(function(node, i){
            result.push((prefix +"  "+ node[0]).trim());
            combs((prefix +"  "+ node[0]).trim(), node[1], result);
        });
        return result;
    };
    return combs('', follows(a), []);
};
/*
* this function helps sort an array based on another array
*/
function sortBasedonArray(array, order) {

    //create a new array for storage
    let newArray = [];

    //loop through order to find a matching id
    for (let i = 0; i < order.length; i++) { 
        //label the inner loop so we can break to it when match found
        dance:
        for (let j = 0; j < array.length; j++) {

            //if we find a match, add it to the storage
            //remove the old item so we don't have to loop long nextime
            //and break since we don't need to find anything after a match
            if (array[j]["es_mysql_id"] == order[i]) {
                newArray.push(array[j]);
                array.splice(j,1);
                break dance;
            }
        }
    }
    return newArray;
}

/*
* this function is used to get display name of particular backend value
*/
function getBenefitname(benefit, product_line,type)
{
    let all_benefits = word_mapping[product_line][type];
    let benefit_keys = Object.keys(all_benefits);
    for(let i in benefit_keys)
    {
        let benefit_name = benefit_keys[i];
        if(all_benefits[benefit_name].entity_key == benefit)
        {
            return benefit_name;
        }
    }
    return benefit;
}
/*
* this is used to get the require reason message 
* @param {string} sessionId
*/
function getReasonMessage(sessionId, current_total_products)
{
    let string ="";
    let context = sessions.getContext(sessionId);
    let reason_messages = context["reason_messages"].concat();
    context["reason_messages"] = [];
    sessions.storeContext(sessionId, context);
    if(current_total_products!=0)
    {
        let prefix_array_changed =  getPrefixReason();
        let previous_message = context["previous_message"];
        if(previous_message && previous_message!="" && reason_messages.length>0)
        {
            previous_message = (previous_message.indexOf(context["product_line"])!=-1)?previous_message:previous_message+" "+context["product_line"];
            string += prefix_array_changed[random(0,prefix_array_changed.length)]+current_total_products+" styles.\n\n";
        }
        else
        {
            let sentence = "I have found "+current_total_products+" styles matching your request.\n"
            if(context.hasOwnProperty("deals"))
                sentence = "I have got "+current_total_products+" best deals from Myntra, Jabong, Voonik "+context["product_line"]+".\n";
            string += sentence;
        }
        for(let i in reason_messages)
        {
            let reason_prefix = getPrefixReasons(context["product_line"])
            let reason = reason_messages[i];
            let reason_array = reason["reason"].split(".");
            /*reason_array = reason_array.map(function(a){
                a = a.trim();
                a = titleCase(a);
                return a;
            });*/
            reason["reason"] = reason_array.join(". ");
            if(reason["type"]=="benefit")
            {
                string += reason_prefix + reason["reason"]+" ";
            }
            else
            {
                //string += reason["reason"]+" ";
            }
        }   
    }
    else
    {
        
    }
    return string
}
function getPrefixReasons(product_line_name)
{
    let prefix_array = [
    	"I have chosen "+product_line_name+" which are ",
    	"I curated "+product_line_name+" which are ",
    	"I am showing "+product_line_name+" that are ",
        "I have picked "+product_line_name+" that are "
    ];
    return prefix_array[random(0,prefix_array.length)];
}
function titleCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getPrefixReason()
{
    return [
        "I have found ",
        "Got ",
        "Found "
    ];
}
/*
* this function is used to get total products count based on the elastic search query
*/
function getTotalProducts(sessionId, callback)
{
    let total_products = 0, sync = true;
    let context = sessions.getContext(sessionId);
    let product_line = mapping.product_line_to_db_keys[context.product_line];
    let benefits = context['benefits'].concat();
    let adjectives = context['adjectives_new'].concat();

    let filters = context['filters'].concat();
    let from = context['from'];
    if(context.hasOwnProperty("brand_deal_values"))
    {
        let brand_deal_values = context["brand_deal_values"];
        let obj = {};
        if(brand_deal_values.indexOf("premium brands")!=-1)
        {
            obj = {start:0.4}
        }
        if(brand_deal_values.indexOf("high end brands")!=-1)
        {
            if(obj.hasOwnProperty("start"))
                obj["start"] = 0.3
            else
            {
                obj["start"] = 0.3;
                obj["end"] = 0.4;
            }
        }
        if(brand_deal_values.indexOf("medium end brands")!=-1)
        {
            if(obj.hasOwnProperty("start"))
                obj["start"] = 0.2
            else
            {
                obj["start"] = 0.2;
                obj["end"] = 0.3;
            }
        }
        if(brand_deal_values.indexOf("all brands")!=-1)
        {
            obj = {"start":0};
        }
        let range_query = {"range":{"brand_weight":{"gte":obj["start"],"lte":obj["end"]}}};
        console.log(range_query);
        filters.push(range_query);
    }
    if(context.hasOwnProperty("deals"))
    {
        let discount_percentage_filter = filters.filter(function(a){
            let obj_keys = Object.keys(a);
            if(obj_keys[0]=="range")
            {
                if(a["range"].hasOwnProperty("product_filter.discount_percent"))
                    return true;
            }
            return false;
        });
        if(discount_percentage_filter.length==0)
        {
            filters.push({"range":{"product_filter.discount_percent":{"gte":40}}})
        }
        filters.push({"deal" : true});
    }
    let product_query = buildQuery(product_line, filters, context.priority_values,from, benefits, adjectives, context.remove_tags, context["sort_type"], context["sort_priority_values"],context["occasion_status"]);
    delete product_query.from;
    delete product_query.size;
    delete product_query.body.sort;
    console.log(JSON.stringify(product_query, null, 2));
    elasticSearch.getCount(product_query, function(err, current_total_products)
    {
        callback(current_total_products);
    });
}
function getLatestTrends(sessionId,from,callback)
{
    let filters = [];
    let benefits = [];
    let adjectives = [];
    let remove_tags = [];
    let product_line="tops"
    let sort_type = "match_score";
    let sort_priority_values = {"benifits":[""]}
    let query = {
        "bool":{
            "must":[{
                "match_phrase":{
                    "trending_status" : true
                }
            }]
        }        
    }
    let product_query = {
        index: 'product_data',
        type: 'women_skirts',
        body: {
            query: query
        },
        from : from*60,
        size: 60
    }
    console.log(JSON.stringify(product_query, null, 2));
    let product_data = {
        total_length : 0,
        list : []
    };
    let new_context = {
        product_line : product_line
    }
    elasticSearch.runQuery(product_query, function (es_result, total, err)
    {
        //console.log(total, es_result);
        let result = [];
        if(err==null && total>0)
        {
            getMongoProductDetails(new_context, es_result, adjectives, benefits, [], function(product_list){
                //console.log("product_list",product_list)
                product_data["total_length"] = total;
                product_data["list"] = product_list;
                callback(product_data);
            });
        }
        else
        {
            product_data["total_length"] = total;
            callback(product_data);
        }
    });  
}
function getBodyProfileReason(context_product_line,body_profile,value)
{
    let product_line = mapping.product_line_to_db_keys[context_product_line];
    let profile_info = word_mapping[product_line][value][body_profile[value]];
    let reason="";
    if(profile_info["reason"])
        reason = profile_info["reason"];
    let tags={};
    if(reason!="" && reason!="na")
    {
        let make_reason = "";
        make_reason += capitalizeFirstLetter(value)+": "+body_profile[value]+"\n";
        //make_reason += "You should go for: "+getBenefitname(profile_info["entity_key"], product_line, "benefits")+"\n";
        make_reason += getPrefixReasons(context_product_line);+" "+reason
        tags = {value:profile_info["entity_key"], "reason":make_reason};
    }
    return tags;

}
/*
* this is used to get the all body profile reasons
* @params {string} context_product_line
* @params {obj} body_profile
* return {array} tags
*/
function getBodyProfileReasons(context_product_line, body_profile)
{
    let body_profile_keys = ["age", "height", "skintone", "bodyshape"];
    let product_line = mapping.product_line_to_db_keys[context_product_line];
    console.log(body_profile);
    let tags = body_profile_keys.map(function(val){
        if(body_profile.hasOwnProperty(val))
        {
            let profile_info = word_mapping[product_line][val][body_profile[val]];
            let reason = profile_info["reason"];
            if(reason!="" && reason!="na")
            {
                let make_reason = "";
                make_reason += capitalizeFirstLetter(val)+": "+body_profile[val]+"\n";
                //make_reason += "You should go for: "+getBenefitname(profile_info["entity_key"], product_line, "benefits")+"\n";
                make_reason += getPrefixReasons(context_product_line)+" "+reason
                return {value:profile_info["entity_key"], "reason":make_reason};
            }
        }
        return {};
    });
    tags = tags.filter(function(val){
        return Object.keys(val).length>0;
    });
    return tags;
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
/*
* this is used to get the all body profile reasons
* @params {string} context_product_line
* @params {array} body_concerns
* return {array} tags
*/
function getBodyConcernReasons(context_product_line, body_concerns)
{
    let product_line = mapping.product_line_to_db_keys[context_product_line];
    let tags = [];
    let body_concerns_info = word_mapping[product_line]["body_concern"];
    console.log("hello",body_concerns,body_concerns_info);
    for(let i in body_concerns)
    {
        let concern = body_concerns[i].toLowerCase();
        if(body_concerns_info.hasOwnProperty(concern) && body_concerns_info[concern])
        {
            let concern_info = body_concerns_info[concern];
            let reason = concern_info["reasons"];
            if(reason!="" && reason!="na")
            {
                let make_reason = "Body Concern: "+concern+"\n";
                //make_reason += "You should go for : "+getBenefitname(concern_info["benefit_key"], product_line, "benefits")+"\n";
                make_reason += getPrefixReasons(context_product_line)+" "+reason
                tags.push({value:concern_info["benefit_key"], "reason":make_reason});
            }
        }
    }
    console.log(tags);
    return tags;
}
function makeTagReason(product_line,tag,added_filters,callback)
{
    console.log("tags:2",tag)
    let without_conflict = [], with_conflict = [];
    let query = {
        index: "styling_rules",
        type: "benefit_rules",
        body: {
            query:{
                bool:{
                    must:[
                        {
                            match_phrase:{
                                "product_line_name":product_line
                            }
                        },
                        {
                            match_phrase:{
                                "adjective_value":tag["value"]
                            }
                        }
                    ]
                }
            }
        }
    };
    elasticSearch.runQuery(query, function(response, total, err)
    {
        if(!err && total>0)
        {
            let conflict_object = {};
            let source = response[0]["_source"];
            let attribute_dependencies = source["attribute_dependencies"];
            let conflict_status = false;
            let filter_count = 0;
            for(let i in added_filters)
            {
                let filters = added_filters[i];
                let filter_status = true;
                for(let j in attribute_dependencies)
                {
                    let attribute_value = attribute_dependencies[j];
                    if(filters["key"]==attribute_value["attribute_type"])
                    {
                        let att_values = attribute_value["attribute_value"].filter(function(a)
                        {
                            let value_status = filters["values"].indexOf(a)!=-1;
                            if(!value_status)
                            {
                                if(!conflict_object.hasOwnProperty(filters["key"]))
                                {
                                    conflict_object[filters["key"]] = filters["values"];
                                }
                            }
                            return value_status;
                        });
                        if(att_values.length==0)
                        {
                            filter_status = false;
                            break;
                        }
                    }
                }
                if(filter_status)
                {
                    filter_count++;
                }
            }
            if(filter_count!=added_filters.length)
            {
                conflict_status = true;
            }
            
            tag["conflict_status"] = conflict_status;
            if(conflict_status)
            {
                tag["conflict_elements"] = conflict_object;
                with_conflict.push(tag);
            }
            else
            {
                without_conflict.push(tag);
            }
        }
        else
        {
            console.log(tag);
            console.log(err, total);
        }
        callback(with_conflict, without_conflict);
    });
}
/*
* this is used to getting all benefits with conflict values and without conflict values
* @params {string} product_line
* @params {array} tags,added_filters
*/
function makeTagReasons(product_line, tags, added_filters, callback)
{
    if(tags)
    {
        console.log("tags:2",tags)
        let without_conflict = [], with_conflict = [];
        let getTagDetails = function(tags, index)
        {
            let tag = tags[index];
            let query = {
                index: "styling_rules",
                type: "benefit_rules",
                body: {
                    query:{
                        bool:{
                            must:[
                                {
                                    match_phrase:{
                                        "product_line_name":product_line
                                    }
                                },
                                {
                                    match_phrase:{
                                        "adjective_value":tag["value"]
                                    }
                                }
                            ]
                        }
                    }
                }
            };
            elasticSearch.runQuery(query, function(response, total, err)
            {
                if(!err && total>0)
                {
                    let conflict_object = {};
                    let source = response[0]["_source"];
                    let attribute_dependencies = source["attribute_dependencies"];
                    let conflict_status = false;
                    let filter_count = 0;
                    for(let i in added_filters)
                    {
                        let filters = added_filters[i];
                        let filter_status = true;
                        for(let j in attribute_dependencies)
                        {
                            let attribute_value = attribute_dependencies[j];
                            if(filters["key"]==attribute_value["attribute_type"])
                            {
                                let att_values = attribute_value["attribute_value"].filter(function(a)
                                {
                                    let value_status = filters["values"].indexOf(a)!=-1;
                                    if(!value_status)
                                    {
                                        if(!conflict_object.hasOwnProperty(filters["key"]))
                                        {
                                            conflict_object[filters["key"]] = filters["values"];
                                        }
                                    }
                                    return value_status;
                                });
                                if(att_values.length==0)
                                {
                                    filter_status = false;
                                    break;
                                }
                            }
                        }
                        if(filter_status)
                        {
                            filter_count++;
                        }
                    }
                    if(filter_count!=added_filters.length)
                    {
                        conflict_status = true;
                    }
                    
                    tag["conflict_status"] = conflict_status;
                    if(conflict_status)
                    {
                        tag["conflict_elements"] = conflict_object;
                        with_conflict.push(tag);
                    }
                    else
                    {
                        without_conflict.push(tag);
                    }
                }
                else
                {
                    console.log(tag);
                    console.log(err, total);
                }
                index++;
                if(index<tags.length)
                    getTagDetails(tags, index)
                else
                    callback(with_conflict, without_conflict);
            });
        };
        if(tags.length>0)
            getTagDetails(tags, 0)
        else
            callback([],[]);
    }
    else
    {
        console.log("tags:3",tags)
        callback([],[]);
    }
}
/*
* this function is used to build the elastic search query based on user requirements
*/
function buildQuery(product_line, filters, context_priority_values, from, benefits, adjectives, remove_tags, sort_type, sort_priority_values,occasion_status)
{
    let query = 
    {
        bool:{
            must : [],
            should : [],
            must_not : []
        }
    };
    let boost_myntra_value_status = true;
    //query for filters
    console.log(filters)
    let cnt_filters = {};
    for(let x in filters)
    {
        let attribute = Object.keys(filters[x])[0];
        if(attribute != "range")
        {
            let push_status = true;
            for(let rm in remove_tags)
            {
                if(("product_filter."+remove_tags[rm].key)==attribute && filters[x][attribute] == remove_tags[rm].value)
                    push_status = false;
            }
            if(push_status)
            {
                if(cnt_filters[attribute] == undefined)
                    cnt_filters[attribute] = [];
                let filter_obj = {};
                filter_obj[attribute] = filters[x][attribute];
                cnt_filters[attribute].push({"match_phrase":filter_obj});
            }
        }
        else
        {
            query.bool.must.push(filters[x]);
        }
    }
    let cnt_keys = Object.keys(cnt_filters);
    for(let y in cnt_keys)
    {
        let output = cnt_filters[cnt_keys[y]];
        query.bool.must.push({"bool":{"should":output}});
    }
    // remove tags
    for(let rm in remove_tags)
    {
        let rm_value = remove_tags[rm];
        if(rm_value.key!="benefit" && rm_value.key!="adjective")
        {
            if(rm_value.key=="range")
            {
                query.bool.must_not.push(rm_value);
            }
            else
            {
                let obj = {};
                if(rm_value.key)
                {
                    obj["product_filter."+rm_value.key] = rm_value.value;
                    query.bool.must_not.push({term:obj});
                }
            }
        }
    }

    //query for important benefits and adjectives
    let priority_benefits = context_priority_values["benefits"];
    let priority_adjectives = context_priority_values["adjectives"];
    for(let i in priority_benefits)
    {
        boost_myntra_value_status = false;
        console.log(benefits_mapping[product_line][priority_benefits[i]])
        if(occasion_status&&benefits_mapping[product_line][priority_benefits[i]]=="broad_occasions")
        {

        }
        else
            query.bool.must.push({match_phrase:{"new_updated_benefit":priority_benefits[i]}});
    }
    for(let i in priority_adjectives)
    {
        boost_myntra_value_status = false;
        query.bool.must.push({match_phrase:{"adjectives":priority_adjectives[i]}});
    }
    //adjectives
    //making all adjectives to must

    let attribute_obj = {};

    let sort_by = [];
    console.log("Sort Type : ",sort_type);
    
    if(sort_type=="priority")
    {
        for(let i in sort_priority_values)
        {
            let obj = sort_priority_values[i];
            let value = obj.value;
            let priority = obj.priority;
            if(obj.type=="adjective")
            {
                if(adjectives.indexOf(value)!=-1)
                    adjectives.splice(adjectives.indexOf(value),1);
                if(priority_adjectives.indexOf(value)==-1)
                {
                    boost_myntra_value_status = false;
                    let adj_name = getBenefitname(value, product_line, "adjectives");
                    let adjective_obj = word_mapping[product_line]["adjectives"][adj_name];
                    let att_name = "0";
                    if(adjective_obj)
                    {
                        att_name = adjective_obj["attribute_key"];
                    }
                    if(!attribute_obj.hasOwnProperty(att_name))
                        attribute_obj[att_name] = [];
                    attribute_obj[att_name].push(value);
                }
            }
            else
            {
                if(benefits.indexOf(value)!=-1)
                    benefits.splice(benefits.indexOf(value),1);
                if(priority_benefits.indexOf(value)==-1)
                {
                    boost_myntra_value_status = false;
                    query.bool.should.push({"match_phrase":{"new_updated_benefit":{"query":value, "boost":1024/priority}}});
                }
            }
        }
    }
    else if(sort_type=="price_low_to_high")
    {
        sort_by.push({"product_filter.discount_price": {"order": "asc"}});
    }
    else if(sort_type=="price_high_to_low")
    {
        sort_by.push({"product_filter.discount_price": {"order": "desc"}});
    }
    else if(sort_type=="discount")
    {
        sort_by.push({"product_filter.discount_percent": {"order": "desc"}});
    }
    else if(benefits.length>0)
    {
        let script_sort_query =
        {
            "_script": {
                "script":{
                    "source":"int total = 0; for (int i = 0; i < doc['new_updated_benefit'].length; ++i) { if(params.benefits.indexOf(doc['new_updated_benefit'][i])!=-1)total+=1; } for (int j = 0; j < doc['adjectives'].length; ++j) { if(params.adjectives.indexOf(doc['adjectives'][j])!=-1)total+=1; } return total;",
                    "params": {
                        "benefits": benefits,
                        "adjectives": adjectives
                    }
                },
                "type": "number",
                "order":"desc"
            }
        }
        sort_by.push(script_sort_query);
    }
    //Benefits
    let benefits_query = {
        "terms":{"new_updated_benefit":benefits}
    };
   
    if(adjectives.length>0)
    {
        adjectives.forEach(function(a){
            let adj_name = getBenefitname(a, product_line, "adjectives");
            let adjective_obj = word_mapping[product_line]["adjectives"][adj_name];
            let att_name = "0";
            if(adjective_obj)
            {
                att_name = adjective_obj["attribute_key"];
            }
            if(!attribute_obj.hasOwnProperty(att_name))
                attribute_obj[att_name] = [];
            attribute_obj[att_name].push(a);
        });
    }
    let attribute_keys = Object.keys(attribute_obj);
    if(attribute_keys.length>0)
    {
        attribute_keys.forEach(function(a){
            query.bool.must.push({terms:{"adjectives":attribute_obj[a]}});
        });
    }
    if(benefits.length > 0)
    {
        boost_myntra_value_status = false;
        query.bool.should.push(benefits_query);
    }
    if(benefits.length>0)
    {
        let sort_values = benefits.map(function(benefit){
            let a = "new_updated_benefit_scores."+benefit+"_score";
            return "doc['"+a+"'].value";
        });
        let sort_query = {"_script" : {"type" : "number","script" : {"source": sort_values.join(" + ")},"order" : "desc"}};
        sort_by.push(sort_query);
    }
    //console.log(JSON.stringify(query,null,2));
    //Remove Tags
    return {
        index: 'product_data',
        type: product_line,
        body: {
            query: query,
            sort : sort_by
        },
        from : from*60,
        size: 60
    };
}
/*
* this function is used to process the adjective module questions
*/
function processConversationQuestion(sessionId, question_type, question, callback)
{
    let user_context = sessions.getContext(sessionId);
    let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
    let response = {
        multi_select : question.multi_select,
        text : question.text,
        belongs : "refineListQuestion",
        attribute : question.attribute,
        gif_status : false
    };
    if(question.multi_select)
        response.type = "multi_select";
    else
        response.type = "single_select";

    // Populating options
    response.options = [];
    let answer_keys = Object.keys(question['options']);
    // conversation options making
    if(question_type=="customize")
    {
        response["question_type"] = "customize";
        for(let i in answer_keys)
        {
            let key = answer_keys[i];
            let new_questions_key = question_type + "_" + key;
            let push_status = true;
            let new_questions = conversationGraph.conversation_rules[product_line][new_questions_key];
            if(new_questions)
            {
                new_questions = new_questions.filter(function(obj){
                    let next_question = conversationGraph.questions[product_line][obj];
                    return user_context["adjective_attributes"].hasOwnProperty(next_question["attribute"]);
                });
                if(new_questions.length>0)
                {
                    push_status = false;
                }
            }

            let answer_text = question['options'][key]['text'];
            if(push_status)
            {
                let option =
                {
                    key : key,
                    value : capitalizeFirstLetter(answer_text)
                }
                response.options.push(option);
            }
        }
        callback(response);
    }
    else
    {
        response["question_type"] = "adjectives";
        function getAnswerKeys(answer_keys, i)
        {
            let key = answer_keys[i];
            let answer_text = question['options'][key]['text'];
            let adjective_value = question['options'][key]['adjective'];
            let image_url = "https://www.prodx.in/fashion_bot/client/hourglass_cut.png";
            if(adjective_value)
            {
                image_url = "https://www.prodx.in/v2/static/"+adjective_value+".png";
                user_context["adjectives_new"].push(adjective_value);
            }
            getTotalProducts(sessionId, function(total_products){
                if(adjective_value)
                {
                    user_context["adjectives_new"].splice(user_context["adjectives_new"].indexOf(adjective_value), 1);
                }
                let option =
                {
                    products_count : total_products,
                    key : key,
                    value : capitalizeFirstLetter(answer_text),
                    image_url : image_url,
                    adjective_value : adjective_value
                };
                if(total_products>0)
                    response.options.push(option);
                i++;
                if(i<answer_keys.length)
                    getAnswerKeys(answer_keys, i);
                else
                    callback(response);
            });
        }
        if(answer_keys.length>0)
            getAnswerKeys(answer_keys, 0);
        else
            callback(response);
    }
}
/*
* this function is used to store the data in mysql
*/
function saveInSql(database, query)
{
    connection.query('use '+database);
    connection.query(query,function (err,data) {
        if(err) console.error(err);
        else {console.log("saved Successfully");}
    });
}
module.exports = {
    getPrefixReasons : getPrefixReasons,
    saveInSql: saveInSql,
    sort_by_benefit_length : sort_by_benefit_length,
    random:random,
    getLatestTrends : getLatestTrends,
    get_reason : get_reason,
    get_inspirations: get_inspirations,
    get_products : get_products,
    get_products_by_query: get_products_by_query,
    get_insp_by_id: get_insp_by_id,
    get_result: get_result,
    resolutions : resolutions,
    combinations : combinations,
    sortBasedonArray : sortBasedonArray,
    makeTagReasons: makeTagReasons, //16-09-2017
    getBenefitname: getBenefitname,
    getReasonMessage: getReasonMessage,
    getTotalProducts: getTotalProducts,
    buildQuery: buildQuery,
    getBodyProfileReasons: getBodyProfileReasons,
    getBodyConcernReasons: getBodyConcernReasons,
    capitalizeFirstLetter: capitalizeFirstLetter,
    processConversationQuestion: processConversationQuestion,
    getMongoProductDetails : getMongoProductDetails,
    sendDealsList : sendDealsList,
    array_intersection : array_intersection,
    getBodyProfileReason : getBodyProfileReason,
    makeTagReason : makeTagReason,
    titleCase : titleCase
};
