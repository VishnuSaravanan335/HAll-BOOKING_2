import React, { useState, useEffect } from 'react';
import { User, KPREvent, Hall, InventoryItem, EventInventoryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { mockApi } from '../services/mockApi';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Package, 
  CheckCircle, 
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  ChevronLeft,
  X,
  Info
} from 'lucide-react';

interface BookerDashboardProps {
  user: User;
  activeTab: string;
  isLocked?: boolean;
}

export default function BookerDashboard({ user, activeTab, isLocked }: BookerDashboardProps) {
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [phase, setPhase] = useState(1);
  const [events, setEvents] = useState<KPREvent[]>([]);
  const [selectedEventDetails, setSelectedEventDetails] = useState<KPREvent | null>(null);
  const [selectedEventInventory, setSelectedEventInventory] = useState<EventInventoryItem[]>([]);
  
  const [eventData, setEventData] = useState({
    name: '',
    resource_person: '',
    coordinator_name: '',
    phone: '',
    department: user.department,
    student_count: 0,
    date: '',
    time_slot: '',
    has_budget: false,
    budget_amount: 0,
    intro_video: false,
    dance_performance: false
  });

  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHall, setSelectedHall] = useState<number | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{item_id: number, requested_qty: number}[]>([]);
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getHallImage = (hallName: string) => {
    if (hallName.toLowerCase().includes('seminar')) {
      return "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1000&auto=format&fit=crop";
  };

  useEffect(() => {
    if (activeTab === 'Dashboard' || activeTab === 'Events') setView('dashboard');
  }, [activeTab]);

  useEffect(() => {
    fetchEvents();
    mockApi.getHalls().then(data => {
      const uniqueHalls = Array.isArray(data) ? data.filter((hall, index, self) =>
        index === self.findIndex((h) => h.name === hall.name)
      ) : [];
      setHalls(uniqueHalls);
    });
    mockApi.getInventoryItems().then(setInventoryItems);
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await mockApi.getEvents();
      if (Array.isArray(data)) {
        const filtered = data.filter((e: KPREvent) => Number(e.booker_id) === Number(user.id));
        setEvents(filtered);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Fetch events error:', err);
      setEvents([]);
    }
  };

  const fetchEventDetails = async (event: KPREvent) => {
    setSelectedEventDetails(event);
    const data = await mockApi.getEventInventory(event.id);
    setSelectedEventInventory(data);
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await mockApi.deleteEvent(id);
      alert('Event deleted successfully.');
      fetchEvents();
      if (selectedEventDetails?.id === id) setSelectedEventDetails(null);
    } catch (err) {
      console.error('Delete event error:', err);
    }
  };

  const stats = {
    submitted: events.length,
    approved: events.filter(e => e.status === 'Approved').length,
    declined: events.filter(e => e.status === 'Declined').length,
    pending: events.filter(e => e.status.startsWith('Pending')).length
  };

  const handlePhase1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Future date check
    if (!eventData.date) {
      setError('Please select a date');
      return;
    }
    const selectedDate = new Date(eventData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Please select a future date.');
      return;
    }

    setPhase(2);
    // Refresh halls to get latest lock status
    mockApi.getHalls().then(data => {
      const uniqueHalls = Array.isArray(data) ? data.filter((hall, index, self) =>
        index === self.findIndex((h) => h.name === hall.name)
      ) : [];
      setHalls(uniqueHalls);
    });
  };

  const suggestedHalls = halls
    .filter(hall => hall.capacity >= eventData.student_count && hall.is_locked === 0)
    .sort((a, b) => a.capacity - b.capacity);

  const otherHalls = halls
    .filter(hall => hall.capacity < eventData.student_count || hall.is_locked === 1)
    .sort((a, b) => a.capacity - b.capacity);

  const sortedHalls = [...suggestedHalls, ...otherHalls];

  const handlePhase2Submit = async () => {
    if (!selectedHall) return;
    setError('');

    // Check availability
    const events = await mockApi.getEvents();
    const isConflict = events.some(e => 
      e.hall_id === selectedHall && 
      e.date === eventData.date && 
      e.time_slot === eventData.time_slot &&
      e.status !== 'Declined'
    );
    
    if (isConflict) {
      setError('This hall is already booked for the selected date and time slot. Please choose another hall or date/time.');
      return;
    }

    setPhase(3);
  };

  const handleAddItem = (itemId: number) => {
    if (selectedItems.find(i => i.item_id === itemId)) return;
    setSelectedItems([...selectedItems, { item_id: itemId, requested_qty: 1 }]);
  };

  const handleUpdateQty = (itemId: number, qty: number) => {
    setSelectedItems(selectedItems.map(i => i.item_id === itemId ? { ...i, requested_qty: qty } : i));
  };

  const handleRemoveItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(i => i.item_id !== itemId));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create Event
      const hall = halls.find(h => h.id === selectedHall);
      const newEvent = await mockApi.addEvent({ 
        ...eventData, 
        booker_id: user.id,
        hall_id: selectedHall!,
        hall_name: hall?.name || '',
        status: 'Pending_Admin', // Initial status is Pending_Admin
        has_budget: eventData.has_budget ? 1 : 0,
        budget_amount: eventData.budget_amount,
        intro_video: eventData.intro_video ? 1 : 0,
        dance_performance: eventData.dance_performance ? 1 : 0
      });
      
      // 2. Submit Inventory
      if (selectedItems.length > 0) {
        for (const item of selectedItems) {
          await mockApi.addEventInventory(newEvent.id, item.item_id, item.requested_qty);
        }
      }

      alert('Event proposal submitted successfully!');
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhase(1);
    setEventData({
      name: '',
      resource_person: '',
      coordinator_name: '',
      phone: '',
      department: user.department,
      student_count: 0,
      date: '',
      time_slot: '',
      has_budget: false,
      budget_amount: 0,
      intro_video: false,
      dance_performance: false
    });
    setSelectedHall(null);
    setSelectedItems([]);
    setError('');
    setView('dashboard');
    fetchEvents();
  };

  if (view === 'dashboard') {
    return (
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {[
            { label: 'Submitted', value: stats.submitted, color: 'bg-blue-500', icon: FileText },
            { label: 'Approved', value: stats.approved, color: 'bg-blue-600', icon: CheckCircle },
            { label: 'Declined', value: stats.declined, color: 'bg-red-500', icon: X },
            { label: 'Pending', value: stats.pending, color: 'bg-amber-500', icon: Clock },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/10`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Logs & New Proposal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Proposal Logs</h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={fetchEvents}
                    className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                    title="Refresh Logs"
                  >
                    <Clock size={18} />
                  </button>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{events.length} Total</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {!Array.isArray(events) || events.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <FileText className="mx-auto mb-4 opacity-20" size={48} />
                    <p>No proposals found. Start by creating a new one!</p>
                  </div>
                ) : (
                   events.map(event => (
                    <div key={event.id} className="relative group">
                      <button
                        onClick={() => fetchEventDetails(event)}
                        className="w-full p-6 hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                            <img 
                              src={getHallImage(event.hall_name || '')} 
                              alt="Hall Preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{event.name}</h3>
                            <p className="text-xs text-slate-500">{event.date} • {event.time_slot}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                            event.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                            event.status === 'Declined' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {event.status.replace('_', ' ')}
                          </span>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors mr-8" />
                        </div>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteEvent(e, event.id)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 rounded-xl transition-all z-20 shadow-sm"
                        title="Delete Proposal"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <button
              onClick={() => !isLocked && setView('form')}
              disabled={isLocked}
              className={`w-full p-8 rounded-[2.5rem] shadow-2xl transition-all flex flex-col items-center justify-center gap-6 group ${
                isLocked 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
              }`}
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform rotate-3 ${
                isLocked ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-blue-600/30 group-hover:scale-110'
              }`}>
                {isLocked ? <Lock size={40} /> : <Plus size={40} />}
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-extrabold tracking-tight">
                  {isLocked ? 'Portal Locked' : 'New Proposal'}
                </h3>
                <p className="text-sm mt-2 font-medium">
                  {isLocked ? 'Maintenance in progress' : 'Book a hall and request items'}
                </p>
              </div>
            </button>

            {/* Event Details Modal (Simplified as a side card) */}
            <AnimatePresence>
              {selectedEventDetails && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-lg p-6 relative"
                >
                  <button 
                    onClick={() => setSelectedEventDetails(null)}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
                    <button 
                      onClick={() => setSelectedEventDetails(null)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <ChevronLeft size={14} /> Back to List
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="w-full h-32 bg-slate-100 rounded-2xl overflow-hidden mb-4">
                      <img 
                        src={selectedEventDetails.hall_name ? getHallImage(selectedEventDetails.hall_name) : getHallImage('')} 
                        alt="Hall Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Hall</span>
                      <span className="font-bold">{selectedEventDetails.hall_name || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Coordinator</span>
                      <span className="font-bold">{selectedEventDetails.coordinator_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Budget</span>
                      <span className="font-bold">{selectedEventDetails.has_budget ? `₹${selectedEventDetails.budget_amount}` : 'No'}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Inventory</p>
                      <div className="space-y-1">
                        {Array.isArray(selectedEventInventory) && selectedEventInventory.map(item => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-gray-600">{item.name}</span>
                            <span className="font-bold">{item.requested_qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <button 
                      onClick={(e) => handleDeleteEvent(e, selectedEventDetails.id)}
                      className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> Delete Proposal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={resetForm}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold"
        >
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900">New Event Proposal</h2>
          <p className="text-sm text-gray-500">Step {phase} of 3</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative px-4">
        <div className="absolute top-5 left-10 right-10 h-[2px] bg-slate-100 z-0">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(phase - 1) * 50}%` }}
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-600"
          />
        </div>
        {[1, 2, 3].map((s) => (
          <div key={s} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              phase >= s ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border-2 border-slate-200'
            }`}>
              {phase > s ? <CheckCircle size={20} /> : s}
            </div>
            <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${phase >= s ? 'text-blue-600' : 'text-slate-400'}`}>
              {s === 1 ? 'Event Info' : s === 2 ? 'Hall Selection' : 'Requirements'}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.div
            key="phase1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Calendar className="text-emerald-500" /> Event Details
            </h2>
            <form onSubmit={handlePhase1Submit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={eventData.name}
                  onChange={e => setEventData({...eventData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Resource Person Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={eventData.resource_person}
                  onChange={e => setEventData({...eventData, resource_person: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Coordinator Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={eventData.coordinator_name}
                  onChange={e => setEventData({...eventData, coordinator_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  required
                  type="tel"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={eventData.phone}
                  onChange={e => setEventData({...eventData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department Organising</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={eventData.department}
                  onChange={e => setEventData({...eventData, department: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date (Future Only)</label>
                <input
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={eventData.date}
                  onChange={e => setEventData({...eventData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time Selection (Manual Entry)</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 10:00 AM - 1:00 PM"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={eventData.time_slot}
                  onChange={e => setEventData({...eventData, time_slot: e.target.value})}
                />
              </div>
              
              <div className="col-span-2 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="text-emerald-500" />
                    <div>
                      <h3 className="font-bold text-gray-900">Budget Proposal</h3>
                      <p className="text-xs text-gray-500">Do you require a budget for this event?</p>
                    </div>
                  </div>
                  <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                    <button 
                      type="button"
                      onClick={() => setEventData({...eventData, has_budget: true})}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${eventData.has_budget ? 'bg-emerald-500 text-white' : 'text-gray-400'}`}
                    >
                      YES
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEventData({...eventData, has_budget: false})}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!eventData.has_budget ? 'bg-red-500 text-white' : 'text-gray-400'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
                {eventData.has_budget && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Enter Amount (₹) - Manual Entry</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                      value={eventData.budget_amount || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setEventData({...eventData, budget_amount: parseFloat(val) || 0});
                      }}
                    />
                  </motion.div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Approximate Student Count (Manual Entry)</label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter number of students"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  value={eventData.student_count || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEventData({...eventData, student_count: parseInt(val) || 0});
                  }}
                />
              </div>

              {error && (
                <div className="col-span-2 flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="col-span-2 pt-4">
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                  Next Step: Hall Selection <ChevronRight size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div
            key="phase2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
          >
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <MapPin className="text-emerald-500" /> Select Hall
            </h2>
            <p className="text-gray-500 mb-8">Halls matching your capacity ({eventData.student_count} students) are highlighted.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {sortedHalls.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <AlertCircle className="mx-auto mb-4 text-slate-400" size={48} />
                  <p className="text-slate-600 font-medium">No halls found in the system.</p>
                </div>
              ) : (
                sortedHalls.map(hall => {
                  const isSuggested = hall.capacity >= eventData.student_count && hall.is_locked === 0;
                  const isHallLocked = hall.is_locked === 1;
                  const isTooSmall = hall.capacity < eventData.student_count;
                  
                  return (
                    <button
                      key={hall.id}
                      disabled={isLocked || isHallLocked || isTooSmall}
                      onClick={() => setSelectedHall(hall.id)}
                      className={`rounded-2xl border-2 transition-none flex flex-col group relative overflow-hidden ${
                        selectedHall === hall.id 
                          ? 'border-emerald-500 bg-emerald-50/50' 
                          : (isLocked || isHallLocked || isTooSmall)
                            ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                            : isSuggested
                              ? 'border-emerald-100 bg-white hover:border-emerald-300'
                              : 'border-slate-100 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Hall Preview Image */}
                      <div className="w-full h-40 bg-slate-100 relative overflow-hidden">
                        <img 
                          src={getHallImage(hall.name)} 
                          alt={hall.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {isSuggested && !isLocked && !isHallLocked && (
                          <span className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg">
                            Suggested
                          </span>
                        )}
                        {(isLocked || isHallLocked) && (
                          <span className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
                            <Lock size={10} /> Locked
                          </span>
                        )}
                        {isTooSmall && !isHallLocked && !isLocked && (
                          <span className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg">
                            Too Small
                          </span>
                        )}
                        
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedHall === hall.id ? 'bg-emerald-500 text-white' : 'bg-white/20 backdrop-blur-md text-white'
                          }`}>
                            <Users size={16} />
                          </div>
                          <span className="text-white font-bold text-sm">{hall.capacity} Capacity</span>
                        </div>
                      </div>

                      <div className="p-6 text-left flex items-center justify-between w-full">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{hall.name}</h3>
                          <p className="text-xs text-slate-500 font-medium">{hall.type} • Campus A</p>
                        </div>
                        {selectedHall === hall.id && (
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <CheckCircle size={20} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl mb-8">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => setPhase(1)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handlePhase2Submit}
                disabled={!selectedHall}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                Confirm Hall & Continue
              </button>
            </div>
          </motion.div>
        )}

        {phase === 3 && (
          <motion.div
            key="phase3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Package className="text-emerald-500" /> Event Requirements
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Item Selection List */}
              <div className="col-span-12 lg:col-span-7">
                <div className="space-y-6">
                  {['Reception', 'IT'].map(dept => (
                    <div key={dept}>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        {dept === 'IT' ? <Clock size={14} /> : <FileText size={14} />}
                        {dept} Requirements
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {inventoryItems.filter(i => i.department === dept).map(item => (
                          <button
                            key={item.id}
                            onClick={() => handleAddItem(item.id)}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-all group text-left"
                          >
                            <span className="text-[11px] font-semibold text-slate-700">{item.name}</span>
                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:text-emerald-500">
                              <Plus size={14} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Special Toggles */}
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Intro Video / KPR Anthem</h4>
                        <p className="text-[10px] text-gray-500">Do you need this played at the start?</p>
                      </div>
                      <div className="flex bg-white p-1 rounded-lg border border-gray-200 w-full sm:w-auto">
                        <button 
                          onClick={() => setEventData({...eventData, intro_video: true})}
                          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold ${eventData.intro_video ? 'bg-emerald-500 text-white' : 'text-gray-400'}`}
                        >YES</button>
                        <button 
                          onClick={() => setEventData({...eventData, intro_video: false})}
                          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold ${!eventData.intro_video ? 'bg-red-500 text-white' : 'text-gray-400'}`}
                        >NO</button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Dance Performance</h4>
                        <p className="text-[10px] text-gray-500">Is there a dance performance scheduled?</p>
                      </div>
                      <div className="flex bg-white p-1 rounded-lg border border-gray-200 w-full sm:w-auto">
                        <button 
                          onClick={() => setEventData({...eventData, dance_performance: true})}
                          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold ${eventData.dance_performance ? 'bg-emerald-500 text-white' : 'text-gray-400'}`}
                        >YES</button>
                        <button 
                          onClick={() => setEventData({...eventData, dance_performance: false})}
                          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold ${!eventData.dance_performance ? 'bg-red-500 text-white' : 'text-gray-400'}`}
                        >NO</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Items List */}
              <div className="col-span-12 lg:col-span-5">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 lg:sticky lg:top-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package size={16} className="text-emerald-500" /> Selected Items
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {selectedItems.length === 0 ? (
                      <div className="text-center py-12 text-gray-300">
                        <Info size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No items selected</p>
                      </div>
                    ) : (
                      selectedItems.map(si => {
                        const item = inventoryItems.find(i => i.id === si.item_id);
                        return (
                          <div key={si.item_id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                            <span className="text-xs font-semibold text-gray-700 truncate mr-2">{item?.name}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                className="w-12 px-1 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500"
                                value={si.requested_qty}
                                onChange={e => handleUpdateQty(si.item_id, parseInt(e.target.value) || 0)}
                              />
                              <button onClick={() => handleRemoveItem(si.item_id)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <button 
                      onClick={handleFinalSubmit}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Submitting...' : 'Submit Proposal'}
                    </button>
                    <button 
                      onClick={() => setPhase(2)}
                      disabled={loading}
                      className="w-full mt-2 py-2 text-indigo-400 text-xs font-bold hover:text-indigo-600 transition-colors disabled:opacity-50"
                    >
                      Back to Hall Selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
