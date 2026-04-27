import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, Maximize, Search, MessageSquare, 
  Bluetooth, Zap, Monitor, Activity, Cpu, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SERVER_URL = `http://${window.location.hostname}:8928`;

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<any>({ 
    connected: false, 
    videoTitle: 'DISCONNECTED', 
    bridgeConnected: false,
    extensionConnected: false 
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'ai' | 'chat'>('basic');
  const [prompt, setPrompt] = useState('');
  const [volume, setVolume] = useState(50);
  const [audioBoost, setAudioBoost] = useState(false);
  const [aiMode, setAiMode] = useState<'direct' | 'confirm' | 'queue'>('confirm');
  const [suggestedQuery, setSuggestedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io(SERVER_URL, { query: { type: 'ui' } });
    
    newSocket.on('connect', () => setStatus(s => ({ ...s, connected: true })));
    newSocket.on('disconnect', () => setStatus(s => ({ ...s, connected: false })));
    newSocket.on('system-status', (data) => setStatus(s => ({ ...s, ...data })));
    
    newSocket.on('extension-data', (data) => {
      if (Array.isArray(data)) setSearchResults(data);
      else setStatus(s => ({ ...s, ...data, extensionConnected: true }));
    });
    
    newSocket.on('ai-suggestion', (data) => setSuggestedQuery(data.query));

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, []);

  const sendCommand = (cmd: string, data: any = {}) => {
    socket?.emit('command', { type: cmd, ...data });
  };

  const sendSystemCommand = (cmd: string, data: any = {}) => {
    socket?.emit('system-command', { type: cmd, ...data });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans selection:bg-[#D4AF37]/30 p-6">
      {/* Handshake Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter" style={{ color: '#007FFF' }}>
            AZURE_GOLD.PRO
          </h1>
          <p className="text-[8px] font-black tracking-widest text-zinc-500 uppercase">Unified Command Core</p>
        </div>
        <div className="flex gap-2">
           <Monitor size={18} style={{ color: status.extensionConnected ? '#007FFF' : '#333' }} />
           <Bluetooth size={18} style={{ color: status.bridgeConnected ? '#D4AF37' : '#333' }} />
        </div>
      </header>

      {/* Main Stream Display */}
      <div className="bg-[#111] border border-white/5 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#007FFF' }} />
        <span className="text-[10px] font-black text-zinc-600 uppercase mb-2 block">Live Input</span>
        <h2 className="text-xl font-bold line-clamp-2 leading-tight min-h-[3rem]">
          {status.videoTitle}
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'basic' && (
          <motion.div key="basic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex justify-around items-center">
              <button onClick={() => sendCommand('prev')}><SkipBack size={32} className="text-zinc-500" /></button>
              <button 
                onClick={() => sendCommand('toggle-play')}
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#007FFF', boxShadow: '0 0 30px rgba(0,127,255,0.3)' }}
              >
                {status.paused ? <Play fill="white" size={36} /> : <Pause fill="white" size={36} />}
              </button>
              <button onClick={() => sendCommand('next')}><SkipForward size={32} className="text-zinc-500" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setAudioBoost(!audioBoost); sendCommand('toggle-boost', { enabled: !audioBoost }); }}
                className="p-6 rounded-3xl border flex flex-col items-center gap-2"
                style={{ 
                  borderColor: audioBoost ? '#D4AF37' : '#222',
                  backgroundColor: audioBoost ? 'rgba(212,175,55,0.1)' : '#111' 
                }}
              >
                <Zap size={24} style={{ color: audioBoost ? '#D4AF37' : '#555' }} fill={audioBoost ? "currentColor" : "none"} />
                <span className="text-[9px] font-black uppercase tracking-widest">Boost</span>
              </button>

              <button 
                onClick={() => sendSystemCommand('toggle-bt')}
                className="p-6 rounded-3xl bg-[#111] border border-white/5 flex flex-col items-center gap-2"
              >
                <Bluetooth size={24} style={{ color: '#D4AF37' }} />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Link BT</span>
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'ai' && (
          <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-[#111] rounded-3xl p-6 border border-white/5 shadow-2xl">
               <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your intent..." 
                  className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none mb-4 h-32"
               />
               <button 
                  onClick={() => { sendCommand('ai-search', { prompt, mode: aiMode }); setPrompt(''); setSearchResults([]); }}
                  className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-black shadow-xl transition-all"
                  style={{ backgroundColor: '#007FFF' }}
               >
                  Generate Search
               </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((video) => (
                  <button
                    key={video.videoId}
                    onClick={() => { sendCommand('execute-search', { query: `https://www.youtube.com/watch?v=${video.videoId}`, mode: 'direct' }); setSearchResults([]); }}
                    className="w-full flex items-center gap-4 p-3 bg-[#111] rounded-2xl border border-white/5"
                  >
                    <img src={video.thumbnail} className="w-20 aspect-video rounded-lg object-cover" />
                    <p className="text-[10px] font-bold text-left line-clamp-2">{video.title}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-8 left-8 right-8 h-16 bg-[#111]/80 backdrop-blur-3xl border border-white/10 rounded-3xl flex justify-around items-center">
        <button onClick={() => setActiveTab('basic')} style={{ color: activeTab === 'basic' ? '#007FFF' : '#555' }}><Cpu size={24} /></button>
        <button onClick={() => setActiveTab('ai')} style={{ color: activeTab === 'ai' ? '#007FFF' : '#555' }}><Search size={24} /></button>
        <button onClick={() => setActiveTab('chat')} style={{ color: activeTab === 'chat' ? '#007FFF' : '#555' }}><MessageSquare size={24} /></button>
      </nav>
    </div>
  );
};

export default App;
