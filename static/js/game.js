const snake_speed = 1;

let lastRenderTime = 0;

function main(currentTime) {
    window.requestAnimationFrame(main);
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if(secondsSinceLastRender < 1 / snake_speed) return;

    lastRenderTime = currentTime;

    updateSnake()
    drawSnake();
}
window.requestAnimationFrame(main);

const snakeBody = [
    { x: 11, y: 11 },
    { x: 12, y: 11 },
    { x: 13, y: 11 }
    ];


let segments = 0; 

function drawSnake() {
    for(i = 0; i < segments; i++) {
        const seg = document.getElementById("" + i);
        console.log(seg);
        if(seg != null) {
        document.getElementById("" + i).remove(); 
        segments--;
        }
    }
    snakeBody.forEach(segment => {
        const snakeElement = document.createElement('div');
        snakeElement.id = segments;
        segments++; 
        snakeElement.style.gridRowStart = segment.x;
        snakeElement.style.gridColumnStart = segment.y;
        snakeElement.classList.add('snake'); // <div class="snake"></div>
        gameScreen.appendChild(snakeElement);
        
    });
}

function updateSnake() {
    const head = {x: snakeBody[0].x + 1, y: snakeBody[0].y};
    snakeBody.unshift(head);
    snakeBody.pop(); 
    
    //console.log('update snake');
}



document.addEventListener('keydown', snakeDirection());

function snakeDirection(e) {
    let direction = { x: 0, y: 0 }
    

    if (e.keyCode === 37) { //previousDirection.x !== 0
        direction = { x: -1, y: 0 }
    }
    if (e.keyCode === 38 ) { //&& previousDirection.y !== 0
        direction = { x: 0, y: -1 }
    }
    if (e.keyCode === 39 ) { //&& previousDirection.x !== 0
        direction = { x: 1, y: 0 }
    }
    if (e.keyCode === 40 ) { //&& previousDirection.y !== 0
        direction = { x: 0, y: 1 }
    }



    /*
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
    } */
}
 
function getDirection() {
    return direction;
}