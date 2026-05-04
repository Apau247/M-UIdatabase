import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../App';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Prices() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try { setPrices(await apiFetch('/prices')); } catch(e) {} finally { setLoading(false); }
  };

  const simulateUpdate = async () => {
    const commodities = ['Gold', 'Bauxite', 'Iron Ore', 'Natural Gas', 'Lithium'];
    const r = Math.floor(Math.random() * commodities.length);
    const p = Math.random() * 2000 + 100;
    try {
      await apiFetch('/prices', { method: 'POST', body: JSON.stringify({ commodity_name: commodities[r], price: p }) });
      loadData();
    } catch(e) {}
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Prices</h1>
          <p className="text-sm text-zinc-500">Global commodity tracking and index.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={loadData} className="p-2 border border-zinc-200 rounded-xl hover:bg-zinc-50">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {user.role !== 'Viewer' && (
            <button onClick={simulateUpdate} className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 text-sm">
                Simulate Market Shift
            </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Price Table */}
           <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2 italic serif text-lg"><TrendingUp className="w-5 h-5" /> Live Tick Data</h3>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[500px]">
                    <div className="divide-y divide-zinc-100">
                        {loading && <div className="p-12 text-center text-xs font-mono text-zinc-400">STREAMING_TICK_DATA...</div>}
                        {prices.map((p, i) => (
                            <div key={p.id} className="p-4 hover:bg-zinc-50 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-black text-white grid place-items-center font-bold text-xs">
                                        {p.commodity_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{p.commodity_name}</p>
                                        <p className="text-[10px] text-zinc-400 font-mono">{new Date(p.date_time).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold font-mono text-sm">${p.price.toLocaleString()}</p>
                                    <div className={`flex items-center justify-end text-[10px] font-bold ${i % 3 === 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {i % 3 === 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                        {(Math.random() * 2).toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
           </div>

           {/* Trend Chart */}
           <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-8 flex flex-col">
                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-2">Aggregate Index Trend</h3>
                    <p className="text-xs text-zinc-400">Showing combined volatility for major commodities.</p>
                </div>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prices.reverse().slice(-20)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="id" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#aaa'}} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Line type="stepAfter" dataKey="price" stroke="#141414" strokeWidth={3} dot={false} animationDuration={1500} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-8 p-4 bg-zinc-50 rounded-2xl flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg border border-zinc-200">
                        <BarChart className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Volatility Analysis</p>
                        <p className="text-sm font-medium">Markets showing moderate confidence in bauxite reserves.</p>
                    </div>
                </div>
           </div>
      </div>
    </div>
  );
}
