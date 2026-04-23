import React, { useState, useEffect } from 'react';
import { fetchCalendarEvents } from '../../lib/calendar';
import { Calendar as CalendarIcon, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export const CalendarAgenda: React.FC<{ accessToken: string }> = ({ accessToken }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const items = await fetchCalendarEvents(accessToken);
        setEvents(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [accessToken]);

  if (loading) return <div className="p-4 text-zinc-500 font-mono text-xs uppercase animate-pulse">Syncing Agenda...</div>;

  return (
    <div className="glass-panel p-6 overflow-hidden flex flex-col h-full group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
           <CalendarIcon className="text-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" size={18} />
           <h3 className="text-slate-200 font-bold text-[11px] uppercase tracking-[0.2em]">Timeline</h3>
        </div>
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Chronos Feed</div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar relative">
        <div className="absolute left-[7px] top-2 bottom-4 w-px bg-white/5 group-hover:bg-white/10 transition-colors"></div>
        
        {events.length === 0 ? (
          <div className="text-center py-10 text-slate-600 font-mono text-[10px] uppercase tracking-widest">Temporal flow empty</div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id}
              className="relative pl-8 group/event"
            >
              <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-slate-900 group-hover/event:bg-purple-500 transition-all shadow-[0_0_8px_rgba(0,0,0,0.5)]"></div>
              
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-[10px] text-purple-400 font-mono font-bold tracking-tighter">
                   <Clock size={10} />
                   {event.start?.dateTime ? format(new Date(event.start.dateTime), 'HH:mm') : 'ALL-DAY'}
                   <span className="opacity-30 text-slate-400">•</span>
                   <span className="text-slate-500">{event.start?.dateTime ? format(new Date(event.start.dateTime), 'MMM d') : ''}</span>
                </div>
                <div className="flex justify-between items-start mt-1">
                  <span className="text-slate-200 text-xs font-bold leading-tight group-hover/event:text-white transition-colors truncate max-w-[85%]">{event.summary || 'Untethered Event'}</span>
                  <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover/event:opacity-100 text-slate-500 hover:text-cyan-400 transition-all p-1">
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
