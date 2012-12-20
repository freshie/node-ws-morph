var app = require('express').createServer();
var io = require('socket.io').listen(app);
var http = require('http');
var os = require('os');

app.listen(8084);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


app.get('/server/getIP', function(req, res){
	//res.send("var serverIP = '23.30.54.5';");
	res.send("var serverIP = '" +getServerIps()[0] +"';");
});

app.get('/resources/:sub/:file', function(req, res){
	var sub = req.params.sub
	, file = req.params.file;
 
  res.sendfile(__dirname + '/resources/' + sub + '/' + file);
   
});

app.get('/resources/:sub/:sub2/:file', function(req, res){
  var sub = req.params.sub
  	, sub2 = req.params.sub2
    , file = req.params.file;
 
  res.sendfile(__dirname + '/resources/' + sub + '/' + sub2 + '/' + file);
   
});

var elements = {};

io.sockets.on('connection', function (socket) {
	
	socket.on('getElements', function(){
		socket.emit('setElements', elements);
	});


	socket.on('sendElement', function(elementIn){
		
		elements[elementIn.id] = elementIn;
		
		socket.broadcast.emit('setElement', elementIn);
	});
	
	socket.on('deleteElement', function(id){
		
		delete elements[id];
                                                  
		socket.broadcast.emit('removeElement', id);
	});
		
});



function getServerIps()
{
	//gets Ip address
	var interfaces = os.networkInterfaces();
	var addresses = [];
	for (k in interfaces) {
	    for (k2 in interfaces[k]) {
	        var address = interfaces[k][k2];
	        if (address.family == 'IPv4' && !address.internal && k != "VirtualBox Host-Only Network") {
	        	addresses.push(address.address);
	        }
	    }
	}

	return addresses
}