const express = require('express');
var socket = require('socket.io');

const app = express();

// Static directory 'static' with subdirectiories css, js, and html.
app.use(express.static('static/html'))
app.use("/static/js", express.static('./static/js/'))
app.use("/static/css", express.static('./static/css/'))

var server = app.listen(5000, () => {
    console.log('Listening on port 5000');
});

var io = socket(server);

io.on('connection', function(socket){
    console.log("sock id:" + socket);
});