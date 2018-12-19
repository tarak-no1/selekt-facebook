'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
// You need to `npm install` the following dependencies: body-parser, express, request.
//
const bodyParser = require('body-parser');
const express = require('express');
// get Bot, const, and Facebook API
const Config = require('./const.js');
const bot_questions = require('./bot_questions.js');
const user_sessions = require("./public/sessions.js");
const fashion_bot = require("./fashion_bot");
const offline_bot = require("./offline_bot");
const filterList = require("./filter-list.js");
const elasticSearch = require('./db_config/elasticSearch');
const undo_module = require('./undo_module.js');
let mapping = require('./public/mapping');
let helper = require('./helper');
const entity_bot = require('./entity_bot.js');
// Setting up our bot
const wit = require("./witApi.js");
const FB = require("./facebook.js");
const path = require('path');
// Webserver parameter
const PORT = process.env.PORT || 1299;
let conversationGraph = require("./public/conversationGraphs");
// Wit.ai bot specific code

// Starting our webserver and putting it all together
const app = express();

app.set('port', PORT);
app.listen(app.get('port'));
app.use(bodyParser.json());
app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
});
console.log(__dirname+'/client');
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(express.static(__dirname+'/client'));

console.log("I'm wating for you @" + PORT);
// checking 
app.get('/fashion_bot/', function(req, res) {
  res.send('"Hi,I am fashion bot"');
});

// Webhook verify setup using FB_VERIFY_TOKEN
app.get('/fashion_bot/webhook/', (req, res) => {
  console.log("In get")
  if (!Config.FB_VERIFY_TOKEN) {
    throw new Error('missing FB_VERIFY_TOKEN');
  }

  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === Config.FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});
let is_name = 0;
/* to retreive body concerns from web view and process user answer*/
app.post('/fashion_bot/bodyconcerns',(req ,res) => {
	if (req.method == 'POST') {
       var jsonString = '';

       req.on('data', function (data) {
           jsonString += data;
           console.log(data);
       });

       req.on('end', function () {
          var result=JSON.parse(jsonString);
          var id = result["id"];
          var keys=Object.values(result["data"])
          console.log(id,keys);
          let user_context = user_sessions.getContext(id);
            user_context["user_profile"]["concern_status"] = true;
            user_context["user_profile"]["body_concerns"] = keys;
            user_sessions.storeContext(id,user_context);
            fashion_bot.processingUserAnswer["bodyConcernQuestion"](id,keys);
       });
   }
});
/*api for body concern page to send use*/
app.get('/fashion_bot/bodyconcern',(req,res) =>{
  let body = req.query;
  console.log(body.id);
	res.render('body_concerns',{source : body.id});
});
/*rendering show products page*/
app.get('/fashion_bot/products_list',(req,res)=>{
  let body = req.query;
  console.log(body.id);
  let sessionId = body.id;
  let context = user_sessions.getContext(sessionId);
  context["trends"] =  undefined;
  user_sessions.storeContext(sessionId, context);
  helper.getTotalProducts(body.id, function(total_products)
  {
    let source =
    {
      sessionId : body.id,
      total : total_products
    }
    res.render('show_products',{source : JSON.stringify(source)});   
  });
  //console.log(products_data);
});

app.get('/fashion_bot/trends',(req,res)=>{
  let body = req.query;
  let sessionId = body.id;
  let context = user_sessions.getContext(sessionId);
  context["trends"] =  true;
  user_sessions.storeContext(sessionId, context);
  let priority_values = {
    benefits : ["trends_dec"],
    adjectives : []
  };
  let from = 0;
  helper.getLatestTrends(sessionId,from, function(total_products)
  {
    console.log("total_products",total_products["total_length"])
    let source = { 
      sessionId : sessionId,
      total : total_products.total_length
    }
    res.render('show_products',{source : JSON.stringify(source)});   
  });
  //console.log(products_data);
});
app.get("/fashion_bot/add_filters", function(req, res){
  let data = req.query;
  let session_id = data["session_id"];
  res.render("filters", {"session_id":session_id});
});
app.post('/fashion_bot/get_filters', function(req, res)
{
    if (req.method == 'POST') {
       let jsonString = '';
       req.on('data', function (data) {
           jsonString += data;
           console.log(data);
       });

       req.on('end', function () 
       {
        let data = JSON.parse(jsonString);
        console.log("in get Filters");
        console.log(data);
        let sessionId = data["session_id"];
        try
        {
          let context = user_sessions.getContext(sessionId);
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
          let filters = [], discount_percentage_filter_status = true;
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
                      discount_percentage_filter_status = false;
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
          if(context.hasOwnProperty("deals"))
          {
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
                          obj["start"] = 0.2
                      else
                      {
                          obj["start"] = 0.2;
                          obj["end"] = 0.4;
                      }
                  }
                  if(brand_deal_values.indexOf("all brands")!=-1)
                  {
                      obj = {"start":0};
                  }
                  let range_query = {"range":{"brand_weight":{"gt":obj["start"],"lte":obj["end"]}}};
                  filters.push(range_query);
              }
              if(discount_percentage_filter_status)
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
                      filters.push({"range":{"product_filter.discount_percent":{"gte":40}}});
                  }
              }
              filters.push({"deal" : true});
          }
          filterList.getFilterCount(product_line,filters,context["priority_values"], benefits, context["adjectives_new"], context["remove_tags"],function(filter_result){
              //console.log(JSON.stringify(filter_result[0]));
              let data = {};
              data["type"] = "filter_list";
              data["options"] = filter_result;
              res.send(data);
          });
        }
        catch(e)
        {
          console.log(e);
          res.send({});
        }
       })
    } 
});
app.post("/fashion_bot/update_filters", function(req, res)
{

  if (req.method == 'POST') {
       let jsonString = '';
       req.on('data', function (data) {
           jsonString += data;
           console.log(data);
       });

       req.on('end', function () 
       {
        let data = JSON.parse(jsonString);
        console.log("update filters : ",data)
        let sessionId = data["session_id"];
        let added_filters = data["add_filters"];
        let remove_filters = data["remove_filters"];
        let context = user_sessions.getContext(sessionId);
        context["filters_status"] = true;
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
        let selected_option_details = {
          type : "filters_question",
          added_filters : added_filters,
          remove_filters : remove_filters
        };
        context["filters"] = filters.concat(context_filters);
        context["unanswered_question"] = "filters_question";
        context["previous_user_messages"].push(selected_option_details);
        user_sessions.storeContext(sessionId, context);
        helper.getTotalProducts(sessionId, function(total_products)
        {
          // if(total_products<=30)
          // {
          //   fashion_bot.foundLessProducts(sessionId, total_products)
          // }
          // else
          {
            let display_product_count_message = bot_questions.displayProductCount(total_products, sessionId);
            FB.sendRequest(sessionId, display_product_count_message);
          }
        });
      });
    } 
});
app.get("/fashion_bot/adjective_reason", function(req, res){
  let query = req.query;
  console.log(query);
  let product_line = query.product_line;
  let adjective_value = query.adjective_value;
  product_line = mapping.product_line_to_db_keys[product_line];
  console.log(product_line);
  let adjective_name = helper.getBenefitname(adjective_value, product_line,"adjectives");
  console.log("Adjective Name : ", adjective_name);
  let adj_query = {
    index :"styling_rules",
    type : "adjectives_rules",
    body : {'query':{"bool":{"must":[{"match_phrase":{"product_line_name":product_line}},{"match_phrase":{"adjective_value":adjective_value}}]}}}
  };
  elasticSearch.runQuery(adj_query, function(response, total, err)
    {
      let obj = {
        adjective_name : adjective_name.split("_").join(" "),
        attribute : "",
        values : []
      };
      if(!err && total>0)
      {
        let attribute_dependencies = response[0]["_source"]["attribute_dependencies"];
        obj["attribute"] = attribute_dependencies[0]["attribute_type"].split("_").join(" ");
        obj["values"] = attribute_dependencies[0]["attribute_value"];
      }
      res.render("adjective_reasons",{"source":JSON.stringify(obj)});
    });
});

/*refine list questions for selecting multiple options*/
app.get('/fashion_bot/refine_the_list',(req,res)=>{
  let body = req.query;
  console.log(body.id);
  if(body.type=="deals")
  {
    let options = ["premium brands", "high end brands", "any brand"];
    let data = {
      id : body.id,
      question : "",
      options : options.map(function(a){return {"key":a, "value":a}}),
      type:"deals"
    };
    res.render('choose_type',{source : JSON.stringify(data)});
  }
  else
  {
    let user_context = user_sessions.getContext(body.id);
    let product_line = mapping.product_line_to_db_keys[user_context["product_line"]];
    let next_question = user_context.unanswered_question_refine;
    let question = conversationGraph.questions[product_line][next_question];
    console.log("product_line,next_question,question_number",product_line,next_question,question);
    helper.processConversationQuestion(body.id, next_question, question, function(response){
      console.log(response,body.id);
      let data={
        id:body.id,
        question:response["text"].split("\n").join(" "),
        options:response.options,
        type:"adjective_module"
      };

      res.render('choose_type',{source : JSON.stringify(data)});
    });
  }
});
/* api for retrieve refine list answers*/
app.post('/fashion_bot/refine_the_list_answers',(req,res)=>{
  var jsonString = '';
  req.on('data', function (data) {
       jsonString += data;
       console.log(data);
   });

  req.on('end', function () {
      var result=JSON.parse(jsonString);
      var id = result["id"];
      var answers = result["selected_keys"];
      var type = result["type"];
      if(type=="deals")
      {
          let user_context = user_sessions.getContext(id);
          user_context["unanswered_question"]="brand_deals_question";
          fashion_bot.processingMessage(id,answers.join(","));
      }     
      else
      {
        let selected_option_details = {
          type : "refineListQuestion",
          answers : answers
        };
        fashion_bot.processingUserAnswer["refineListQuestion"](id,answers, selected_option_details);
      }
  });
})

/* api for sent product list data*/
app.post('/fashion_bot/products_lists',(req,res)=>{
  var jsonString = '';
  req.on('data', function (data) {
       jsonString += data;
       //console.log(data);
   });

  req.on('end', function () {
      var result=JSON.parse(jsonString);
      var id = result["id"];
      let user_context = user_sessions.getContext(id);
      let from = result["page_no"];
      console.log(user_context["trends"],"trends");
      if(from)
        user_context["from"] = from;
      else
        from =0;
      if(user_context["trends"])
      {
        console.log(user_context["trends"],"trends2");
        helper.getLatestTrends(id,from, function(total_products)
        {
          res.send({"products_data":total_products["list"],"product_line":user_context["product_line"], "page_no":from});  
        });
      }
      else if(!user_context.hasOwnProperty("deals"))
      {
        offline_bot.getProducts(id,function(products_data){
          console.log("seding products length : ",products_data.length)
          res.send({"products_data" : products_data,"product_line":user_context["product_line"], "page_no":from});
        });
      }
      else
      {
        console.log(user_context["trends"],"trends1");
        helper.sendDealsList(id, function(product_list_details)
        {
          res.send({"products_data":product_list_details["list"],"product_line":user_context["product_line"], "page_no":from});
        });
      }
  });
});

// The main message handler
app.post('/fashion_bot/webhook', (req, res) => {
  console.log("In POST sWebhook");
  //let body = req.body;
  //console.log(JSON.stringify(body, null, 2));
  // Parsing the Messenger API response
  let messaging = null;
  let sender_id;
   if (req.body.object === 'page') {
    //console.log(JSON.stringify(req.body.entry,null,2));
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if ((event.message)||(event.postback)) {
          messaging = event;
        }
        else
        {
          sender_id = event.sender.id;
        }
       
      });
    });
  }
  
  if (messaging) {
    const sender = messaging.sender.id;
    //for typing gif
    let user_context;
    // We retrieve the user's current session, or create one if it doesn't exist
    // This is needed for our bot to figure out the conversation history
    let sessionId = sender;
    let user_message;
    console.log(sender+" "+new Date().toISOString());
    if(messaging&&messaging.hasOwnProperty("message")&&messaging.message.hasOwnProperty("attachments"))
    {
      user_message = "attachments_from_facebook";
    }
    else if (messaging.postback)
    {
      // Yay! We got a new message payload!
      // We retrieve the Facebook user ID of the sender
      console.log("Got Payload message "+ messaging.postback.payload)
      //taking reply as user message
      user_message= messaging.postback.payload;
    }
    else if(messaging.message){
      // Yay! We got a new message!
      // We retrieve the Facebook user ID of the sender
      console.log("Got message ", JSON.stringify(messaging.message.text, null, 2));
      //taking message as user message
      user_message=messaging.message.text;
      if(messaging.message.hasOwnProperty("quick_reply"))
      {
        user_message = messaging.message.quick_reply.payload;
      }
    }
    user_message = user_message.toLowerCase();
    let status = true;
    //if session id is not exist create context for user
    if(!user_sessions.isSessionExists(sessionId))
    {
      FB.getName(sessionId,function(name){
        console.log("name:",name);
        user_sessions.createSession(sessionId);
        fashion_bot.welcomeMessage(sessionId,name);
      })
    }
     else
    {
      let user_context = user_sessions.getContext(sessionId);
      user_context["previous_user_message"] = user_message;
      console.log("Previous Question : ",user_context["unanswered_question"])
      let previous_question_needed_entities = entity_bot.checkForPreviousQuestionEntities(user_context["unanswered_question"], user_message);
      console.log("Needed Data :",previous_question_needed_entities);
      user_context["previous_question_needed_entities"] = previous_question_needed_entities;
      if(user_message=="get_started_payload")
      {
          user_context = user_sessions.clearContext(sessionId);
          user_sessions.storeContext(sessionId, user_context);
          let welcome_back_message = bot_questions.welcomeBackMessage(user_context["username"]);
          user_context["bot_messages"].push(welcome_back_message);
          let send_suggestions_message = bot_questions.sendSuggestionsMessage();
          user_context["bot_messages"].push(send_suggestions_message);
          let after_suggestions_message = bot_questions.afterSuggestionsMessage();
          user_context["bot_messages"].push(after_suggestions_message);
          user_sessions.storeContext(sessionId, user_context);
          fashion_bot.sendBotMessages(sessionId);
      }
      else if(previous_question_needed_entities.indexOf("help")!=-1)
      {
        let help_message = bot_questions.textMessages("- if you want to reset/refresh your chat, just type \"clear\" \n\n- if you want to go back to the previous question type \"undo\".")
        user_context["bot_messages"].push(help_message);
        user_context["previous_user_messages"].push({"type":"user_typed_message", "message" :user_message, "entities": ["help"]});
        user_sessions.storeContext(sessionId, user_context);
        fashion_bot.sendBotMessages(sessionId);
      }
      else if(previous_question_needed_entities.indexOf("undo")!=-1)
      {
          undo_module.getUndoState(sessionId);
      }
      else if(previous_question_needed_entities.indexOf("reset")!=-1)
      {
        user_context = user_sessions.clearContext(sessionId);
        user_sessions.storeContext(sessionId, user_context);
        user_context = user_sessions.getContext(sessionId);
        user_context["previous_user_messages"].push({"type":"user_typed_message", "message" :user_message, "entities": ["reset"]});
        let first_message = bot_questions.textMessages("Your session is reset");
        user_context["bot_messages"].push(first_message);
        let after_suggestions_message = bot_questions.afterSuggestionsMessage();
        user_context["bot_messages"].push(after_suggestions_message);
        user_sessions.storeContext(sessionId, user_context);
        fashion_bot.sendBotMessages(sessionId);
      }
      else
      {
          user_sessions.storeContext(sessionId, user_context);
          console.log("session is exist "+user_context["belongs_to"],user_context["unanswered_question"],"user_context[unanswered_question]");      
          fashion_bot.processingMessage(sessionId,user_message);
      }
    }
  }
  else
  {
    
  }

    // //console.log(JSON.stringify(context, null, 2));
    // if(messaging.message)
    // {
    //   //console.log("MESSAGE : ", messaging);
    //   // We retrieve the message content
    //   const atts = messaging.message.attachments;
    //   let msg = messaging.message.text;
    //   //let context = UserSessions.createContext(sender)
      
    // } 

  res.sendStatus(200).end();
});
