const fs = require("fs");
const mapping = require('./public/mapping');
const word_mapping = JSON.parse(fs.readFileSync("./public/word_mapping.json"));
const msg_mapping = JSON.parse(fs.readFileSync("./public/msg_mapping.json"));
const occasion_to_productline_map = JSON.parse(fs.readFileSync("./public/occasion_to_productline_map.json"));
const body_profile_mapping = JSON.parse(fs.readFileSync("./public/body_profile_mapping.json"));

let noNoWords = ["if","but","until","not","nor","yet","unless","doesn't","don't","didn't","can't","whether","as musch as",
"where as","because","besides","however","neverthless","nonetheless","instead","otherwise","rather","accordingly","consequently",
"hence","meanwhile","furthermore","likewise"];

const broad_category_mapping = 
{
    //synonym : value
    "topwear" : "topwear",
    "top wear" : "topwear",
    "bottomwear" : "bottomwear",
    "bottom wear" : "bottomwear",
    "footwear" : "footwear",
    "foot wear" : "footwear",
    "nightwear" :"nightwear",
    "night wear" : "nightwear",
    "innerwear" : "innerwear",
    "inner wear" : "innerwear",
    "westerwear" : "westerwear",
    "wester wear" : "westerwear",
    "indianwear" : "indianwear",
    "indian wear" : "indianwear",
    "traditionalwear" : "indianwear",
    "traditional wear" : "indianwear",
    "accessories" : "accessories",
    "ethnicwear" : "ethnicwear",
    "ethnic wear" : "ethnicwear"
};
/*
* this will helps to get the entities in a message
* @param {string} message
* @param {obj} context
* return {obj}
*/
function getEntities(message, context, callback)
{
    message = cleanSentence(message);
    let entities = {},entities_productline=undefined;
    
    //checking any greet words present or not
    let greet_words = checkForGreetMessage(message);
    message = greet_words["message"];
    entities = Object.assign(entities, greet_words["entities"]);
   
    let help_words = checkForHelpMessage(message);
    message = help_words["message"];
    entities = Object.assign(entities, help_words["entities"]);  
    
    //deal module
   /* let deals = checkForDeals(message);
    if(deals.hasOwnProperty("deals"))
    {
        message = deals["message"];
        entities["deals"] = "deals";
    }
    let brand_deal_values = checkForBrandDeals(message);
    if(brand_deal_values.hasOwnProperty("deal_values"))
    {
        entities["brand_deal_values"] = brand_deal_values["deal_values"];
        message =  brand_deal_values["message"];
    }*/

    //checking the product line is present in the message or not
    let get_product_line = checkForProductline(message);
    let productline_obj = get_product_line[0];
    message = get_product_line[1];
    console.log(context["previous_user_message"])
    if(!productline_obj.hasOwnProperty("product_line"))
    {
        if(context && context["product_line"])
            productline_obj.product_line = context.product_line;
    }
    else
    {
        entities.product_line = productline_obj.product_line;
        if(context && context["product_line"]==productline_obj.product_line&&context["previous_user_message"]!="undo")
            delete entities["product_line"]
    }
    
    if(!productline_obj.hasOwnProperty("product_line"))
    {
        let other_entities = checkForOtherValuesInMessage(message);
        entities = Object.assign(entities, other_entities);
        callback(entities, message.trim());
        return;
    }
    else
    {
        entities_productline = productline_obj.product_line;
    }
    let product_line =  undefined;
    try
    {
        product_line = mapping.product_line_to_db_keys[entities_productline];
    }catch(e){};
    /*using all synonyms that are present in the word_mapping file based on the product line,
    creating like this format 
        {
            "wedding" :
            {
                main_value : broad_occasions,
                key_name : 
            },
            "red" :
            {
                main_value : attribute_values,
                key_name : colour
            }
        }
    */
    if(!product_line)
    {
        entities["product_line_not_included"] = true; 
        callback(entities, message.trim());
    }
    else
    {
        let product_line_words = word_mapping[product_line];
        let word_keys = Object.keys(product_line_words);
        
        let json = msg_mapping[product_line];
        let json_keys = Object.keys(json);
        
        let entity_values = requireValues(json_keys, message);
        let require_values = entity_values["require_values"];
        message = entity_values["message"];
        require_values = require_values.map(function(value)
        {
            return json[value];
        });
        // checking the below values are present in the require_value array
        let occasions = word_mapping[product_line]["occasions"];
        let occasions_keys = Object.keys(occasions);

        let broad_occasions = word_mapping[product_line]["broad_occasions"];
        let broad_occasions_keys = Object.keys(broad_occasions);

        let adjectives = word_mapping[product_line]["adjectives"];
        let adjectives_keys = Object.keys(adjectives);

        let benefits = word_mapping[product_line]["benefits"];
        let benefits_keys = Object.keys(benefits);

        let attribute_values = word_mapping[product_line]["attribute_values"];
        let attribute_values_keys = Object.keys(attribute_values);

        let body_concerns = word_mapping[product_line]["body_concern"];
        let body_concerns_keys = Object.keys(body_concerns);

        let age = word_mapping[product_line]["age"];
        let age_keys = Object.keys(age);

        let height = word_mapping[product_line]["height"];
        let height_keys = Object.keys(height);

        let bodyshape = word_mapping[product_line]["bodyshape"];
        let bodyshape_keys = Object.keys(bodyshape);

        let skintone = word_mapping[product_line]["skintone"];
        let skintone_keys = Object.keys(skintone);
        for(let i in require_values)
        {
            let key_name = require_values[i].key_name;
            let main_value = require_values[i].main_value;
            let index_value = -1;
            if(key_name=="occasions")
            {
                index_value = occasions_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                entities["occasion"] = occasions[occasions_keys[index_value]];
                entities["occasion"].key = main_value;
            }
            else if(key_name=="broad_occasions")
            {
                index_value = broad_occasions_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                entities["broad_occasion"] = broad_occasions[broad_occasions_keys[index_value]];
            }
            else if(key_name=="body_concern")
            {
                index_value = body_concerns_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                if(!entities.hasOwnProperty("body_concerns"))
                {
                    entities["body_concerns"] = [];
                }
                let body_concern_value = body_concerns[body_concerns_keys[index_value]];
                body_concern_value.key = main_value;
                entities["body_concerns"].push(body_concern_value);
            }
            else if(key_name=="benefits")
            {
                index_value = benefits_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                if(!entities.hasOwnProperty("entity_benefits"))
                {
                    entities["entity_benefits"] = [];
                }
                let benefit_value = benefits[benefits_keys[index_value]];
                benefit_value.key = main_value;
                entities["entity_benefits"].push(benefit_value);
            }
            else if(key_name=="adjectives")
            {
                index_value = adjectives_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                if(!entities.hasOwnProperty("adjectives"))
                {
                    entities["adjectives"] = [];
                }
                let adjective_value = adjectives[adjectives_keys[index_value]];
                adjective_value["key"] = main_value;
                entities["adjectives"].push(adjective_value);
            }
            else if(key_name=="attribute_values")
            {
                index_value = attribute_values_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                if(!entities.hasOwnProperty("attribute_values"))
                {
                    entities["attribute_values"] = [];
                }
                let attribute_value = attribute_values[attribute_values_keys[index_value]];
                attribute_value.key = main_value;
                entities["attribute_values"].push(attribute_value);
            }
            else if(key_name=="age")
            {
                index_value = age_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                entities["age"] = age[age_keys[index_value]];
                entities["age"].key = main_value;
            }
            else if(key_name=="bodyshape")
            {
                index_value = bodyshape_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                entities["bodyshape"] = bodyshape[bodyshape_keys[index_value]];
                entities["bodyshape"].key = main_value;
            }
            else if(key_name=="height")
            {
                index_value = height_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                entities["height"] = height[height_keys[index_value]];
                entities["height"].key = main_value;
            }
            else if(key_name=="skintone")
            {
                index_value = skintone_keys.findIndex(item => main_value.toLowerCase() === item.toLowerCase());
                entities["skintone"] = skintone[skintone_keys[index_value]];
                entities["skintone"].key = main_value;
            }
        }
        let other_entities = checkForOtherValuesInMessage(message);
        entities = Object.assign(entities, other_entities);

        //getting negative words from the message
        entity_values = requireValues(noNoWords,message);
        let negative_words = entity_values["require_values"];
        message = entity_values["message"];

        if(negative_words.length > 0)
            entities.negative_words = negative_words;
        // getting the range values are present in the message
        if(message.length>0)
        {
            let range = checkForRange(message);
            entities = Object.assign(range["entities"], entities);
            message = range["message"];
        }
        if(message.indexOf("remove")!=-1)
            entities.type = "remove";
        callback(entities, message.trim());
    }
}
/*
* this will helps to getting the values present in the message.
* @param {array} json_keys
* @param {string} message
* return {obj}
*/
function requireValues(json_keys, message)
{
    //based on the key length sorting the array in ascending order
    try{
        json_keys = json_keys.sort(function(a,b)
        {
            return b.length - a.length;
        });
    }catch(e){}

    let require_values = [];
    for(let i in json_keys)
    {
        let value = json_keys[i].toLowerCase();
        let value_index = message.indexOf(value);
        if(value_index!=-1)
        {
            if(value_index==0 && (value_index+value.length)<message.length)
            {
                if(message.charAt(value_index+value.length)==" ")
                {
                    message = message.replace(value,"");
                    require_values.push(json_keys[i]);
                }
            }
            else if(value_index>0 && (value_index+value.length)==message.length)
            {
                if(message.charAt(value_index-1)==" ")
                {
                    message = message.replace(value,"");
                    require_values.push(json_keys[i]);
                }
            }
            else if(value_index==0 && (value_index+value.length)==message.length)
            {
                message = message.replace(value,"");
                require_values.push(json_keys[i]);
            }
            else if(value_index>0 && (value_index+value.length)<message.length)
            {
                if(message.charAt(value_index-1)==" " && message.charAt(value_index+value.length)==" ")
                {
                    message = message.replace(value,"");
                    require_values.push(json_keys[i]);
                }
            }
        }
    }
    return { require_values : require_values, message : message };
}
function checkForBrandDeals(message)
{
    let brand_deal_values = {
        "premium brands" : "premium brands",
        "premium brand" : "premium brands",
        "high end brands" : "high end brands",
        "high end brand" : "high end brands",
        "highend brands" : "high end brands",
        "highend brand" : "high end brands",
        "medium end brands" : "medium end brands",
        "medium end brand" : "medium end brands",
        "mediumend brands" : "medium end brands",
        "mediumend brand" : "medium end brands",
        "all brands" : "all brands",
    };
    let obj = {};
    let brand_deals = requireValues(Object.keys(brand_deal_values), message);
    if(brand_deals["require_values"].length>0)
    {
        obj["deal_values"] = [];
        brand_deals["require_values"].forEach(function(a){
            a = brand_deal_values[a];
            if(obj["deal_values"].indexOf(a)==-1)
                obj["deal_values"].push(a);
        });
        obj["message"] = brand_deals["message"];
    }
    return obj;
}
function checkForOtherValuesInMessage(message)
{
    let entities = {};
    let require_message = message.trim();
    let occasion_data = getMatchingValues(occasion_to_productline_map, require_message);
    if(occasion_data.hasOwnProperty("data"))
    {
        entities["occasion_productline_map"] = occasion_data["data"];
        require_message = occasion_data["message"];
    }
    //checking for broad category
    let broad_category_keys = Object.keys(broad_category_mapping);
    let broad_category = requireValues(broad_category_keys, require_message);
    
    let body_profile_data = getMatchingValues(body_profile_mapping, require_message);
    if(body_profile_data.hasOwnProperty("data"))
    {
        entities["body_profile_productline_map"] = body_profile_data["data"];
        require_message = body_profile_data["message"];
    }

    if(broad_category["require_values"].length>0)
    {
        let broad_category_key = broad_category_mapping[broad_category["require_values"][0]];
        let product_line_list = mapping.broad_category_to_product_lines[broad_category_key];
        entities["broad_category"] = {
            "key": broad_category_key,
            "values": product_line_list,
            "message": broad_category["message"]
        };
    }
    return entities;
}
/*
* this will helps to getting product line in the message.
* @param {string} message
* return {array}
*/
function checkForProductline(message)
{
    let entities = {};
    let product_line_names =
    {
        /*
        "product_line": [ synonym1, synonum2 ]
        */
        
        "blazers": [
            "blazers","blazer",
            "suits","suit"
        ],
        "capris": [
            "capris"
        ],
        "casual shoes": [
            "casual shoes",
            "shoe",
            "shoes"
        ],
        "dresses": [
            "gowns",
            "dress",
            "dresses"
        ],
        "flats": [
            "flats"
        ],
        "handbags": [
            "handbags","handbag"
        ],
        "heels": [
            "heels"
        ],
        "jackets": [
            "jacket",
            "jackets"
        ],
        "jeans": [
            "jean",
            "jeans"
        ],
        "jeggings": [
            "jeggings","jegging"
        ],
        "jumpsuits": [
            "jumpsuits","jumpsuit"
        ],
        "kurtas": [
            "kurta",
            "kurtas",
            "kurtha"
        ],
        "shirts": [
            "shirts","shirt"
        ],
        "shorts": [
            "shorts"
        ],
        "skirts": [
            "skirts", "skirt"
        ],
        "sweaters": [
            "sweaters", "sweater"
        ],
        "sweatshirts": [
            "sweatshirts", "sweatshirt"
        ],
        "tops": [
            "top",
            "tops"
        ],
        "trousers": [
            "trousers","trouser"
        ],
        "tshirts": [
            "tees",
            "tshirt",
            "tshirts",
            "t shirts",
            "t shirt"
        ],
        saree : ["saree", "sarees"],
        churidars : ["churidars", "churidar"],
        lehenga : ["lehenga", "lehengas"],
        salwar : ["salwar","salwars"],
        dress_material : ["dress material", "indial dresses", "dress materials", "traditional dresses"],
        palazos : ["palazos"]
    };
    let obj_keys  = Object.keys(product_line_names);
    let pl_keys = {};
    for(let i in obj_keys)
    {
        let pl_obj = product_line_names[obj_keys[i]];
        for(let j in pl_obj)
        {
            pl_keys[pl_obj[j]] = obj_keys[i];
        }
    }
    let pl_obj_keys = Object.keys(pl_keys);

    let require_values = requireValues(pl_obj_keys, message);
    let getproduct_line = require_values["require_values"];

    message = require_values["message"];
    if(getproduct_line.length>0)
    {
        entities["product_line"] = pl_keys[getproduct_line[0]];
    }
    return [entities,message];
}
/*
* this will helps to getting range values in the message.
* @param {string} message
* return {obj} entities
*/
function checkForRange(message)
{
    let entities = {};
    let numbers = message.match(/[-]{0,1}[\d.]*[\d]+/g);
    for(let i in numbers)
    {
        let number = numbers[i].toString();
        try{
            if(message[message.indexOf(number)+number.length]=="k")
            {
                message = message.split(number+"k").join(" ");
                numbers[i] = number*1000;
            }
            else
            {
                message = message.split(number+"").join(" ");
            }
        }catch(e){}
    }
    console.log("Numbers ",numbers);
    if(numbers)
    {
        if(message.indexOf("under")!=-1 || message.indexOf("below")!=-1)
        {
            let range_value = message.indexOf("under")!=-1?"under":"below";
            message = message.split(range_value).join("");
            entities.range ={};
            entities.range.type =  "under";
            entities.range.numbers = numbers;
        }
        else if(message.indexOf("above")!=-1)
        {
            message = message.split("above").join("");
            entities.range ={};
            entities.range.type =  "above";
            entities.range.numbers = numbers;
        }
        else if(message.indexOf("between")!=-1 || (message.indexOf("to")!=-1 && numbers && numbers.length>1))
        {
            let range_value = message.indexOf("between")!=-1?"between":"to";
            message = message.split(range_value).join("");
            entities.range ={};
            entities.range.type =  "between";
            entities.range.numbers = numbers;
        }
        else
        {
            let range_value = message.indexOf("under")!=-1?"under":"below";
            message = message.split(range_value).join("");
            entities.range ={};
            entities.range.type =  "under";
            entities.range.numbers = numbers;
        }
        if(entities.hasOwnProperty("range"))
        {
            let unit_object = checkForUnits(message);
            entities["range"]["units"] = unit_object["units"];
            message = unit_object["message"];
        }
    }
    return {"entities":entities,"message":message};
}
/*
* checking the unit values are present in the message
*/
function checkForUnits(message)
{
    let entities = {
        "units" : "",
        "message" : message.trim()
    };
    let units = 
    {
        rupees : ["rupees", "rs", "rupee"]
    };
    let unit_keys = Object.keys(units);
    let units_object = {};
    unit_keys.forEach(function(a){
        let synonyms = units[a];
        synonyms.forEach(function(val){
            units_object[val] = a;
        });
    });
    let all_keys = Object.keys(units_object);
    let require_keys = requireValues(all_keys, message);
    let unit_values = require_keys["require_values"];
    if(unit_values.length>0)
    {
        entities["message"] = require_keys["message"].trim();
        entities["units"] = units_object[unit_values[0]];
    }
    return entities;
}

function checkForDeals(message)
{
    let entities = {
        message : message
    };
    let deal_values = {
        deals : ["deals", "deal"]
    };
    let deal_keys = Object.keys(deal_values);
    let deal_object = {};
    deal_keys.forEach(function(a){
        let synonyms = deal_values[a];
        synonyms.forEach(function(val){
            deal_object[val] = a;
        });
    });
    let all_keys = Object.keys(deal_object);
    let require_keys = requireValues(all_keys, message);
    let require_values = require_keys["require_values"];
    if(require_values.length>0)
    {
        entities["message"] = require_keys["message"].trim();
        entities["deals"] = deal_object[require_values[0]];
    }
    return entities;
}
/*
* Getting all matching values in and object
* @params {obj} mapping_data
* @param {string} message
* return {obj} entities
*/
function getMatchingValues(mapping_data, message)
{
    let entities = {};
    // checking occasion present in message
    let mapping_keys = Object.keys(mapping_data);
    let synonyms = [];
    let mapping_obj = {};
    for(let i in mapping_keys)
    {
        let synonym_values = mapping_data[mapping_keys[i]]["synonyms"];
        for(let j in synonym_values)
        {
            if(!mapping_obj.hasOwnProperty(synonym_values[j]))
            {
                mapping_obj[synonym_values[j]] = mapping_keys[i];
            }
        }
        synonyms = synonyms.concat(synonym_values);
    }
    let mapping_values = requireValues(synonyms, message);
    let require_message = mapping_values["message"];
    if(mapping_values["require_values"].length>0)
    {
        let require_data = mapping_values["require_values"].map(function(a){

            return { "type":mapping_data[mapping_obj[a]]["type"],"key" : mapping_obj[a], "values" : mapping_data[mapping_obj[a]]["values"], synonyms:mapping_data[mapping_obj[a]]["synonyms"] };
        });
        entities["data"] = require_data;
    }
    entities["message"] = require_message;
    return entities;
}
function checkForGreetMessage(message)
{
    let greet_object = {
        entities : {},
        message : message
    };
    let greet_words = [ "hi", "hello", "hey"];
    let get_words = requireValues(greet_words, message);
    if(get_words["require_values"].length>0)
    {
        greet_object["message"] = get_words["message"];
        greet_object["entities"]["greet"] = true;
    }
    return greet_object;
}
function cleanSentence(message)
{
    let stop_words = ["a","able","about","across","after","almost","also","am","among","an","any","are","as","at","be","because","been","best","but","by","can","cannot","could","dear","did","do","does","either","else","ever","every","for","from","get","got","had","has","have","he","her","hers","him","his","how","however","i","if","in","into","is","it","its","just","least","let","like","likely","may","me","might","most","must","my","neither","no","nor","not","of","often","on","or","other","our","own","rather","said","say","says","she","should","since","so","some","than","that","the","their","them","then","there","these","they","this","tis","too","twas","us","wants","was","we","were","what","when","where","which","while","who","whom","why","will","with","would","yet","you","your","show","need","women","new","want"];
    message = message.toLowerCase();
    message = message.replace(/[^A-Z0-9a-z]+/ig, ' ');
    //message = message.replace(/[;^!@|_-=*?<>{}\[\]]/g, ' ');
    message = message.split("-").join(" ");
    stop_words.forEach(function(a){
        if(message.indexOf(" "+a+" ")!=-1)
        {
            message = message.split(" "+a+" ").join(" ");
        }
        else if(message.indexOf(" "+a)!=-1 && (message.indexOf(" "+a)+a.length)==message.length-1)
        {
            message = message.replace(" "+a, "");
        }
        else if(message.indexOf(a+" ")!=-1 && message.indexOf(a)==0)
        {
            message = message.replace(a+" ","");
        }
    });
    return message;
}
function processMessageWithEntities(message, entities)
{
    let msg_entities = JSON.parse(JSON.stringify(entities));
    message = cleanSentence(message);
    if(msg_entities.hasOwnProperty("occasion_productline_map"))
    {
        for(let i in msg_entities["occasion_productline_map"])
        {
            let occasion_value = msg_entities["occasion_productline_map"][i];
            let synonyms = occasion_value["synonyms"];
            try{
                synonyms = synonyms.sort(function(a, b){return b.length - a.length;});
            }catch(e){};
            for(let i in synonyms)
            {
                if(message.indexOf(synonyms[i])!=-1)
                {
                    message = message.split(synonyms[i]).join("");
                }
            }
        }
    }
    if(msg_entities.hasOwnProperty("body_profile_productline_map"))
    {
        for(let i in msg_entities["body_profile_productline_map"]){
            let obj = msg_entities["body_profile_productline_map"][i];
            let synonyms = obj["synonyms"];
            try{
                synonyms = synonyms.sort(function(a, b){return b.length - a.length;});
            }catch(e){};
            for(let i in synonyms)
            {
                if(message.indexOf(synonyms[i])!=-1)
                {
                    message = message.split(synonyms[i]).join("");
                }
            }
        }
    }
    return message.trim();
}
function checkForHelpMessage(message)
{
    let help_object = {
        entities : {},
        message : message
    }
    let help_words = ["help"];
    let get_words = requireValues(help_words, message);
    if(get_words["require_values"].length>0)
    {
        help_object["message"] = get_words["message"];
        help_object["entities"]["help"] = true;
    }
    return help_object;
}
function checkForPreviousQuestionEntities(previous_question, message)
{
    let independant_user_answers = {
        "undo" : ["undo", "back"],
        "show_list" : ["show_list","show list", "show", "open products", "open list"],
        "reset" : ["reset", "clear", "start again", "restart", "restart_again"],
        "help" : ["help"]
    };
    let previous_question_values = {
        about_me : {
            "ok" : ["ok","k"],
        },
        instructions_to_user :{
            "ok" : ["ok","k"],
        },
        ask_suggestions : {
            "ok" : ["ok","k"],
        },
        filters_question : {
            "no" : ["no","no, style me", "style me"],
            "continue_chat" : ["continue_chat", "continue", "continue chat", "chat"],
        },
        continueStatusQuestion : {
            continue_chat : ["continue_chat", "continue", "continue chat", "chat"],
        },
        preference_status_question :
        {
            no : ["no"],
            check_deals : ["check_deals", "check deals", "show deals", "deals"],
            add_preferences : ["continue_chat", "continue", "continue chat", "chat","add_preferences","add preference"]
        },
        occasionStatusQuestion : {
            "yes" : ["yes","yaa","yup","ya","why not"],
            "no" : ["no"]
        },
        occasionQuestion : {
            nothing : ["nothing", "no need", "skip"]
        },
        heightQuestion : {
            "skip" : ["skip", "no need", "nothing"]
        },
        skintoneQuestion : {
            "skip" : ["skip", "no need", "nothing"]
        },
        bodyshapeQuestion : {
            "skip" : ["skip", "no need", "nothing"]
        },
        bodyConcernQuestion : {
            "skip" : ["skip", "no need", "nothing", "no"]
        },
        userProfileStatusQuestion : {
            "its_me" : ["its_me", "its me", "mine", "thats mine", "me"],
            "not_me" : ["not_me","not me","not"],
            "skip" : ["skip", "no need", "nothing"]
        },
        profile_intrest : {
            "yes" : ["yes","yaa","yup","ya","why not"],
            "no" : ["no"]
        },
        brand_deals_question : {
            continue_chat : ["continue_chat", "continue", "continue chat", "chat"],
        },
        ask_price_question : {
            continue_chat : ["continue_chat", "continue", "continue chat", "chat"],
        },
        someIdentifiedQuestion : {
            continue_chat : ["continue_chat", "continue", "continue chat", "chat"],
            no : ["no","nope"]
        },
        occasionFilterConflictQuestion : {
            suggest_recommended : ["suggest_recommended","recommended", "suggest recommended"],
            go_as_per_my_likes : ["go_as_per_my_likes", "my likes", "go as per my likes"]
        },
        conversation_completed :{
            feedback : ["give feedback","complaint","suggestions","feed back","feedback"]
        },
        
    };
    let detected_entities = [];

    let synonyms_obj_for_user_answers = {};
    let answer_keys = Object.keys(independant_user_answers);
    answer_keys.forEach(function(main_key){
        independant_user_answers[main_key].forEach(function(synonym)
        {
            synonyms_obj_for_user_answers[synonym] = main_key;
        });
    });
    let synonym_keys_for_user_answers = Object.keys(synonyms_obj_for_user_answers);
    let require_data_for_user_answers = requireValues(synonym_keys_for_user_answers, message);
    require_data_for_user_answers["require_values"].forEach(function(val){
        if(detected_entities.indexOf(synonyms_obj_for_user_answers[val])==-1)
            detected_entities.push(synonyms_obj_for_user_answers[val]);
    });

    if(previous_question_values.hasOwnProperty(previous_question))
    {
        let previous_question_data = previous_question_values[previous_question];
        let synonyms_obj = {};
        let keys = Object.keys(previous_question_data);
        keys.forEach(function(main_key){
            previous_question_data[main_key].forEach(function(synonym)
            {
                synonyms_obj[synonym] = main_key;
            });
        });
        let synonym_keys = Object.keys(synonyms_obj);
        let data = requireValues(synonym_keys, message);
        data["require_values"].forEach(function(val){
            if(detected_entities.indexOf(synonyms_obj[val])==-1)
                detected_entities.push(synonyms_obj[val]);
        });
    }
    return detected_entities;
}
module.exports = 
{
    getEntities : getEntities,
    requireValues : requireValues,
    processMessageWithEntities : processMessageWithEntities,
    checkForPreviousQuestionEntities : checkForPreviousQuestionEntities
};