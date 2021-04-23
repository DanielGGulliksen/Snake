var socket = io.connect('http://localhost:5000');

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
    gameScreen.style.display = "block";
}