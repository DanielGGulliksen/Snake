var socket = io.connect('http://localhost:5000', {
    'sync disconnect on unload': true
});

let clientId = null;
socket.on('id', (id) => clientId = id);

socket.on('update players', function(players){
    let tableContent = "<table>";
    
    //const row = content => `<tr>${content}</tr>`;
    const cell = name => `<td>${name}</td>`;

    let length = Object.keys(players).length;
    let columnCounter = 0;
    let rowContent = "";
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
    document.getElementById("players").innerHTML = tableContent+"</table>";
});

function createRoom(){
    socket.emit('create room');
}

function joinRoom(roomId){
    socket.emit('join room', {"roomId": roomId});
}

function updateRooms(rooms){
    
    let content = "<table>";
    
    for (var id in rooms){
        if (rooms[id] != undefined){
            let totalMembers = rooms[id].members.length;
            let members = "";
            for (let i = 0; i < totalMembers; i++){
                const member = rooms[id].members[i];
                if (i < totalMembers-1) {
                    if (member.id != clientId)
                        members += member.name + ", ";
                    else
                        members += member.name + " (you), ";
                }
                else {
                    if (member.id != clientId)
                        members += rooms[id].members[i].name;
                    else
                        members += member.name + " (you)";
                }
            }
            content += "<tr><td><button onclick='joinRoom("+id+");'>Join</button></td><td>"+rooms[id].roomName+":</td><td>("+totalMembers+"):</td><td>"+members+"</td></tr>";
        }
    }                                           
    document.getElementById("existingRooms").innerHTML = content + "</table>";
}

socket.on('update rooms', function(rooms){
   updateRooms(rooms);
});


const loginScreen = document.getElementById("login");
const gameScreen = document.getElementById('game');

gameScreen.style.display = "none";

const singleButton = document.getElementById("single");
const multiButton = document.getElementById("multi");

singleButton.addEventListener('click', newSingleplayer);
multiButton.addEventListener('click', newMultiplayer);

function newSingleplayer(){
    start();
}

const roomsList = document.getElementById("rooms");

function newMultiplayer(){
    roomsList.style.display = "block";
    multiButton.removeEventListener('click', newMultiplayer);
    multiButton.innerText = "Ready";
    multiButton.disabled = true;
    multiButton.className = 'greyedOut';
    //multiButton.className = 'loginButton'; reverts to old style
    multiButton.addEventListener('click', setReady);
    socket.emit('get rooms');
}

function start(){
    loginScreen.style.display = "none";
    gameScreen.style.display = "grid";
}

function setReady(){

}