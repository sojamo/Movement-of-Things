/* the twiz ids we will accept */
var twiz = [];
twiz.push('TwizC6C');
twiz.push('TwizCE2');
twiz.push('TwizCE6');
twiz.push('TwizCF7'); // Add your device here

var config = require('./config.json');


/* setup UDP socket to send and receive OSC packets */
var osc = require('osc-min');
var udp = require("dgram");

var data = {};

var address = "/twiz"; /* default osc address pattern */
// address = "/wek/inputs"; /* wekinator address pattern */

var port = 11000; /* default osc port */
// port = 5000; /* GRT */
// port = 6448; /* wekinator */


/* debug types */
var debugMessages = [];
// debugMessages.push('data');
debugMessages.push('info');
debugMessages.push('debug');
debugMessages.push('connect');
debugMessages.push('disconnect');
debugMessages.push('scan');
debugMessages.push('discover');
debugMessages.push('queue');
debugMessages.push('osc');


debug('info','sending data to remote address '+config.remote+":"+port);



var sock = udp.createSocket("udp4", function(thePacket, rinfo) {
	// receive an OSC message
	debug('osc','received an OSC packet at '+wsListeningPort);
	try {
		// send through WebSocketServer wss to all connected clients (browser)
		var packet = unpack(thePacket);
		debug('osc',packet);
	} catch (err) {
		logger.log('error',err);
		return logger.log('debug','invalid OSC packet.');
	}
});

var unpack = function(thePacket) {
	return JSON.stringify(osc.fromBuffer(thePacket));
}

/* setup serial communication */
var SerialPort = require("serialport");
var bleNano = new SerialPort("/dev/cu.usbmodem146122", {
  baudRate: 115200,
	parser: SerialPort.parsers.readline('\n')
});

bleNano.on('open', function() {
  bleNano.write('main screen turn on', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('message written');
  });
});

// open errors will be emitted as an error event
bleNano.on('error', function(err) {
  console.log('Error: ', err.message);
});

bleNano.on('data', function (theData) {

	if(theData.startsWith("Twiz")) {

		/* expected data format: TwizCE2=f3:16:e0:82:c4:24:a3:d2:07:af:8d:98 */
		var arr = theData.substr(8).trim().split(':');

		var bytes = [];
		arr.forEach(function(elem) { bytes.push(parseInt(elem, 16)); });
		var buf = new Buffer(bytes);

		var values = [];
		var unsigned = 32768;
		for(var i = 0; i< buf.length; i += 2) {
			/* add a signed int to array values */
			values.push(unsigned - (buf.readInt16BE(i, 2) % unsigned));
		}

		var peripheral = theData.substr(0,7);
		data[peripheral].isConnected = true;

		debug('data',
				peripheral + "\t"+values[0]+
				", " + values[1]+
				", " + values[2]+
				", " + values[3]+
				", " + values[4]+
				", " + values[5]);


		/* data conversion based on documentation available at:
		 * https://github.com/medialablasalle/twiz */
		var n = Math.pow(2, 16);
		var rad = 0.0174533;
		var ax = (values[0] * 4.0)/n;
		var ay = (values[1] * 4.0)/n;
		var az = (values[2] * 4.0)/n;
		var ex = rad * (values[3] * 360.0)/n;
		var ey = rad * (values[4] * 360.0)/n;
		var ez = rad * (values[5] * 360.0)/n;

		var queue = data[peripheral].queue;

		debug('debug',
				peripheral,
				"x:" + ax.toFixed(3),
				"y:" + ay.toFixed(3),
				"z:" + az.toFixed(3),
				queue.getLength());


		if(queue.getLength()>10) {
			debug('queue', 'removed ' +queue.getLength() + ' items from queue.');
			queue.clear();
		}
		queue.enqueue({'ex':ex, 'ey':ey, 'ez':ez, 'ax':ax, 'ay':ay, 'az':az});

	} else {
		debug('debug', data);
	}
});




var time = getTime();

function getTime() {
	return new Date().getTime();
}

function debug() {
	var type = arguments[0];
	if(debugMessages.indexOf(type)>-1) {
		var t = getTime();
		var d = t-time;
		time = t;
		var msg = new Date().getTime() + " ("+d+")\t";
		for(var i=1;i<arguments.length;i++){
			msg += arguments[i]+"\t";
		}
		console.log(msg)
	}
}


function setup() {
	for(var i in twiz) {
		data[twiz[i]] = {
			'queue': new Queue(),
			'isConnected':false,
			'current':{'ax':0, 'ay':0, 'az':0, 'ex':0, 'ey':0, 'ez':0},
			'smooth':{'ax':0, 'ay':0, 'az':0, 'ex':0, 'ey':0, 'ez':0}};
	}

	initSocket();

	loop();
}

var frameRate = 25;

function loop() {
	setTimeout(function() {

		var interpolate = true;

		var key = 'TwizC6C';

		for(var key in data) {

			if(data[key].isConnected === false) { continue; }

			var state = data[key].queue.dequeue();

			if(state !== undefined) {
				data[key].current.ax = state.ax;
				data[key].current.ay = state.ay;
				data[key].current.az = state.az;
				data[key].current.ex = state.ex;
				data[key].current.ey = state.ey;
				data[key].current.ez = state.ez;
			}

			var s = 0.4;
			data[key].smooth.ax += (data[key].current.ax - data[key].smooth.ax) * s;
			data[key].smooth.ay += (data[key].current.ay - data[key].smooth.ay) * s;
			data[key].smooth.az += (data[key].current.az - data[key].smooth.az) * s;
			data[key].smooth.ex = data[key].current.ex;
			data[key].smooth.ey = data[key].current.ey;
			data[key].smooth.ez = data[key].current.ez;

			var buf = osc.toBuffer({
				address: ("/twiz/"+key),
				args: [key,
				data[key].current.ax,
				data[key].current.ay,
				data[key].current.az,
				data[key].current.ex,
				data[key].current.ey,
				data[key].current.ez ]
			});

			sock.send(buf, 0, buf.length, port, config.remote);

			wss.clients.forEach(function each(client) {
	      client.send(JSON.stringify({'key': key, 'data': data[key].current, 'time': (+new Date)}));
	    });
		}

		loop();

	}, 1000/frameRate);
}


var wss;

function initSocket() {
	console.log('init socket');
	var wsListeningPort = 8081;
	var WebSocketServer = require('ws').Server;
	wss = new WebSocketServer({ port: wsListeningPort });
	console.log('init socket (2)');
	wss.on('connection', function connection(ws) {
		console.log('WebSocket running ', ws);
	  ws.on('message', function incoming(message) {console.log(message);});
	  ws.on('close', function close(ws) {console.log('closing websocket connection ' + ws);});
	});


}


function almostEqual(a,b,epsilon) {
	return Math.abs(a - b) < epsilon;
}

setup();


/*

	 Queue.js

	 A function to represent a queue

	 Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
	 the terms of the CC0 1.0 Universal legal code:

	 http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/

/* Creates a new queue. A queue is a first-in-first-out (FIFO) data structure -
 * items are added to the end of the queue and removed from the front.
 */
function Queue(){

	// initialise the queue and offset
	var queue  = [];
	var offset = 0;

	// Returns the length of the queue.
	this.getLength = function(){
		return (queue.length - offset);
	}

	this.clear = function() {
		queue = [];
		offset = 0;
	}

	// Returns true if the queue is empty, and false otherwise.
	this.isEmpty = function(){
		return (queue.length == 0);
	}

	/* Enqueues the specified item. The parameter is:
	 *
	 * item - the item to enqueue
	 */
	this.enqueue = function(item){
		queue.push(item);
	}

	/* Dequeues an item and returns it. If the queue is empty, the value
	 * 'undefined' is returned.
	 */
	this.dequeue = function(){

		// if the queue is empty, return immediately
		if (queue.length == 0) return undefined;

		// store the item at the front of the queue
		var item = queue[offset];

		// increment the offset and remove the free space if necessary
		if (++ offset * 2 >= queue.length){
			queue  = queue.slice(offset);
			offset = 0;
		}

		// return the dequeued item
		return item;

	}

	/* Returns the item at the front of the queue (without dequeuing it). If the
	 * queue is empty then undefined is returned.
	 */
	this.peek = function(){
		return (queue.length > 0 ? queue[offset] : undefined);
	}

}
