import java.util.*;
import sojamo.osc.*;
import controlP5.*;
import static controlP5.ControlP5.*;

OscP5 osc;
ControlP5 cp;

void setup() {
  size(1280, 600, P3D);
  smooth(8);
  hint(DISABLE_DEPTH_TEST);  
  osc = new OscP5(this, 11000);
  cp = new ControlP5(this);
  float y = height-40; 
  cp.addSlider("len").setPosition(20,y).setSize(200,20).setRange(10,400).setValue(10);
  cp.addToggle("x").setPosition(250,y).setSize(20,20).setValue(true);
  cp.addToggle("y").setPosition(290,y).setSize(20,20).setValue(true);
  cp.addToggle("z").setPosition(330,y).setSize(20,20).setValue(true);
  background(0);
  noStroke();
}

int n = 0;
int pos = 10;
float rotY = 0, nrotY = 0;

void draw() {
  rotY += (nrotY - rotY) *0.1;
  n = 0;
  noStroke();
  fill(0, 255);
  rect(0, 0, width, height);
  render();
}

void keyPressed() {
  pos = 0;
  background(0);
  log.clear();
}


void mouseDragged() {
  if(mouseY<height-100) {
    nrotY += (pmouseX-mouseX)*0.01;
  }
}


float spacing = 4; /* spacing between each visual element */
float scl = 0.25; /* zoom factor while rendering */
int len = 200;
List<Data> log = new ArrayList();


void render() {
  if (log.size()<=0) {
    return;
  } 

  /* render visual elements into the 3D scene without 
   * clearing the render buffer while the program is running. 
   */
  lights();
  pushMatrix();
  translate(width/2, height/2);
  scale(scl);
  //rotateX(frameCount*0.01);
  //rotateY(0.25);
  rotateY(rotY);
  translate(-spacing*0.5*log.size(), 0);

  long l0 = Long.parseLong(log.get(0).time);
  
  float t = cp.get("len").getValue();
  boolean bx = b(cp.get("x").getValue());
  boolean by = b(cp.get("y").getValue());
  boolean bz = b(cp.get("z").getValue());
  
  for (int i=1; i<log.size(); i++) {
    Data data = log.get(i);
    long l1 = Long.parseLong(log.get(i).time);
    int dif = int(l1-l0);
    l0 = l1;
    translate(spacing, 0);
    pushMatrix();
    rotateX((data.yaw));
    rotateY((data.pitch));
    rotateZ((data.roll));
    fill(255, 120);
    float difx = abs(data.ax - log.get(i-1).ax) * 400;
    float dify = abs(data.ay - log.get(i-1).ay) * 400;
    float difz = abs(data.az - log.get(i-1).az) * 400;
    
    if(bx) box(t   + (difx), 4, 4);
    if(by) box(4, t + (dify), 4);
    if(bz) box(4, 4, t + (difz));
    
    popMatrix();
  }
  popMatrix();
}


class Data {
  String time = "0";
  float ax, ay, az;
  float yaw, pitch, roll;
  public String toString() {
    return time+"\t"+ax+","+ay+","+az+"\t"+yaw+","+pitch+","+roll+"\n";
  }
}



void oscEvent(OscMessage m) {

  if (log.size()==800) {
    log.remove(0);
  }
  if (m.getAddress().startsWith("/twiz")) {
    String id = m.getStringAt(0);
    float ax = m.getFloatAt(1);
    float ay = m.getFloatAt(2);
    float az = m.getFloatAt(3);
    float yaw = m.getFloatAt(4);
    float pitch = m.getFloatAt(5);
    float roll = m.getFloatAt(6);
    Data data = new Data();
    data.ax = ax;
    data.ay = ay;
    data.ax = az;
    data.yaw = yaw;
    data.pitch = pitch;
    data.roll = roll;
    log.add(data);
    //if (log.size()==100) {
    //  log.remove(0);
    //}
  }
}