const express = require('express');
const app = express();

app.use(express.json());

const self = process.env.SELF || 'A';
const otherUrl = process.env.OTHER_URL;
const routePrefix = process.env.ROUTE_PREFIX || '/api/a';
const port = process.env.PORT || 3000;

const messages = [];
const phrases = [
  'hello', 'how are you?', 'nice weather today', 'any news?',
  'lol', 'ping', 'pong', 'random chat here', 'anyone there?', 'i like k8s'
];

app.get(routePrefix + '/messages', (req, res) => res.json(messages));

app.post(routePrefix + '/message', (req, res) => {
  messages.push(req.body);
  res.json({ ok: true });
});

async function sendRandom() {
  if (!otherUrl) return;
  const msg = {
    from: self,
    text: phrases[Math.floor(Math.random() * phrases.length)],
    time: new Date().toISOString()
  };
  // log our own sent message
  messages.push(msg);
  try {
    await fetch(otherUrl + '/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
  } catch (e) {
    console.error('send failed', e.message);
  }
}

setInterval(sendRandom, 3000);

app.listen(port, () => console.log(`${self} listening on port ${port} at ${routePrefix}`));
