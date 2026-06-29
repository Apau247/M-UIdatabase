import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Pickaxe, Calendar, DollarSign, Box } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../App';

export default function Mining() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    mineral_type: 'Gold',
    production_volume: 0,
    export_volume: 0,
    royalties: 0,
    corporate_tax: 0,
    dividend_tax: 0,
    reserve_value: 0,
    equity_stake: 0,
    date_recorded: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try { setData(await apiFetch('/mining')); } catch(e) { console.error('Failed to load mining data', e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/mining', { method: 'POST', body: JSON.stringify(formData) });
      setIsModalOpen(false);
      loadData();
    } catch(e) { console.error('Failed to submit mining record', e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mining Data</h1>
          <p className="text-sm text-zinc-500">Mineral production and fiscal contributions.</p>
        </div>
        {user.role !== 'Viewer' && (
          <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 text-sm">
            <Plus className="w-4 h-4" /> Record Entry
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-100">
                <th className="px-6 py-4">Mineral</th>
                <th className="px-6 py-4">Production Vol.</th>
                <th className="px-6 py-4">Export Vol.</th>
                <th className="px-6 py-4">Royalties</th>
                <th className="px-6 py-4">Reserve Val.</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-mono text-xs">QUERYING_BLOCKS...</td></tr>
              ) : data.map(m => (
                <tr key={m.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4 font-bold capitalize">{m.mineral_type}</td>
                  <td className="px-6 py-4 font-mono">{m.production_volume?.toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono">{m.export_volume?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-green-600 font-bold">${m.royalties?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-zinc-500">${m.reserve_value?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs text-zinc-400">{new Date(m.date_recorded).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-[60]">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-3xl p-8 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-6">New Resource Entry</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Mineral Type</label>
                <input value={formData.mineral_type} onChange={e => setFormData({...formData, mineral_type: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Date Recorded</label>
                <input type="date" value={formData.date_recorded} onChange={e => setFormData({...formData, date_recorded: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Production Volume</label>
                <input type="number" value={formData.production_volume} onChange={e => setFormData({...formData, production_volume: Number(e.target.value)})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
               <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Export Volume</label>
                <input type="number" value={formData.export_volume} onChange={e => setFormData({...formData, export_volume: Number(e.target.value)})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Royalties (USD)</label>
                <input type="number" value={formData.royalties} onChange={e => setFormData({...formData, royalties: Number(e.target.value)})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Corporate Tax (USD)</label>
                <input type="number" value={formData.corporate_tax} onChange={e => setFormData({...formData, corporate_tax: Number(e.target.value)})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div className="col-span-2 flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-zinc-200 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold">Log Record</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
