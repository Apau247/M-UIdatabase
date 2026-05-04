import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Pickaxe, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { apiFetch } from '../lib/api';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [miningData, setMiningData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, miningList] = await Promise.all([
          apiFetch('/stats'),
          apiFetch('/mining')
        ]);
        setStats(statsData);
        setMiningData(miningList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl" />)}
    </div>
    <div className="h-96 bg-white rounded-2xl" />
  </div>;

  const kpis = [
    { name: 'Active Stakeholders', value: stats.stakeholders, icon: Users, color: 'text-blue-600' },
    { name: 'Total Production (T)', value: stats.production.toLocaleString(), icon: Pickaxe, color: 'text-orange-600' },
    { name: 'Mining Royalties', value: `$${(stats.royalties / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-green-600' },
    { name: 'System Activity', value: 'High', icon: Activity, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 italic serif">Executive Overview</h1>
        <p className="text-zinc-500">Real-time metrics from the Mining & Industry Unit.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={kpi.name} 
            className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl bg-zinc-50 ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-50 px-2 py-1 rounded"> +12.5%</span>
            </div>
            <p className="text-sm font-medium text-zinc-500 mb-1">{kpi.name}</p>
            <p className="text-2xl font-bold font-mono tracking-tighter">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Production vs Export Volume
            </h3>
            <select className="bg-zinc-50 border border-zinc-200 rounded-lg text-sm px-3 py-1 outline-none">
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={miningData.slice(-10)}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date_recorded" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="production_volume" name="Production" stroke="#141414" fillOpacity={1} fill="url(#colorProd)" strokeWidth={3} />
                <Area type="monotone" dataKey="export_volume" name="Export" stroke="#8E9299" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Trends Sidebar */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Live Market Prices</h3>
          <div className="space-y-6">
            {stats.latestPrices.map((price: any) => (
              <div key={price.id} className="flex items-center justify-between pb-4 border-b border-zinc-100 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 grid place-items-center">
                    <span className="font-bold text-xs uppercase">{price.commodity_name.substring(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight">{price.commodity_name}</p>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase">{new Date(price.date_time).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold font-mono text-sm">${price.price.toFixed(2)}</p>
                  <span className="text-[10px] text-green-500 font-medium">+0.4%</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl border border-zinc-200 text-sm font-semibold hover:bg-zinc-50 transition-colors">
            View All Prices
          </button>
        </div>
      </div>
    </div>
  );
}
