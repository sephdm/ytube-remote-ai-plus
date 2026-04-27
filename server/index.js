const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.setMaxListeners(100);

let lastBridgePoll = 0;
let extensionSocket = null;
let bridgeSocket = null;
let pendingBridgeCommands = [];

// Auto-Discovery & Polling Endpoints
app.get('/identify', (req, res) => {
  res.json({ service: 'yt-remote-hub', version: '1.1' });
});

app.get('/bridge-poll', (req, res) => {
  lastBridgePoll = Date.now();
  if (pendingBridgeCommands.length > 0) {
    res.json(pendingBridgeCommands.shift());
  } else {
    res.json({});
  }
});

// System Status Broadcast
setInterval(() => {
  io.emit('system-status', {
    bridgeConnected: (Date.now() - lastBridgePoll) < 5000,
    extensionConnected: !!extensionSocket
  });
}, 2000);

io.on('connection', (socket) => {
  socket.setMaxListeners(100);
  const type = socket.handshake.query.type;
  console.log(`New connection: ${socket.id} (${type})`);

  if (type === 'extension') extensionSocket = socket;
  if (type === 'bridge') bridgeSocket = socket;

  // Relay Commands to Extension
  socket.on('command', (data) => {
    if (data.type === 'ai-search') {
      const { prompt: userPrompt, mode } = data;
      const aiPrompt = `You are a YouTube search assistant. Based on this request: "${userPrompt}", provide ONLY the most relevant YouTube search query string. Do not include quotes or extra text.`;
      
      exec(`gemini -p "${aiPrompt}"`, (error, stdout) => {
        if (!error && stdout) {
          const query = stdout.trim();
          if (mode === 'confirm') socket.emit('ai-suggestion', { query });
          else if (extensionSocket) extensionSocket.emit('command', { type: 'execute-search', query, mode });
        }
      });
      return;
    }

    if (extensionSocket) extensionSocket.emit('command', data);
  });

  // Relay System Commands to Bridge
  socket.on('system-command', (data) => {
    pendingBridgeCommands.push(data);
    if (bridgeSocket) bridgeSocket.emit('system-command', data);
  });

  // Relay Results from Extension back to UI
  socket.on('extension-data', (data) => {
    socket.broadcast.emit('extension-data', data);
  });

  socket.on('disconnect', () => {
    if (socket === extensionSocket) extensionSocket = null;
    if (socket === bridgeSocket) bridgeSocket = null;
  });
});

const PORT = process.env.PORT || 8928;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Azure Gold Hub running on port ${PORT}`);
});
