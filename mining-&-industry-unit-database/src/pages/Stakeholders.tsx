import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Mail, Phone, Building } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../App';

export default function Stakeholders() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    organization: '',
    email: '',
    phone: '',
    category: 'private sector'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await apiFetch('/stakeholders');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/stakeholders', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsModalOpen(false);
      setFormData({ full_name: '', position: '', organization: '', email: '', phone: '', category: 'private sector' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this stakeholder?')) return;
    try {
      await apiFetch(`/stakeholders/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = data.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stakeholders</h1>
          <p className="text-sm text-zinc-500">Manage government and industry partners.</p>
        </div>
        {user.role !== 'Viewer' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Add Stakeholder
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by name or organization..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-black outline-none"
            />
          </div>
          <button className="px-4 py-2 border border-zinc-200 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-50">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-100">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Contact</th>
                {user.role === 'Admin' && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-mono text-xs">LOADING_RECORDS...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">No stakeholders found.</td>
                </tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm tracking-tight">{s.full_name}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">{s.position}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="w-3.5 h-3.5 text-zinc-400" />
                      {s.organization}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                      s.category === 'government' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {s.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Mail className="w-3 h-3" /> {s.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Phone className="w-3 h-3" /> {s.phone}
                      </div>
                    </div>
                  </td>
                  {user.role === 'Admin' && (
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-[60]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-3xl p-8"
          >
            <h2 className="text-xl font-bold mb-6">Register Stakeholder</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Full Name</label>
                  <input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Position</label>
                  <input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Organization</label>
                  <input value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Phone</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                    <option value="government">Government</option>
                    <option value="private sector">Private Sector</option>
                    <option value="association">Association</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-zinc-200 rounded-xl font-bold hover:bg-zinc-50">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-zinc-800">Save Personnel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
