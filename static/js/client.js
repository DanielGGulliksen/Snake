var socket = io.connect('http://localhost:5000', {
    'sync disconnect on unload': true
});

//socketConnection.on('connect', function(data) { console.log(socketConnection.id + " " + data);});

socket.on('update players', function(players){
    let tableContent = "<table>";
    const row = name => `<tr><td>Id</td><td>${name}</td></tr>`;
    let length = Object.keys(players.players).length;
    for (i=0;i<length;i++){
        if (players.players[i].id != players.id)
            tableContent += row(players.players[i].id);
        else
            tableContent += row("You");
    }
    document.getElementById("players").innerHTML = tableContent+"</table>";
});

function createRoom(){
    socket.emit('create room');
}

socket.on('update rooms', function(rooms){
    let content = "<table>";
    let length = Object.keys(rooms).length;
    for (let id = 0; id < length; id++){
        let totalMembers = 0;
        for (let i = 0; i < rooms[id].members.length; i++){
            totalMembers++;
        }
        content += "<tr><td>"+rooms[id].roomName+":</td><td>"+totalMembers+"</td></tr>"; 
    }
    document.getElementById("existingRooms").innerHTML = content + "</table>";
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
    //start();
}

function start(){
    loginScreen.style.display = "none";
    gameScreen.style.display = "grid";
}