import sys
import time
from linux_ble import LinuxBle
import gc
import OSC
import math
from sets import Set


class BLEcommand():

    osc = None
    debug = False
    addresses = Set()
    connection = False

    def build(self):
        self.addresses = Set()
        self.init_ble()
        time.sleep(1)
        self.set_scanning(True)
        self.init_osc()
    
    def init_ble(self):
        print "init ble, ready to listen for twiz devices ... "
        self.scanner = LinuxBle(callback=self.update_device)
        
        
    def set_scanning(self, value):
        if value:
            print "started scanning ble devices."
            self.scanner.start()
        else:
            self.scanner.stop()
    
    def run(self):
        n = time.time() # start time
        while True:
            duration = str(round(time.time()-n,2))
            connections = str(len(self.addresses))
            connected = "yes" if self.connection==True else "no"
            sys.stdout.write("running " + duration + "\t|\tdevices:" + connections  + "\t|\tosc-client? " + connected +" "+str(self.send_address)+ "\r")
            sys.stdout.flush()
            self.addresses.clear()
            time.sleep(0.2)
            
    def update_device(self, data):
        self.addresses.add(data.get('address',''))
        
        if self.debug:
            print data.get('sensor','')
            print data.get('address','')

        if self.osc is None:
            if self.debug:
                print 'no osc'
                connection = False
        else:
            msg = OSC.OSCMessage()
            msg.setAddress('/twiz')
            msg.append(data.get('address',''))
            #msg.append(data.get('sensor',''))
            values =  data.get('sensor','')
            if type(values) is tuple:
                
                n = math.pow(2, 16);
                rad = 0.0174533;
                ax = (values[0] * 4.0)/n;
                ay = (values[1] * 4.0)/n;
                az = (values[2] * 4.0)/n;
                ex = rad * (values[3] * 360.0)/n;
                ey = rad * (values[4] * 360.0)/n;
                ez = rad * (values[5] * 360.0)/n;
                
                msg.append(ax)
                msg.append(ay)
                msg.append(az)
                msg.append(ex)
                msg.append(ey)
                msg.append(ez)


                if len(msg.tags())==7:
                    try:
                        self.osc.send(msg)
                        self.connection = True
                    except:
                        if self.debug:
                            print 'lost connection'
                            self.connection = False
                                
                                
    def init_osc(self):
        self.send_address = '192.168.1.194',11000
        self.osc = OSC.OSCClient()
        self.osc.connect(self.send_address)


if __name__ == '__main__':
    app = BLEcommand()
    app.build()
    app.run()



