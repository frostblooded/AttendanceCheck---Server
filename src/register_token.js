var path = require('path');
var mongoClient = require('mongodb').MongoClient;
var database_handler = require(path.join(__dirname, '/database_handler.js'));
var logger = require(path.join(__dirname, '/logger.js'));

var insertToken = function(db, token, callback){
	db.collection('tokens').insertOne({
		"token": token
	}, function(err, result){
		callback(result);
	});
}

var existsInDB = function(db, token, callback){
	db.collection('tokens').count({ 'token': token }, function(error, numOfDocs) {
	    count = numOfDocs;
		callback(count > 0);
	});
}

this.register = function(databaseUrl, requestBody){
	var token = requestBody.token;
	var device_name = requestBody.device_name;

	mongoClient.connect(databaseUrl, function(err, db){
		existsInDB(db, token, function(exists){
			if(!exists){
				logger.info('Registering token ' + token + ' with name ' + device_name);
				time = new Date().toString();

				var data = {
					'token': token,
					'device_name': device_name,
					'time': time
				}

				database_handler.insert(data, 'tokens', function(){
					db.close();
					logger.info("Token registered successfully!");
				});
			}
			else{
				logger.info("Token is already registered!");
			}
		});
	});
}