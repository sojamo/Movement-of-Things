var myFont;

var values = {
	'x':[], 'y': [], 'z': [],
	'ex': 0, 'ey':0, 'ez':0,
	'accx': [0,0], 'accy': [0,0], 'accz': [0,0],
	'ix': [0,0], 'iy': [0,0], 'iz': [0,0]
};


function preload() {
    // myFont = loadFont('./assets/RobotoCondensed-Regular.ttf');
		initSocket();
}

function setup() {
	createCanvas(windowWidth, windowHeight);
}

function update() {
	var s = 0.1;
	values.accx[1] += (values.accx[0] - values.accx[1]) * s;
	values.accy[1] += (values.accy[0] - values.accy[1]) * s;
	values.accz[1] += (values.accz[0] - values.accz[1]) * s;

	values.ix[1] += (values.ix[0] - values.ix[1]) * s;
	values.iy[1] += (values.iy[0] - values.iy[1]) * s;
	values.iz[1] += (values.iz[0] - values.iz[1]) * s;
}

function draw() {
	update();
	background(240);
	// textFont(myFont);
	textSize(20);
	fill(0,220,128);
	text("Twiz\n", 10,20, 400, 100);

	push();
	translate(10,200);

	push();
	drawAccel(values.x, values.ix);
	translate(250,20);
	drawOrientation(values.ex);
	pop();

	translate(0,50);
	push();
	drawAccel(values.y, values.ix);
	translate(250,20);
	drawOrientation(values.ey);
	pop();

	translate(0,50);
	push();
	drawAccel(values.z, values.iz);
	translate(250,20);
	drawOrientation(values.ez);
	pop();

	pop();
	noStroke();

}

function drawAccel(theValue, theIntensity) {
	var i = 0;
	var h = 40;
	fill(40,theIntensity[1]*255);
	noStroke();
	rect(0,0,200,h);
	stroke(40);
	noFill();
	beginShape();
	theValue.forEach(function(elem) {
		var val = map(elem, -2,4,0,1);
		vertex(i += 2, val * h);
	});
	endShape();
}

function drawOrientation(theValue) {
	noStroke();
	push();
	fill(40,20);
	ellipse(0,0,40,40);
	rotate(theValue);
	fill(40);
	rect(0,0,20,1);
	pop();
}

function trigger(theData) {
	var elem = (JSON.parse(theData));
	var lim = 100;

	values.x.unshift(elem['data']['ax']);
	values.y.unshift(elem['data']['ay']);
	values.z.unshift(elem['data']['az']);
	if(values.x.length > lim) values.x.pop();
	if(values.y.length > lim) values.y.pop();
	if(values.z.length > lim) values.z.pop();

	values.ex = elem['data']['ex'];
	values.ey = elem['data']['ey'];
	values.ez = elem['data']['ez'];

	values.accx[0] = map(elem['data']['ax'], -2, 2, 0 , 1);
	values.accy[0] = map(elem['data']['ay'], -2, 2, 0 , 1);
	values.accz[0] = map(elem['data']['az'], -2, 4, 0 , 1);

	if(values.x.length > 2) {
		values.ix[0] = values.x[0]-values.x[1];
		values.iy[0] = values.y[0]-values.y[1];
		values.iz[0] = values.z[0]-values.z[1];
	}

}

function initSocket() {
		var ws = new WebSocket('ws://127.0.0.1:8081');
		ws.onopen = function (theEvent) { console.log("websocket connection is open.",+new Date);}
	  ws.onmessage = function (theEvent) { trigger(theEvent.data);};
		ws.onerror = function (theEvent) { console.log("websocket error.");}
	  ws.onclose = function (theEvent) { console.log("websocket connection is closed.");}
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
