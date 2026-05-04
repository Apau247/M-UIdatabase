import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Pickaxe, 
  Factory, 
  TrendingUp, 
  FileText, 
  Bot, 
  LogOut, 
  Menu, 
  X,
  Plus,
  Search,
  Database,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './pages/Dashboard';
import Stakeholders from './pages/Stakeholders';
import Mining from './pages/Mining';
import Industry from './pages/Industry';
import Prices from './pages/Prices';
import Explorer from './pages/Explorer';
import Login from './pages/Login';
import AIAssistant from './components/AIAssistant';

// --- Auth Context ---
interface AuthContextType {
  user: any;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext)!;

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, [token]);

  const login = (newToken: string, newUser: any) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-mono text-zinc-400">LOADING_SYSTEM...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="stakeholders" element={<Stakeholders />} />
            <Route path="mining" element={<Mining />} />
            <Route path="industry" element={<Industry />} />
            <Route path="prices" element={<Prices />} />
            <Route path="explorer" element={<Explorer />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function Layout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAIOpen, setAIOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: BarChart3 },
    { name: 'Stakeholders', path: '/stakeholders', icon: Users },
    { name: 'Mining Data', path: '/mining', icon: Pickaxe },
    { name: 'Industry Data', path: '/industry', icon: Factory },
    { name: 'Market Prices', path: '/prices', icon: TrendingUp },
    { name: 'Data Explorer', path: '/explorer', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-[#F5F5F0] text-[#141414] font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-[#141414] text-white flex flex-col transition-all duration-300 border-r border-zinc-800"
      >
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
          <div className="bg-white w-8 h-8 rounded grid place-items-center">
            <Pickaxe className="text-black w-5 h-5" />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="font-bold tracking-tighter text-lg whitespace-nowrap"
            >
              MIU_DB v1.0
            </motion.span>
          )}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive 
                  ? 'bg-white text-black' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 p-2">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold uppercase">
              {user.username[0]}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.username}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{user.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 p-3 rounded-lg text-red-500 hover:bg-red-500/10 w-full transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-100 rounded-md"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-lg font-semibold capitalize tracking-tight">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={() => setAIOpen(true)}
              className="flex items-center gap-2 bg-[#141414] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
            >
              <Bot className="w-4 h-4" />
              AI Assistant
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           <Routes>
             <Route index element={<Dashboard />} />
             <Route path="stakeholders" element={<Stakeholders />} />
             <Route path="mining" element={<Mining />} />
             <Route path="industry" element={<Industry />} />
             <Route path="prices" element={<Prices />} />
             <Route path="explorer" element={<Explorer />} />
           </Routes>
        </div>

        {/* AI Assistant Sidebar Overlay */}
        <AnimatePresence>
          {isAIOpen && (
            <AIAssistant onClose={() => setAIOpen(false)} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
