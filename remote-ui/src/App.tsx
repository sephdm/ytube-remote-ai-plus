import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, VolumeX, Maximize, Minimize, 
  Search, MessageSquare, Bluetooth, Zap,
  ThumbsUp, UserPlus, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SERVER_URL = `http://${window.location.hostname}:8927`;

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<any>({ connected: false, videoTitle: 'No video playing' });
  const [activeTab, setActiveTab] = useState<'basic' | 'ai' | 'chat'>('basic');
  const [prompt, setPrompt] = useState('');
  const [volume, setVolume] = useState(50);
  const [audioBoost, setAudioBoost] = useState(false);
  const [aiMode, setAiMode] = useState<'direct' | 'confirm' | 'queue'>('confirm');
  const [suggestedQuery, setSuggestedQuery] = useState('');

  useEffect(() => {
    const newSocket = io(SERVER_URL, { query: { type: 'ui' } });
    
    newSocket.on('connect', () => setStatus(s => ({ ...s, connected: true })));
    newSocket.on('disconnect', () => setStatus(s => ({ ...s, connected: false })));
    newSocket.on('extension-data', (data) => setStatus(s => ({ ...s, ...data })));
    
    // Handle AI suggestions back from Gemini
    newSocket.on('ai-suggestion', (data: { query: string }) => {
      if (aiMode === 'confirm') {
        setSuggestedQuery(data.query);
      } else {
        sendCommand('execute-search', { query: data.query, mode: aiMode });
      }
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, [aiMode]);

  const sendCommand = (cmd: string, data: any = {}) => {
    socket?.emit('command', { type: cmd, ...data });
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const sendSystemCommand = (cmd: string, data: any = {}) => {
    socket?.emit('system-command', { type: cmd, ...data });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-500/30">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <h1 className="font-bold tracking-tight text-lg">YT REMOTE</h1>
        </div>
        <button onClick={() => sendSystemCommand('toggle-bt')} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all">
          <Bluetooth size={20} className="text-blue-400" />
        </button>
      </header>

      {/* Main UI */}
      <main className="pb-24 max-w-md mx-auto">
        <div className="p-4">
          <div className="bg-zinc-900 rounded-2xl p-4 mb-6 shadow-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Now Playing</p>
            <h2 className="text-lg font-medium truncate leading-snug">{status.videoTitle || 'Waiting for connection...'}</h2>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'basic' && (
              <motion.div 
                key="basic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Playback Controls */}
                <div className="flex justify-center items-center gap-8">
                  <button onClick={() => sendCommand('prev')} className="p-4 text-zinc-400 active:scale-90 transition-transform"><SkipBack size={32} /></button>
                  <button 
                    onClick={() => sendCommand('toggle-play')} 
                    className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                  >
                    {status.paused ? <Play size={40} fill="white" /> : <Pause size={40} fill="white" />}
                  </button>
                  <button onClick={() => sendCommand('next')} className="p-4 text-zinc-400 active:scale-90 transition-transform"><SkipForward size={32} /></button>
                </div>

                {/* Volume & Boost */}
                <div className="space-y-4 px-2">
                  <div className="flex items-center gap-4">
                    <Volume2 size={20} className="text-zinc-500" />
                    <input 
                      type="range" 
                      className="flex-1 accent-red-600 h-1.5 rounded-lg appearance-none bg-zinc-800 cursor-pointer"
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setVolume(v);
                        sendCommand('set-volume', { volume: v });
                      }} 
                    />
                    <span className="text-sm font-mono text-zinc-500 w-8">{volume}%</span>
                  </div>
                  <button 
                    onClick={() => {
                      setAudioBoost(!audioBoost);
                      sendCommand('toggle-boost', { enabled: !audioBoost });
                    }}
                    className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${audioBoost ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-zinc-800 text-zinc-400'}`}
                  >
                    <Zap size={18} fill={audioBoost ? "currentColor" : "none"} />
                    AUDIO BOOST {audioBoost ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Display Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => sendCommand('toggle-fullscreen')} className="flex flex-col items-center gap-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800 active:bg-zinc-800">
                    <Maximize size={24} />
                    <span className="text-xs font-medium">Fullscreen</span>
                  </button>
                  <button onClick={() => sendCommand('toggle-pip')} className="flex flex-col items-center gap-2 p-4 bg-zinc-900 rounded-xl border border-zinc-800 active:bg-zinc-800">
                    <Monitor size={24} />
                    <span className="text-xs font-medium">Display Window</span>
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex justify-around py-4 border-t border-zinc-800">
                  <button onClick={() => sendCommand('like')} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-red-500"><ThumbsUp size={24} /><span className="text-[10px]">Like</span></button>
                  <button onClick={() => sendCommand('subscribe')} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-red-500"><UserPlus size={24} /><span className="text-[10px]">Subscribe</span></button>
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 space-y-4">
                {/* AI Mode Selector */}
                <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  {(['direct', 'confirm', 'queue'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setAiMode(mode)}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${aiMode === mode ? 'bg-zinc-800 text-red-500 shadow-inner' : 'text-zinc-500'}`}
                    >
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                  <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-500" /> PROMPT SEARCH
                  </h3>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to watch..." 
                    className="w-full bg-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 transition-all resize-none h-32"
                  />
                  
                  {suggestedQuery && aiMode === 'confirm' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">AI Suggestion</p>
                      <p className="text-sm italic mb-3">"{suggestedQuery}"</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            sendCommand('execute-search', { query: suggestedQuery, mode: 'direct' });
                            setSuggestedQuery('');
                          }}
                          className="flex-1 py-2 bg-red-600 rounded-lg text-xs font-bold"
                        >
                          Execute
                        </button>
                        <button 
                          onClick={() => setSuggestedQuery('')}
                          className="px-4 py-2 bg-zinc-800 rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <button 
                    onClick={() => {
                      sendCommand('ai-search', { prompt, mode: aiMode });
                      setPrompt('');
                    }}
                    disabled={!prompt}
                    className="w-full mt-4 py-3 bg-red-600 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Search size={18} /> GENERATE SEARCH
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 p-2 flex justify-around items-center">
        <button 
          onClick={() => setActiveTab('basic')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'basic' ? 'text-red-500' : 'text-zinc-500'}`}
        >
          <Play size={24} />
          <span className="text-[10px] font-bold mt-1">REMOTE</span>
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'ai' ? 'text-red-500' : 'text-zinc-500'}`}
        >
          <Search size={24} />
          <span className="text-[10px] font-bold mt-1">AI SEARCH</span>
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'chat' ? 'text-red-500' : 'text-zinc-500'}`}
        >
          <MessageSquare size={24} />
          <span className="text-[10px] font-bold mt-1">ASK GEMINI</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
