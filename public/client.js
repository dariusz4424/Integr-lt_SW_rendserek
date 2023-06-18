const socket = io();

const statusElement = document.querySelector('#status');
const winnerElement = document.querySelector('#winner');
const player1Coordinates = document.querySelector('#player1-coordinates');
const player2Coordinates = document.querySelector('#player2-coordinates');
const ballCoordinates = document.querySelector('#ball-coordinates');

const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');

let players = {};
let ball = null;

function update() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const id in players) {
    const player = players[id];
    context.fillStyle = player.color;
    context.beginPath();
    context.arc(player.x, player.y, 20, 0, 2 * Math.PI);
    context.fill();
  }

  if (ball) {
    context.fillStyle = 'green';
    context.beginPath();
    context.arc(ball.x, ball.y, 10, 0, 2 * Math.PI);
    context.fill();
  }

  player1Coordinates.textContent = players[Object.keys(players)[0]] ? `Player 1: (${players[Object.keys(players)[0]].x.toFixed(2)}, ${players[Object.keys(players)[0]].y.toFixed(2)})` : '';
  player2Coordinates.textContent = players[Object.keys(players)[1]] ? `Player 2: (${players[Object.keys(players)[1]].x.toFixed(2)}, ${players[Object.keys(players)[1]].y.toFixed(2)})` : '';
  ballCoordinates.textContent = ball ? `Ball: (${ball.x.toFixed(2)}, ${ball.y.toFixed(2)})` : '';
}

socket.on('players', (data) => {
  players = data;
});

socket.on('ball', (data) => {
  ball = data;
});

socket.on('winner', (data) => {
  winnerElement.textContent = data;
});

socket.on('clientCount', (count) => {
  if (count < 2) {
    statusElement.textContent = 'Waiting for clients to join';
  } else {
    statusElement.textContent = '';
  }
});

socket.on('serverFull', () => {
  statusElement.textContent = 'Disconnected! Clients have already joined.';
});

setInterval(update, 1000 / 60);  // update 60 times per second

//Random velocity from client to server
setInterval(()=>{
  socket.emit('xseb', Math.random()*10-5);
  socket.emit('yseb', Math.random()*10-5);
}, 1000, 60);

document.addEventListener('keydown', (event) => {
  let direction = '';
  if (event.key === 'ArrowUp') {
    direction = 'up';
  } else if (event.key === 'ArrowDown') {
    direction = 'down';
  } else if (event.key === 'ArrowLeft') {
    direction = 'left';
  } else if (event.key === 'ArrowRight') {
    direction = 'right';
  }
  socket.emit('move', direction);
});
