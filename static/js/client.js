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

socket.on('start game', () => {
    start();
});

const loginScreen = document.getElementById("login");
const gameScreen = document.getElementById('game');

gameScreen.style.display = "none";

const singleButton = document.getElementById("single");
const multiButton = document.getElementById("multi");

singleButton.addEventListener('click', newSingleplayer);
multiButton.addEventListener('click', newMultiplayer);

function newSingleplayer(){
    socket.emit('leave multiplayer');
    start();
    window.requestAnimationFrame(main);
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

function start(){
    loginScreen.style.display = "none";
    gameScreen.style.display = "grid";
}

function setReady(){
    socket.emit('set ready');
    document.getElementById('feedback').innerText = '(Your are ready)';
    socket.emit('update all rooms');
}

socket.on('update game', (gameState) => {
    draw(gameState);
});