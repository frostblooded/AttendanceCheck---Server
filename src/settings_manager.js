var path = require('path');
var database_handler = require(path.join(__dirname, '/database_handler.js'));

this.get = function(setting, callback){
	database_handler.find({name:setting}, 'settings', function(data){
		if(callback){
			callback(data[0].value);
		}
	});
}

this.set = function(setting, new_value, callback){
	database_handler.updateOne({name:setting}, {value:new_value}, 'settings', function(){
		if(callback){
			callback();
		}
	});
}