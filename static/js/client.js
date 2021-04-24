var socket = io.connect('http://localhost:5000', {
    'sync disconnect on unload': true
});

//socketConnection.on('connect', function(data) { console.log(socketConnection.id + " " + data);});
socket.emit('online');

let clientId = null;

socket.on('id', function(data){
    clientId = data.id;
});

socket.on('otherLogon', function(data){
    document.getElementById("players").innerText = data.total;
});

socket.on('user disconnected', function(data){
    document.getElementById("players").innerText = data.total;
})

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

function newMultiplayer(){
    start();
}

function start(){
    loginScreen.style.display = "none";
    gameScreen.style.display = "grid";
}