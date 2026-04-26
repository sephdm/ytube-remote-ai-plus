import './socket.io.min.js';

// Configuration: The Bridge will update this, or we scan
const HUB_IP = '25.3.51.219'; 
const socket = io(`http://${HUB_IP}:8928`, { 
  query: { type: 'extension' },
  transports: ['websocket'], // FORCE WEBSOCKETS ONLY (Fixes r.open error)
  upgrade: false
});

socket.on('connect', () => {
  console.log('Connected to Android Hub');
});

socket.on('command', (cmd) => {
  console.log('Received command:', cmd);
  chrome.tabs.query({ url: "https://www.youtube.com/*" }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: 'command', command: cmd });
    });
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'status' || msg.type === 'search-results') {
    socket.emit('extension-data', msg.data);
  }
});
