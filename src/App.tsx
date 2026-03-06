import React, { useState, useEffect } from 'react';
import { User } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import BookerDashboard from './components/BookerDashboard';
import ITReceptionDashboard from './components/ITReceptionDashboard';
import PrincipalDashboard from './components/PrincipalDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Lock } from 'lucide-react';
import { mockApi } from './services/mockApi';

export default function App() {
  console.log("[APP] Rendering App component");
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isLocked, setIsLocked] = useState(false);

  // Persist login state
  useEffect(() => {
    const savedUser = localStorage.getItem('kpr_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await mockApi.getSettings();
      setIsLocked(data.portal_locked === '1');
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('kpr_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kpr_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (isLocked && user.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl text-center">
          <div className="w-64 h-32 mx-auto mb-8 flex items-center justify-center bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
            <img 
              src="https://kprcas.ac.in/wp-content/uploads/2022/01/KPRCAS-Logo.png" 
              alt="KPRCAS Logo" 
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Portal Locked</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            The KPR HUB portal is temporarily locked for maintenance or administrative reasons. 
            Please check back later or contact the administrator.
          </p>
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {user.role === 'Booker' && <BookerDashboard user={user} activeTab={activeTab} isLocked={isLocked} />}
      {(user.role === 'IT' || user.role === 'Reception') && <ITReceptionDashboard user={user} activeTab={activeTab} />}
      {user.role === 'Principal' && <PrincipalDashboard user={user} activeTab={activeTab} />}
      {user.role === 'Admin' && <AdminDashboard user={user} activeTab={activeTab} />}
    </Layout>
  );
}
