const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let board = Array(9).fill(null);
let current = 'X';
let winner = null;

const wins = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

function checkWinner() {
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function state() {
  return { board, current, winner };
}

app.get('/api/game', (req, res) => res.json(state()));

app.post('/api/game/move', (req, res) => {
  const { position, player } = req.body;
  if (winner || position < 0 || position > 8 || board[position] || player !== current) {
    return res.status(400).json(state());
  }
  board[position] = player;
  winner = checkWinner();
  current = current === 'X' ? 'O' : 'X';
  res.json(state());
});

app.get('/api/game/reset', (req, res) => {
  board = Array(9).fill(null);
  current = 'X';
  winner = null;
  res.json(state());
});

app.listen(3000, () => console.log('Game service on 3000'));
