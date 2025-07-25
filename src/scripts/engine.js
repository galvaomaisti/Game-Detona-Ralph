const state = {
    // View elements for the game
    // These elements are used to display the game state and interact with the user
    view:{
        squares: document.querySelectorAll(".square"),
        enemy: document.querySelector(".enemy"),
        timeLeft: document.querySelector("#time-left"),
        score: document.querySelector("#score"),
        xp: document.querySelector("#xp"),
        // The xp element is not used in the current game logic, but can be used for
        // Buttons to start and stop the game
        startButton: document.querySelector("#start-button"),
        stopButton: document.querySelector("#stop-button"),
    },
    // Initial values for the game state
    values:{
        
        gameVelocity: 1000, // milliseconds
        gameDuration: 60, // seconds
        hitPosition: 0,
        result: 0,
    },

    actions: {
        // Function to start the game
        timeId: setInterval(randomSquare, 1000), // Timer to change the enemy square position
        countDownTimerId: setInterval(startTimer, 1000), // Timer to count down the game duration
        startTimer: startTimer,
        randomSquare: randomSquare,
        addListenerHitBox: addListenerHitBox,
        initializeGame: initializeGame,
        stopGame: stopGame,
    }

    
};

function startTimer() {
    state.values.gameDuration--;
    state.view.timeLeft.textContent = state.values.gameDuration;
    if (state.values.gameDuration <= 0) {
        clearInterval(state.values.timeId);
        clearInterval(state.actions.timeId);
        clearInterval(state.actions.countDownTimerId);
        stopGame();
        alert("Game Over! Your score is: " + state.values.result);
    }
}

function playSound(audioName) {
    const audio = new Audio(`./src/sounds/${audioName}.m4a`);
    audio.volume = 0.2; // Set volume to 50%
    audio.loop = false; // Play sound once
    audio.play();
}

// Function to update the time left
function randomSquare() {
    state.view.squares.forEach((square) => {
        square.classList.remove("enemy");
    });
    // Generate a random number between 0 and 8 (inclusive)
    // This will select a random square from the 9 available squares
    let randomNumber = Math.floor(Math.random() * 9);
    let randomSquare = state.view.squares[randomNumber];
    randomSquare.classList.add("enemy");
    state.values.hitPosition = randomSquare.id;
}
// Function to move the enemy square at regular intervals
// This function will be called repeatedly to change the position of the enemy square

// Function to add event listeners to the squares
function addListenerHitBox(){
    state.view.squares.forEach((square) => {
        square.addEventListener("mousedown", () => {
         if(square.id === state.values.hitPosition){
            state.values.result++;
            square.classList.remove("enemy");
            state.view.score.textContent = state.values.result;
            state.values.hitPosition = null;
            playSound("hit");
        
         }
        
        });
    });
        
}




//  Function to initialize the game
// This function will set up the game by moving the enemy and adding event listeners
function initializeGame() {
  

  addListenerHitBox();
 
}
// Function to stop the game
function stopGame() {
    clearInterval(state.values.timeId);
    state.view.squares.forEach((square) => {
        square.classList.remove("enemy");
    });
    state.view.timeLeft.textContent = "0";
    state.view.score.textContent = "0";
    state.values.result = 0;
}
initializeGame();