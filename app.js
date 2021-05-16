const express = require('express');
var socket = require('socket.io');

/*
const https = require('https')
const fs = require('fs')
const path = require('path')
*/

const app = express();

// Static directory 'static' with subdirectiories css, js, and html.
app.use(express.static('static/html'))
app.use("/static/js", express.static('./static/js/'))
app.use("/static/css", express.static('./static/css/'))
app.use("/static/misc", express.static('./static/misc/'))

/*
const credentials = {
    key: fs.readFileSync(path.join(__dirname, 'static/misc', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'static/misc', 'cert.pem')),
};

const sslServer = https.createServer(credentials, app);

var server = sslServer.listen(5000, () => {
    console.log('Listening on port 5000');
});
*/

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
            if (thisPlayer.currentRoomId != undefined)
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

        socket.on('get rooms', () => {

            for (var room in rooms){
                const gameState = gameStates[room];
                if (gameState != undefined){

                    if (gameState.players != undefined){
                        if (!gameState.ongoing){
                            for (var player in gameState.players){
                                gameState.players.pop();
                            }
                            //if (gameState.players.length < 1)
                            refreshRoom(gameState);
                        }
                    }
                }
            }

            socket.emit('update rooms', rooms);
        });

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
        let singleplayerGameState = {};
        socket.on('start singleplayer', function(){
            singleplayerGameState = createSingleplayer(thisPlayer.id);
            socket.emit('update game', singleplayerGameState);
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
                for (var member in room.members){
                    room.members[member].ready = false;
                }
            }
            else
                io.sockets.emit('update rooms', rooms);
        });

        socket.on('update direction', function(direction){
            
            if (thisPlayer.currentRoomId != undefined)
                changeDirection(direction, thisPlayer.number, thisPlayer.currentRoomId);
            else
                if (singleplayerGameState.players != undefined)
                    singleplayerGameState.players[0].direction = direction;
        });
});

function createGame(room, roomId){
   
    io.to('room'+roomId).emit('start game');

    gameStates[roomId] = {};
    let gameState = gameStates[roomId];
    gameState.players = [];
    gameState.roomId = roomId;
    gameState.ongoing = true;

    for (var memberIndex in room.members){
        let x = Math.floor(Math.random() * 30) + 1;
        let y = Math.floor(Math.random() * 30) + 1;
        let snakeBody = [
            { x: x, y: y },
            { x: x, y: y+1 },
            { x: x, y: y+2 }
        ];

        /*
        let occupied = checkOccupied(gameState.players, snakeBody);
        while (occupied){
            x = Math.floor(Math.random() * 33) + 1;
            y = Math.floor(Math.random() * 33) + 1;
            snakeBody = [
                { x: x, y: y },
                { x: x, y: y+1 },
                { x: x, y: y+2 }
            ];
            occupied = checkOccupied(gameState.players, snakeBody);
        }
        */

        let direction = { x: 0, y: -1 };
        room.members[memberIndex].number = memberIndex;
        let player = {id:room.members[memberIndex].id, body:snakeBody, direction:direction, present:true, number:memberIndex, colour: randomColour(), borderColour: randomColour(), alive:true};
    
        io.to('room'+roomId).emit('set colour', {colour:player.colour, id:player.id, borderColour:player.borderColour});

        gameState.players.push(player);
    }

    gameState.food = generateFood();

    io.to('room'+roomId).emit('update game', gameState);
    countdownGame(room, roomId, 3, gameState, "");
}

function checkOccupied(players, item){
    
    players.forEach(player => {
        player.body.forEach(part => {

        });
    });
}

function generateFood(){
    return [{
        x: Math.floor(Math.random() * 33) + 1,
        y: Math.floor(Math.random() * 33) + 1
    }]
}

function createSingleplayer(thisPlayerId){
    
    let gameState = {};
    const x = Math.floor(Math.random() * 30) + 1;
    const y = Math.floor(Math.random() * 30) + 1;
    let snakeBody = [
        { x: x, y: y },
        { x: x, y: y+1 },
        { x: x, y: y+2 }
        ];
    let direction = { x: 0, y: -1 };
    let player = {id:thisPlayerId, body:snakeBody, direction:direction, present:true, alive:true, number:0, colour: randomColour(), borderColour: randomColour()};
    gameState.players = [player];
    gameState.ongoing = true;
    gameState.food = generateFood();
    countdownGame(-1, -1, 3, gameState, thisPlayerId);
    return gameState;
}

function countdownGame(room, roomId, counter, gameState, thisPlayerId){
    if (counter > 0)
        setTimeout(function() { 
        counter--;
        countdownGame(room, roomId, counter, gameState, thisPlayerId);
    }, 1000);
    else
        updateGame(gameState, roomId, 0, thisPlayerId);
}

function updateGame(gameState, roomId, counter, thisPlayerId) {
    updateSnake(gameState);
    let speed = 1000;
    if (counter < 1)
        speed = 200;
    else
        counter--;

    //if (gameState.players.length > 0){
    //console.log(gameState.ongoing);
    if (gameState.ongoing){
        if (roomId != -1){
            io.to('room'+roomId).emit('update game', gameState);
            if (gameState == gameStates[roomId]) { // If gameState variable has changed, the loop ends.
                setTimeout(function() { 
                    updateGame(gameState, roomId, counter, thisPlayerId);
                }, speed);
            }
        } else {
            io.to(thisPlayerId).emit('update game', gameState);
            setTimeout(function() { 
                updateGame(gameState, roomId, counter, thisPlayerId);
            }, speed);
        }
    }      
}

function refreshRoom(gameState){
    
//if (gameState.players.length < 1) {
        if (gameState.roomId != undefined) {
            rooms[gameState.roomId] = undefined;
        }
        io.to("room"+gameState.roomId).emit('update rooms', rooms);
        gameState = {};
//    }        
}

function changeDirection(direction, playerNumber, currentRoomId){
        let gameState = gameStates[currentRoomId];
        if (gameState.players[playerNumber] != undefined)
            gameState.players[playerNumber].direction = direction;
}

function updateSnake(gameState) {
    let remaining = false;
    gameState.players.forEach(player => {
       
        if (player.body.length > 0){
            remaining = true;                 
            const head = {x: player.body[0].x + player.direction.x, y: player.body[0].y + player.direction.y};
                if (player.alive){
                    player.body.unshift(head);
                    player.body.pop();
                    if (hitWall(player.body))
                        player.alive = false;
                }
                else {
                    player.body.shift();
                }
        }
        else {
            if (player.present){
                //player.body.pop();
                gameOver(player.id);
                io.to("room"+gameState.roomId).emit('screen refresh');
                player.present = false;
            }
        }
    });
    if (!remaining)
        gameState.ongoing = false;
}

function gameOver(playerId){
    
    for (var player in players){

        if (players[player] != undefined)
            if (players[player].id == playerId){
                players[player].currentRoomId = undefined;
                break;
            }
    }
    
    io.to(playerId).emit('game over');
}

function hitWall(snakeBody) {
    if(snakeBody[0].x < 1 || snakeBody[0].x > 35) {
        return true;
    }
    if(snakeBody[0].y < 1 || snakeBody[0].y > 35) {
        return true;
    }
    return false;
}


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