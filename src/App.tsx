import React from 'react';
import { FocusTracker } from './components/focus/FocusTracker';
import { GoalsList } from './components/goals/GoalsList';
import { SnakeGame } from './components/games/SnakeGame';
import { WorkspaceManager } from './components/workspace/WorkspaceManager';
import { DailyReport } from './components/reports/DailyReport';
import { CalendarAgenda } from './components/calendar/CalendarAgenda';
import { auth, googleProvider, db, handleFirestoreError } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, User, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, User as UserIcon, LayoutGrid, Clock, Gamepad2, Settings, ListTodo, Calendar, BrainCircuit, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loggingIn, setLoggingIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('focus');
  const [selectedWorkspace, setSelectedWorkspace] = React.useState<string | null>(null);
  const [totalFocusTimeToday, setTotalFocusTimeToday] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, `users/${user.uid}/sessions`),
      where('startTime', '>=', today),
      where('status', '==', 'completed')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const total = snapshot.docs.reduce((acc, curr) => acc + (curr.data().duration || 0), 0);
      setTotalFocusTimeToday(total);
    });
    
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        setAccessToken(credential.accessToken || null);
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError('Uplink blocked by browser popup protection. Please allow popups for this site.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError(`Domain not authorized. Please add ${window.location.host} to your Firebase console authorized domains.`);
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Silent fail for overlapping requests as we handle state
      } else {
        setLoginError(error.message || 'Neural synchronization failed. Check system console.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSessionComplete = async (duration: number) => {
    if (!user || !selectedWorkspace) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/sessions`), {
        userId: user.uid,
        workspaceId: selectedWorkspace,
        startTime: serverTimestamp(),
        duration,
        status: 'completed',
      });
    } catch (e) {
      handleFirestoreError(e, 'create', `/users/${user.uid}/sessions`);
    }
  };

  if (loading) return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <Loader2 className="text-white animate-spin" size={40} />
    </div>
  );

  if (!user) return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,1)_0%,rgba(0,0,0,1)_100%)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-white rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.15)]">
           <BrainCircuit className="text-black" size={40} />
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter mb-4 italic">FOCUSFLOW</h1>
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest mb-12 max-w-sm mx-auto">
          Cognitive Architecture for the High-Frequency Mind.
        </p>
        <button 
          onClick={login}
          disabled={loggingIn}
          className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] mb-6 disabled:opacity-50 disabled:cursor-wait"
        >
          {loggingIn ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
          {loggingIn ? 'Syncing...' : 'Initialize Uplink'}
        </button>

        {loginError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-sm mx-auto"
          >
            <p className="text-[10px] text-red-400 font-mono uppercase tracking-[0.2em] font-bold">
              Security Protocol Violation:
            </p>
            <p className="text-[11px] text-red-200/70 mt-1 font-medium">
              {loginError}
            </p>
          </motion.div>
        )}
      </motion.div>
      
      <div className="absolute bottom-8 text-[10px] text-zinc-800 font-mono uppercase tracking-[0.5em]">
        Secured by Firebase • Enhanced by Gemini 2.0
      </div>
    </div>
  );  const tabs = [
    { id: 'focus', icon: <Clock size={16} />, label: 'Deep Work' },
    { id: 'tasks', icon: <ListTodo size={16} />, label: 'Tasks' },
    { id: 'schedule', icon: <Calendar size={16} />, label: 'Temporal' },
    { id: 'reports', icon: <BrainCircuit size={16} />, label: 'Audit' },
    { id: 'games', icon: <Gamepad2 size={16} />, label: 'Neural Reset' },
  ];

  return (
    <div className="h-screen w-full bg-[#050508] text-slate-100 flex overflow-hidden font-sans relative selection:bg-cyan-500/30 selection:text-white">
      {/* Immersive Background */}
      <div className="atmospheric-bg">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
        <div className="glow-3"></div>
      </div>

      <WorkspaceManager 
        userId={user.uid} 
        onSelect={setSelectedWorkspace} 
        selectedId={selectedWorkspace} 
      />
      
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 z-20 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">FOCUSFLOW</span>
             </div>
             
             <nav className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                      activeTab === tab.id 
                        ? 'bg-white/10 text-white border border-white/10' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden lg:inline">{tab.label}</span>
                  </button>
                ))}
             </nav>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs font-bold uppercase tracking-tight text-slate-200">{user.displayName || 'Operator'}</span>
                <span className="text-[10px] text-slate-500 font-mono">UPLINK ACTIVE</span>
             </div>
             {user.photoURL ? (
                <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full border border-white/20 hover:border-cyan-500 transition-colors cursor-pointer" />
             ) : (
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
                   <UserIcon size={16} />
                </div>
             )}
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-7xl mx-auto h-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {activeTab === 'focus' && (
                    <div className="flex flex-col gap-6">
                      <FocusTracker onSessionComplete={handleSessionComplete} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GoalsList userId={user.uid} />
                        {accessToken ? <CalendarAgenda accessToken={accessToken} /> : (
                           <div className="glass-panel p-8 flex flex-col items-center justify-center text-center opacity-40">
                              <Calendar className="text-slate-600 mb-4" size={32} />
                              <p className="text-[10px] font-mono uppercase text-slate-500 tracking-widest">Connect Calendar</p>
                           </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'tasks' && <GoalsList userId={user.uid} />}
                  {activeTab === 'schedule' && accessToken && <CalendarAgenda accessToken={accessToken} />}
                  {activeTab === 'reports' && <DailyReport userId={user.uid} />}
                  {activeTab === 'games' && <SnakeGame />}
                </div>

                {/* Info Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                   <div className="glass-panel p-6">
                      <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Cognitive Metrics</h4>
                      <div className="space-y-5">
                         <div>
                            <div className="flex justify-between items-center mb-1.5">
                               <span className="text-slate-300 text-[10px] font-semibold uppercase">Daily Flow Time</span>
                               <span className="text-cyan-400 text-[10px] font-bold">{totalFocusTimeToday}m</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.min((totalFocusTimeToday / 300) * 100, 100)}%` }}
                                 className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                               />
                            </div>
                         </div>
                         <div>
                            <div className="flex justify-between items-center mb-1.5">
                               <span className="text-slate-300 text-[10px] font-semibold uppercase">Focus Target (300m)</span>
                               <span className="text-purple-400 text-[10px] font-bold">{Math.round((totalFocusTimeToday / 300) * 100)}%</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.min((totalFocusTimeToday / 300) * 100, 100)}%` }}
                                 className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                               />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="glass-panel flex-1 flex flex-col p-6">
                      <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">Aether Log</h4>
                      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                         <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                            <p className="text-[10px] text-cyan-500 font-mono mb-1">LOG::ACTIVE</p>
                            <p className="text-[11px] text-slate-300">Neural uplink initialized correctly.</p>
                         </div>
                         <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-500 font-mono mb-1">WORKSPACE::SCAN</p>
                            <p className="text-[11px] text-slate-300">Objectives updated from Aether Cloud.</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Immersive Footer */}
        <footer className="h-8 flex items-center justify-between px-8 text-[10px] text-slate-500 border-t border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex gap-6">
            <span>STATUS: <span className="text-cyan-400 font-bold uppercase tracking-widest">Aether Connected</span></span>
            <span>SYSTEM: <span className="text-slate-300 uppercase tracking-widest">Nominal</span></span>
          </div>
          <div className="flex gap-4 font-mono font-medium">
            <span>v4.2.0-AETHER</span>
            <span className="text-slate-300">10:42 AM</span>
          </div>
        </footer>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}
