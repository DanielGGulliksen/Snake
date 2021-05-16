function drawSnakes(gameState) {

        let segment = 0;
        gameState.players.forEach(player => {

                let shownHead = false;
                const snakeBody = player.body;
                snakeBody.forEach(part => {
                    let oldSegment = document.getElementById(""+segment);
                    if (oldSegment != null)
                        oldSegment.remove();
            
                    const snakeElement = document.createElement('div');
                    
                    if (player.alive) {
                        if (!shownHead){
                            snakeElement.innerText = "^^";
                            shownHead = true;
                        }
                    }
                    else
                        snakeElement.innerText = "!";

                    snakeElement.id = segment;
                    segment++;
                    snakeElement.style.gridColumnStart = part.x;
                    snakeElement.style.gridRowStart = part.y;
                    snakeElement.style.backgroundColor = player.colour;
                    snakeElement.style.border = "2px solid";
                    snakeElement.style.borderColor = player.borderColour;
                    snakeElement.classList.add('snake');
                    gameScreen.appendChild(snakeElement);
                });
            
    });
}

function drawFood(food) {
    let oldFoodElement = document.getElementById('food');
    if(oldFoodElement != null)
        oldFoodElement.remove();

    const foodElement = document.createElement('div');
    foodElement.id = "food";
    foodElement.style.gridColumnStart = food.x;
    foodElement.style.gridRowStart = food.y;
    foodElement.classList.add('food');
    gameScreen.appendChild(foodElement);
}
    
/*
function eatFood() {
    head = {x: snakeBody[0].x + direction.x, y: snakeBody[0].y + direction.y};
    if(snakeBody[0].x == food.y && snakeBody[0].y == food.x) {
        console.log(food.x + ", " + food.y);
        food.x = Math.floor(Math.random() * 33) + 1;
        food.y = Math.floor(Math.random() * 33) + 1; 
        drawFood();
        snakeBody.unshift(head);
        
    } 
} 
*/


let direction = { x: 0, y: -1 };

document.addEventListener('keydown', changeDirection);

function changeDirection(key) {
    const goingUp = direction.y == -1;
    const goingRight = direction.x == 1; 
    const goingDown = direction.y == 1;
    const goingLeft = direction.x == -1; 

    if (key.keyCode === 37 && !goingRight) { //left
        direction = { x: -1, y: 0 };
    }
    if (key.keyCode === 38 && !goingDown) { // up
        direction = { x: 0, y: -1 };
    }
    if (key.keyCode === 39 && !goingLeft) { // right
        direction = { x: 1, y: 0 };
    }
    if (key.keyCode === 40 && !goingUp) { // down
        direction = { x: 0, y: 1 };
    }
    socket.emit('update direction', direction);
}