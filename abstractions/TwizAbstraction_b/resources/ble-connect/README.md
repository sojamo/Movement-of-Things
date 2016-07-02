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
