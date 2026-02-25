import React, { useState, useEffect } from 'react';
import { User } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import BookerDashboard from './components/BookerDashboard';
import ITReceptionDashboard from './components/ITReceptionDashboard';
import PrincipalDashboard from './components/PrincipalDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Persist login state
  useEffect(() => {
    const savedUser = localStorage.getItem('kpr_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      console.log('Loaded User from Storage:', parsed);
      setUser(parsed);
    }
  }, []);

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

  return (
    <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {user.role === 'Booker' && <BookerDashboard user={user} activeTab={activeTab} />}
      {(user.role === 'IT' || user.role === 'Reception') && <ITReceptionDashboard user={user} activeTab={activeTab} />}
      {user.role === 'Principal' && <PrincipalDashboard user={user} activeTab={activeTab} />}
      {user.role === 'Admin' && <AdminDashboard user={user} activeTab={activeTab} />}
    </Layout>
  );
}
