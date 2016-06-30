class Twiz {

  LinkedHashMap<String, List<Float>> history = new LinkedHashMap();
  String id;
  float intx, inty, intz;

  Twiz(String theId) {
    id = theId;
    List fill = Collections.nCopies(1, 0.0);
    history.put("ax", new ArrayList<Float>(fill));
    history.put("ay", new ArrayList<Float>(fill));
    history.put("az", new ArrayList<Float>(fill));
    history.put("ix", new ArrayList<Float>(fill));
    history.put("iy", new ArrayList<Float>(fill));
    history.put("iz", new ArrayList<Float>(fill));
    history.put("yaw", new ArrayList<Float>(fill));
    history.put("pitch", new ArrayList<Float>(fill));
    history.put("roll", new ArrayList<Float>(fill));
  }

  void add(OscMessage m) {
    if (m.getAddress().startsWith("/twiz")) {

      float ax = m.getFloatAt(1);
      float ay = m.getFloatAt(2);
      float az = m.getFloatAt(3);
      float yaw = m.getFloatAt(4);
      float pitch = m.getFloatAt(5);
      float roll = m.getFloatAt(6);

      az = az > 0 ? history.get("az").get(history.get("az").size()-1):az;

      for (List<Float> l : history.values()) {
        if (l.size()==200) {
          l.remove(0);
        }
      }


      float ix = ax - history.get("ax").get(history.get("ax").size()-1);
      float iy = ay - history.get("ay").get(history.get("ay").size()-1);
      float iz = az - history.get("az").get(history.get("az").size()-1);

      intx += (0-(intx-abs(ix)))* 0.1;
      inty += (0-(inty-abs(iy)))* 0.1;
      intz += (0-(intz-abs(iz)))* 0.1;

      history.get("ax").add(ax);
      history.get("ay").add(ay);
      history.get("az").add(az);
      history.get("ix").add(ix);
      history.get("iy").add(iy);
      history.get("iz").add(iz);
      history.get("yaw").add(yaw);
      history.get("pitch").add(pitch);
      history.get("roll").add(roll);
    }
  }
}