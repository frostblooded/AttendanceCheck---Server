var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var ObjectId = require('mongodb').ObjectID;
var register_token = require(path.join(__dirname, '/src/register_token'));
var send_notification = require(path.join(__dirname, '/src/send_push_notification.js'));
var database_handler = require(path.join(__dirname, '/src/database_handler.js'));
var settings_manager = require(path.join(__dirname, '/src/settings_manager.js'));
var mail_sender = require(path.join(__dirname, '/src/mail_sender.js'));
var logger = require(path.join(__dirname, '/src/logger.js'));

var last_sent_mail_day = 0;

var DATABASE_URL = "mongodb://localhost:27017/attendanceCheck"
var ALLOWED_TIME_DIFFERENCE = 5 * 60 * 1000;
var SECRET = "secret";

app.use(express.static(path.join(__dirname, '/public')));

//Return index.html
app.get('/', function(req, res){
	logger.info(req.query);
	res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.use(bodyParser.json());

app.post('/register_token', function(request, response){
	register_token.register(DATABASE_URL, request.body);
	response.end("200");
});

app.post('/submit', function(request, response){
	submission = request.body;
	submission_time = new Date(submission.android_receival_time);
	current_time = new Date();
	time_difference = current_time - submission_time;

	logger.info("Time difference is " + time_difference);
	logger.info("Allowed time difference is " + ALLOWED_TIME_DIFFERENCE);

	if(time_difference < ALLOWED_TIME_DIFFERENCE){
		logger.info("Handling submission " + JSON.stringify(submission));

		database_handler.updateOne({
			_id: ObjectId(submission.id)
		}, {
			time_left: submission.time_left,
			receival_time: current_time.toString(),
			status: 'received'
		}, 'submissions', function(){
			response.end("200");
		});
	} else{
		logger.info("Not handling submission.");
	}
});

app.get('/info', function(request, response){
	//queries the database with requested query
	response.header('Access-Control-Allow-Origin', "*");

	var collection = request.query.collection;
	var db_query = JSON.parse(request.query.query);

	if(request.query.secret == SECRET){
		database_handler.find(db_query, collection, function(result){
			response.end(JSON.stringify(result));
		});
	} else{
		response.end("403");
	}
});

app.post('/settings', function(request, response){
	settings = request.body.data;

	if(request.body.secret == SECRET){
		logger.info('Changing settings to: ' + JSON.stringify(settings));

		settings.forEach(function(setting){
			settings_manager.set(setting.name, setting.value);
		});

		response.end("200");
	} else{
		response.end("403");
	}
});

//Couldn't get DELETE to work, so am using post to delete users
app.post('/users', function(request, response){
	var query = request.body;

	if(query.secret == SECRET){
		logger.info('Deleting user ' + JSON.stringify(query));

		database_handler.deleteMany({device_name: query.device_name}, 'tokens', function(){
			response.end("200");
		});
	} else{
		response.end("403");
	}
});

//Set submission sending
var second = 1000; //milliseconds
var minute = second * 60;

var milliseconds_since_sending = 0;

//Check every minute if enough time has passed
setInterval(function(){
	milliseconds_since_sending += minute;

	settings_manager.get('submission_interval', function(submission_interval){
		logger.info('Sending in '
		 + (submission_interval - milliseconds_since_sending) / (60 * 1000)
		 + ' minutes.');

		if(milliseconds_since_sending >= submission_interval){
			milliseconds_since_sending = 0;
			send_notification.send();
		}
	});

	mail_sender.is_end_of_shift(last_sent_mail_day, function(result){
		if(result){
			logger.info('Is end of shift: ' + result);
			mail_sender.send(function(err, message){
				if(err){
					last_sent_mail_day = 0;
				}
				else{
					last_sent_mail_day = new Date().getDate();
				}
			});
		}
	});
}, minute);

//Run server
var server = app.listen(8080, function(){
	var port = server.address().port;
	logger.info('Server listening at port ' + port);
});
