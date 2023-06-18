const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = socketIo(server);

let clients = {};
let ball = null;

const canvas = { width: 800, height: 600 };
let winner = null;
let VelocityRandom = 0.5;
let VelocityDistance = 2;

function distance(x1, y1, x2, y2) {
  const a = x1 - x2;
  const b = y1 - y2;
  return Math.sqrt(a * a + b * b);
}

function updateBall() {
  if (ball) {
    for (const id in clients) {
      const player = clients[id];
      const dist = distance(player.x, player.y, ball.x, ball.y);
      if (dist <= 30) {
        const overlap = 30 - dist;
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const angle = Math.atan2(dy, dx);
        const offsetX = Math.cos(angle) * overlap;
        const offsetY = Math.sin(angle) * overlap;
        ball.x += offsetX;
        ball.y += offsetY;
      }
    }

    if(ball.y<10) ball.y = 10;
    if(ball.y>590) ball.y = 590; 

    if (ball.x - 10 <= 0) {
      winner = 'Second player has won!';
      ball = null;
    } else if (ball.x + 10 >= canvas.width) {
      winner = 'First player has won!';
      ball = null;
    } else {
      ball.x += ball.dx;
    }
  }
}

function updatePlayerAI(player, xSeb, ySeb) {
  if (player.color === 'red') {
    // First player AI logic: Move towards the ball's x position
    if (ball) {
      let dist1 = distance(ball.x, ball.y, player.x, player.y);
      player.x += xSeb * VelocityRandom + (ball.x-player.x)/dist1 * VelocityDistance;
      player.y += ySeb * VelocityRandom + (ball.y-player.y)/dist1 * VelocityDistance;
      if(player.x<20) player.x = 20;
      if(player.x>780) player.x = 780;
      if(player.y<20) player.y = 20;
      if(player.y>580) player.y = 580;      
    }
  } else {
    // Second player AI logic: Move towards the ball's x position
    if (ball) {
      let dist2 = distance(ball.x, ball.y, player.x, player.y);
      player.x += xSeb * VelocityRandom + (ball.x-player.x)/dist2 * VelocityDistance;
      player.y += ySeb * VelocityRandom + (ball.y-player.y)/dist2 * VelocityDistance;
      if(player.x<20) player.x = 20;
      if(player.x>780) player.x = 780;
      if(player.y<20) player.y = 20;
      if(player.y>580) player.y = 580;      
    }
  }
}

setInterval(updateBall, 1000 / 60);  // update 60 times per second

io.on('connection', (socket) => {
  let xSeb = 0;
  let ySeb = 0;

  if (Object.keys(clients).length > 1) {
    socket.emit('serverFull');
    socket.disconnect();
    return;
  }

  clients[socket.id] = { x: Object.keys(clients).length ? 700 : 100, y: 300, color: Object.keys(clients).length ? 'blue' : 'red' };
  if (Object.keys(clients).length === 2) {
    ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 0 };
  }

  socket.on('disconnect', () => {
    delete clients[socket.id];
    ball = null;
  });

  //üzenet klienstől
  socket.on('move', (direction) => {
      console.log('Irány: ', direction);
  });

  //x irányú sebesség
  socket.on('xseb', (value) => {
    xSeb = value;
  });

  //y irányú sebesség
  socket.on('yseb', (value) => {
    ySeb = value;
  });

  setInterval(() => {
    if (socket.id in clients) {
      updatePlayerAI(clients[socket.id], xSeb, ySeb);
    }
  }, 1000 / 60);

  setInterval(() => {
    socket.emit('players', clients);
    socket.emit('ball', ball);
    socket.emit('winner', winner);
    socket.emit('clientCount', Object.keys(clients).length);
  }, 1000 / 60);
});

server.listen(4001, () => {
  console.log('listening on *:4001');
});
