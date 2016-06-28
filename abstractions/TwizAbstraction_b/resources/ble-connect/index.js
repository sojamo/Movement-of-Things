/* setup UDP socket to send and receive OSC packets */
var osc = require('osc-min');
var udp = require("dgram");

var x = 0 ,y =  0, z =  0;
var nx = 0, ny = 0, nz = 0;

var accx = 0 ,accy =  0, accz =  0;
var naccx = 0, naccy = 0, naccz = 0;
var cnt = 0;
var queue = new Queue();


var sock = udp.createSocket("udp4", function(thePacket, rinfo) {
  // receive an OSC message
  console.log('debug','received an OSC packet at '+wsListeningPort);
  try {
    // send through WebSocketServer wss to all connected clients (browser)
    var packet = unpack(thePacket);
    console.log(packet);

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
  console.log("restart scanning ble devices .." + queue.getLength());

  setTimeout(function() { noble.startScanning(); }, 500);
  // setTimeout(function() { scan(); }, 10000);

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
    console.log("stop scanning ..");
    noble.stopScanning();
  }
});


noble.on('disconnect', function(peripheral) {
  console.log("disconnected: "+peripheral);
});


noble.on('connect', function(peripheral) {
  console.log("connected: "+peripheral);
});


function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

noble.on('discover', function(peripheral) {
  console.log('discovered:'+peripheral.advertisement.localName);

  var name = peripheral.advertisement.localName;
  var twiz = "";
  twiz = "TwizCE2";
  twiz = "TwizC6C";

  if(name !== undefined && (name.startsWith("TwizC6C") || name.startsWith("TwizCE2"))) {

    // console.log("sleep");
    // sleep(2000);
    // sleep(2000);
    // sleep(1000);
    // console.log("continue");
    console.log("connecting? "+name);
    setTimeout(function() {
      console.log("attempting to connect to "+name);

    /* TODO Timeout of 5 seconds required? Or bug fixed? */

    peripheral.once('connect',function() {
      console.log("connected to twiz. " + peripheral.advertisement.localName);
    });

    peripheral.once('disconnect',function() {
      console.log("disconnected from twiz." + peripheral.advertisement.localName);
      scan();
    });

    peripheral.connect(function(error) {
      console.log('connected to peripheral: ' + peripheral.advertisement.localName +' ( '+ peripheral.uuid+ ' )');

      peripheral.discoverServices(['1901'], function(error, services) {
        console.log('discovered service:'+services[0]);

        var service = services[0];

        service.discoverCharacteristics(['2b01'], function(error, characteristics) {
          console.log('discovered characteristic');

          var characteristic = characteristics[0];
          characteristic.on('read', function(data, isNotification) {

            if(data.length==12) {
              var values = [];
              for(var k=0;k<data.length;k+=2) {
                  values.push(data.readIntBE(k, 2)); /* signed int */
              }
              console.log(peripheral.advertisement.localName+", "+values[0]+", "+values[1]+", "+values[2]);

              var n = Math.pow(2, 16);
              var rad = 0.0174533;
              var ax = (values[0] * 4.0)/n;
              var ay = (values[1] * 4.0)/n;
              var az = (values[2] * 4.0)/n;
              var ex = rad * (values[3] * 360.0)/n;
              var ey = rad * (values[4] * 360.0)/n;
              var ez = rad * (values[5] * 360.0)/n;

              nx = ex;
              ny = ey;
              nz = ez;

              naccx = ax;
              naccy = ay;
              naccz = az;

              // console.log(ex,ey,ez);

              if(queue.getLength()>10) {
                console.log("removed "+queue.getLength()+" "+items);
                queue.clear();
              }
              queue.enqueue({'nx':ex, 'ny':ey, 'nz':ez, 'naccx':naccx, 'naccy':naccy, 'naccz':naccz });

              cnt++;
              // console.log((cnt)+"\t"+n+"\t"+":"+peripheral.uuid+"\t"+naccx+"\t"+naccy+"\t"+naccz+"\t"+nx+"\t"+ny+"\t"+nz);
              // console.log((cnt)+"\t"+n+"\t"+":"+peripheral.uuid+"\t"+ax+"\t"+ay+"\t"+az+"\t"+ex+"\t"+ey+"\t"+ez);
            }
          });

          // true to enable notify
          characteristic.notify(true, function(error) {
            console.log('start listening.');
          });

        });
      });
    });

  },5000);

  }
});


function upd() {
    setTimeout(function() {

      var address = "/twiz"; /* default osc address pattern */
      // address = "/wek/inputs"; /* wekinator address pattern */

      var port = 12000; /* default osc port */
      // port = 5000; /* GRT */
      // port = 6448; /* wekinator */

      var interpolate = true;


      /* evaluate current sensor data */

      var data = queue.dequeue();

      if(data !== undefined) {
        accx = data.naccx;
        accy = data.naccy;
        accz = data.naccz;
        x = data.nx;
        y = data.ny;
        z = data.nz;
      }

      var buf;
      buf = osc.toBuffer({
        address: address,
        args: [accx,accy,accz,x,y,z]
      });
      sock.send(buf, 0, buf.length, port, "127.0.0.1");

      upd();

    },20);
}

function almostEqual(a,b,epsilon) {
  return Math.abs(a - b) < epsilon;
}

upd();






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
