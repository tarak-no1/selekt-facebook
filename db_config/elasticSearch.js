
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
 hosts:[ 'https://user:fLxscDBh5zdZ@35.200.199.189/elasticsearch']
});

function runQuery(query, callback) {
    query.requestTimeout = 60000;
    client.search(query).then(function (resp) {
        let hits = resp.hits.hits;
        console.log(hits)
        callback(hits,resp.hits.total,null);
    }, function (err) {
        console.log(err);
        //console.log(JSON.stringify(query,null,2));
        callback([],0,err);
    });
}
function getElasticResults(query, callback) {
    query.requestTimeout = 60000;
    client.search(query).then(function (resp) {
        callback(resp,resp.hits.total,null);
    }, function (err) {
        console.log(err);
        //console.log(JSON.stringify(query,null,2));
        callback([],0,err);
    });
}
function getMobilesData(query, callback)
{
    let mobile_query = {
        index : "mobile",
        type : "mobile_data",
        body : query,
        requestTimeout : 60000
    };
    client.search(mobile_query).then(function(resp)
    {
        let hits = resp.hits.hits;
        callback(hits, resp.hits.total, null);
    }, function(err)
    {
        console.log(err);
        callback(null, 0, err);
    });
}
function getCount(query,callback)
{
    client.count(query,function(err, response)
    {
        callback(err,response.count);
    });
}
module.exports = {
    runQuery : runQuery,
    getMobilesData : getMobilesData,
    getElasticResults : getElasticResults,
    getCount : getCount
};
