import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { FolderKanban, Plus, Hash } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  description: string;
}

export const WorkspaceManager: React.FC<{ userId: string, onSelect: (id: string) => void, selectedId: string | null }> = ({ userId, onSelect, selectedId }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    // SECURITY FIX: Query MUST include where clause when rules enforce field-level security
    const q = query(
      collection(db, 'workspaces'), 
      where('ownerId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workspace));
      setWorkspaces(data);
      if (data.length > 0 && !selectedId) onSelect(data[0].id);
    });

    return () => unsubscribe();
  }, [userId]);

  const createWorkspace = async () => {
    if (!newName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, 'workspaces'), {
        name: newName,
        ownerId: userId,
        createdAt: serverTimestamp(),
      });
      setNewName('');
      onSelect(docRef.id);
    } catch (e) {
      handleFirestoreError(e, 'create', '/workspaces');
    }
  };

  return (
    <div className="bg-black/40 border-r border-white/5 w-72 flex flex-col h-screen backdrop-blur-3xl z-20 overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
          <h2 className="text-slate-100 font-bold text-xs uppercase tracking-[0.3em]">Workspaces</h2>
        </div>

        <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2 h-[calc(100vh-250px)]">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => onSelect(ws.id)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all group ${
                selectedId === ws.id 
                  ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest truncate">{ws.name}</span>
              {selectedId === ws.id && <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-white/5 bg-black/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New Aether Area..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] text-white focus:outline-none focus:border-cyan-500/50 font-mono tracking-wider uppercase"
          />
          <button
            onClick={createWorkspace}
            className="bg-white/10 text-slate-100 p-2.5 rounded-xl hover:bg-white/20 transition-all border border-white/10"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
