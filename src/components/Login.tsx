import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { mockApi } from '../services/mockApi';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const users = await mockApi.getUsers();
      const user = users.find(u => u.username === username && username === password); // Simple mock login
      
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-6 sm:p-12 border border-white/20 relative z-10"
      >
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-full max-w-[320px] h-40 mx-auto mb-6 sm:mb-8 flex items-center justify-center bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
            <img 
              src="https://kprcas.ac.in/wp-content/uploads/2022/01/KPRCAS-Logo.png" 
              alt="KPRCAS Logo" 
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 sm:mb-3">KPR HUB</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium">Event & Inventory Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Username</label>
            <div className="relative group">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-slate-900"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Password</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium text-slate-900"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm text-center font-bold border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-slate-900 via-blue-700 to-emerald-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-blue-600/20 active:scale-[0.98]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Demo Credentials</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-[10px] sm:text-xs font-medium text-gray-500">
            <div className="bg-gray-50 p-2 rounded-lg">admin / admin</div>
            <div className="bg-gray-50 p-2 rounded-lg">student / student</div>
            <div className="bg-gray-50 p-2 rounded-lg">it / it</div>
            <div className="bg-gray-50 p-2 rounded-lg">reception / reception</div>
            <div className="bg-gray-50 p-2 rounded-lg sm:col-span-2">principal / principal</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
