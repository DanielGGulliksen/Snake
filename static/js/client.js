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

const snake_speed = 2;

const snakeBody = [
    { x: 11, y: 11 },
    { x: 12, y: 11 },
    { x: 13, y: 11 }
    ]

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

let lastRenderTime = 0
 

function main(currentTime) {
    window.requestAnimationFrame(main)
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000
    if(secondsSinceLastRender < 1 / snake_speed) return

    console.log('draw snake')
    lastRenderTime = currentTime

    updateSnake()
    drawSnake()
}
window.requestAnimationFrame(main)

const gb = document.getElementById('game')

function drawSnake(gb) {
    snakeBody.forEach(segment => {
        const snakeElement = document.createElement('div')
        snakeElement.style.gridRowStart = segment.x
        snakeElement.style.gridColumnStart = segment.y
        snakeElement.classList.add('snake')
        //gb.appendChild(snakeElement) 
    })
}



function updateSnake() {
    console.log('update snake')
}

let direction = { x: 0, y: 0 }
let previousDirection = { x: 0, y: 0 }

document.addEventListener('keydown', keydown);

function keydown(e) {
    switch(e.keyCode) {
        case "keyUp" :
            if (previousDirection.y !== 0) break
            direction = { x: 0, y: -1 }
        break;
        case "keyDown" :
            if (previousDirection.y !== 0) break
            direction = { x: 0, y: 1 }
        break;
        case "keyRight" :
            if (previousDirection.x !== 0) break
            direction = { x: 1, y: 0 }
        break;
        case "keyLeft" :
            if (previousDirection.x !== 0) break
            direction = { x: -1, y: 0 }
        break;
    }
}

function getDirection() {
    return direction;
}
