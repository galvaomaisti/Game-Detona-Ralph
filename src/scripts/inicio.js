 

const video = document.getElementById('video');
const startButton = document.getElementById('start-button');

video.addEventListener('ended', () => {
  startButton.style.display = 'block';
});

setTimeout(() => {
  document.querySelector('.capa img').style.display = 'none';
  video.style.display = 'block';
  video.play();
}, 2000); // tempo em milissegundos para exibir a imagem antes do vídeo

startButton.addEventListener('click', () => {
  window.location.href = 'index.html'; // redireciona para a página do jogo
});

    values: {
        timeLeft: 30,
        score: 0,
        lives: 3,
        hitPosition: null,
        result: 0
    },
    // View elements
    view: {
        squares: document.querySelectorAll(".square"),
        enemy: document.querySelector(".enemy"),
        timeLeft: document.querySelector("#time-left"),
        score: document.querySelector("#score"),
        xp: document.querySelector("#xp"),
        startButton: document.querySelector("#start-button"),       
        stopButton: document.querySelector("#stop-button"),
    },
    // Actions to manipulate the game state
    actions: {