const express = require('express');
var socket = require('socket.io');

const app = express();



/* The section below is used to export the server's performance metrics
*  to the Prometheus monitioring system
*/
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics({ timeout: 30000 });

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});
// Prometheus end



// The section below is initializes the server with HTTPS.
// The server's communication is encrypted using a self signed TLS certificate.

// Necessary imports for TLS/SSL implementation.
const https = require('https')
const fs = require('fs')
const path = require('path')

// Defining routes to TLS encryption requirements.
const credentials = {
    key: fs.readFileSync(path.join(__dirname, 'static/misc', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'static/misc', 'cert.pem')),
};

// Creating SSL server.
const sslServer = https.createServer(credentials, app);

// Server is not initialized as a server implementing the SSL/TLS protocol.
var server = sslServer.listen(5000, () => {
    console.log('Listening on port 5000');
});
// TLS end



/* The following section implement GET and POST requests to an external
*  MySQL database (Postgres). This database is run in a separate docker container.
*/
// Database imports
const morgan = require('morgan');
const database = require('./database/js');

// Middleware
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Retrieves contents of MySQL 'leaders' relation from the external database.
app.get('/leaderboard', async (req, res) => {
    const leaders = await database.select().from('leaders');
    res.json(leaders.sort(compare).reverse());
});

// Retrieves contents of MySQL 'singleplayerleaders' relation from the external database.
app.get('/singleplayerleaderboard', async (req, res) => {
    const leaders = await database.select().from('singleplayerleaders');
    res.json(leaders.sort(compare).reverse());
});
// MySQL end



// This initializes the server using HTTP with no implemented TLS to encrypt
// communication. It is a comment because HTTPS is being used instead.
/*
var server = app.listen(5000, () => {
    console.log('Listening on port 5000');
});
*/



// Static directory 'static' contains subdirectiories css, js, misc, and html.
// the four lines below explicitly provide routes to every file in the project.
app.use(express.static('static/html'))
app.use("/static/js", express.static('./static/js/'))
app.use("/static/css", express.static('./static/css/'))
app.use("/static/misc", express.static('./static/misc/'))

// Starting 'socket.io'
var io = socket(server);

// The following dictionaries are universal and used to manage the systems
//  rooms, players, and game states respectively
let rooms = {};
let players = {};
let gameStates = {};


// The 'socket' variable is different for every client.
io.on('connection', function(socket){
    
    // Providing the client with its respective ID so that it can distinguish itself from other clients.
    socket.emit('id', socket.id);    
   
        // this object is used to manages all data relevant to a specific user.
        let thisPlayer = {"id":socket.id, name: names[Math.floor(Math.random() * 38)]};
        
        let length = Object.keys(players).length;
        let added = false;
        for (i=0;i<length+1 && !added;i++){
            if (players[i] == undefined){
                players[i] = thisPlayer;
                added = true;
            }
        }
        
        //Updating players overview on client side for all clients
        io.sockets.emit('update players', players);


        // The function below is used to handle a user disconnection to avoid storing users
        // that are no longer connected.
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


        // This creates a user room which is isolated from all other rooms.
        // Rooms are used to facilitate the instansiation of multiple parallel multiplayer games.
        // This method also ensures that no user is in two rooms simultaneously.
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

        // This function returns the room dictionary to the client to allow clients to
        // keep their room overview updated. It also removes rooms that were in game but
        // are now empty.
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

        // Used to update room overview for all connected clients.
        socket.on('update all rooms', () => io.sockets.emit('update', rooms));

        // Allows users to join a room. It also ensures that no user is in two rooms
        // simultaneously
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

        // Singleplayer games have a gamestate that does not belong to any
        // existing room. The 'singleplayerGameState' variable can only have
        // one member.
        let singleplayerGameState = {};
        socket.on('start singleplayer', function(){
            singleplayerGameState = createSingleplayer(thisPlayer.id);
            socket.emit('update game', singleplayerGameState);
        });

        // If a user is to start a singleplayer game or close their browser while in a
        // multiplayer room, this method removes them from their current room.
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

        // Multiplayer games only start when all members are ready. This method updates the
        // 'ready' status of a user and starts a multiplayer game if all room members are
        // ready.
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

        //This method handles direction updates for both multiplayer and singleplayer games.
        socket.on('update direction', function(direction){
            
            if (thisPlayer.currentRoomId != undefined)
                changeDirection(direction, thisPlayer.number, thisPlayer.currentRoomId);
            else
                if (singleplayerGameState.players != undefined)
                    singleplayerGameState.players[0].direction = direction;
        });

        //This method posts a new user to one of the two database relations.
        socket.on('post to leaderboard', function(leader) {
            postToLeaderboard(leader);
        });
    
});

// This method create a multiplayer game state. This game state is stored in the
// 'gameStates' dictionary defined earlier.
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

        let occupied = checkOccupied(gameState.players, {body:snakeBody});
        while (occupied){
            x = Math.floor(Math.random() * 33) + 1;
            y = Math.floor(Math.random() * 33) + 1;
            snakeBody = [
                { x: x, y: y },
                { x: x, y: y+1 },
                { x: x, y: y+2 }
            ];
            occupied = checkOccupied(gameState.players, {body:snakeBody});
        }
        
        let direction = { x: 0, y: -1 };
        room.members[memberIndex].number = memberIndex;

        //The 'object' contains all relevant data pertaining to specific player.
        let player = {id:room.members[memberIndex].id, body:snakeBody, direction:direction, present:true, number:memberIndex, colour: randomColour(), borderColour: randomColour(), alive:true, score:0};
    
        io.to('room'+roomId).emit('set colour', {colour:player.colour, id:player.id, borderColour:player.borderColour});

        gameState.players.push(player);
    }

    gameState.food = generateFood();
    
    let occupied = checkOccupied(gameState.players, gameState.food);
    while (occupied){
        gameState.food = generateFood();
        occupied = checkOccupied(gameState.players, gameState.food);
    }

    io.to('room'+roomId).emit('update game', gameState);
    countdownGame(room, roomId, 3, gameState, "");
}

// This method is used to avoid generating a game object 'on top' of another.
// It also is used to check whether a snake has 'crashed' into another snake
// or itself.
function checkOccupied(players, item){

    let occupied = false;
    const head = item.body[0];
    players.forEach(player => {
        if (item.id != undefined){
            
            let part = 0;
            if (player.id == item.id)
                part++;
            
            while (part < player.body.length){

                if (player.body[part].x == head.x && player.body[part].y == head.y){
                    occupied = true;
                }
                part++;
            }
        }
    });
    return occupied;
}

// This method returns a new 'food' object which is generated on game start
// and whenever a snake 'eats' it.
function generateFood(){
    return {
        body:[
            {
            x: Math.floor(Math.random() * 33) + 1,
            y: Math.floor(Math.random() * 33) + 1
            }
        ]
    }
}

// This method is a counterpart to the 'createGame' method previously defined. This
// method only generates a game state to be used in a singleplayer game instance.
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

    //The 'object' contains all relevant data pertaining to specific player.
    let player = {id:thisPlayerId, body:snakeBody, direction:direction, present:true, alive:true, number:0, colour: randomColour(), borderColour: randomColour(), score: 0};
    gameState.players = [player];
    gameState.ongoing = true;
    gameState.food = generateFood();
    countdownGame(-1, -1, 3, gameState, thisPlayerId);
    return gameState;
}

// This method avoid starting the game immediately after users have all set their 
// respective statuses to 'ready'. It calls the 'updateGame' function after
// a predetermined amount of time.
function countdownGame(room, roomId, counter, gameState, thisPlayerId){
    if (counter > 0)
        setTimeout(function() { 
        counter--;
        countdownGame(room, roomId, counter, gameState, thisPlayerId);
    }, 1000);
    else
        updateGame(gameState, roomId, 0, thisPlayerId);
}

// This method updates a the game state every second.
function updateGame(gameState, roomId, counter, thisPlayerId) {
    updateSnake(gameState);
    let speed = 1000;
    if (counter < 1)
        speed = 200;
    else
        counter--;

    //if (gameState.players.length > 0){
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

// This method is used to remove empty formerly 'in game' rooms for all clients.
function refreshRoom(gameState){
    
    if (gameState.roomId != undefined) {
        rooms[gameState.roomId] = undefined;
    }
    io.to("room"+gameState.roomId).emit('update rooms', rooms);
    gameState = {};        
}

// This method is used to update the direction of a specific player.
function changeDirection(direction, playerNumber, currentRoomId){
        let gameState = gameStates[currentRoomId];
        if (gameState.players[playerNumber] != undefined)
            gameState.players[playerNumber].direction = direction;
}

// This method manages the 'movement' of a snake, the 'growth' of a snake and whether or not
// the player has lost. 
function updateSnake(gameState) {
    let remaining = false;
    gameState.players.forEach(player => {
       
        if (player.body.length > 0){
            remaining = true;                 
            const head = {x: player.body[0].x + player.direction.x, y: player.body[0].y + player.direction.y};
                if (player.alive){
                    
                    player.body.unshift(head);
                    
                    if(head.x == gameState.food.body[0].x && head.y == gameState.food.body[0].y){
                        gameState.food = generateFood();
                        player.score += 100; 
                    }
                    else
                        player.body.pop();

                    let occupied = checkOccupied(gameState.players, player);
                    
                    if (hitWall(player.body) || occupied){
                        player.alive = false;
                    }
                }
                else {
                    player.body.shift();
                }
        }
        else {
            if (player.present){
                player.body.pop();
                gameOver(player.id);
                io.to("room"+gameState.roomId).emit('screen refresh');
                player.present = false;
            }
        }
    });
    if (!remaining)
        gameState.ongoing = false;
}

// This method removes a player from the room they just lost in. It also initiates
// the 'game over' screen on the client sides.
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

// This method checks whether a snake's 'head' has reached the boundaries of the
// game map.
function hitWall(snakeBody) {
    if(snakeBody[0].x < 1 || snakeBody[0].x > 35) {
        return true;
    }
    if(snakeBody[0].y < 1 || snakeBody[0].y > 35) {
        return true;
    }
    return false;
}

// This method generates a random colour.
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

// This list of names is used to distinguish users from each other.
const names = ['Brian', 'Kiera', 'Treasa', 'Tierney', 'Phelan', 'Eadan', 'Shea', 'Osheen','Murdoch','Pilib',
               'Ronan', 'Keeva', 'Daley', 'Aignes', 'Quinn', 'Nola', 'Rory', 'Conor', 'Ulick', 'Alannah',
               'Moyra', 'Fiona', 'Cathair', 'Toal', 'Catriona', 'Enya', 'Concepta', 'Aoife', 'Niamh', 'Fionntan',
               'Daly', 'Svavonne', 'Keenan', 'Teague', 'Brendanus', 'Florry', 'Talulla', 'Devnet', 'Cormac', 'Bryant'];


// Updates the two 'leaderboards' stored on the database and ensures only
// 5 users are stored in each relation.
async function postToLeaderboard(leader){
    
    if (leader.multiplayer){
        if (leader.leaderboardlength >= 5){
            
            await database('leaders').del().where({id:leader.lowestId});
            await database('leaders').insert({name:leader.name, score:leader.score});
        }
        else {
            await database('leaders').insert({name:leader.name, score:leader.score});
        }
    }
    else {
        if (leader.leaderboardlength >= 5){
            
            await database('singleplayerleaders').del().where({id:leader.lowestId});
            await database('singleplayerleaders').insert({name:leader.name, score:leader.score});
        }
        else {
            await database('singleplayerleaders').insert({name:leader.name, score:leader.score});
        }
    }
}

// This method is used by the ".sort()" method to sorth the leaderboard
// based on their respective scores.
function compare(userA, userB) {
    
    const scoreA = userA.score;
    const scoreB = userB.score;
  
    let comparison = 0;
    if (scoreA > scoreB) {
      comparison = 1;
    } else if (scoreA < scoreB) {
      comparison = -1;
    }
    return comparison;
}