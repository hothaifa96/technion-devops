const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    service: 'API B',
    message: 'Hello from microservice B',
    pod: process.env.HOSTNAME || 'local'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API B listening on port ${PORT}`);
});
