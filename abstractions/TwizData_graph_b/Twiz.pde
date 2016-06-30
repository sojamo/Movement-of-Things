class Twiz {

  LinkedHashMap<String, List<Float>> history = new LinkedHashMap();
  String id;

  Twiz(String theId) {
    id = theId;
    history.put("ax", new ArrayList<Float>());
    history.put("ay", new ArrayList<Float>());
    history.put("az", new ArrayList<Float>());
    history.put("yaw", new ArrayList<Float>());
    history.put("pitch", new ArrayList<Float>());
    history.put("roll", new ArrayList<Float>());
  }

  void add(OscMessage m) {
    if (m.getAddress().startsWith("/twiz")) {
      
      float ax = m.getFloatAt(1);
      float ay = m.getFloatAt(2);
      float az = m.getFloatAt(3);
      float yaw = m.getFloatAt(4);
      float pitch = m.getFloatAt(5);
      float roll = m.getFloatAt(6);
      for(List<Float> l:history.values()) {
        if(l.size()==200) {
          l.remove(0);
        }
      }
      history.get("ax").add(ax);
      history.get("ay").add(ay);
      history.get("az").add(az);
      history.get("yaw").add(yaw);
      history.get("pitch").add(pitch);
      history.get("roll").add(roll);
      
    }
  }
}