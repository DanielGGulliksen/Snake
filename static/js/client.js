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
    multiButton.className = 'loginButton';
    multiButton.disabled = false;
}

function joinRoom(roomId){
    socket.emit('join room', {"roomId": roomId});
    multiButton.className = 'loginButton';
    multiButton.disabled = false;
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
//const inGameScreen = document.getElementById('ingame');

const gameScreen = document.getElementById('game');

const pregameScreen = document.getElementById("pregame");

//inGameScreen.style.display = "none";
pregameScreen.style.display = "none";
gameScreen.style.display = "none";


const singleButton = document.getElementById("single");
const multiButton = document.getElementById("multi");

singleButton.addEventListener('click', newSingleplayer);
multiButton.addEventListener('click', newMultiplayer);

let multiplayer = false;

function newSingleplayer(){
    socket.emit('leave multiplayer');
    loginScreen.style.display = "none";
    pregameScreen.style.display = "block";
    gameScreen.style.display = "grid";
    drawSnake();
    countdownDisplay.innerText = 5;
    countdown(5);
}

const colourBlock = document.createElement('button');
colourBlock.float = "left";

socket.on('set colour', (player) => {

    if (player.id == clientId) {
        colourBlock.style.backgroundColor = player.colour;
        colourBlock.style.border = "2px solid black";
        colourBlock.style.color = player.colour;
    }
});

socket.on('start game', () => {
    loginScreen.style.display = "none";
    pregameScreen.style.display = "block";
    let info = document.getElementById("info");
    const label = document.createElement('label');
    label.innerHTML = "Your colour is: ";
    label.float = "right";
    colourBlock.innerText = "llllllllllllllllllllllll";
    info.appendChild(label);
    info.appendChild(colourBlock);
    gameScreen.style.display = "grid";
    countdownDisplay.innerText = 5;
    countdown(5);
    //start();
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
        //pregameScreen.style.display = "none";
        pregameScreen.style.display = "none";
        if (!multiplayer)
            window.requestAnimationFrame(main);
    }
}

const roomsList = document.getElementById("rooms");


function newMultiplayer(){
    roomsList.style.display = "block";
    multiButton.removeEventListener('click', newMultiplayer);
    multiButton.innerText = "Start";
    multiButton.disabled = true;
    multiButton.className = 'greyedOut';
    multiButton.addEventListener('click', setReady);
    socket.emit('get rooms');
}

//function start(){
    //loginScreen.style.display = "none";
    //inGameScreen.style.display = "block";
    //pregameScreen.style.display = "none";
    //gameScreen.style.display = "grid";
//}

function setReady(){
    socket.emit('set ready');
    document.getElementById('feedback').innerText = '(Your are ready)';
    socket.emit('update all rooms');
}

socket.on('update game', (gameState) => {    
    draw(gameState);
    multiplayer = true;
});