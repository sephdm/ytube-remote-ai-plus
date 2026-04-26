import './socket.io.min.js';

// Configuration: Replace with your Pixel 3XL's IP address
const HUB_IP = 'PHONE_IP_HERE'; // We will need to set this
const socket = io(`http://${HUB_IP}:8927`, { query: { type: 'extension' } });

socket.on('connect', () => {
  console.log('Connected to Pixel 3XL Hub');
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
  if (msg.type === 'status') {
    socket.emit('extension-data', msg.data);
  }
});
