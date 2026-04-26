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
      if (cmd.query.startsWith('http')) {
        window.location.href = cmd.query; // Direct video link
      } else {
        window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(cmd.query)}`;
      }
      break;
  }
}

// Scrape search results if on a search page
function scrapeResults() {
  if (!window.location.pathname.includes('/results')) return;
  
  const results = [];
  const videoElements = document.querySelectorAll('ytd-video-renderer');
  
  videoElements.forEach((el, index) => {
    if (index > 5) return; // Top 5 only
    const titleEl = el.querySelector('#video-title');
    const imgEl = el.querySelector('img');
    const linkEl = el.querySelector('a#thumbnail');

    if (titleEl && linkEl) {
      results.push({
        title: titleEl.innerText,
        videoId: linkEl.href.split('v=')[1]?.split('&')[0],
        thumbnail: imgEl?.src || ''
      });
    }
  });

  if (results.length > 0) {
    chrome.runtime.sendMessage({
      type: 'search-results',
      data: results
    });
  }
}

// Watch for page changes
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(scrapeResults, 2000); // Wait for YT to load results
  }
}).observe(document, { subtree: true, childList: true });

// Initial scrape
setTimeout(scrapeResults, 2000);

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
