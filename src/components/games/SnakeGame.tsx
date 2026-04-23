import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, LayoutPanelLeft } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 5, y: 5 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

export const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake((prevSnake) => {
      const newHead = {
        x: (prevSnake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (prevSnake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setFood({
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        });
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [direction, food, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused((p) => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, 150);
    return () => clearInterval(interval);
  }, [moveSnake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  return (
    <div className="glass-panel p-8 h-full flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-cyan-900/10 rounded-full blur-[80px] pointer-events-none transition-all group-hover:bg-cyan-900/20"></div>
      
      <div className="flex justify-between items-center w-full max-w-[400px] mb-8 z-10">
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em] font-black mb-1">Signal Strength</div>
          <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
            {String(score).padStart(3, '0')}
          </div>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="bg-white/5 text-slate-400 hover:text-cyan-400 p-2.5 rounded-xl border border-white/5 transition-all"
        >
          {isPaused ? <LayoutPanelLeft size={18} /> : <RefreshCcw size={18} />}
        </button>
      </div>

      <div 
        className="relative bg-black/40 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
        style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '1/1'
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_70%)]"></div>
        
        {/* Snake Rendering */}
        {snake.map((segment, i) => (
          <div
            key={i}
            className={`rounded-sm shadow-[0_0_8px_rgba(34,211,238,0.3)] ${i === 0 ? 'bg-cyan-400' : 'bg-cyan-900'}`}
            style={{ 
              gridColumnStart: segment.x + 1,
              gridRowStart: segment.y + 1,
              opacity: 1 - (i / snake.length) * 0.5,
              zIndex: snake.length - i
            }}
          />
        ))}

        {/* Food Rendering */}
        <motion.div
          animate={{ 
            scale: [0.6, 0.8, 0.6],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 1, repeat: Infinity }}
          className="bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.6)]"
          style={{ 
            gridColumnStart: food.x + 1,
            gridRowStart: food.y + 1,
          }}
        />

        <AnimatePresence>
          {(gameOver || isPaused) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6 text-center"
            >
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
                {gameOver ? 'Neural Conflict' : 'Simulation Paused'}
              </h3>
              <p className="text-slate-400 text-[10px] font-mono mb-8 uppercase tracking-widest leading-relaxed">
                {gameOver ? 'Cognitive pattern disrupted. Re-initialize flow?' : 'Cognitive simulation on standby.'}
              </p>
              <button
                onClick={gameOver ? resetGame : () => setIsPaused(false)}
                className="bg-white text-black px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all shadow-[0_10px_30px_rgba(34,211,238,0.2)]"
              >
                {gameOver ? 'Re-Sync' : 'Resume Link'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex gap-8 text-slate-500 z-10">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_cyan]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Active Flow</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Aether Node</span>
         </div>
      </div>
    </div>
  );
};
