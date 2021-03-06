// HTTP Portion
var http = require('http');
var fs = require('fs'); // Using the filesystem module
var httpServer = http.createServer(requestHandler);
var url = require('url');
var nedb = require('nedb');

httpServer.listen(8080);

function requestHandler(req, res) {

	// Read index.html	
	fs.readFile(__dirname + '/index.html',
		// Callback function for reading
		function (err, data) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading index.html');
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(data);
  		}
  	);
  	
}

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

// Empty array to hold clients
var clients = [];


var db = {};
//this file should hold all the order groups created
db.groupordersdb = new nedb({
	filename: 'groups.db',
	autoload: true
});

//this file should store all info on the users order params in each groupdb
db.userparamsdb = new nedb({
	filename: 'userparams.db',
	autoload: true
});
 db.userparamsdb.loadDatabase();

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection', 
	// We are given a websocket object in our function
	function (socket) {

		console.log("connected");

		
		// when a request for a new order group is created, add a new group to groups database. als add a new user to users database

		socket.on('neworderreq', function(data){
			//var id = data.id;
			//var gOrds = {
			//	//the name of the group
			//	groupname: data.groupname,
			//	//_id: id,
			//	//an array of food choices available for other users to pick
			//	groupcuisine: data.group.cuisine,
            //
			//	//group was created by
			//	groupcreated: data.username
			//};

			//db.groupordersdb.insert(gOrds, function (err, group) {});
			var userId = -1;
			var uParms = {
				//the user's name
				username: data.username,
				usernumber: data.usernumber,
				//the user's food choices
				cuisine: data.cuisine,
				//the group this user is attached to
				group: data.groupname
			};

			//save newgroup to db, save new user to db
			console.log(data);
			db.userparamsdb.insert(uParms, function(err, user) {});

			db.userparamsdb.find({usernumber: data.usernumber}, function(err){
				if(err){
					console.log(err);
				}
			});
			socket.broadcast.emit('neworderreq', data);
		});

		socket.on('findDb', function(){
			db.userparamsdb.find({}, function (err, result){
				if (err) { console.log(err); }
				if (result.count > 0) {
					console.log(result[0]._id);
				}
			});
		});

		socket.on('ready', function(data){
			var r;
			db.userparamsdb.find({username: data}, function (err, result){
				if (err) { console.log(err); }
				if (result.count > 0) {
					r = result[0]._id;
					console.log(result[0]._id);
				}
			});

			//remove user from database
			db.remove({ _id: r }, {}, function (err, numRemoved) {
				// Now the fruits array is ['orange', 'pear']
				socket.broadcast.emit('useroptout', data);
			});
		});

		socket.on('optOut', function(data){
			db.userparamsdb.find({username: data}, function (err, result){
				if (err) { console.log(err); }
				if (result.count > 0) {
					//console.log(result[0]._id);
				}
			});
		});


		// if a new user joins an existing group, push their data to the db, emit the info to everyone else
		socket.on('joinanexorder', function(data){
			var uParms = {
				//the user's name
				username: data.username,

				//the user's food choices
				usercuisine: data.cuisine,

				//the group this user is attached to
				grouporderID: groupordersdb.id
			};

			// save userinfo to db
			userparamsdb.insert(uParms, function(err){
				if (err) { console.log(err); }});

			console.log('a new user has joined the order group');
			io.sockets.emit('newuserjoined', uParms);
		});

		// Disconnect clients and remove them from array
		socket.on('disconnect', function() {
			console.log("Client has disconnected " + socket.id);
			clients.splice(clients.indexOf(socket.id), 1);
			console.log(clients);
		});
	}
);

