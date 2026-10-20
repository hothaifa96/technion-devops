const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/health") return res.end("ok");
  res.end(`hello, api key configured: ${Boolean(process.env.API_KEY)}\n`);
});

server.listen(3000, () => console.log("listening on 3000"));

// graceful shutdown - works because node is PID 1 (exec form CMD)
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server");
  server.close(() => process.exit(0));
});
