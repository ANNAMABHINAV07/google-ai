import React, { useState } from 'react';
import { generateDailyReport } from '../../lib/gemini';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, where, limit, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';

export const DailyReport: React.FC<{ userId: string }> = ({ userId }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAndGenerateReport = async () => {
    setLoading(true);
    try {
      const sessionsQ = query(
        collection(db, `users/${userId}/sessions`),
        orderBy('startTime', 'desc'),
        limit(10)
      );
      const goalsQ = query(
        collection(db, `users/${userId}/goals`),
        where('status', '==', 'completed'),
        limit(10)
      );

      const [sessionsSnap, goalsSnap] = await Promise.all([
        getDocs(sessionsQ),
        getDocs(goalsQ)
      ]);

      const sessions = sessionsSnap.docs.map(d => d.data());
      const goals = goalsSnap.docs.map(d => d.data());

      const aiReport = await generateDailyReport(sessions, goals);
      setReport(aiReport);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 shadow-2xl flex flex-col h-full overflow-hidden relative group">
      {/* Background Decorative Element */}
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-all pointer-events-none"></div>

      <div className="flex items-center justify-between mb-10 z-10">
        <div className="flex items-center gap-3">
           <BarChart3 className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" size={18} />
           <h3 className="text-slate-200 font-bold text-[11px] uppercase tracking-[0.3em]">Neural Analytics</h3>
        </div>
        <button 
          onClick={fetchAndGenerateReport}
          disabled={loading}
          className="bg-white/5 text-slate-500 hover:text-cyan-400 hover:bg-white/10 p-2.5 rounded-xl border border-white/5 transition-all disabled:opacity-30"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 z-10">
        <AnimatePresence mode="wait">
          {!report ? (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="h-full flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-white/5 rounded-3xl bg-black/10 backdrop-blur-sm"
             >
                <div className="w-16 h-16 bg-cyan-950/30 rounded-3xl flex items-center justify-center mb-6 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                    <Sparkles className="text-cyan-400" />
                </div>
                <h4 className="text-slate-200 font-black mb-3 uppercase text-xs tracking-widest">Neural Sync Required</h4>
                <p className="text-slate-500 text-[11px] font-mono mb-8 leading-relaxed max-w-[220px]">
                   Synchronize focus patterns to generate current cognitive efficiency architecture.
                </p>
                <button 
                  onClick={fetchAndGenerateReport}
                  className="bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                >
                  Initiate Analysis
                </button>
             </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-black/40 p-6 rounded-2xl border border-white/5 relative overflow-hidden group/card shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/card:opacity-20 transition-opacity">
                    <Sparkles size={100} className="text-cyan-400" />
                 </div>
                 <div className="text-[10px] text-cyan-500 font-mono uppercase tracking-[0.2em] mb-4 font-black">Coaching Output</div>
                 <p className="text-slate-300 text-[13px] leading-relaxed font-semibold italic">
                    "{report.summary}"
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 font-bold">Total Flow</div>
                    <div className="text-3xl font-black text-white tracking-tighter">{report.totalFocusTime || 0}<span className="text-[10px] text-cyan-500 ml-1 font-mono">MIN</span></div>
                 </div>
                 <div className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1 font-bold">Yield Rate</div>
                    <div className="text-3xl font-black text-white tracking-tighter">{report.goalsAccomplished || 0}<span className="text-[10px] text-purple-500 ml-1 font-mono">UNITS</span></div>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-3 font-black px-2">Efficiency Adjustments</div>
                 {Array.isArray(report.insights) ? report.insights.map((insight: string, i: number) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ x: 4 }}
                      className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    >
                       <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shadow-[0_0_5px_cyan]"></div>
                       <span className="text-[11px] text-slate-400 font-bold leading-relaxed">{insight}</span>
                    </motion.div>
                 )) : <p className="text-xs text-slate-400 p-4 italic">{report.insights}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
