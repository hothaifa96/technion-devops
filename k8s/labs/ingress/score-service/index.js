const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let scores = { xWins: 0, oWins: 0, draws: 0 };

app.get('/api/score', (req, res) => res.json(scores));

app.post('/api/score/win', (req, res) => {
  if (req.body.player === 'X') scores.xWins++;
  else if (req.body.player === 'O') scores.oWins++;
  res.json(scores);
});

app.post('/api/score/draw', (req, res) => {
  scores.draws++;
  res.json(scores);
});

app.get('/api/score/reset', (req, res) => {
  scores = { xWins: 0, oWins: 0, draws: 0 };
  res.json(scores);
});

app.listen(3000, () => console.log('Score service on 3000'));
