import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  User,
  CheckCircle2,
  Clock,
  MoreVertical,
  MessageSquare,
  ShieldCheck,
  Activity,
  ArrowRight
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface StudentThread {
  id: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
}

export const AdminSupportDesk: React.FC = () => {
  const { appUser } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [threads, setThreads] = useState<StudentThread[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch unique students who have messages
  useEffect(() => {
    const q = query(collection(db, 'support_messages'), orderBy('createdAt', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const studentMap = new Map();
      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        if (!studentMap.has(d.studentId)) {
          studentMap.set(d.studentId, {
            id: d.studentId,
            name: d.senderName || 'Student',
            lastMessage: d.text,
            lastTime: d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000).toLocaleTimeString() : 'Now',
            unreadCount: 0 // Mocking for now
          });
        }
      });
      setThreads(Array.from(studentMap.values()));
    });
    return unsub;
  }, []);

  // 2. Fetch messages for selected student
  useEffect(() => {
    if (!selectedStudentId) return;

    const q = query(
      collection(db, 'support_messages'),
      where('studentId', '==', selectedStudentId),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return unsub;
  }, [selectedStudentId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedStudentId || !appUser) return;

    const msg = inputText;
    setInputText('');

    await addDoc(collection(db, 'support_messages'), {
      studentId: selectedStudentId,
      senderId: appUser.uid,
      text: msg,
      isAdmin: true,
      senderName: 'Basechan Support',
      createdAt: serverTimestamp(),
    });
  };

  const selectedThread = threads.find(t => t.id === selectedStudentId);

  return (
    <div className="h-[calc(100vh-10rem)] w-full flex bg-slate-950/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl animate-in fade-in duration-500">

      {/* Sidebar: Student Queue */}
      <aside className="w-80 border-r border-white/5 flex flex-col bg-slate-950/20">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Support Queue</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedStudentId(thread.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selectedStudentId === thread.id
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-900/40 border-white/5 hover:bg-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-black text-white">{thread.name}</span>
                <span className="text-[8px] font-bold text-slate-500">{thread.lastTime}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate line-clamp-1">{thread.lastMessage}</p>
            </button>
          ))}
          {threads.length === 0 && (
            <div className="py-20 text-center opacity-20">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest">Inbox Empty</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace: Active Thread */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950/20">
        {selectedStudentId ? (
          <>
            <header className="px-8 py-6 border-b border-white/5 bg-slate-900/20 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-amber-500">
                  {selectedThread?.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{selectedThread?.name}</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Discussion</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all">
                  Resolve Ticket
                </button>
                <button className="p-2 text-slate-500 hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] space-y-2`}>
                    <div className={`p-4 rounded-3xl text-sm ${
                      msg.isAdmin
                        ? 'bg-amber-500 text-slate-950 font-bold rounded-br-none shadow-xl shadow-amber-500/10'
                        : 'bg-slate-900 border border-white/5 text-slate-300 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-[8px] font-bold text-slate-600 uppercase tracking-widest ${msg.isAdmin ? 'text-right' : 'text-left'}`}>
                      {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString() : 'Sending...'}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <footer className="p-8 bg-slate-900/30 border-t border-white/5">
              <form onSubmit={handleReply} className="flex items-center space-x-4">
                <div className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 focus-within:border-amber-500/50 transition-all flex items-center">
                  <input
                    type="text"
                    placeholder="Compose administrative response..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-30">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
               <ShieldCheck className="w-10 h-10" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Select a thread to begin audit</p>
          </div>
        )}
      </main>
    </div>
  );
};
