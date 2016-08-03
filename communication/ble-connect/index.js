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

		/* a packet here is converted into an object which is
		 * identifiable by its oscType value (message or bundle).
		 * at this point the packet, no matter of which type it is,
		 * can be sent to the client, or can be processed and
		 * scheduled (if of type bundle) for distribution considering
		 * the timetag.
		 * the packet is the sent to the Websocket client where it is
		 * translated from the osc-min packet format into an
		 * sojamo.osc.OscPacket format.
		 */

		// wss.clients.forEach(function each(client) {
		//   client.send(packet);
		// });

	} catch (err) {
		logger.log('error',err);
		return logger.log('debug','invalid OSC packet.');
	}
});

var unpack = function(thePacket) {
	return JSON.stringify(osc.fromBuffer(thePacket));
}

// var oscListeningPort = 11000;
// sock.bind(oscListeningPort);
// logger.log('info','UDP socket create and bound to port '+oscListeningPort);


var noble = require('noble');

function scan() {
	debug('scan', 'restart scanning ble devices ..');

	setTimeout(function() { noble.startScanning(); }, 500);

	setTimeout(function() { scan(); }, 20000);

	/*
	 * use intervals to restart scanning, see:
	 * https://github.com/sandeepmistry/noble/issues/97
	 *
	 * In case a peripheral disconnects due to crashing, running out of power, etc.
	 * it can only reconnect after refreshing the scanning procedure by calling
	 * noble.startScanning() this has been a solution reported under issue 97
	 * though this occasionally resulted in conflicts after a while, again see issue 97.
	 *
	 * Also consider to change the scanning procedure to the method used in 'reconnect.js'
	 *
	 */
}

noble.on('stateChange', function(state) {
	if (state === 'poweredOn') {
		scan();
	} else {
		debug('scan', 'stop scanning ... ');
		noble.stopScanning();
	}
});


noble.on('disconnect', function(peripheral) {
	debug('disconnect', 'disconnected from ' + peripheral);
});


noble.on('connect', function(peripheral) {
	debug('connect', 'connected to ' + peripheral);
});



noble.on('discover', function(peripheral) {

	var name = peripheral.advertisement.localName;
	var delay = 100;


	debug('connect', 'discovered: '+peripheral.advertisement.localName+" ( " +(twiz.indexOf(name) > -1 ? "registered":"not accepted" )+ " )");

	if( twiz.indexOf(name) > -1 ) {
		debug('connect', 'Starting to connect to ' + name + ', waiting ' + delay + 'ms.');

		setTimeout(function() {
			debug('connect', 'attempting to connect to ' + name);

			/* TODO Timeout of 5 seconds required? Or bug fixed? */

			peripheral.once('connect',function() {
				debug('connect', 'connected to ' + peripheral.advertisement.localName);
				data[peripheral.advertisement.localName].isConnected = true;
			});

			peripheral.once('disconnect',function() {
				debug('disconnect', 'Got disconnected from ' + peripheral.advertisement.localName);
				data[peripheral.advertisement.localName].isConnected = false;
				scan();
			});

			peripheral.connect(function(error) {
				debug('connect', 'connected to peripheral: ' + peripheral.advertisement.localName +' ( '+ peripheral.uuid+ ' )');

				peripheral.discoverServices(['1901'], function(error, services) {
					debug('discover', 'discovered service:'+services[0]);

					var service = services[0];

					service.discoverCharacteristics(['2b01'], function(error, characteristics) {
						debug('discover', 'discovered characteristic');

						var characteristic = characteristics[0];
						characteristic.on('read', function(theData, isNotification) {

							if(theData.length==12) {
								var values = [];
								for(var k=0;k<theData.length;k+=2) {
									values.push(theData.readInt16BE(k, 2)); /* signed int */
								}
								debug('data',
										peripheral.advertisement.localName+"\t"+values[0]+
										", "+values[1]+
										", "+values[2]+
										", "+values[3]+
										", "+values[4]+
										", "+values[5]);

								var n = Math.pow(2, 16);
								var rad = 0.0174533;
								var ax = (values[0] * 4.0)/n;
								var ay = (values[1] * 4.0)/n;
								var az = (values[2] * 4.0)/n;

								var ex = rad * (values[3] * 360.0)/n;
								var ey = rad * (values[4] * 360.0)/n;
								var ez = rad * (values[5] * 360.0)/n;


								var queue = data[peripheral.advertisement.localName].queue;

								debug('debug',
										peripheral.advertisement.localName,
										"x:"+ax.toFixed(3),
										"y:"+ay.toFixed(3),
										"z:"+az.toFixed(3),
										queue.getLength());


								if(queue.getLength()>10) {
									debug('queue', 'removed ' +queue.getLength() + ' items from queue.');
									queue.clear();
								}
								queue.enqueue({'ex':ex, 'ey':ey, 'ez':ez, 'ax':ax, 'ay':ay, 'az':az });
							}
						});

						// true to enable notify
						characteristic.notify(true, function(error) {
							debug( 'connect', 'start listening to ' + peripheral.advertisement.localName);
						});

					});
				});
			});

		}, delay);

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
		data[twiz[i]] = {'queue': new Queue(), 'isConnected':false, 'current':{'ax':0, 'ay':0, 'az':0, 'ex':0, 'ey':0, 'ez':0}};
	}
	loop();
}

var frameRate = 50;

function loop() {
	setTimeout(function() {

		var interpolate = true;

		for(var key in data) {
			// console.log('reading '+key+' '+data[key].queue.getLength());
			if(data[key].isConnected === false) {
				continue;
			}
			var state = data[key].queue.dequeue();
			if(state !== undefined) {
				data[key].current.ax = state.ax;
				data[key].current.ay = state.ay;
				data[key].current.az = state.az;
				data[key].current.ex = state.ex;
				data[key].current.ey = state.ey;
				data[key].current.ez = state.ez;
			}

			var buf;
			buf = osc.toBuffer({
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
		}

		loop();

	},1000/frameRate);
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
