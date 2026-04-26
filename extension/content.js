let socket = null;
let gainNode = null;
let audioCtx = null;

// Initialize Audio Context for Audio Boost
function initAudio() {
  const video = document.querySelector('video');
  if (!video || audioCtx) return;
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaElementSource(video);
  gainNode = audioCtx.createGain();
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
}

// Command Handler
function handleCommand(cmd) {
  const video = document.querySelector('video');
  if (!video) return;

  switch (cmd.type) {
    case 'toggle-play':
      video.paused ? video.play() : video.pause();
      break;
    case 'next':
      document.querySelector('.ytp-next-button')?.click();
      break;
    case 'prev':
      window.history.back();
      break;
    case 'set-volume':
      video.volume = cmd.volume / 100;
      break;
    case 'toggle-boost':
      initAudio();
      gainNode.gain.value = cmd.enabled ? 3.0 : 1.0; // 300% boost
      break;
    case 'toggle-fullscreen':
      document.querySelector('.ytp-fullscreen-button')?.click();
      break;
    case 'toggle-pip':
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        video.requestPictureInPicture();
      }
      break;
    case 'like':
      document.querySelector('button[aria-label^="like this video"]')?.click();
      break;
    case 'subscribe':
      document.querySelector('ytd-subscribe-button-renderer button')?.click();
      break;
    case 'execute-search':
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cmd.query)}`;
      if (cmd.mode === 'queue') {
        // Queue logic: Open in hidden iframe or fetch result then queue
        // For simplicity, we'll navigate for now, or use a more advanced 'add to queue' script
        console.log('Queue mode requested for:', cmd.query);
        window.location.href = searchUrl + '&sp=EgIQAQ%253D%253D'; // Appends filter for videos only
      } else {
        window.location.href = searchUrl;
      }
      break;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'command') handleCommand(msg.command);
});

// Send status updates back to hub
setInterval(() => {
  const video = document.querySelector('video');
  if (video) {
    chrome.runtime.sendMessage({
      type: 'status',
      data: {
        videoTitle: document.title.replace(' - YouTube', ''),
        paused: video.paused,
        currentTime: video.currentTime,
        duration: video.duration
      }
    });
  }
}, 2000);
