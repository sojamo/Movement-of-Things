/*
 * Movement Of Things 
 * Exploring Inertial Motion Sensing When Autonomous, Tiny and Wireless
 * Andreas Schlegel, Cedric Honnet
 * 
 */

import java.util.*;

List<Data> log = new ArrayList();
int index = 0;
float spacing = 4; /* spacing between each visual element */
float scl = 0.15; /* zoom factor while rendering */
int len = 200;

void setup() {
  size(1280, 720, P3D);
  hint(DISABLE_DEPTH_TEST);
  String filename = "twiz-20150521-140658.txt"; 

  log = read(filename);

  noStroke();
  background(0);
}

void draw() {
  /* render visual elements into the 3D scene without 
   * clearing the render buffer while the program is running. 
   */
  lights();
  pushMatrix();
  translate(width/2, height/2);
  scale(scl);
  rotateX(frameCount*0.01);
  rotateY(0.25);
  translate(-spacing*0.5*log.size(), 0);
  long l0 = Long.parseLong(log.get(0).time);

  for (int i=1; i<log.size (); i++) {
    Data data = log.get(i);
    long l1 = Long.parseLong(log.get(i).time);
    int dif = int(l1-l0);
    l0 = l1;
    translate(spacing, 0);
    pushMatrix();
    rotateX(radians(data.yaw));
    rotateY(radians(data.pitch));
    rotateZ(radians(data.roll));
    fill(255, 12);
    box(400, 20, 2);
    popMatrix();
  }
  popMatrix();

}

class Data {
  String time;
  float x, y, z;
  float yaw, pitch, roll;
  public String toString() {
    return time+"\t"+x+","+y+","+z+"\t"+yaw+","+pitch+","+roll+"\n";
  }
}


void keyPressed() {
  switch(key) {
    case('s'):
    saveFrame();
    break;
  }
}


List<Data> read(String theFilename) {
  List<Data> log = new ArrayList();
  /* read and print data into the console */
  String[] file = loadStrings(theFilename);
  for (String s0 : file) {
    if (!s0.startsWith("#")) {
      String[] s1 = s0.split("\t");
      Data data = new Data(); 
      for (int i=0; i<s1.length; i++) {
        print(i+" "+s1[i]+"\t");
        switch(i) {
          case(0):
          data.time = s1[i];
          break;
          case(1):
          String[] xyz = s1[i].split(",");
          data.x = float(xyz[0]);
          data.y = float(xyz[1]);
          data.z = float(xyz[2]);
          break;
          case(2):
          String[] yawPitchRoll = s1[i].split(",");
          data.yaw = float(yawPitchRoll[0]);
          data.pitch = float(yawPitchRoll[1]);
          data.roll = float(yawPitchRoll[2]);
          break;
        }
      }
      log.add(data);
    }
    println();
  }
  return log;
}