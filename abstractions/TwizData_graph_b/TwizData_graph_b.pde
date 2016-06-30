import java.util.*;
import sojamo.osc.*;
import sojamo.util.*;
import static sojamo.util.Common.*;

OscP5 osc;
NetAddress wekinator;

LinkedHashMap<String, Twiz> graphs = new LinkedHashMap();

void setup() {
  size(1280, 600, P3D);
  // pixelDensity(2); /* only works for retina displays, otherwise comment out. */
  smooth(8);
  osc = new OscP5(this, 11000);
  wekinator = new NetAddress(6448);
  textFont(createFont("Menlo-regular", 20));
  textSize(16);
  background(0);
  noStroke();
}


void draw() {
  background(0);
  translate(50, 50);
  for (Twiz twiz : graphs.values()) {
    pushMatrix();
    render(twiz);
    popMatrix();
    translate(0, 300);
  }
}

void render(Twiz theTwiz) {
  pushMatrix();
  fill(0, 255, 128);
  text(theTwiz.id, 0, -10);
  
  {
    Map p1 = toMap("scale", 10, "height", 50, "width", 200, "offset", 25);
    Map p2 = toMap("scale", 50, "height", 50, "width", 200);
    
    pushMatrix();
    lineGraph(theTwiz.history.get("ax"), p1);
    translate(0, 70);
    histogramGraph(theTwiz.history.get("ix"), p2);
    fill(255);
    rect(0,50,10,-theTwiz.intx*i(p2.get("scale"))*4);
    popMatrix();
    
    pushMatrix();
    translate(220, 0);
    lineGraph(theTwiz.history.get("ay"), p1);
    translate(0, 70);
    histogramGraph(theTwiz.history.get("iy"), p2);
    fill(255);
    rect(0,50,10,-theTwiz.inty*i(p2.get("scale"))*4);
    popMatrix();
    
    pushMatrix();
    translate(440, 0);
    lineGraph(theTwiz.history.get("az"), p1);
    translate(0, 70);
    histogramGraph(theTwiz.history.get("iz"), p2);
    fill(255);
    rect(0,50,10,-theTwiz.intz*i(p2.get("scale"))*4);
    popMatrix();
    
  }
  popMatrix();

  translate(0, 200);

  pushMatrix();
  Map p2 = toMap("diameter", 100);
  translate(100, 0);
  radialGraph(theTwiz.history.get("yaw"), p2);
  translate(220, 0);
  radialGraph(theTwiz.history.get("pitch"), p2);
  translate(220, 0);
  radialGraph(theTwiz.history.get("roll"), p2);
  popMatrix();
}

void radialGraph(List<Float> theData, Map theParams) {
  float d = f(value(theParams, "diameter"), 50);

  pushMatrix();
  noStroke();
  fill(255, 100);
  ellipse(0, 0, d, d);
  stroke(255);
  float f = theData.get(theData.size()-1);
  rotate(f);
  rect(0, 0, d/2, 1);
  popMatrix();
}

void lineGraph(List<Float> theData, Map theParams) {
  float offset = f(value(theParams, "offset"), 0);
  float w = f(value(theParams, "width"), 100);
  float h = f(value(theParams, "height"), 100);
  float scale = f(value(theParams, "scale"), 1);
  noStroke();
  fill(255, 50);
  rect(0, 0, w, h);
  noFill();
  stroke(255);
  strokeWeight(1.5);
  pushMatrix();
  translate(0, offset);
  beginShape();
  float x=0;
  for (float y : theData) {
    vertex(x++, y*scale);
  }
  endShape(LINES);
  popMatrix();
}
void histogramGraph(List<Float> theData, Map theParams) {
  float w = f(value(theParams, "width"), 100);
  float h = f(value(theParams, "height"), 100);
  float scale = f(value(theParams, "scale"), 1);
  noStroke();
  fill(255, 50);
  rect(0, 0, w, h);
  fill(255, 150);
  pushMatrix();
  float x=0;
  for (float y : theData) {
    rect(x++, h, 1, -abs(y*scale));
  }
  popMatrix();
}


void oscEvent(OscMessage m) {
  if (m.getAddress().startsWith("/twiz")) {
    String id = m.getStringAt(0);
    if (!graphs.containsKey(id)) {
      graphs.put(id, new Twiz(id));
    }
    graphs.get(id).add(m);
    osc.send(wekinator, "/wek/inputs", m.getFloatAt(4), m.getFloatAt(5), m.getFloatAt(6));
  }
}