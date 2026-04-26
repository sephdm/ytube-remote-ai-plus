import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, Maximize, Search, MessageSquare, 
  Bluetooth, Zap, ThumbsUp, UserPlus, Monitor,
  Wifi, Laptop, Activity, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SERVER_URL = `http://${window.location.hostname}:8927`;

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<any>({ 
    connected: false, 
    videoTitle: 'Awaiting Connection...', 
    bridgeConnected: false,
    extensionConnected: false 
  });
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
    newSocket.on('extension-data', (data) => setStatus(s => ({ ...s, ...data, extensionConnected: true })));
    
    newSocket.on('ai-suggestion', (data: { query: string }) => {
      setSuggestedQuery(data.query);
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, []);

  const sendCommand = (cmd: string, data: any = {}) => {
    socket?.emit('command', { type: cmd, ...data });
    if (window.navigator.vibrate) window.navigator.vibrate([30]);
  };

  const sendSystemCommand = (cmd: string, data: any = {}) => {
    socket?.emit('system-command', { type: cmd, ...data });
    if (window.navigator.vibrate) window.navigator.vibrate([50, 30, 50]);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Connection Dashboard */}
      <header className="p-6 flex justify-between items-center relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">System Core</span>
          <h1 className="text-xl font-black italic tracking-tighter text-white">YT_REMOTE.v1</h1>
        </div>
        <div className="flex gap-3">
          <div className={`p-2 rounded-lg bg-white/5 border ${status.extensionConnected ? 'border-green-500/50' : 'border-white/10'} backdrop-blur-md`}>
            <Monitor size={16} className={status.extensionConnected ? 'text-green-500' : 'text-zinc-600'} />
          </div>
          <div className={`p-2 rounded-lg bg-white/5 border ${status.bridgeConnected ? 'border-blue-500/50' : 'border-white/10'} backdrop-blur-md`}>
            <Bluetooth size={16} className={status.bridgeConnected ? 'text-blue-500' : 'text-zinc-600'} />
          </div>
        </div>
      </header>

      <main className="px-6 pb-32 max-w-md mx-auto relative z-10">
        {/* Visual Handshake / Now Playing */}
        <section className="relative group mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-zinc-900 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-600 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <Activity size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Stream</span>
            </div>
            <h2 className="text-2xl font-bold leading-tight mb-2 h-14 line-clamp-2">
              {status.videoTitle}
            </h2>
            <div className="flex items-center gap-4 text-zinc-500">
               <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-red-600"
                   initial={{ width: 0 }}
                   animate={{ width: status.connected ? '45%' : 0 }} 
                 />
               </div>
               <span className="text-[10px] font-mono">LIVE_LINK</span>
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {activeTab === 'basic' && (
            <motion.div key="basic" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-6">
              {/* Transport Deck */}
              <div className="grid grid-cols-3 items-center gap-4">
                <button onClick={() => sendCommand('prev')} className="h-16 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 active:bg-white/10 transition-colors">
                  <SkipBack size={24} />
                </button>
                <button 
                  onClick={() => sendCommand('toggle-play')}
                  className="h-24 bg-white text-black rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-all"
                >
                  {status.paused ? <Play size={36} fill="black" /> : <Pause size={36} fill="black" />}
                </button>
                <button onClick={() => sendCommand('next')} className="h-16 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 active:bg-white/10 transition-colors">
                  <SkipForward size={24} />
                </button>
              </div>

              {/* Utility Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <Volume2 size={20} className="text-zinc-400" />
                    <span className="text-xs font-mono text-zinc-500">{volume}%</span>
                  </div>
                  <input 
                    type="range" 
                    className="w-full accent-white h-1 rounded-full appearance-none bg-zinc-800"
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setVolume(v);
                      sendCommand('set-volume', { volume: v });
                    }} 
                  />
                </div>
                
                <button 
                  onClick={() => {
                    setAudioBoost(!audioBoost);
                    sendCommand('toggle-boost', { enabled: !audioBoost });
                  }}
                  className={`p-6 rounded-3xl border transition-all flex flex-col gap-3 ${audioBoost ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/5 text-zinc-400'}`}
                >
                  <Zap size={24} fill={audioBoost ? "currentColor" : "none"} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-left">Boost</span>
                </button>

                <button 
                  onClick={() => sendSystemCommand('toggle-bt')}
                  className="p-6 rounded-3xl bg-white/5 border border-white/5 text-zinc-400 active:bg-blue-500/10 active:border-blue-500/50 active:text-blue-400 transition-all flex flex-col gap-3"
                >
                  <Bluetooth size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-left">Link BT</span>
                </button>

                <button onClick={() => sendCommand('toggle-fullscreen')} className="p-6 rounded-3xl bg-white/5 border border-white/5 text-zinc-400 flex flex-col gap-3">
                  <Maximize size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-left">Expand</span>
                </button>
                <button onClick={() => sendCommand('toggle-pip')} className="p-6 rounded-3xl bg-white/5 border border-white/5 text-zinc-400 flex flex-col gap-3">
                  <Monitor size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-left">Window</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex gap-2 mb-6 p-1 bg-black/50 rounded-xl">
                  {(['direct', 'confirm', 'queue'] as const).map((mode) => (
                    <button key={mode} onClick={() => setAiMode(mode)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${aiMode === mode ? 'bg-white text-black' : 'text-zinc-500'}`}>
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell Gemini what to find..." 
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-red-500/50 transition-all h-32 mb-4"
                />
                
                {suggestedQuery && aiMode === 'confirm' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-600/10 border border-red-600/30 rounded-2xl">
                    <p className="text-sm italic text-red-100 mb-4">"{suggestedQuery}"</p>
                    <div className="flex gap-2">
                      <button onClick={() => { sendCommand('execute-search', { query: suggestedQuery, mode: 'direct' }); setSuggestedQuery(''); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">GO</button>
                      <button onClick={() => setSuggestedQuery('')} className="px-6 py-3 bg-white/5 rounded-xl text-zinc-400">X</button>
                    </div>
                  </motion.div>
                )}

                <button onClick={() => { sendCommand('ai-search', { prompt, mode: aiMode }); setPrompt(''); }} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-red-600/20">
                  Execute Search
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Futuristic Nav */}
      <nav className="fixed bottom-8 left-6 right-6 h-20 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl flex justify-around items-center z-50 shadow-2xl">
        <button onClick={() => setActiveTab('basic')} className={`p-4 rounded-2xl transition-all ${activeTab === 'basic' ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'text-zinc-500'}`}>
          <Cpu size={24} />
        </button>
        <button onClick={() => setActiveTab('ai')} className={`p-4 rounded-2xl transition-all ${activeTab === 'ai' ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'text-zinc-500'}`}>
          <Search size={24} />
        </button>
        <button onClick={() => setActiveTab('chat')} className={`p-4 rounded-2xl transition-all ${activeTab === 'chat' ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'text-zinc-500'}`}>
          <MessageSquare size={24} />
        </button>
      </nav>
    </div>
  );
};

export default App;
