import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  Database,
  Terminal,
  RefreshCw,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { apiFetch } from '../lib/api';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  onClose: () => void;
}

const SYSTEM_PROMPT = `You are the MIU Intelligence Agent (MIA), an AI assistant for the Mining & Industry Unit Database.
Your goal is to help users query, analyze, and understand mining and industry data.

DATABASE SCHEMA:
- stakeholders: id, full_name, position, organization, email, phone, category
- mining_data: id, mineral_type, production_volume, export_volume, royalties, corporate_tax, dividend_tax, reserve_value, equity_stake, date_recorded
- industry_data: id, sector, production_volume, import_volume, export_volume, reporting_period
- market_prices: id, commodity_name, price, date_time

CAPABILITIES:
1. Query Data: You can fetch real-time data from the database using natural language.
2. Summarization: You can provide summaries of production, exports, and market trends.
3. SQL Conversion: If asked for a query, you can generate and execute it.

GUIDELINES:
- Be professional, technical yet accessible.
- Always provide units (e.g., Tons, USD) if available.
- If you don't know something, ask for clarification or use the search tool.
- Use the tools provided to fetch REAL data. Do not make up numbers.
`;

const schemaTools: FunctionDeclaration[] = [
  {
    name: "executeQuery",
    description: "Executes a SQL SELECT query against the Mining & Industry Database and returns the results.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sql: {
          type: Type.STRING,
          description: "The SQL SELECT query to execute. Example: 'SELECT * FROM mining_data WHERE mineral_type = \"Gold\"'"
        }
      },
      required: ["sql"]
    }
  },
  {
     name: "getMarketStatus",
     description: "Fetches current market prices for key minerals.",
     parameters: {
       type: Type.OBJECT,
       properties: {}
     }
  }
];

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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: schemaTools }]
        }
      });

      // Prepare history
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // In a real app we'd pass history to chat. But for simplicity here we'll just send the message.
      // We'll simulate a multi-turn by just sending the message with tool support.
      
      let response = await chat.sendMessage({ message: userMessage });
      
      // Handle Function Calls
      let toolInvocations = response.functionCalls;
      
      while (toolInvocations && toolInvocations.length > 0) {
        const toolResponses = await Promise.all(toolInvocations.map(async (call) => {
          if (call.name === 'executeQuery') {
            try {
              const data = await apiFetch('/explorer', {
                method: 'POST',
                body: JSON.stringify({ query: (call.args as any).sql })
              });
              return { name: call.name, response: { content: data } };
            } catch (err: any) {
              return { name: call.name, response: { error: err.message } };
            }
          }
          if (call.name === 'getMarketStatus') {
            const data = await apiFetch('/prices');
            return { name: call.name, response: { content: data } };
          }
          return { name: call.name, response: { error: "Unknown tool" } };
        }));

        response = await chat.sendMessage({ 
          message: toolResponses.map(r => ({ functionResponse: r })) as any 
        });
        toolInvocations = response.functionCalls;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
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
