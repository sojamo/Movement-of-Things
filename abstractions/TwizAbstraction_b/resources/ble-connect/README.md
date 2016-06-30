### Install

#### Linux

    apt-get install npm

If you can only get an old node, this should help:

    sudo npm cache clean -f
    sudo npm install -g n
    sudo n stable

    sudo chown -R $(whoami):$(whoami) /usr/local/n/
    VERSION=$(/usr/local/n/versions/node/*/bin/node --version | tr -d 'v')
    sudo ln -sf /usr/local/n/versions/node/$VERSION/bin/node /usr/bin/node
    sudo ln -sf /usr/local/n/versions/node/$VERSION/bin/npm /usr/bin/npm


#### Twiz

    cd ble-connect
    npm install


### Run

    [sudo] node index.js # sudo is needed with linux

