var request = require('request');
var path = require('path');
var database_handler = require(path.join(__dirname, '/database_handler.js'));
var settings_manager = require(path.join(__dirname, '/settings_manager.js'));
var logger = require(path.join(__dirname, '/logger.js'));

Array.prototype.getUnique = function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
}

var get_tokens = function(callback){
	database_handler.find({}, 'tokens', function(result){	
		var tokens = [];

		result.forEach(function(a){
			tokens.push(a['token']);
		});

		//get unique because there is a bug where some tokens manage
		//to get into the database twice
		tokens = tokens.getUnique();

		if(callback){
			callback(tokens);
		}
	});
}

var insert_submission_status = function(token, callback){
	var current_time = new Date();
	
	database_handler.insert({
		token: token,
		send_time: current_time,
		status: 'sent'
	}, 'submissions', function(){
		database_handler.find({
			token: token,
			send_time: current_time
		}, 'submissions', function(data){
			if(callback){
				//return submission id
				callback(data[0]._id);
			}
		});
	});
}

var get_settings = function(callback){
	settings_manager.get('alarm_time', function(alarm_time){
		settings_manager.get('submission_interval', function(submission_interval){
			callback(alarm_time, submission_interval);
		});
	});
}

var make_request = function(tokens){
	tokens.forEach(function(token){
		insert_submission_status(token, function(id){
			get_settings(function(alarm_time, submission_interval){
				logger.info("Sending push notification to " + token);
				request({
					url: 'https://gcm-http.googleapis.com/gcm/send',
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'key=AIzaSyAF0-3_iHMBBjaAJDHaRUOeFajbfxynplk'
					},
					json: {
						data:{
							token: token,
							time: new Date().toString(),
							submission_interval: submission_interval,
							alarm_time: alarm_time,
							id: id
						},
						'to': token
					}
				}, function(error, response, body){
					if(error){
						logger.info("Submission sending error code: " + error);
					}
					else{
						logger.info("Submission sending status code: " + response.statusCode);
					}
				});
			});
		});
	});
}

var check_is_shift = function(callback){
	settings_manager.get('shift_start', function(shift_start){
		settings_manager.get('shift_end', function(shift_end){
			shift_start = parseInt(shift_start);
			shift_end = parseInt(shift_end);

			var current_hour = new Date().getHours();
			var result = false;

			if(shift_start < shift_end){
				if(current_hour >= shift_start && current_hour < shift_end){
					result = true;
				}
			}
			else if(shift_start > shift_end){
				if(current_hour < shift_end || current_hour >= shift_start){
					result = true;
				}
			}

			if(callback){
				callback(result);
			}
		});
	});
}

this.send = function(dbUrl){
	check_is_shift(function(is_shift){
		if(is_shift){
			get_tokens(make_request);
		}
	});
}