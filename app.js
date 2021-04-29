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

let rooms = {};
let players = {};

io.on('connection', function(socket){
        const thisPlayer = {"id":socket.id};
        let length = Object.keys(players).length;
        for (i=0;i<length+1;i++){
            if (players[i] == undefined)
                players[i] = thisPlayer;
        }
        io.sockets.emit('update players', {"id":socket.id, "players":players});

        socket.on('disconnect', function () {
            console.log("disconnected");
            let found = false;
            let length = Object.keys(players).length;
            
            for (idx=0;idx<length && !found ;idx++){
                console.log(idx);
                if (players[idx] != undefined){
                
                    if (players[idx].id == socket.id){
                        players[idx] = undefined;
                        console.log("players[i].id: "+players[idx]+", "+ socket.id);
                        found = true;
                    }
                }
            }
            console.log("----------------------------------");
            console.log(players);
            io.sockets.emit('update players', {"id":socket.id, "players":players});
        });

        socket.on('create room', function(){
            let length = Object.keys(rooms).length;
            for (let i = 0; i < length+1; i++){
                if (rooms[i] == undefined){
                    rooms[i] = {"roomName":"Room "+i, "members":[{"id":socket.id}]};
                }
            }
            io.sockets.emit('update rooms', rooms);
        });

        socket.on('join room', function(){

        });

});

