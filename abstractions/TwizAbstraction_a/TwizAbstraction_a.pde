/*
 * Movement Of Things 
 * Exploring Inertial Motion Sensing When Autonomous, Tiny and Wireless
 * Andreas Schlegel, Cedric Honnet
 * 
 * A software for abstract data renderings using recordings captured from the Twiz motion sensor.
 * Each data point is translated into a visual element, an elongated cube. hese visual elements 
 * are then rendered from left to right. The orientation for each element is determined by  
 * the yaw, pitch and roll data of the corresponding data point. While the visual elements are 
 * rendered onto the screen, they leave a trail over time which results in a 3D volume  
 * repsenting the recorded data as a visual abstraction. Individual frames can be saved as an 
 * image by pressing key s while the program is running.
 *
 * Code by Andreas Schlegel (c) 2015, 2016
 * https://github.com/sojamo/movement-of-things
 * tested with Processing 3.0.2 (http://www.processing.org/download)
 *
 * The Movement of Things project is an exploration into the qualities and properties of movement. 
 * Through a range of exercises these movements are captured and translated by custom-built 
 * software and the use of an autonomous, tiny and wireless motion sensor. 
 * A series of Motion Sensing Extensions suggest different approaches of how to use a motion 
 * sensor within various physical environments to capture movement to better understand the 
 * materialization of movement and new forms of interactions through movement.
 *
 * The objective of the project is to collect the acceleration and orientation 
 * properties of moving objects and express them ar- tistically. We have tested the 
 * Movement of Things in two different scenarios, a recorded and a real-time scenario.
 * Recording Scenario
 * The recorded scenario took place in May 2015 in Paris where various subjects found in an 
 * urban environment were mea- sured, including an air vent, washing machine, dryer, escalator, 
 * trees, water, doors or the metro. Later, the recorded data was interpreted through abstract 
 * data renderings and trans- lated into a kinetic object animated by data recordings.
 *
 */
 
import java.util.*;

List<Data> log = new ArrayList();
/* set true for to see the orientation for 
 * each data point repesented by a cube in the center of the screen 
 */
boolean isCube = false; 

int index = 0;
float spacing = 4; /* spacing between each visual element */
float scl = 0.15; /* zoom factor while rendering */


void setup() {
  size(1280,720,P3D);
  hint(DISABLE_DEPTH_TEST);
  String filename = "";
  /* sample recordings from the data captured from the twiz motion sensor
   * are located inside the data folder.
   *
   * in the following data read from a text file twiz-20150521-140658.txt 
   * is used, data is recorded from a water stream in Paris.
   */
  filename = "twiz-20150521-140658.txt"; 
  
  /* read and print data into the console */
  String[] file = loadStrings(filename);
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
    // box(2, 400, 2);
    box(400, 20, 2);
    popMatrix();
  }
  popMatrix();

  if (isCube) {
    translate(width/2, height/2, 400);
    rotateX(radians(log.get(index).yaw));
    rotateY(radians(log.get(index).pitch));
    rotateZ(radians(log.get(index).roll));
    fill(255);
    box(20);
    index++;
    index %= log.size();
  }
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