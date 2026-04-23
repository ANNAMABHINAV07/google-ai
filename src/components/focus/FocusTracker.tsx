import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Coffee, Trophy, Plus } from 'lucide-react';
import { Progress } from '../ui/progress';

interface FocusTrackerProps {
  onSessionComplete: (duration: number) => void;
  onTimerStateChange?: (isActive: boolean) => void;
  activeTask?: { title: string; duration: number } | null;
  workDuration?: number;
  breakDuration?: number;
}

export const FocusTracker: React.FC<FocusTrackerProps> = ({ 
  onSessionComplete, 
  onTimerStateChange,
  activeTask,
  workDuration: propsWorkDuration = 25, 
  breakDuration: propsBreakDuration = 5 
}) => {
  const [workDuration, setWorkDuration] = useState(propsWorkDuration);
  const [breakDuration, setBreakDuration] = useState(propsBreakDuration);
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync props and active task to local state when inactive
  useEffect(() => {
    if (!isActive) {
      if (activeTask) {
        setWorkDuration(activeTask.duration);
        setIsActive(true); // Auto-start lock mode
      } else {
        setWorkDuration(propsWorkDuration);
      }
    }
  }, [activeTask, propsWorkDuration]); // remove isActive as a dependency here to prevent infinite auto-start loops after pausing

  useEffect(() => {
    onTimerStateChange?.(isActive);
  }, [isActive, onTimerStateChange]);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(isBreak ? breakDuration * 60 : workDuration * 60);
    }
  }, [workDuration, breakDuration, isBreak, isActive]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    if (!isBreak) {
      onSessionComplete(workDuration);
      setIsBreak(true);
    } else {
      setIsBreak(false);
    }
    setIsActive(false);
    alert(isBreak ? "Break over! Let's get back to work." : "Work session complete! Time for a break.");
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? breakDuration * 60 : workDuration * 60);
  };

  const adjustDuration = (amount: number) => {
    if (isActive) return;
    if (isBreak) {
      setBreakDuration(prev => Math.max(1, prev + amount));
    } else {
      setWorkDuration(prev => Math.max(1, prev + amount));
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const total = isBreak ? breakDuration * 60 : workDuration * 60;
  const progress = ((total - timeLeft) / total) * 100;
  
  // SVG Circumference calculation for stroke-dasharray
  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-panel min-h-[420px] p-10 flex flex-col items-center justify-center relative overflow-hidden group">
      {/* Internal Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_70%)] pointer-events-none group-hover:opacity-100 transition-opacity opacity-50"></div>
      
      {/* Circular Timer Visual */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        <svg className="absolute w-full h-full -rotate-90 pointer-events-none">
          <circle 
            cx="160" 
            cy="160" 
            r="150" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="transparent" 
            className="text-white/5" 
          />
          <motion.circle 
            cx="160" 
            cy="160" 
            r="150" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: "linear" }}
            fill="transparent" 
            className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" 
          />
        </svg>

        <div className="text-center z-10 flex flex-col items-center">
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`text-[10px] uppercase tracking-[0.3em] mb-1 font-bold ${activeTask && !isBreak ? 'text-cyan-400' : 'text-slate-400'}`}
          >
            {isBreak ? 'AETHER RECHARGE' : (activeTask ? activeTask.title : 'DEEP FOCUS SESSION')}
          </motion.div>
          <div className="flex items-center gap-6">
            {!isActive && (
              <button 
                onClick={() => adjustDuration(-1)}
                className="text-slate-600 hover:text-cyan-400 transition-colors p-2"
              >
                <div className="w-6 h-0.5 bg-current rounded-full"></div>
              </button>
            )}
            <div className="text-7xl font-mono tracking-tighter text-white font-black tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            {!isActive && (
              <button 
                onClick={() => adjustDuration(1)}
                className="text-slate-600 hover:text-cyan-400 transition-colors p-2"
              >
                <Plus size={24} />
              </button>
            )}
          </div>
          
          <div className="mt-8 flex gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleTimer}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-zinc-200 transition-all"
            >
              {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={resetTimer}
              className="w-12 h-12 rounded-full border border-white/10 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/5 transition-all"
            >
              <RotateCcw size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      <motion.div
         animate={{ 
           borderColor: isBreak ? 'rgba(168, 85, 247, 0.3)' : 'rgba(34, 211, 238, 0.3)',
           backgroundColor: isBreak ? 'rgba(168, 85, 247, 0.1)' : 'rgba(34, 211, 238, 0.05)'
         }}
         className="mt-10 px-6 py-2 border rounded-full text-[10px] font-bold tracking-widest text-slate-200 flex items-center gap-3"
      >
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isBreak ? 'bg-purple-400' : 'bg-cyan-400'}`}></span>
        {isBreak ? 'RECHARGE READY • MINI GAMES ENABLED' : 'AETHER LINK ESTABLISHED • NO DISTRACTIONS'}
      </motion.div>
    </div>
  );
};
