var socket = io.connect('http://localhost:5000');

const loginScreen = document.getElementById("login");
const gameScreen = document.getElementById('game');
const snake_speed = 2;

const snakeBody = [
    { x: 11, y: 10 },
    { x: 12, y: 10 },
    { x: 13, y: 10 }
    ]

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



function drawSnake(snake) {
    snakeBody.forEach(segment => {
        const snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = segment.x
        snakeElement.style.gridColumnStart = segment.y
        snakeElement.classList.add('snake')
        snake.appendChild(snakeElement)
    })
}

function update() {
}

let direction = { x: 0, y: 0 }
let previousDirevtion = { x: 0, y: 0 }

document.addEventListener('keydown', keydown);

function keydown(e) {
    switch(e.keyCode) {
        case "keyUp" :
            if (previousDirevtion.y !== 0) break
            direction = { x: 0, y: -1 }
        break;
        case "keyDown" :
            if (previousDirevtion.y !== 0) break
            direction = { x: 0, y: 1 }
        break;
        case "keyRight" :
            if (previousDirevtion.x !== 0) break
            direction = { x: 1, y: 0 }
        break;
        case "keyLeft" :
            if (previousDirevtion.x !== 0) break
            direction = { x: -1, y: 0 }
        break;
    }
}

function getDirection() {
    return direction;
}
