const express = require('express');
var socket = require('socket.io');

const app = express();

// Static directory 'static' with subdirectiories css, js, and html.
app.use(express.static('static/html'))
app.use("/static/js", express.static('./static/js/'))
app.use("/static/css", express.static('./static/css/'))
app.use("/static/images", express.static('./static/images/'))

var server = app.listen(5000, () => {
    console.log('Listening on port 5000');
});

var io = socket(server);

let rooms = {};
let players = {};
let gameStates = {};

io.on('connection', function(socket){
    
    socket.emit('id', socket.id);    
   
        let thisPlayer = {"id":socket.id, name: names[Math.floor(Math.random() * 38)]};
        
        let length = Object.keys(players).length;
        let added = false;
        for (i=0;i<length+1 && !added;i++){
            if (players[i] == undefined){
                players[i] = thisPlayer;
                added = true;
            }
        }
        
        io.sockets.emit('update players', players);

        socket.on('disconnect', function () {
            let found = false;
            let length = Object.keys(players).length;
            
            if (thisPlayer.currentRoomId != undefined){
                const pid = thisPlayer.currentRoomId;
                
                let room = rooms[thisPlayer.currentRoomId];
                if (room != undefined){
                    for (let j = 0; j< room.members.length; j++){
                        if (thisPlayer.id == room.members[j].id){
                            room.members.splice(j,1);
                        }
                    }
                    if (room.members.length == 0){
                        rooms[thisPlayer.currentRoomId] = undefined;        
                    }
                    io.sockets.emit('update rooms', rooms);
                }
            }

            for (idx=0;idx<length && !found ;idx++){
                if (players[idx] != undefined){
                
                    if (players[idx].id == socket.id){
                        players[idx] = undefined;
                        found = true;
                    }
                }
            }
            if (thisPlayer.currentRoomId != undefined)    //
                if (gameStates[thisPlayer.currentRoomId] != undefined)
                    gameStates[thisPlayer.currentRoomId] = {};

            io.sockets.emit('update players', players);
        });

        socket.on('create room', function(){

            let length = Object.keys(rooms).length;
            let stopped = false;

            for (let i = 0; i < length+1; i++){
                if (rooms[i] == undefined){
                    let userFound = false;
                    if (thisPlayer.currentRoomId != undefined){
                        let room = rooms[thisPlayer.currentRoomId];
                        if (room != undefined){
                            if (room.members.length < 2) {
                                stopped = true;
                            }
                            if (!stopped) {
                                for (let j = 0; j< room.members.length && !userFound; j++){
                                    if (thisPlayer.id == room.members[j].id){
                                        room.members.splice(j,1);
                                        socket.leave('room'+thisPlayer.currentRoomId);
                                        userFound = true;
                                    }
                                }
                            }
                        } else console.log("room"+ thisPlayer.currentRoomId+" undefined");
                        
                        if (userFound){
                            thisPlayer.currentRoomId = i;
                            socket.join('room'+i);
                            gameStates[i] = [];
                            rooms[i] = {"roomName":"Room "+ i , "members":[thisPlayer]};
                        }
                    }
                    else {
                        if (!stopped){
                        thisPlayer.currentRoomId = i;
                        socket.join('room'+i);
                        gameStates[i] = [];
                        rooms[i] = {"roomName":"Room "+ i , "members":[thisPlayer]};
                        }
                    }
                } 
            }
            io.sockets.emit('update rooms', rooms);
        });

        socket.on('get rooms', () => socket.emit('update rooms', rooms));

        socket.on('update all rooms', () => io.sockets.emit('update', rooms));

        socket.on('join room', function(data){
            let found = false;
            let room = rooms[data.roomId];            
            if (room != undefined){
                if (room.members != undefined){
                    let userFound = false;
                    if (thisPlayer.currentRoomId != undefined){
                        let room = rooms[thisPlayer.currentRoomId];
                        
                        if (room != undefined){
                            for (let j = 0; j< room.members.length && !userFound; j++){
                                if (thisPlayer.id == room.members[j].id){
                                    room.members.splice(j,1);
                                    socket.leave('room'+thisPlayer.currentRoomId);
                                    userFound = true;
                                }
                            }
                            
                            if (thisPlayer.currentRoomId != data.roomId)   
                                if (room.members.length == 0) {
                                    rooms[thisPlayer.currentRoomId] = undefined;
                                }
                        }
                        else console.log("room with id " + thisPlayer.currentRoomId+" is undefined.");
                    }
                    else userFound = true;
                    
                    if (userFound){

                        for (let i=0; i < room.members.length && !found;i++){
                            if (room.members[i] != undefined){
                                if (room.members[i].id == thisPlayer.id)
                                    found = true;
                            }
                        }
                        if (!found){
                            thisPlayer.currentRoomId = data.roomId;
                            socket.join('room'+data.roomId);
                            rooms[data.roomId].members.push(thisPlayer);
                            io.sockets.emit('update rooms', rooms);
                        }
                        else
                            console.log("user found");
                    }
                }
                else
                    console.log("members undefined");
            }
            else
                console.log("room undefined");
        });

        socket.on('leave multiplayer', function(){
            const pid = thisPlayer.currentRoomId;
            if (pid != undefined){
                let room = rooms[thisPlayer.currentRoomId];
                if (room != undefined){
                    for (let j = 0; j< room.members.length; j++){
                        if (thisPlayer.id == room.members[j].id){
                            socket.leave('room'+thisPlayer.currentRoomId);
                            room.members.splice(j,1);
                        }
                    }
                    if (room.members.length == 0){
                        rooms[thisPlayer.currentRoomId] = undefined;
                    }
                    io.sockets.emit('update rooms', rooms);
                    if (gameStates[thisPlayer.currentRoomId] != undefined)
                        gameStates[thisPlayer.currentRoomId] = {};
                }
            }
        });

        socket.on('set ready', function(){
            thisPlayer.ready = true;
            
            let room = rooms[thisPlayer.currentRoomId];
            let allReady = true;
            for (let i = 0; i < room.members.length; i++){
                if (room.members[i].ready != undefined){
                    if (!room.members[i].ready)
                        allReady = false;
                }
                else
                    allReady = false;
            }
            if (allReady){
                room.inGame = true;
                io.sockets.emit('update rooms', rooms);
                createGame(room, thisPlayer.currentRoomId);
            }
            else
                io.sockets.emit('update rooms', rooms);
        });

        socket.on('update direction', function(direction){
            changeDirection(direction, thisPlayer.number, thisPlayer.currentRoomId);
        });
});

function createGame(room, roomId){
   
    io.to('room'+roomId).emit('start game');

    gameStates[roomId] = [];
    let gameState = gameStates[roomId];
    for (var memberIndex in room.members){
        const x = Math.floor(Math.random() * 35);
        const y = Math.floor(Math.random() * 35);
        let snakeBody = [
            { x: x, y: y },
            { x: x, y: y+1 },
            { x: x, y: y+2 }
            ];
        let direction = { x: 0, y: -1 };
        room.members[memberIndex].number = memberIndex;
        let player = {id:room.members[memberIndex].id, body:snakeBody, direction:direction, number:memberIndex, colour: randomColour()};
        io.to('room'+roomId).emit('set colour', {colour:player.colour, id:player.id});
        //let player = {body:snakeBody, direction};
        gameState.push(player);
        //gameState[playerNumber] = player;
    }
    io.to('room'+roomId).emit('update game', gameState);
    countdownGame(room, roomId, 5, gameState);
    //updateGame(gameState, roomId, 6);
}

function countdownGame(room, roomId, counter, gameState){
    
    if (counter > 0)
        setTimeout(function() { 
        counter--;
        countdownGame(room, roomId, counter, gameState);
    }, 1000);
    else
        updateGame(gameState, roomId, 6);
}

function updateGame(gameState, roomId, counter) {
    updateSnake(gameState);
    let speed = 1000;
    if (counter < 1)
        speed = 200;
    else
        counter--;

    io.to('room'+roomId).emit('update game', gameState);
    if (gameState == gameStates[roomId]) { // If gameState variable has changed, the loop ends.
        setTimeout(function() { 
            updateGame(gameState, roomId, counter);
        }, speed);
    }
}

function changeDirection(direction, playerNumber, currentRoomId){
    let gameState = gameStates[currentRoomId];
    gameState[playerNumber].direction = direction;
}

function updateSnake(gameState) {
    
    gameState.forEach(player => {
        const head = {x: player.body[0].x + player.direction.x, y: player.body[0].y + player.direction.y};
        player.body.unshift(head);
        player.body.pop();
    });

}

/*
function randomColour() {
    let hex = '0123456789ABCDEF';
    var colour = '#';
    for (var i = 0; i < 6; i++) {
      colour += hex[Math.floor(Math.random() * 16)];
    }
    return colour;
  }
*/
  
function randomColour() {
    var colour = values => `rgb(${values})`;
   
    let rgb = [];
    
    const min = Math.ceil(200);
    const max = Math.floor(256);

    for (var i = 0; i < 3; i++) {
        if (i != 2)
            rgb[i] = Math.floor(Math.random() * 256);
        else
            rgb[i] = Math.floor(Math.random() * (max - min) + min);
    }
    return colour(rgb[0]+","+rgb[1]+","+rgb[2]);
}

const names = ['Brian', 'Kiera', 'Treasa', 'Tierney', 'Phelan', 'Eadan', 'Shea', 'Osheen','Murdoch','Pilib',
               'Ronan', 'Keeva', 'Daley', 'Aignes', 'Quinn', 'Nola', 'Rory', 'Conor', 'Ulick', 'Alannah',
               'Moyra', 'Fiona', 'Cathair', 'Toal', 'Catriona', 'Enya', 'Concepta', 'Aoife', 'Niamh', 'Fionntan',
               'Daly', 'Svavonne', 'Keenan', 'Teague', 'Brendanus', 'Florry', 'Talulla', 'Devnet', 'Cormac', 'Bryant'];