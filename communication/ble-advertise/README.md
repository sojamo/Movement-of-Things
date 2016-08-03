
# Twiz-Command

Some notes on how to install python ble to get the command line program for the
twiz up and running. The following source files need to be in place:

	* index.py linux_ble.py bt_consts.py


## Modules required 

The following modules need to be installed via apt-get

	* bluez libbluetooth-dev python-dev

The following python modules are required to be installed via pip

	* pybluez


## Run the command

	sudo python index.py

## OSC communication

the host IP and port are (as of now) hard coded, make changes accordingly. 



