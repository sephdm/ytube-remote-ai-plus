const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.setMaxListeners(50); // Prevent MaxListenersExceededWarning

let lastBridgePoll = 0;
let extensionSocket = null;
let bridgeSocket = null;
let pendingBridgeCommands = [];

app.get('/identify', (req, res) => {
  res.json({ service: 'yt-remote-hub', version: '1.0' });
});

app.get('/bridge-poll', (req, res) => {
  lastBridgePoll = Date.now(); // Track connection
  if (pendingBridgeCommands.length > 0) {
    res.json(pendingBridgeCommands.shift());
  } else {
    res.json({});
  }
});

// Broadcast status to UI every 2 seconds
setInterval(() => {
  const status = {
    bridgeConnected: (Date.now() - lastBridgePoll) < 5000,
    extensionConnected: !!extensionSocket
  };
  io.emit('system-status', status);
}, 2000);

io.on('connection', (socket) => {
  socket.setMaxListeners(100); // Fix: Set limit on individual socket
  const type = socket.handshake.query.type;
  console.log(`New connection: ${socket.id} (Type: ${type})`);

  if (type === 'extension') {
    extensionSocket = socket;
    console.log('Extension connected');
  } else if (type === 'bridge') {
    bridgeSocket = socket;
    console.log('Windows Bridge connected');
  }

const { exec } = require('child_process');

// ... (previous code)

io.on('connection', (socket) => {
  // ... (previous handshake logic)

  // Handle AI Search Command
  socket.on('command', (data) => {
    if (data.type === 'ai-search') {
      const { prompt: userPrompt, mode } = data;
      console.log(`AI Search requested [Mode: ${mode}]:`, userPrompt);
      
      const aiPrompt = `You are a YouTube search assistant. Based on this request: "${userPrompt}", provide ONLY the most relevant YouTube search query string. Do not include quotes or extra text.`;
      
      exec(`gemini -p "${aiPrompt}"`, (error, stdout, stderr) => {
        if (!error && stdout) {
          const searchQuery = stdout.trim();
          console.log('Gemini suggested query:', searchQuery);
          
          if (mode === 'confirm') {
            // Send suggestion back to the UI for approval
            socket.emit('ai-suggestion', { query: searchQuery });
          } else {
            // Send direct command to extension
            if (extensionSocket) {
              extensionSocket.emit('command', { 
                type: 'execute-search', 
                query: searchQuery,
                mode: mode 
              });
            }
          }
        }
      });
      return;
    }

    if (data.type === 'execute-search') {
      if (extensionSocket) {
        extensionSocket.emit('command', data);
      }
      return;
    }

    // Handle standard commands
    if (extensionSocket) {
      extensionSocket.emit('command', data);
    }
  });

  // Handle Ask Gemini (Chat about video)
  socket.on('command', (data) => {
    if (data.type === 'ask-gemini') {
      const { userPrompt, transcript } = data;
      const fullPrompt = `Context (Video Transcript): ${transcript}\n\nUser Question: ${userPrompt}\n\nAnswer concisely based on the transcript provided.`;
      
      exec(`gemini -p "${fullPrompt}"`, (error, stdout, stderr) => {
        if (!error && stdout) {
          socket.emit('ai-response', { answer: stdout.trim() });
        }
      });
    }
  });

  // ... (rest of the socket logic)
});


  // Handle system commands (Bluetooth/Audio)
  socket.on('system-command', (data) => {
    console.log('System command received:', data);
    pendingBridgeCommands.push(data); // Add to queue for polling bridge
    if (bridgeSocket) {
      bridgeSocket.emit('system-command', data);
    }
  });

  // Handle data from Extension (transcripts, status)
  socket.on('extension-data', (data) => {
    socket.broadcast.emit('extension-data', data);
  });

  socket.on('disconnect', () => {
    if (socket === extensionSocket) extensionSocket = null;
    if (socket === bridgeSocket) bridgeSocket = null;
    console.log(`Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8928;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
