// This method displays all game snakes according to the coordinates from 
// the provided 'gameState' object. It also clears all displayed game
// snakes from the previous game state from the screen.
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

// This first removes the previous 'food' object from the client's screen, and then 
// displays a 'food' object on the clients screen. It also
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
    
// The direction object is to be altered according to a user's provided inputs.
let direction = { x: 0, y: -1 };

document.addEventListener('keydown', changeDirection);

// This method handles the provided users keyboard input and changes the
// 'direction' object accordingly.
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
    if (gameOngoing)
        socket.emit('update direction', direction);
}
