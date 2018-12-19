let mongodb = require('mongodb');
let fs = require('fs');
let assert = require('assert');

let MongoClient = mongodb.MongoClient;
let url = 'mongodb://adminUser:password@35.200.171.190:27017/product_data';
let main_database;
MongoClient.connect(url, function (err, database) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
        console.log('Connection established to', url);
        main_database = database;
	}
});
// Connect to the db
function runQuery(db_name, product_line, query, callback)
{
	let db = main_database.db(db_name);
	let collection = db.collection(product_line);
	collection.find(query,{}).toArray(function(error,docs){
		callback(docs, error)
		assert.equal(null, error);
	});

}
module.exports = 
{
	runQuery : runQuery
}