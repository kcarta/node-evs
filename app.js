var net = require('net');
var fs = require('fs');

console.log("<Starting>");

var server = net.createServer((socket) => {
    var parseFreq = 10;
    var streamOn = false;
    var timer;
    var log = fs.readFileSync("streamBits.txt").toString().split("\r\n\r\n");
    var logIterator = iterator(log);

    console.log("<Connection Made>");
    socket.on('data', (data) => {
        handleMessage(data.toString());
    });
    socket.on('end', () => {
        console.log("<Socket Disconnected>");
    });
    socket.on('error', (err) => {
        console.log("<Error: " + err + ">");
        clearInterval(timer);
    });

    function handleMessage(message) {
        console.log("<Received: " + message + ">");
        message = message.toUpperCase();
        if (message.includes("VER")) {
            sendAndLog("EVS300 Node Simulator");
        }
        else if (message.includes("MEASTIME")) {
            parseFreq = parseInt(message.slice(9));
            if (streamOn) {
                clearInterval(timer);
                startStream();
            }
            sendAndLog("READY.");
        }
        else if (message.includes("STOPSTREAM")) {
            if (streamOn) {
                streamOn = false;
                clearInterval(timer);
            }
            sendAndLog("READY.");
        }
        else if (message.includes("STREAM FULL, 1")) {
            streamOn = true;
            sendAndLog("READY.");
            startStream();
        }
        else if (message === "\r\n") {
            // No response to empty messages
        }
        else {
            sendAndLog("READY.");
        }
    }

    function sendAndLog(message) {
        if (socket.write(message + '\r\n')) {
            console.log("<" + message + ">");
        }
    }

    function startStream() {
        timer = setInterval(() => {
            if (streamOn) {
                sendAndLog(logIterator.next());
            }
        }, parseFreq);
    }

    function iterator(arr) {
        var nextIndex = 0;
        return {
            next: function () {
                if (!(nextIndex < arr.length)) {
                    nextIndex = 0;
                }
                return arr[nextIndex++];
            }
        }
    }
}).on('error', (err) => {
    throw err;
});

server.listen({
    port: 8000,
    host: 'localhost'
}, () => {
    console.log('Server listening on', server.address());
});
