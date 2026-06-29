import React, { useState, useEffect } from 'react';
import { Plus, Factory, Box, ArrowRightLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../App';

export default function Industry() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    sector: '',
    production_volume: 0,
    import_volume: 0,
    export_volume: 0,
    reporting_period: 'Q1-2025'
  });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try { setData(await apiFetch('/industry')); } catch(e) { console.error('Failed to load industry data', e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/industry', { method: 'POST', body: JSON.stringify(formData) });
      setIsModalOpen(false);
      loadData();
    } catch(e) { console.error('Failed to submit industry record', e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Industry Data</h1>
          <p className="text-sm text-zinc-500">Non-mining sector performance metrics.</p>
        </div>
        {user.role !== 'Viewer' && (
          <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 text-sm">
            <Plus className="w-4 h-4" /> Add Sector Data
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full h-40 flex items-center justify-center font-mono text-xs text-zinc-400">INDEXING_SECTORS...</div>
        ) : data.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Factory className="w-20 h-20" />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center">
                 <Box className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="font-bold tracking-tight">{item.sector}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{item.reporting_period}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-50 p-3 rounded-xl">
                <p className="text-[8px] text-zinc-400 font-bold uppercase mb-1">Prod.</p>
                <p className="font-mono text-xs font-bold">{item.production_volume?.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl">
                <p className="text-[8px] text-zinc-400 font-bold uppercase mb-1">Imp.</p>
                <p className="font-mono text-xs font-bold">{item.import_volume?.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl text-green-600">
                <p className="text-[8px] text-zinc-400 font-bold uppercase mb-1">Exp.</p>
                <p className="font-mono text-xs font-bold">{item.export_volume?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-[60]">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6">Add Industry Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Sector Name</label>
                <input required value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" placeholder="e.g. Textiles, Agritech" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Production Volume</label>
                  <input type="number" value={formData.production_volume} onChange={e => setFormData({...formData, production_volume: Number(e.target.value)})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Reporting Period</label>
                  <input value={formData.reporting_period} onChange={e => setFormData({...formData, reporting_period: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-zinc-200 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold">Save Record</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
