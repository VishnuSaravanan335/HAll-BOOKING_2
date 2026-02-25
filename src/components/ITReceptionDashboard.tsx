import React, { useState, useEffect } from 'react';
import { User, Event, EventInventoryItem, InventoryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  FileText, 
  Download,
  AlertCircle,
  Save,
  ChevronRight,
  ChevronLeft,
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Filter,
  History as HistoryIcon,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Info,
  ArrowRight
} from 'lucide-react';

interface ITReceptionDashboardProps {
  user: User;
  activeTab: string;
}

export default function ITReceptionDashboard({ user, activeTab }: ITReceptionDashboardProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [inventory, setInventory] = useState<EventInventoryItem[]>([]);
  const [allInventoryItems, setAllInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // History Filters
  const [historyFilters, setHistoryFilters] = useState({
    name: '',
    date: '',
    department: ''
  });

  // Inventory Management State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', stock_qty: 0 });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchAllInventory();
  }, [activeTab]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Fetch events error:', err);
      setEvents([]);
    }
  };

  const fetchAllInventory = async () => {
    try {
      const res = await fetch('/api/inventory-items');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllInventoryItems(data.filter(i => i.department === user.role));
      }
    } catch (err) {
      console.error('Fetch all inventory error:', err);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name) return;
    try {
      await fetch('/api/inventory-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, department: user.role }),
      });
      setIsAddingItem(false);
      setNewItem({ name: '', stock_qty: 0 });
      fetchAllInventory();
    } catch (err) {
      console.error('Add item error:', err);
    }
  };

  const handleUpdateStock = async () => {
    if (!editingItem) return;
    try {
      await fetch(`/api/inventory-items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_qty: editingItem.stock_qty }),
      });
      setEditingItem(null);
      fetchAllInventory();
    } catch (err) {
      console.error('Update stock error:', err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to remove this item?')) return;
    try {
      await fetch(`/api/inventory-items/${id}`, { method: 'DELETE' });
      fetchAllInventory();
    } catch (err) {
      console.error('Delete item error:', err);
    }
  };

  const fetchInventory = async (eventId: number) => {
    try {
      const res = await fetch(`/api/event-inventory/${eventId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setInventory(data);
      } else {
        setInventory([]);
      }
    } catch (err) {
      console.error('Fetch inventory error:', err);
      setInventory([]);
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    fetchInventory(event.id);
  };

  const handleUpdateInventory = async (id: number, field: string, value: number) => {
    setInventory(inventory.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const filteredInventory = inventory.filter(item => item.department === user.role);

  const handleDeleteEvent = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
      fetchEvents();
    } catch (err) {
      console.error('Delete event error:', err);
    }
  };

  const handleDeclineEvent = async () => {
    if (!selectedEvent) return;
    if (!confirm('Are you sure you want to decline this event?')) return;
    try {
      await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Declined' }),
      });
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      console.error('Decline event error:', err);
    }
  };

  const exportCSV = () => {
    const headers = ['Event Name', 'Coordinator', 'Date', 'Status', 'Dept'];
    const rows = events.map(e => [e.name, e.coordinator_name, e.date, e.status, e.department]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${user.role}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today && (e.status === 'Pending_IT_Reception' || e.status === 'Pending_Principal' || e.status === 'Approved');
  });

  const historyEvents = events.filter(e => {
    const matchesName = e.name.toLowerCase().includes(historyFilters.name.toLowerCase());
    const matchesDate = historyFilters.date ? e.date === historyFilters.date : true;
    const matchesDept = historyFilters.department ? e.department === historyFilters.department : true;
    return matchesName && matchesDate && matchesDept;
  });

  const stats = {
    pending: events.filter(e => e.status === 'Pending_IT_Reception').length,
    approved: events.filter(e => e.status === 'Approved').length,
    rejected: events.filter(e => e.status === 'Declined').length
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {activeTab === 'Dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
                  <Clock size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Approval</p>
                  <h3 className="text-3xl font-black text-slate-900">{stats.pending}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Approved</p>
                  <h3 className="text-3xl font-black text-slate-900">{stats.approved}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm">
                  <XCircle size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rejected</p>
                  <h3 className="text-3xl font-black text-slate-900">{stats.rejected}</h3>
                </div>
              </div>
            </div>

            {/* Recent Logs / Activity */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <LayoutDashboard className="text-emerald-500" /> Recent Activity Logs
                </h3>
              </div>
              <div className="divide-y divide-slate-50">
                {events
                  .filter(e => e.status !== 'Pending_Principal')
                  .slice(0, 10)
                  .map(event => (
                  <div key={event.id} className="relative group">
                    <button 
                      onClick={() => handleSelectEvent(event)}
                      className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          event.status === 'Approved' ? 'bg-emerald-50 text-emerald-500' : 
                          event.status === 'Declined' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                        }`}>
                          {event.status === 'Approved' ? <CheckCircle size={20} /> : 
                           event.status === 'Declined' ? <XCircle size={20} /> : <Clock size={20} />}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{event.name}</p>
                          <p className="text-xs text-slate-400 font-medium">Requested by {event.department} on {event.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          event.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                          event.status === 'Declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {event.status.replace('_', ' ')}
                        </span>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteEvent(e, event.id)}
                      className="absolute right-16 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Schedule' && (
          <motion.div key="schedule" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <CalendarIcon className="text-emerald-500" size={32} /> Upcoming Schedule
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {event.date}
                    </div>
                    <span className="text-xs font-bold text-slate-400">{event.time_slot}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{event.name}</h4>
                  <div className="space-y-2 mb-6">
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Users size={14} /> {event.coordinator_name} ({event.department})
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Info size={14} /> {event.student_count} Students
                    </p>
                  </div>
                  <button 
                    onClick={() => handleSelectEvent(event)}
                    className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-emerald-500 hover:text-white transition-all"
                  >
                    Manage Inventory
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'Inventory' && (
          <motion.div key="inventory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <Package className="text-emerald-500" size={32} /> Inventory Management
              </h2>
              <button 
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
              >
                <Plus size={20} /> Add New Item
              </button>
            </div>

            {isAddingItem && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-6">Add New Inventory Item</h3>
                <div className="grid grid-cols-3 gap-6">
                  <input 
                    type="text" 
                    placeholder="Item Name" 
                    className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                  />
                  <input 
                    type="number" 
                    placeholder="Initial Stock" 
                    className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    value={newItem.stock_qty || ''}
                    onChange={e => setNewItem({...newItem, stock_qty: parseInt(e.target.value) || 0})}
                  />
                  <div className="flex gap-3">
                    <button onClick={handleAddItem} className="flex-1 bg-emerald-500 text-white rounded-2xl font-bold">Save Item</button>
                    <button onClick={() => setIsAddingItem(false)} className="px-6 bg-slate-100 text-slate-500 rounded-2xl font-bold">Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Name</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Current Stock</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allInventoryItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-900">{item.name}</td>
                      <td className="px-8 py-6 text-center">
                        {editingItem?.id === item.id ? (
                          <input 
                            type="number" 
                            className="w-24 px-3 py-2 bg-white border border-emerald-200 rounded-xl text-center font-bold outline-none focus:ring-4 focus:ring-emerald-500/10"
                            value={editingItem.stock_qty}
                            onChange={e => setEditingItem({...editingItem, stock_qty: parseInt(e.target.value) || 0})}
                          />
                        ) : (
                          <span className="px-4 py-2 bg-slate-100 rounded-xl font-mono font-bold text-slate-600">{item.stock_qty}</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right space-x-2">
                        {editingItem?.id === item.id ? (
                          <button onClick={handleUpdateStock} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"><Save size={18} /></button>
                        ) : (
                          <button onClick={() => setEditingItem(item)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                        )}
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'Reports' && (
          <motion.div key="reports" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-4xl mx-auto">
            <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm text-center">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <FileText size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Generate Department Report</h2>
              <p className="text-slate-500 mb-12 max-w-md mx-auto font-medium">Download a comprehensive CSV report of all events and their inventory status for the {user.role} department.</p>
              <button 
                onClick={exportCSV}
                className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] mx-auto"
              >
                <Download size={24} /> Download CSV Report
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'History' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <HistoryIcon className="text-emerald-500" size={32} /> Event History
              </h2>
            </div>

            {/* Filters */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Event Name</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search events..." 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    value={historyFilters.name}
                    onChange={e => setHistoryFilters({...historyFilters, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                <input 
                  type="date" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  value={historyFilters.date}
                  onChange={e => setHistoryFilters({...historyFilters, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium appearance-none"
                  value={historyFilters.department}
                  onChange={e => setHistoryFilters({...historyFilters, department: e.target.value})}
                >
                  <option value="">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="MECH">MECH</option>
                  <option value="IT">IT</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dept</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyEvents.map(event => (
                    <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-900">{event.name}</td>
                      <td className="px-8 py-6 text-sm text-slate-500">{event.department}</td>
                      <td className="px-8 py-6 text-sm text-slate-500">{event.date}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          event.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                          event.status === 'Declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {event.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => handleSelectEvent(event)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><ArrowRight size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal (Overlay) */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedEvent(null)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all shadow-sm">
                    <ChevronLeft size={24} />
                  </button>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedEvent.name}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inventory Management • {user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    selectedEvent.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedEvent.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Coordinator</p>
                    <p className="font-bold text-slate-900">{selectedEvent.coordinator_name}</p>
                    <p className="text-xs text-slate-500">{selectedEvent.department}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date & Time</p>
                    <p className="font-bold text-slate-900">{selectedEvent.date}</p>
                    <p className="text-xs text-slate-500">{selectedEvent.time_slot}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Student Count</p>
                    <p className="font-bold text-slate-900">{selectedEvent.student_count}</p>
                    <p className="text-xs text-slate-500">Approximate</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 px-2">Inventory Requirements</h3>
                  <div className="rounded-[2rem] border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Req</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Prov</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Alloc</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredInventory.map(item => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                            <td className="px-6 py-4 text-center font-mono text-slate-400">{item.requested_qty}</td>
                            <td className="px-6 py-4 text-center">
                              <input 
                                type="number" 
                                className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                value={item.providable_qty}
                                onChange={e => handleUpdateInventory(item.id, 'providable_qty', parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input 
                                type="number" 
                                className={`w-16 px-2 py-1 bg-slate-50 border rounded-lg text-center text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
                                  item.allocated_qty > item.stock_qty ? 'border-red-500 bg-red-50' : 'border-slate-200'
                                }`}
                                value={item.allocated_qty}
                                onChange={e => handleUpdateInventory(item.id, 'allocated_qty', parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">{item.stock_qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                <button onClick={() => setSelectedEvent(null)} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-all">Close</button>
                <button 
                  onClick={handleDeclineEvent}
                  className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
                >
                  Decline Event
                </button>
                <button 
                  onClick={async () => {
                    setLoading(true);
                    for (const item of filteredInventory) {
                      await fetch(`/api/event-inventory/${item.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          providable_qty: item.providable_qty, 
                          allocated_qty: item.allocated_qty,
                          status: 'Approved' 
                        }),
                      });
                    }
                    // If this is the first time processing, maybe move status?
                    if (selectedEvent.status === 'Pending_IT_Reception') {
                      // Check if ALL items for this event are approved
                      const res = await fetch(`/api/event-inventory/${selectedEvent.id}`);
                      const allItems = await res.json();
                      const allApproved = allItems.every((i: any) => i.status === 'Approved');
                      if (allApproved) {
                        await fetch(`/api/events/${selectedEvent.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'Pending_Principal' }),
                        });
                      }
                    }
                    setLoading(false);
                    setSelectedEvent(null);
                    fetchEvents();
                  }}
                  className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-[0.98]"
                >
                  Save & Approve Allocation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
