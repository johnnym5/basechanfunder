import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  X,
  User,
  ShieldCheck,
  MoreHorizontal,
  ArrowLeft,
  Circle
} from 'lucide-react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  isAdmin: boolean;
}

export const StudentSupportChat: React.FC = () => {
  const { appUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!appUser?.uid) return;

    // In a production app, we'd fetch based on a threadId
    const q = query(
      collection(db, 'support_messages'),
      where('studentId', '==', appUser.uid),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return unsub;
  }, [appUser?.uid]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !appUser) return;

    const msg = inputText;
    setInputText('');

    await addDoc(collection(db, 'support_messages'), {
      studentId: appUser.uid,
      senderId: appUser.uid,
      text: msg,
      isAdmin: false,
      senderName: appUser.displayName,
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="h-[80vh] w-full max-w-md mx-auto flex flex-col bg-slate-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">

      {/* Chat Header */}
      <header className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Concierge Support</h3>
            <div className="flex items-center space-x-1.5">
               <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Online</span>
            </div>
          </div>
        </div>
        <button className="p-2 text-slate-500 hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium ${
              msg.isAdmin
                ? 'bg-slate-900 border border-white/5 text-slate-300 rounded-bl-none'
                : 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold rounded-br-none shadow-lg shadow-amber-500/10'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <div className="p-6 bg-slate-900/30 backdrop-blur-xl border-t border-white/5">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3 bg-slate-950 border border-white/10 p-2 rounded-2xl focus-within:border-amber-500/50 transition-all">
          <button type="button" className="p-2 text-slate-500 hover:text-amber-500 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-xs text-white px-2"
          />
          <button
            type="submit"
            className="p-2.5 bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
