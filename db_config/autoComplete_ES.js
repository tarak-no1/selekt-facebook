
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  hosts: [
    //'https://user:niUqYByb66Z6@35.198.217.44/elasticsearch'
    'https://user:opf9ykShP5Dv@35.200.186.84/elasticsearch'
  ]
});
function runQuery(query, callback) {
    query.requestTimeout = 60000;
    client.search(query).then(function (resp) {
        let hits = resp.hits.hits;
        callback(hits,resp.hits.total,null);
    }, function (err) {
        console.log(err);
        console.log(JSON.stringify(query,null,2));
        callback(null,null,err);
    });
}
function updateMessagePopularity(message)
{
    let query = {
        index:"autocomplete_main",
        body : {
            query :{
                "match_phrase": {
                    "sentence":message
                }
            }
        }
    };
    runQuery(query, function(response, total, err){
        if(!err && total>0)
        {
            let source = response[0]["_source"];
            let id = response[0]["_id"];
            let type = response[0]["_type"];

            source["priority"]++;
            update(id, source, type);
        }
    });
}
function update(id, source, type)
{
    client.bulk({
      body: [
        // action description
        { index: { _index: 'autocomplete_main', _type: type, _id: id } },
        // the document to update
        source
      ]
    }, function (err, resp) {
        if(err)
          console.log(err);
    });
}
module.exports =
{
    updateMessagePopularity: updateMessagePopularity,
    runQuery : runQuery
};
