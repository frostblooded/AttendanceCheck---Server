var mongoClient = require('mongodb').MongoClient;

var DATABASE_URL = "mongodb://localhost:27017/attendanceCheck"

this.createTTLIndex = function(){
	// Create index to set expiration of submissions
	mongoClient.connect(DATABASE_URL, function(err, db){
		db.collection('submissions').createIndex(
	      	{ "send_time": 1 },
	      	{ "expireAfterSeconds": 60 * 60 * 24 * 7 }, function(){
	    		db.close();
	      	});
	});
}

this.insert = function(data, collection, callback){
	mongoClient.connect(DATABASE_URL, function(err, db){
		db.collection(collection).insertOne(data, function(err, result){
			db.close();

			if(callback){
				callback(err, result);
			}
		});
	});
}

this.updateOne = function(query, updated_data, collection, callback){
	mongoClient.connect(DATABASE_URL, function(err, db){
		db.collection(collection).updateOne(query, {
			$set: updated_data
		}, function(err, results){
			db.close();

			if(callback){
				callback(err, results);
			}
		});
	});
}

this.deleteMany = function(query, collection, callback){
	mongoClient.connect(DATABASE_URL, function(err, db){
		db.collection(collection).deleteMany(query, function(err, results){
			db.close();

			if(callback){
				callback(err, results);
			}
		});
	});
}

this.find = function(query, collection, callback){
	mongoClient.connect(DATABASE_URL, function(err, db){
		var entries = [];
		var cursor = db.collection(collection).find(query);

		cursor.each(function(err, doc){
			if(doc != null){
				entries.push(doc);
			}
			else{
				db.close();

				if(callback){
					callback(entries);
				}
			}
		});
	});
}