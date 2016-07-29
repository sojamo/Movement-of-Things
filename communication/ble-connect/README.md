### Install

#### Linux

    apt-get install npm

It was tested with node v6.2.2 / npm v3.9.5, if you need updates, this should help:

    sudo npm cache clean -f
    sudo npm install -g n
    sudo n stable

    sudo chown -R $(whoami):$(whoami) /usr/local/n/
    VERSION=$(/usr/local/n/versions/node/*/bin/node --version | tr -d 'v')
    sudo ln -sf /usr/local/n/versions/node/$VERSION/bin/node /usr/bin/node
    sudo ln -sf /usr/local/n/versions/node/$VERSION/bin/npm /usr/bin/npm

In case of error, this should help too:

    sudo rm -rf node_modules
    apt-get install npm

#### Twiz

    cd ble-connect
    npm install


### Run

    sudo node index.js # sudo is needed to access BLE hardware

It should display the name of the available devices (something like TwizXXX).
You need to enable it in the beginning of index.js and it should work.

If you have a new Twiz firmware, move it to get data, otherwise it will seem dead.


#### Advertising

I ran into the following issues while attempting to  connect multiple  Twiz to the ble-connect app:

  - only one twiz would be recognized at certain times after starting the app
	- at certain times a second twiz would not be recognized

After scratching my head around this for a while, I conclude with the following findings:

  - all Twiz must be available when starting the app in order to be recognized and able to connect. They simply have to on when the app starts.
	- when a Twiz is disconnected or looses power after having been connected before, it will be able to reconnect (Having said that, sometimes this is not true, the Twiz will not reconnect, need to restart the app)
  - Having said all this, there are situations where things work as expected, not matter of the state of a Twiz
	- Reintroducing the restart of the scanning process after given time intervals also seemed to improve this hiccup `setTimeout(function() { scan(); }, 10000);`

#### LED

There are 3 states that a Twiz is able to communicate via the on board LED

  - constant green: booting
	- blinking green: ready to connect
	- blinking blue : connected and sending data 
	





