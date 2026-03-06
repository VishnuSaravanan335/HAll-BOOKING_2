import React, { useState, useEffect } from 'react';
import { User, KPREvent, Hall } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { mockApi } from '../services/mockApi';
import { 
  Shield, 
  Zap, 
  Map as MapIcon, 
  Users as UsersIcon, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Unlock,
  Trash2,
  Plus,
  Eye,
  Settings,
  LayoutDashboard,
  Building2,
  AlertTriangle
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  activeTab: string;
}

export default function AdminDashboard({ user, activeTab }: AdminDashboardProps) {
  const [currentTab, setCurrentTab] = useState('Dashboard');
  const [events, setEvents] = useState<KPREvent[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState({ portal_locked: '0' });
  
  // Forms
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Booker', department: '' });
  const [newHall, setNewHall] = useState({ name: '', capacity: 0, type: 'Hall' });

  const getHallImage = (hallName: string) => {
    if (hallName.toLowerCase().includes('seminar')) {
      return "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1000&auto=format&fit=crop";
  };

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [currentTab]);

  const fetchData = async () => {
    try {
      if (currentTab === 'Dashboard') {
        const data = await mockApi.getEvents();
        setEvents(Array.isArray(data) ? data.filter((e: KPREvent) => e.status === 'Pending_Admin') : []);
      } else if (currentTab === 'Events') {
        const data = await mockApi.getEvents();
        setEvents(Array.isArray(data) ? data.filter((e: KPREvent) => e.status === 'Pending_IT_Reception') : []);
      } else if (currentTab === 'Halls') {
        const data = await mockApi.getHalls();
        setHalls(Array.isArray(data) ? data : []);
      } else if (currentTab === 'Users') {
        const data = await mockApi.getUsers();
        setUsers(Array.isArray(data) ? data : []);
      } else if (currentTab === 'Settings') {
        const data = await mockApi.getSettings();
        setSettings(data);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
    }
  };

  const handleApproveProposal = async (id: number, status: 'Pending_IT_Reception' | 'Declined') => {
    try {
      await mockApi.updateEvent(id, { status });
      alert(status === 'Declined' ? 'Proposal declined.' : 'Proposal approved and forwarded.');
      fetchData();
    } catch (err) {
      console.error('Approve proposal error:', err);
    }
  };

  const handleForceApproval = async (id: number) => {
    try {
      await mockApi.updateEvent(id, { status: 'Pending_Principal' });
      fetchData();
    } catch (err) {
      console.error('Force approval error:', err);
    }
  };

  const toggleHallLock = async (id: number, currentLock: number) => {
    try {
      await mockApi.updateHall(id, { is_locked: currentLock ? 0 : 1 });
      alert(`Hall ${!currentLock ? 'Locked' : 'Unlocked'} successfully.`);
      fetchData();
    } catch (err) {
      console.error('Toggle hall lock error:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mockApi.addUser(newUser);
      setNewUser({ username: '', password: '', role: 'Booker', department: '' });
      fetchData();
    } catch (err) {
      console.error('Add user error:', err);
    }
  };

  const handleAddHall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mockApi.addHall(newHall);
      setNewHall({ name: '', capacity: 0, type: 'Hall' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add hall');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await mockApi.deleteUser(id);
      fetchData();
    } catch (err) {
      console.error('Delete user error:', err);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await mockApi.deleteEvent(id);
      alert('Event deleted successfully.');
      fetchData();
    } catch (err) {
      console.error('Delete event error:', err);
    }
  };

  const handleDeleteHall = async (id: number) => {
    if (!confirm('Are you sure you want to delete this hall?')) return;
    try {
      await mockApi.deleteHall(id);
      alert('Hall deleted successfully.');
      fetchData();
    } catch (err) {
      console.error('Delete hall error:', err);
    }
  };

  const togglePortalLock = async () => {
    try {
      const isLocked = settings.portal_locked === '1';
      await mockApi.updateSettings(!isLocked);
      fetchData();
    } catch (err) {
      console.error('Toggle portal lock error:', err);
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {currentTab === 'Dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <LayoutDashboard className="text-blue-500" size={32} /> Admin Dashboard
              </h2>
              <button 
                onClick={fetchData}
                className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-500 rounded-2xl transition-all shadow-sm"
                title="Refresh Data"
              >
                <Zap size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <div key={event.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-xl">
                      {event.booker_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{event.name}</h3>
                      <p className="text-xs text-slate-500">by {event.booker_name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Date</span>
                      <span className="font-semibold">{event.date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Students</span>
                      <span className="font-semibold">{event.student_count}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                      title="Delete Event"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleApproveProposal(event.id, 'Declined')}
                      className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => handleApproveProposal(event.id, 'Pending_IT_Reception')}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {currentTab === 'Events' && (
          <motion.div key="events" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4 mb-8">
              <Zap className="text-emerald-500" size={32} /> Force Approval
            </h2>
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-x-auto shadow-sm">
              <table className="min-w-[800px] w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Name</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coordinator</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {events.map(event => (
                    <tr key={event.id}>
                      <td className="px-8 py-6 font-bold text-slate-900">{event.name}</td>
                      <td className="px-8 py-6 text-sm text-slate-500">{event.coordinator_name}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          Pending IT/Reception
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleForceApproval(event.id)}
                          className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all flex items-center gap-2 ml-auto"
                        >
                          <Zap size={14} /> Force Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {currentTab === 'Halls' && (
          <motion.div key="halls" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm lg:sticky lg:top-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-emerald-500" /> Create New Hall
                </h3>
                <form onSubmit={handleAddHall} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Hall Name</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newHall.name}
                      onChange={e => setNewHall({...newHall, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Capacity</label>
                    <input 
                      required
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newHall.capacity || ''}
                      onChange={e => setNewHall({...newHall, capacity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newHall.type}
                      onChange={e => setNewHall({...newHall, type: e.target.value})}
                    >
                      <option value="Hall">Hall</option>
                      <option value="Auditorium">Auditorium</option>
                      <option value="OAT">OAT</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
                    Create Hall
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {halls.map(hall => (
                  <div key={hall.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="w-full h-32 bg-slate-100 relative">
                      <img 
                        src={getHallImage(hall.name)} 
                        alt={hall.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button 
                          onClick={() => toggleHallLock(hall.id, hall.is_locked)}
                          className={`p-2 rounded-xl transition-all shadow-sm border ${
                            hall.is_locked 
                              ? 'bg-red-500 text-white border-red-400 hover:bg-red-600' 
                              : 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
                          }`}
                          title={hall.is_locked ? 'Unlock Hall' : 'Lock Hall'}
                        >
                          {hall.is_locked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        <button 
                          onClick={() => handleDeleteHall(hall.id)}
                          className="p-2 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-red-500 hover:border-red-400 rounded-xl transition-all shadow-sm"
                          title="Delete Hall"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${hall.is_locked ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                          {hall.is_locked ? 'Locked' : 'Available'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{hall.name}</h3>
                      <p className="text-xs text-slate-500 mb-4">{hall.type} • {hall.capacity} Capacity</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <Building2 size={14} /> Campus A
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {currentTab === 'Users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm lg:sticky lg:top-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-emerald-500" /> Add New User
                </h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                    <input 
                      required
                      type="password"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Role</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="Booker">Booker</option>
                      <option value="IT">IT</option>
                      <option value="Reception">Reception</option>
                      <option value="Principal">Principal</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Department</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.department}
                      onChange={e => setNewUser({...newUser, department: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-600/20">
                    Create User
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-x-auto shadow-sm">
                <table className="min-w-[600px] w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dept</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-8 py-6 font-bold text-slate-900">{u.username}</td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-500">{u.department}</td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {currentTab === 'Settings' && (
          <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
            <div className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 sm:mb-12 text-center sm:text-left">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0">
                  <Settings size={32} />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Portal Settings</h2>
                  <p className="text-slate-500 font-medium text-sm sm:text-base">Manage global portal configurations</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 bg-slate-50 rounded-3xl border border-slate-100 gap-6">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${settings.portal_locked === '1' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <Lock size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Lock Portal</h4>
                      <p className="text-xs text-slate-500">Temporarily disable all bookings</p>
                    </div>
                  </div>
                  <button 
                    onClick={togglePortalLock}
                    className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all ${
                      settings.portal_locked === '1' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {settings.portal_locked === '1' ? 'LOCKED' : 'UNLOCK'}
                  </button>
                </div>

                {settings.portal_locked === '1' && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 text-sm font-medium">
                    <AlertTriangle size={18} />
                    The portal is currently locked. Non-admin users cannot create new proposals.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
