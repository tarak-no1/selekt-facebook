
const elasticSearch = require('./db_config/elasticSearch.js');
let feed_attributes = {};
function get_product_line_filters(product_line, callback) {
    let attribute_value_list_query = {
        index: "styling_rules",
        type: "product_line_filters",
        body: {
            query: {
                match_phrase:{"product_line_name": product_line}
            }
        },
        size: 300
    };
    console.log("Getting filters for "+product_line);
    elasticSearch.runQuery(attribute_value_list_query,function (result,total) {
        console.log("Total Fitlers : ",total);
        result = result.sort(function(a, b) {
            a._id = parseInt(a._id);
            b._id = parseInt(b._id);
            return a["_id"] - b["_id"];
        });
        let filter_options = []
        for(let i in result) {
            let attribute = result[i]["_source"];
            let attribute_name = attribute["product_line_attribute_db_path"].split(".").slice(-1)[0];
            let attribute_value_list = attribute['product_line_attribute_value_list'];
            attribute_value_list = attribute_value_list.sort();
            let option = {
                "key" : attribute_name,
                "display_name" : attribute["product_line_attribute"],
                "values" : attribute_value_list
            }
            filter_options.push(option);
        }
        callback(filter_options);
    });
}
function getFilterCount(product_line, filters, context_priority_values, benefits, adjectives, remove_tags, callback)
{
    console.log("\n\n\n =================== In generateFilterQuery function");
    let query = {
        bool:{
            must : [],
            should : [],
            must_not : []
        }
    };
    let already_having_attributes = {};
    //query for filters
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
                {
                    cnt_filters[attribute] = [];
                }
                if(!already_having_attributes.hasOwnProperty(attribute))
                {
                    already_having_attributes[attribute] = {values:[]};
                }
                if(already_having_attributes[attribute]["values"].indexOf(filters[x][attribute]))
                {
                    already_having_attributes[attribute]["values"].push(filters[x][attribute]);
                }
                let filter_obj = {};
                filter_obj[attribute] = filters[x][attribute];
                cnt_filters[attribute].push({"match_phrase":filter_obj});
            }
        }
        else
        {
            already_having_attributes[Object.keys(filters[x]["range"])[0]] = 
            {
                index : query.bool.must.length,
                values : []
            };
            query.bool.must.push(filters[x]);
        }
    }
    
    let cnt_keys = Object.keys(cnt_filters);
    for(let y in cnt_keys)
    {
        let attribute_name = cnt_keys[y];
        let output = cnt_filters[attribute_name];
        already_having_attributes[attribute_name]["index"] = query.bool.must.length;
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
        query.bool.must.push({match_phrase:{"new_updated_benefit":priority_benefits[i]}});
    }
    for(let i in priority_adjectives)
    {
        query.bool.must.push({match_phrase:{"adjectives":priority_adjectives[i]}});
    }
    if(adjectives.length>0)
    {
        let attribute_obj = {};
        adjectives.forEach(function(a){
            let adjective_name = getBenefitname(a, product_line, "adjectives");
            let adjective_obj = word_mapping[product_line]["adjectives"][adjective_name];
            let attribute_key = adjective_obj["attribute_key"];
            if(!attribute_obj.hasOwnProperty(attribute_key))
            {
                attribute_obj[attribute_key] = [];
            }
            attribute_obj[attribute_key].push(a);
        });
        let adjective_query = Object.keys(attribute_obj).map(function(adj){
            return {"terms":{"adjectives":attribute_obj[adj]}};
        });
        query.bool.must = query.bool.must.concat(adjective_query);
    }
    if(benefits.length > 0)
    {
        let benefits_query = {
            "terms":{"new_updated_benefit":benefits}
        };
        query.bool.should.push(benefits_query);
    }

    let product_filter_query = {
        index : "styling_rules",
        type : "product_line_filters",
        body : {
            "size": 50,
            "query": {
                "match_phrase": {
                   "product_line_name": product_line
                }
            }
        }
    };
    elasticSearch.runQuery(product_filter_query, function(response, total, err)
    {
        if(!err)
        {
            response = response.map(function(attribute){
                return {"attribute_path":attribute["_source"].product_line_attribute_db_path,"display_name":attribute["_source"].product_line_attribute}
            });
            let aggs_query = {};
            console.log(JSON.stringify(query,null, 2))
            console.log(already_having_attributes);
            for(let i in response)
            {
                let filter_query = JSON.parse(JSON.stringify(query));
                if(already_having_attributes.hasOwnProperty(response[i]["attribute_path"]))
                    filter_query.bool.must.splice(already_having_attributes[response[i]["attribute_path"]]["index"], 1);
                aggs_query[response[i]["display_name"]] = {
                    filter : filter_query,
                    aggs : { count_is : { terms : { field : response[i]["attribute_path"], size : 1000} } }
                };
            }
            let product_data_query = {
                index : "product_data",
                type : product_line,
                body : {
                    size : 0,
                    aggs : aggs_query
                }
            };
            //console.log(JSON.stringify(product_data_query, null, 2));
            elasticSearch.getElasticResults(product_data_query, function(filter_response, total, error)
            {
                if(!error)
                {
                    let filters = filter_response["aggregations"];
                    let filter_list = [];
                    for(let i in response)
                    {
                        obj = {
                            key : response[i]["attribute_path"].split(".")[1],
                            display_name : response[i]["display_name"],
                            values : []
                        };
                        filter_values = filters[response[i]["display_name"]]["count_is"]["buckets"];
                        if(obj["key"]=="discount_price")
                        {
                            let count_0_500 = 0, count_500_1000 = 0,count_1000_1500 = 0,count_1500_2000=0,count_2000_2500=0,count_2500_above=0;
                            for(let i in filter_values)
                            {
                                let filter_obj = filter_values[i];
                                if(filter_obj["key"]>=0 && filter_obj["key"]<500)
                                {
                                    count_0_500+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=500 && filter_obj["key"]<1000)
                                {
                                    count_500_1000+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=1000 && filter_obj["key"]<1500)
                                {
                                    count_1000_1500+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=1500 && filter_obj["key"]<2000)
                                {
                                    count_1500_2000+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=2000 && filter_obj["key"]<2500)
                                {
                                    count_2000_2500+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=2500)
                                {
                                    count_2500_above+=filter_obj["doc_count"];
                                }
                            }
                            if(count_0_500!=0)
                            {
                                obj["values"].push({"key":"0 to 500","doc_count":count_0_500,check_status:false});
                            }
                            if(count_500_1000!=0)
                            {
                                obj["values"].push({"key":"500 to 1000","doc_count":count_500_1000,check_status:false});
                            }
                            if(count_1000_1500!=0)
                            {
                                obj["values"].push({"key":"1000 to 1500","doc_count":count_1000_1500,check_status:false});
                            }
                            if(count_1500_2000!=0)
                            {
                                obj["values"].push({"key":"1500 to 2000","doc_count":count_1500_2000,check_status:false});
                            }
                            if(count_2000_2500!=0)
                            {
                                obj["values"].push({"key":"2000 to 2500","doc_count":count_2000_2500,check_status:false});
                            }
                            if(count_2500_above!=0)
                            {
                                obj["values"].push({"key":"2500 or above","doc_count":count_2500_above,check_status:false});
                            }
                        }
                        else if(obj["key"]=="discount_percent")
                        {
                            let count_lessthan_10 = 0, count_greater_10 = 0,count_greater_20 = 0,count_greater_30=0;
                            let count_greater_40=0,count_greater_50=0,count_greater_60=0,count_greater_70=0;
                            for(let i in filter_values)
                            {
                                let filter_obj = filter_values[i];
                                if(filter_obj["key"]<10)
                                {
                                    count_lessthan_10+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=10)
                                {
                                    count_greater_10+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=20)
                                {
                                    count_greater_20+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=30)
                                {
                                    count_greater_30+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=40)
                                {
                                    count_greater_40+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=50)
                                {
                                    count_greater_50+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=60)
                                {
                                    count_greater_60+=filter_obj["doc_count"];
                                }
                                if(filter_obj["key"]>=70)
                                {
                                    count_greater_70+=filter_obj["doc_count"];
                                }
                            }
                            if(count_lessthan_10!=0)
                            {
                                obj["values"].push({"key":"Less than 10%","doc_count":count_lessthan_10,check_status:false});
                            }
                            if(count_greater_10!=0)
                            {
                                obj["values"].push({"key":"10% or more","doc_count":count_greater_10,check_status:false});
                            }
                            if(count_greater_20!=0)
                            {
                                obj["values"].push({"key":"20% or more","doc_count":count_greater_20,check_status:false});
                            }
                            if(count_greater_30!=0)
                            {
                                obj["values"].push({"key":"30% or more","doc_count":count_greater_30,check_status:false});
                            }
                            if(count_greater_40!=0)
                            {
                                obj["values"].push({"key":"40% or more","doc_count":count_greater_40,check_status:false});
                            }
                            if(count_greater_50!=0)
                            {
                                obj["values"].push({"key":"50% or more","doc_count":count_greater_50,check_status:false});
                            }
                            if(count_greater_60!=0)
                            {
                                obj["values"].push({"key":"60% or more","doc_count":count_greater_60,check_status:false});
                            }
                            if(count_greater_70!=0)
                            {
                                obj["values"].push({"key":"70% or more","doc_count":count_greater_70,check_status:false});
                            }
                        }
                        else
                        {
                            filter_values = filter_values.filter(function(fil)
                            {
                                return fil["key"]!="na";
                            });
                            obj["values"] = filter_values.map(function(fil){
                                let check_status = false;
                                if(already_having_attributes.hasOwnProperty(response[i]["attribute_path"]))
                                {
                                    if(already_having_attributes[response[i]["attribute_path"]]["values"].indexOf(fil["key"])!=-1)
                                    {
                                        check_status = true;
                                    }
                                }
                                fil["check_status"] = check_status;
                                return fil;
                            });
                        }
                        filter_list.push(obj);
                    }
                    let fl_list = filter_list.concat();
                    filter_list = filter_list.sort(function(a, b){
                        let dp1 = a["display_name"],dp2 = b["display_name"];
                        if (dp1 > dp2) return 1;
                        if (dp1 < dp2) return -1;
                        return 0;
                    });
                    console.log("Sending Filter count");
                    callback(filter_list);
                }
            });
        }
    });
}
function getRecommendedPreferences(product_line, context_filters, conflict_benefit, callback)
{
    console.log("In getRecommendedPreferences")
    console.log(conflict_benefit);
    let filter_result = [];
    let filters = {};
    context_filters.forEach(function(obj){
        let key = Object.keys(obj)[0];
        if(key!="range")
        {
            let main_key = key.split(".")[1];
            if(!filters.hasOwnProperty(main_key))
            {
                filters[main_key] = [];
            }
            filters[main_key].push(obj[key]);
        }
    });
    let filters_keys = Object.keys(filters);
    filter_result = filters_keys.map(function(attribute)
    {
        return {"key":attribute, values : filters[attribute]};
    });
    filter_result = filter_result.map(function(a){
        a["values"] = a["values"].map(function(val){
            val["recommend"] = [];
            return val;
        });
        a["status"] = false;
        return a;
    });
    let query = 
    {
        index: "styling_rules",
        type: "benefit_rules",
        body: {
            query:{
                bool :{
                    must:[
                        {
                            "match_phrase":{"product_line_name":product_line}
                        },
                        {
                            "match_phrase":{"adjective_value":conflict_benefit}
                        }
                    ]
                }
            }
        }
    };
    elasticSearch.runQuery(query, function(response, total, err)
    {
        if(!err)
        {
            let source = response[0]["_source"];
            let display_name = source["adjective_display_name"];
            let dependencies = source["attribute_dependencies"];
            for(let j in dependencies)
            {
                let att_value = dependencies[j];
                filter_result = filter_result.map(function(attribute)
                {
                    if(attribute["key"]==att_value["attribute_type"])
                    {
                        attribute["values"] = attribute["values"].map(function(val)
                        {
                            console.log(att_value["attribute_value"]);
                            if(att_value["attribute_value"].indexOf(val["key"])==-1)
                            {
                                attribute["status"] = true;
                                if(!attribute.hasOwnProperty("recommend"))
                                    attribute["recommend"] = [];
                                attribute["recommend"] = att_value["attribute_value"].concat();///////////
                            }
                            return val;
                        });
                    }
                    return attribute;
                });
            }
            filter_result = filter_result.filter(function(attribute){
                return attribute["status"];
            });
            callback(filter_result);
        }
    });
}
/*function getRecommendedPreferences(product_line, context_filters, conflict_benefit, callback)
{
    console.log("In getRecommendedPreferences")
    console.log(conflict_benefit);
    let filter_result = [];
    let filters = {};
    context_filters.forEach(function(obj){
        let key = Object.keys(obj)[0];
        if(key!="range")
        {
            let main_key = key.split(".")[1];
            if(!filters.hasOwnProperty(main_key))
            {
                filters[main_key] = [];
            }
            filters[main_key].push(obj[key]);
        }
    });
    let filters_keys = Object.keys(filters);
    filter_result = filters_keys.map(function(attribute)
    {
        return {"key":attribute, values : filters[attribute]};
    });
    filter_result = filter_result.map(function(a){
        a["values"] = a["values"].map(function(val){
            val["recommend"] = [];
            return val;
        });
        a["status"] = false;
        return a;
    });
    let query = 
    {
        index: "styling_rules",
        type: "updated_benefit_rules",
        body: {
            query:{
                bool :{
                    must:[
                        {
                            "match_phrase":{"product_line_name":product_line}
                        },
                        {
                            "match_phrase":{"adjective_value":conflict_benefit}
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
            let source = response[0]["_source"];
            let must_not_have = source["must_not_have"];
            let must_have = source["must_have"];
            let good_to_have = source["good_to_have"];
            let adjectives  = [];
            must_have.forEach(function(array){
                array = array.map(function(obj){
                    return obj["attribute_value"];
                });
                array = array.filter(function(val){return adjectives.indexOf(val)==-1;});
                adjectives = adjectives.concat(array);
            });
            getAdjectiveRules(product_line, adjectives, filter_result, function(filter_result){
                callback(filter_result);
            });
        }
        else
        {
            callback([]);   
        }
    });
}*/
function getAdjectiveRules(product_line, adjectives, filter_result, callback)
{
    let query = 
    {
        index: "styling_rules",
        type: "adjectives_rules",
        body: {
            size : 20,
            query:{
                bool :{
                    must:[
                        {
                            "match_phrase":{"product_line_name":product_line}
                        },
                        {
                            "terms":{"adjective_value":adjectives}
                        }
                    ]
                }
            }
        }
    };
    elasticSearch.runQuery(query, function(response, total, err)
    {
        if(!err)
        {
            //console.log(filter_result);
            response.forEach(function(obj){
                let source = obj["_source"];
                let display_name = source["adjective_display_name"];
                let dependencies = source["attribute_dependencies"];
                for(let j in dependencies)
                {
                    let att_value = dependencies[j];
                    //console.log(att_value["attribute_type"]);
                    filter_result = filter_result.map(function(attribute)
                    {
                        if(attribute["key"]==att_value["attribute_type"])
                        {
                            attribute["values"] = attribute["values"].map(function(val)
                            {
                                console.log(att_value["attribute_value"]);
                                if(att_value["attribute_value"].indexOf(val["key"])==-1)
                                {
                                    attribute["status"] = true;
                                    if(!attribute.hasOwnProperty("recommend"))
                                        attribute["recommend"] = [];
                                    attribute["recommend"] = att_value["attribute_value"].concat();///////////
                                }
                                return val;
                            });
                        }
                        return attribute;
                    });
                }
            });
            //console.log(filter_result);
            filter_result = filter_result.filter(function(attr){
                return attr["status"];
            });
            callback(filter_result);
        }
    });
}
module.exports = {
    get_product_line_filters : get_product_line_filters,
    getFilterCount : getFilterCount,
    getRecommendedPreferences: getRecommendedPreferences
}
