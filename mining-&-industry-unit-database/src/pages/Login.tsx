import React, { useState } from 'react';
import { Pickaxe, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../App';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123'); // Default from seed
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[2rem] shadow-2xl border border-zinc-200 overflow-hidden">
          <div className="p-12 text-center">
            <div className="inline-flex p-4 bg-black text-white rounded-2xl mb-8 shadow-xl">
              <Pickaxe className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter mb-2 italic serif">MIU_SYSTEM</h1>
            <p className="text-zinc-500 mb-10 text-sm">Mining & Industry Unit Database Login</p>

            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 ml-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
              <button 
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {loading ? 'AUTHENTICATING...' : (
                  <>
                    Infiltrate System <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
          <div className="bg-zinc-50 p-6 flex items-center justify-center gap-2 border-t border-zinc-100">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Classified Access Only</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
