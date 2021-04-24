const snake_speed = 1;

let lastRenderTime = 0;

function main(currentTime) {
    window.requestAnimationFrame(main);
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if(secondsSinceLastRender < 1 / snake_speed) return;

    lastRenderTime = currentTime;

    //updateSnake()
    drawSnake();
}
window.requestAnimationFrame(main);

const snakeBody = [
    { x: 11, y: 11 },
    { x: 12, y: 11 },
    { x: 13, y: 11 }
    ];

function drawSnake() {
    snakeBody.forEach(segment => {
        const snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = segment.x;
        snakeElement.style.gridColumnStart = segment.y;
        snakeElement.classList.add('snake'); // <div class="snake"></div>
        gameScreen.appendChild(snakeElement);
    });
}

function updateSnake() {
    console.log('update snake');
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