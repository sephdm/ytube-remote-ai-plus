import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, Maximize, Search, MessageSquare, 
  Bluetooth, Zap, ThumbsUp, UserPlus, Monitor,
  Activity, Cpu, Radio, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SERVER_URL = `http://${window.location.hostname}:8928`;

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<any>({ 
    connected: false, 
    videoTitle: 'Awaiting Uplink...', 
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
      if (Array.isArray(data)) {
        setSearchResults(data); // These are the search results
      } else {
        setStatus(s => ({ ...s, ...data, extensionConnected: true }));
      }
    });
    
    newSocket.on('ai-suggestion', (data: { query: string }) => {
      setSuggestedQuery(data.query);
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, []);

  const sendCommand = (cmd: string, data: any = {}) => {
    socket?.emit('command', { type: cmd, ...data });
    if (window.navigator.vibrate) window.navigator.vibrate([20]);
  };

  const sendSystemCommand = (cmd: string, data: any = {}) => {
    socket?.emit('system-command', { type: cmd, ...data });
    if (window.navigator.vibrate) window.navigator.vibrate([40, 20, 40]);
  };

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans overflow-hidden selection:bg-yellow-500/30">
      {/* Dynamic Celestial Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-sky-500/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Visual Handshake Dashboard */}
      <header className="p-8 flex justify-between items-end relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status.connected ? 'bg-sky-400 shadow-[0_0_10px_#0ea5e9]' : 'bg-zinc-800'}`} />
            <span className="text-[9px] font-black tracking-[0.3em] text-zinc-500 uppercase">Aether Link Active</span>
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
            YT_CELESTIAL.PRO
          </h1>
        </div>
        
        <div className="flex gap-2">
           <div className={`p-3 rounded-2xl bg-white/5 border backdrop-blur-xl transition-all ${status.extensionConnected ? 'border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'border-white/5'}`}>
             <Monitor size={18} className={status.extensionConnected ? 'text-sky-400' : 'text-zinc-700'} />
           </div>
           <div className={`p-3 rounded-2xl bg-white/5 border backdrop-blur-xl transition-all ${status.bridgeConnected ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-white/5'}`}>
             <Bluetooth size={18} className={status.bridgeConnected ? 'text-yellow-500' : 'text-zinc-700'} />
           </div>
        </div>
      </header>

      <main className="px-6 pb-36 max-w-md mx-auto relative z-10">
        {/* Holographic Now Playing Section */}
        <section className="relative mb-10 group">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-600/20 to-yellow-600/10 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
          <div className="relative bg-black/40 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 p-4">
                <Radio size={16} className="text-sky-500/50 animate-pulse" />
             </div>
             
             <div className="flex flex-col gap-4">
               <div className="flex items-center gap-2">
                 <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[8px] font-black uppercase tracking-widest border border-sky-500/20">Stream Output</span>
               </div>
               <h2 className="text-2xl font-bold leading-tight tracking-tight h-16 line-clamp-2 text-white">
                 {status.videoTitle}
               </h2>
               
               <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>SYNC_STABLE</span>
                    <span>8.927GHz</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-sky-600 to-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: status.connected ? '75%' : '0%' }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
               </div>
             </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {activeTab === 'basic' && (
            <motion.div key="basic" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              {/* Main Control Deck */}
              <div className="flex items-center justify-between gap-6 px-4">
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => sendCommand('prev')} className="p-5 bg-white/5 rounded-full text-zinc-400 active:text-sky-400 transition-colors">
                  <SkipBack size={28} />
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendCommand('toggle-play')}
                  className="w-24 h-24 bg-white text-black rounded-[3rem] flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] active:shadow-sky-500/50 transition-all"
                >
                  {status.paused ? <Play size={44} fill="black" /> : <Pause size={44} fill="black" />}
                </motion.button>

                <motion.button whileTap={{ scale: 0.85 }} onClick={() => sendCommand('next')} className="p-5 bg-white/5 rounded-full text-zinc-400 active:text-sky-400 transition-colors">
                  <SkipForward size={28} />
                </motion.button>
              </div>

              {/* Bento Grid Controls */}
              <div className="grid grid-cols-4 gap-4 mt-8">
                {/* Volume Slide-Module */}
                <div className="col-span-4 bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-zinc-500" />
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Master</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 font-bold">{volume}%</span>
                  </div>
                  <input 
                    type="range" 
                    className="w-full accent-sky-500 h-1.5 rounded-full appearance-none bg-zinc-800/50"
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setVolume(v);
                      sendCommand('set-volume', { volume: v });
                    }} 
                  />
                </div>

                {/* Tactical Buttons */}
                <button 
                  onClick={() => { setAudioBoost(!audioBoost); sendCommand('toggle-boost', { enabled: !audioBoost }); }}
                  className={`col-span-2 p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3 ${audioBoost ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                >
                  <Zap size={24} fill={audioBoost ? "currentColor" : "none"} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Boost</span>
                </button>

                <button 
                  onClick={() => sendSystemCommand('toggle-bt')}
                  className="col-span-2 p-6 rounded-[2rem] bg-white/5 border border-white/5 text-zinc-500 active:bg-sky-500/10 active:border-sky-500/50 active:text-sky-400 transition-all flex flex-col items-center gap-3"
                >
                  <Bluetooth size={24} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bridge</span>
                </button>

                <button onClick={() => sendCommand('toggle-fullscreen')} className="col-span-2 p-6 rounded-[2rem] bg-white/5 border border-white/5 text-zinc-500 active:bg-white/10 flex flex-col items-center gap-3">
                  <Maximize size={24} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Expand</span>
                </button>

                <button onClick={() => sendCommand('toggle-pip')} className="col-span-2 p-6 rounded-[2rem] bg-white/5 border border-white/5 text-zinc-500 active:bg-white/10 flex flex-col items-center gap-3">
                  <ShieldCheck size={24} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Display</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="bg-black/40 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-600 via-transparent to-yellow-600 opacity-30" />
                
                <div className="flex gap-2 mb-8 p-1.5 bg-zinc-900/50 rounded-2xl border border-white/5">
                  {(['direct', 'confirm', 'queue'] as const).map((mode) => (
                    <button key={mode} onClick={() => setAiMode(mode)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${aiMode === mode ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-zinc-600'}`}>
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your intent..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-sky-500/50 transition-all h-36 mb-6 placeholder:text-zinc-700"
                  />
                  <div className="absolute top-4 right-4 text-sky-500/20">
                    <Cpu size={24} />
                  </div>
                </div>
                
                {suggestedQuery && aiMode === 'confirm' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 bg-sky-500/10 border border-sky-500/30 rounded-2xl relative">
                    <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest absolute -top-2 left-4 px-2 bg-[#020202]">Gemini Insight</span>
                    <p className="text-sm font-medium text-sky-100 mb-6 mt-2">"{suggestedQuery}"</p>
                    <div className="flex gap-3">
                      <button onClick={() => { sendCommand('execute-search', { query: suggestedQuery, mode: 'direct' }); setSuggestedQuery(''); }} className="flex-1 py-3.5 bg-sky-500 text-black font-black text-xs rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)]">EXECUTE_LINK</button>
                      <button onClick={() => setSuggestedQuery('')} className="px-6 py-3.5 bg-white/5 rounded-xl text-zinc-500 font-bold text-xs uppercase">X</button>
                    </div>
                  </motion.div>
                )}

                <button onClick={() => { sendCommand('ai-search', { prompt, mode: aiMode }); setPrompt(''); setSearchResults([]); }} className="w-full py-5 bg-gradient-to-r from-sky-600 to-sky-400 rounded-2xl font-black text-xs tracking-[0.2em] uppercase text-black shadow-xl shadow-sky-500/20 active:scale-[0.98] transition-all">
                  Generate Search
                </button>

                {/* Results Gallery */}
                {searchResults.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Top Results</h4>
                    <div className="flex flex-col gap-3">
                      {searchResults.map((video, i) => (
                        <motion.button
                          key={video.videoId}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => {
                            sendCommand('execute-search', { query: `https://www.youtube.com/watch?v=${video.videoId}`, mode: 'direct' });
                            setSearchResults([]);
                          }}
                          className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 active:bg-white/10 text-left transition-all group"
                        >
                          <div className="relative w-24 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900">
                             <img src={video.thumbnail} className="w-full h-full object-cover opacity-80 group-active:opacity-100" />
                          </div>
                          <p className="text-xs font-medium leading-snug line-clamp-2 pr-4">{video.title}</p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Futuristic Floating Dock */}
      <nav className="fixed bottom-10 left-8 right-8 h-20 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex justify-around items-center z-50 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <button onClick={() => setActiveTab('basic')} className={`relative p-5 rounded-2xl transition-all ${activeTab === 'basic' ? 'text-white' : 'text-zinc-700'}`}>
          <Cpu size={26} />
          {activeTab === 'basic' && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-sky-500/10 rounded-2xl blur-md" />}
          {activeTab === 'basic' && <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-sky-500 rounded-full" />}
        </button>
        <button onClick={() => setActiveTab('ai')} className={`relative p-5 rounded-2xl transition-all ${activeTab === 'ai' ? 'text-white' : 'text-zinc-700'}`}>
          <Search size={26} />
          {activeTab === 'ai' && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-sky-500/10 rounded-2xl blur-md" />}
          {activeTab === 'ai' && <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-sky-500 rounded-full" />}
        </button>
        <button onClick={() => setActiveTab('chat')} className={`relative p-5 rounded-2xl transition-all ${activeTab === 'chat' ? 'text-white' : 'text-zinc-700'}`}>
          <MessageSquare size={26} />
          {activeTab === 'chat' && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-sky-500/10 rounded-2xl blur-md" />}
          {activeTab === 'chat' && <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-sky-500 rounded-full" />}
        </button>
      </nav>
    </div>
  );
};

export default App;
