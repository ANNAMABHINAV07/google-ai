import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Trash2, Plus, Target, Clock, ChevronRight, Timer, Play } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  estimatedMinutes: number;
}

interface GoalsListProps {
  userId: string;
  onStartTask?: (task: Goal) => void;
}

export const GoalsList: React.FC<GoalsListProps> = ({ userId, onStartTask }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [newTime, setNewTime] = useState('25');

  useEffect(() => {
    const q = query(collection(db, `users/${userId}/goals`), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
    }, (error) => handleFirestoreError(error, 'list', `/users/${userId}/goals`));
    return () => unsubscribe();
  }, [userId]);

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    try {
      await addDoc(collection(db, `users/${userId}/goals`), {
        userId,
        title: newGoal,
        status: 'pending',
        estimatedMinutes: parseInt(newTime) || 25,
        priority: 'medium',
        createdAt: serverTimestamp(),
      });
      setNewGoal('');
      setNewTime('25');
    } catch (e) {
      handleFirestoreError(e, 'create', `/users/${userId}/goals`);
    }
  };

  const toggleGoal = async (goal: Goal) => {
    try {
      await updateDoc(doc(db, `users/${userId}/goals/${goal.id}`), {
        status: goal.status === 'completed' ? 'pending' : 'completed'
      });
    } catch (e) {
      handleFirestoreError(e, 'update', `/users/${userId}/goals/${goal.id}`);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/goals/${id}`));
    } catch (e) {
      handleFirestoreError(error, 'delete', `/users/${userId}/goals/${id}`);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
           <Target className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" size={18} />
           <h3 className="text-slate-200 font-bold text-[11px] uppercase tracking-[0.3em]">Objectives Core</h3>
        </div>
        <div className="text-[10px] text-slate-500 font-mono font-bold">{goals.length} ACTIVE</div>
      </div>

      <form onSubmit={addGoal} className="space-y-4 mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Neural prompt for new objective..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-cyan-500 transition-all font-sans placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-4">
           <div className="flex-1 flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
              <Clock size={14} className="text-slate-500 ml-2" />
              <input 
                type="number" 
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="bg-transparent text-cyan-400 text-xs font-mono w-full focus:outline-none"
                placeholder="MIN"
              />
              <span className="text-[10px] text-slate-600 font-bold pr-2">MINUTES</span>
           </div>
           <button 
            type="submit"
            className="bg-cyan-400 text-black px-6 py-3 rounded-xl hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] text-[10px] font-black uppercase tracking-widest"
          >
            Deploy
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                goal.status === 'completed' 
                  ? 'bg-black/40 border-white/5 opacity-50' 
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={() => toggleGoal(goal)} 
                  className={`transition-colors ${goal.status === 'completed' ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-300'}`}
                >
                  {goal.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex flex-col">
                   <span className={`text-xs font-bold tracking-tight transition-all ${
                     goal.status === 'completed' ? 'text-slate-600 line-through' : 'text-slate-200'
                   }`}>
                     {goal.title}
                   </span>
                   <div className="flex items-center gap-2 mt-1">
                      <Timer size={10} className="text-slate-600" />
                      <span className="text-[10px] font-mono text-slate-500">{goal.estimatedMinutes}m Allocated</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 {onStartTask && goal.status !== 'completed' && (
                   <button 
                     onClick={() => onStartTask(goal)}
                     className="p-2 text-cyan-400 bg-cyan-400/10 rounded-full hover:bg-cyan-400/20 transition-all opacity-0 group-hover:opacity-100"
                     title="Start Task"
                   >
                     <Play size={14} className="ml-0.5" />
                   </button>
                 )}
                 <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-700 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={14} className="text-slate-800" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
