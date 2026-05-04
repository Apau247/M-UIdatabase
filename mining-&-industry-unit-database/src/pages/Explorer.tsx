import React, { useState } from 'react';
import { Database, Terminal, Play, Download, Search, AlertTriangle, Info } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../App';

export default function Explorer() {
  const [query, setQuery] = useState('SELECT * FROM mining_data LIMIT 10');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleExecute = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/explorer', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      Object.keys(results[0]).join(','),
      ...results.map(row => Object.values(row).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
  };

  return (
    <div className="space-y-8 h-full flex flex-col pb-12">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Explorer</h1>
          <p className="text-sm text-zinc-500">Flexible SQL querying and data extraction.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
          {/* Query Editor */}
          <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold flex items-center gap-2"><Terminal className="w-4 h-4" /> SQL Console</h3>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-2 py-1 rounded">Read-Only Access</span>
                    </div>
                    <textarea 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 w-full bg-[#1a1a1a] text-[#8eec20] p-6 font-mono text-xs rounded-2xl resize-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-none"
                        spellCheck={false}
                    />
                    <div className="mt-6 flex flex-col gap-3">
                        <button 
                            onClick={handleExecute}
                            disabled={loading || !query.trim()}
                            className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Execute Query
                        </button>
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex gap-3">
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-blue-700 leading-relaxed font-medium capitalize">
                                Use valid table names: stakeholders, mining_data, industry_data, market_prices. Consult MIA (AI Assistant) if you need help writing a query.
                            </p>
                        </div>
                    </div>
                </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col min-h-0 shadow-lg shadow-zinc-200/50">
               <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
                    <h3 className="font-bold flex items-center gap-2"><Database className="w-4 h-4" /> Results</h3>
                    {results.length > 0 && (
                        <button 
                            onClick={handleExport}
                            className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-indigo-600 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" /> Export as CSV
                        </button>
                    )}
               </div>
               <div className="flex-1 overflow-auto p-0 relative">
                   {loading && (
                       <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                           <div className="flex flex-col items-center gap-3">
                               <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                               <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Fetching Data Blocks...</p>
                           </div>
                       </div>
                   )}

                   {error ? (
                       <div className="p-12 text-center">
                           <div className="bg-red-50 text-red-500 p-6 rounded-2xl inline-block border border-red-100">
                               <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
                               <p className="font-mono text-xs">{error}</p>
                           </div>
                       </div>
                   ) : results.length > 0 ? (
                       <table className="w-full text-left border-collapse">
                           <thead className="sticky top-0 bg-zinc-50 z-10">
                               <tr className="border-b border-zinc-100">
                                   {Object.keys(results[0]).map(key => (
                                       <th key={key} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">{key}</th>
                                   ))}
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-zinc-100">
                               {results.map((row, i) => (
                                   <tr key={i} className="hover:bg-zinc-50 transition-colors">
                                       {Object.values(row).map((val: any, j) => (
                                           <td key={j} className="px-4 py-3 text-xs font-medium text-zinc-600 font-mono truncate max-w-xs">{String(val)}</td>
                                       ))}
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   ) : (
                       <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-12 text-center opacity-40">
                           <Search className="w-16 h-16 mb-4 stroke-1" />
                           <p className="font-bold text-sm">Query execution required.</p>
                           <p className="text-xs mt-1">Enter a SQL query in the console to explore the database.</p>
                       </div>
                   )}
               </div>
               <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 text-[10px] font-bold text-zinc-400 flex justify-between shrink-0">
                    <span>RECORDS_COUNT: {results.length}</span>
                    <span>ENGINE: SQLITE_V3_INTERNAL</span>
               </div>
          </div>
      </div>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
