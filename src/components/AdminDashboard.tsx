import React, { useState, useEffect } from 'react';
import { User, Event, Hall } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Zap, 
  Map, 
  Users as UsersIcon, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Unlock,
  Trash2,
  Plus,
  Eye,
  Settings
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  activeTab: string;
}

export default function AdminDashboard({ user, activeTab }: AdminDashboardProps) {
  const [phase, setPhase] = useState(1);
  const [events, setEvents] = useState<Event[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // User Form State
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Booker', department: '' });

  useEffect(() => {
    if (activeTab === 'Dashboard') setPhase(1);
    else if (activeTab === 'Events') setPhase(2);
    else if (activeTab === 'Inventory') setPhase(3);
    else if (activeTab === 'Users') setPhase(4);
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [phase]);

  const fetchData = async () => {
    try {
      if (phase === 1 || phase === 2) {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (Array.isArray(data)) {
          if (phase === 1) setEvents(data.filter((e: Event) => e.status === 'Pending_Admin'));
          else if (phase === 2) setEvents(data.filter((e: Event) => e.status === 'Pending_IT_Reception'));
        } else {
          setEvents([]);
        }
      } else if (phase === 3) {
        const res = await fetch('/api/halls');
        const data = await res.json();
        setHalls(Array.isArray(data) ? data : []);
      } else if (phase === 4) {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
    }
  };

  const handleApproveProposal = async (id: number, status: 'Pending_IT_Reception' | 'Declined') => {
    await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
    setSelectedEvent(null);
  };

  const handleForceApproval = async (id: number) => {
    await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Pending_Principal' }),
    });
    fetchData();
  };

  const toggleHallLock = async (id: number, currentLock: number) => {
    await fetch(`/api/halls/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_locked: !currentLock }),
    });
    fetchData();
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    setNewUser({ username: '', password: '', role: 'Booker', department: '' });
    fetchData();
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="space-y-8">
      {/* Phase Selector */}
      <div className="flex gap-4 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 w-fit shadow-sm">
        {[1, 2, 3, 4].map(p => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 ${
              phase === p ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            {p === 1 && <Shield size={16} />}
            {p === 2 && <Zap size={16} />}
            {p === 3 && <Map size={16} />}
            {p === 4 && <UsersIcon size={16} />}
            Phase {p}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.div key="p1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-8">
            <div className="col-span-12">
              <h2 className="text-2xl font-bold mb-6">New Event Proposals</h2>
              <div className="grid grid-cols-3 gap-6">
                {Array.isArray(events) && events.map(event => (
                  <div key={event.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold text-xl">
                        {event.booker_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{event.name}</h3>
                        <p className="text-xs text-gray-500">by {event.booker_name || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Date</span>
                        <span className="font-semibold">{event.date}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Students</span>
                        <span className="font-semibold">{event.student_count}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
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
                        className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="p2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold mb-6">Force Approval (IT & Reception Bypass)</h2>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Event Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coordinator</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Array.isArray(events) && events.map(event => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 font-bold text-gray-900">{event.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{event.coordinator_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          Pending IT/Reception
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
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

        {phase === 3 && (
          <motion.div key="p3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold mb-6">Hall Management</h2>
            <div className="grid grid-cols-4 gap-6">
              {halls.map(hall => (
                <div key={hall.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                      <Map size={24} />
                    </div>
                    <button 
                      onClick={() => toggleHallLock(hall.id, hall.is_locked)}
                      className={`p-2 rounded-xl transition-all ${hall.is_locked ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}
                    >
                      {hall.is_locked ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{hall.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">{hall.type} • {hall.capacity} Capacity</p>
                  <button className="w-full py-2 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                    <Eye size={14} /> View Logs
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 4 && (
          <motion.div key="p4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-8">
            <div className="col-span-4">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm sticky top-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-emerald-500" /> Add New User
                </h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                    <input 
                      required
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Role</label>
                    <select 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
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
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Department</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newUser.department}
                      onChange={e => setNewUser({...newUser, department: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                    Create User
                  </button>
                </form>
              </div>
            </div>
            <div className="col-span-8">
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dept</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 font-bold text-gray-900">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.department}</td>
                        <td className="px-6 py-4 text-right">
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
      </AnimatePresence>
    </div>
  );
}
