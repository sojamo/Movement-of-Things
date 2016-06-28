/* from https://github.com/sandeepmistry/noble/issues/77
 * code snippet used below is from this post
 * https://github.com/sandeepmistry/noble/issues/77#issuecomment-45209627
 * do keep in mind, to change
 * peripheral.on('disconnect', function()
 * to
 * peripheral.once('disconnect', function()
 * to avoid duplicate scanning.
 */
var noble = require('noble');


noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
    }
});

noble.on('scanStart', function() {
    console.log('Scanning for peripherals ...');
});


noble.on('scanStop', function() {
    console.log('Scan stopped.');

    setTimeout(function() {
        noble.startScanning();
    }, 500);
});


noble.on('discover', function(peripheral) {
    console.log('Found peripheral.');

    peripheral.connect(function(err) {
        handleConnect(err, peripheral);
    });
});


function handleConnect(err, peripheral) {
    console.log('Connected.');

    peripheral.once('disconnect', function() {
        handleDisconnect(peripheral);
    });
}


function handleDisconnect(peripheral) {
    console.log('Connection lost.');
    
    noble.stopScanning();
}
