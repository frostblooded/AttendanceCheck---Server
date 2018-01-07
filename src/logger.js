var winston = require('winston');

var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({json:false, timestamp: function() {
			return new Date().toString();
		}}),
		new winston.transports.File({ filename: __dirname + '/../debug.log', timestamp: function() {
			return new Date().toString();
		},
		json: false, maxsize: 1024 * 1024, maxFiles: 3 })
	],
	exceptionHandlers: [
		new (winston.transports.Console)({json:false, timestamp: function() {
			return new Date().toString();
		}}),
		new winston.transports.File({ filename: __dirname + '/../debug.log', timestamp: function() {
			return new Date().toString();
		},
		json: false, maxsize: 1024 * 1024, maxFiles: 3 })
	],
	exitOnError: false
});

module.exports = logger;