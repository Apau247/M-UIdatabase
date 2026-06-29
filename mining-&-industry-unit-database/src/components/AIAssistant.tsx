import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  onClose: () => void;
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "Hello! I'm MIA. How can I assist you with the mining and industry database today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error processing your request. Please ensure my connection to the database is stable." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl flex flex-col z-50 border-l border-zinc-200"
    >
      <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold tracking-tight">MIU Intelligence (MIA)</h3>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">AI Analytics Engine</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              m.role === 'user' 
              ? 'bg-black text-white rounded-tr-none shadow-lg' 
              : 'bg-zinc-50 border border-zinc-100 text-zinc-800 rounded-tl-none'
            }`}>
              {m.role === 'assistant' && <div className="text-[10px] font-bold text-zinc-400 uppercase mb-2 flex items-center gap-1"><Bot className="w-3 h-3" /> MIA RESPONSE</div>}
              <div className="prose prose-sm prose-zinc">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-50 p-4 rounded-2xl rounded-tl-none border border-zinc-100 flex gap-1">
              {[0, 1, 2].map(d => (
                <motion.div 
                  key={d}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }}
                  className="w-1.5 h-1.5 bg-zinc-300 rounded-full" 
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-zinc-100 bg-zinc-50/30">
        <div className="relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask anything about the mining database..."
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 pr-14 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none shadow-sm"
            rows={2}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-3 bottom-3 p-3 bg-black text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-black transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
            <button 
                onClick={() => setInput("Summarize gold exports for 2025")}
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-200 px-2 py-1 rounded hover:bg-white transition-colors"
            >
                Summarize Gold
            </button>
            <button 
                onClick={() => setInput("Who are the top stakeholders in government?")}
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-200 px-2 py-1 rounded hover:bg-white transition-colors"
            >
                Top Stakeholders
            </button>
        </div>
      </div>
    </motion.div>
  );
}
