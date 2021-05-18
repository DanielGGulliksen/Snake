//var socket = io.connect('https://localhost:5000', {
var socket = io.connect('http://localhost:5000', {
    'sync disconnect on unload': true
});

let clientId = null;
socket.on('id', (id) => clientId = id);

socket.on('update players', function(players){
    //let tableContent = "<table>";
    let tableContent = "";
    
    const cell = name => `<td class='playerTd'>${name}</td>`;

    let length = Object.keys(players).length;
    let columnCounter = 0;

    for (let i=0;i<length;i++){
        if (columnCounter == 0)
            tableContent += "<tr>";
        
        if (columnCounter <5) {
            if (players[i] != undefined){
                if (players[i].id != clientId)
                    tableContent += cell(players[i].name);
                else
                    tableContent += cell(players[i].name+" (You)");  
        }
        columnCounter++;   
        }
        if (columnCounter > 4)
            columnCounter = 0;
    }
    document.getElementById("players").innerHTML = tableContent;
});

function createRoom(){
    socket.emit('create room');
    startButton.className = 'loginButton';
    startButton.disabled = false;
}

function joinRoom(roomId){
    socket.emit('join room', {"roomId": roomId});
    startButton.className = 'loginButton';
    startButton.disabled = false;
}

function showReady(username, ready){
    const p = un => `<p>${un}</p>`;
    const readyp = readyun => `<p class='readyp'>${readyun}</p>`;

    if (!ready){
        return p(username);
    }
    else
        return readyp(username);
}

function updateRooms(rooms){
    
    let content = "<table>";

    for (var id in rooms){
        if (rooms[id] != undefined){
            if (rooms[id].inGame == undefined){
                let totalMembers = rooms[id].members.length;
                let members = "";
                for (let i = 0; i < totalMembers; i++){
                    const member = rooms[id].members[i];
                    let username = member.name;
                    let ready = false;
                    if (member.ready != undefined){
                        if (member.ready){
                            ready = true;
                            username = username.bold();
                        }
                    }

                    if (i < totalMembers-1) {
                        if (member.id != clientId)
                            members += showReady(username + ", ", ready);
                        else
                            members += showReady(username + " (you), ", ready);
                    }
                    else {
                        if (member.id != clientId)
                            members += showReady(username, ready);
                        else
                            members += showReady(username + " (you)", ready);
                    }
                }
                content += "<tr><td><button onclick='joinRoom("+id+");'>Join</button></td><th>"+rooms[id].roomName+":</th><td>("+totalMembers+"x):</td><td>"+members+"</td></tr>";
            }
            else content += "<tr><th>"+rooms[id].roomName+":</th><td>(In game)</td></tr>";
        }
    }
    
    document.getElementById("existingRooms").innerHTML = content + "</table>";
}

socket.on('update rooms', function(rooms){
   updateRooms(rooms);
});

const loginScreen = document.getElementById("login");

const gameScreen = document.getElementById('game');

const pregameScreen = document.getElementById("pregame");
const postgameScreen = document.getElementById('postgame');

postgameScreen.style.display = "none";
pregameScreen.style.display = "none";
gameScreen.style.display = "none";

const singleButton = document.getElementById("single");
const multiButton = document.getElementById("multi");
const startButton = document.getElementById("start");
startButton.style.display = "none";

singleButton.addEventListener('click', newSingleplayer);
multiButton.addEventListener('click', newMultiplayer);
startButton.addEventListener('click', setReady);

function newSingleplayer(){
    socket.emit('start singleplayer')
    socket.emit('leave multiplayer');
    loginScreen.style.display = "none";
    pregameScreen.style.display = "block";
    gameScreen.style.display = "grid";
    countdownDisplay.innerText = 3;
    countdown(3);
}

const colourBlock = document.createElement('button');
colourBlock.float = "left";

socket.on('set colour', (player) => {

    if (player.id == clientId) {
        colourBlock.style.backgroundColor = player.colour;
        colourBlock.style.border = "2px solid";
        colourBlock.style.borderColor = player.borderColour;
        colourBlock.style.color = player.colour;
    }
});

const label = document.createElement('label');

socket.on('start game', () => {
    loginScreen.style.display = "none";
    pregameScreen.style.display = "block";
    let info = document.getElementById("info");
    label.id = "yourColour";
    label.innerHTML = "Your colour is: ";
    label.float = "right";
    colourBlock.innerText = "llllllllllllllllllllllll";
    info.appendChild(label);
    info.appendChild(colourBlock);
    gameScreen.style.display = "grid";
    countdownDisplay.innerText = 3;
    countdown(3);
});

const countdownDisplay = document.getElementById("timer");

function countdown(counter){
    if (counter > 0)
        setTimeout(function() { 
            counter--;
            countdownDisplay.innerText = counter;
            countdown(counter);
        }, 1000);
    else {
        countdownDisplay.innerText = "";
        pregameScreen.style.display = "none";
    }
}

const roomsList = document.getElementById("rooms");

function newMultiplayer(){
    roomsList.style.display = "block";
    multiButton.style.display = "none";
    startButton.disabled = true;
    startButton.style.display = "inline-block";
    socket.emit('get rooms');
}

const feedback = document.getElementById('feedback');

function setReady(){
    socket.emit('set ready');
    feedback.innerText = '(Your are ready)';
    socket.emit('update all rooms');
}

socket.on('update game', (gameState) => {    
    drawSnakes(gameState);
    drawFood(gameState.food.body[0]);
    showScore(gameState);
});

function showScore(gameState) {
    gameState.players.forEach(player => {
        if(player.id == clientId) {
            document.getElementById('score').innerText = "Score: " + player.score;
            return; 
        }
    });
}

socket.on('game over', () => {
    postgameScreen.style.display = "inline-block";
});

function toHome(){
    socket.emit('leave multiplayer');
    postgameScreen.style.display = "none";
    gameScreen.style.display = "none";
    loginScreen.style.display = "block";
    feedback.innerText = "";
    socket.emit('get rooms');

    startButton.style.display = "none";
    startButton.disabled = true;
    startButton.className = "greyedOut";

    multiButton.style.display = "inline-block";
}

socket.on('screen refresh', () => {
    
    gameScreen.innerHTML = "";
    
});