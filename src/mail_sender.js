var path = require('path');
var email = require("emailjs");
var settings_manager = require(path.join(__dirname, '/settings_manager.js'));
var database_handler = require(path.join(__dirname, '/database_handler.js'));
var logger = require(path.join(__dirname, '/logger.js'));

this.is_end_of_shift = function(last_sent_mail_day, callback){
	settings_manager.get('shift_end', function(shift_end){
		shift_end = parseInt(shift_end);
		var result = new Date().getHours() == shift_end && last_sent_mail_day != new Date().getDate();

		if(callback){
			callback(result);
		}
	});
}

var get_emails = function(callback){
	settings_manager.get('email1', function(email1){
		settings_manager.get('email2', function(email2){
			if(callback){
				callback(email1, email2);
			}
		});
	});
}

var get_user_from_token = function(users, token){
	for(var i = 0; i < users.length; i++){
		if(users[i].token == token){
			return users[i];
		}
	}
}

var make_email = function(callback){
	var date_formatting = {
	    day: "numeric", month: "numeric", year: "numeric", 
	    hour: "2-digit", minute: "2-digit"
	};

	database_handler.find({}, 'tokens', function(users){
		database_handler.find({time_left:"0"}, 'submissions', function(not_answered_submissions){
			database_handler.find({status:"sent"}, 'submissions', function(not_received_submissions){
				var result = "";

				not_answered_submissions.forEach(function(submission){
					var submission_date = new Date(submission.send_time);
					var passed_hours = new Date().getHours() - submission_date.getHours();
					
					if(passed_hours < 24){
						var user = get_user_from_token(users, submission.token);
						result += user.device_name;
						result += ' не е отговорил: ';
						result += submission_date.toLocaleDateString("en-US", date_formatting);
						result += '\n';
					}
				});

				not_received_submissions.forEach(function(submission){
					var sending_date = new Date(submission.send_time);
					var passed_hours = new Date().getHours() - sending_date.getHours();

					if(passed_hours < 24){
						var user = get_user_from_token(users, submission.token);
						result += user.device_name;
						result += " не е могъл да бъде достигнат: ";
						result += sending_date.toLocaleDateString("en-US", date_formatting);
						result += '\n';
					}
				});

				if(result.length == 0){
					result = "Nothing to report in the last 24 hours.";
				}

				if(callback){
					callback(result);
				}
			});
		});
	});
}

this.send = function(callback){
	make_email(function(email_text){
		get_emails(function(email1, email2){
			var server  = email.server.connect({
			   user:    "attendance_check", 
			   password:"1969000000", 
			   host:    "smtp.mail.yahoo.com", 
			   ssl:     true
			});

			// send the message and get a callback with an error or details of the message that was sent
			server.send({
			   text:    email_text, 
			   from:    "attendance_check@yahoo.com", 
			   to:      [email1, email2],
			   subject: "Attendance Check daily report"
			}, function(err, message){
				if(message){
					logger.info('Email sending result: ' + JSON.stringify(message));
				}

				if(err){
					logger.info('Email sending error: ' + JSON.stringify(err));
				}

				if(callback){
					callback(err, message);
				}
			});
		});
	});
}