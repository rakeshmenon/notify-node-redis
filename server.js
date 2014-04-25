// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express'); 		// call express
var app        = express(); 				// define our app using express
var multer = require('multer');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(multer());

var port = process.env.PORT || 8080; 		// set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

// CONFIGURE SOCKET CONNECTIONS
// =============================================================================
var io = require('socket.io').listen(8001);
var redis = require("redis");

var redisClient = redis.createClient();

io.of('/notifications').
on('connection', function (socket) {

    console.log("New connection: " + socket.id);
    // Send the message of connection for receiving the user ID
    socket.emit('connected');

    // Receive the ID
    socket.on('join', function(channelpre, id){
      var channel = channelpre + id;
      console.log("Connecting to redis: " + channel);

      // store in the socket our connection
      socket.redisClient =  redis.createClient();
      socket.redisClient.subscribe(channel);

      // subscribe to our channel (We don't need to check because we have a
      // connection per channel/user)
      socket.redisClient.on("message", function(channel, message) {
        console.log(channel + ': ' + message);
        socket.emit('notification', channel, message);
      });

    });

});


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.post('/', function(req, res) {
	var result = {};

	console.log(result);

	for(prop in req.body) {
		if(typeof req.body[prop] === "string")
			result[prop] = req.body[prop];
		else
			result[prop] = JSON.parse(req.body[prop]);
	}

	console.log("Channel:" + (req.body.channel + req.body.id));
	redisClient.publish(req.body.channel + req.body.id, result);

	res.json(result);
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Notify is notifying on port ' + port);