var mongoClient = require('mongodb').MongoClient;

var databaseUrl = "mongodb://localhost:27017/attendanceCheck"

this.insert = function(data, collection, callback){
	mongoClient.connect(databaseUrl, function(err, db){
		db.collection(collection).insertOne(data, function(err, result){
			db.close();

			if(callback){
				callback(err, result);
			}
		});
	});
}

this.updateOne = function(query, updated_data, collection, callback){
	mongoClient.connect(databaseUrl, function(err, db){
		db.collection(collection).updateOne(query, {
			$set: updated_data
		}, function(err, results){
			if(callback){
				callback(err, results);
			}
		});
	});
}

this.deleteMany = function(query, collection, callback){
	mongoClient.connect(databaseUrl, function(err, db){
		db.collection(collection).deleteMany(query, function(err, results){
			if(callback){
				callback(err, results);
			}
		});
	});
}

this.find = function(query, collection, callback){
	mongoClient.connect(databaseUrl, function(err, db){
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