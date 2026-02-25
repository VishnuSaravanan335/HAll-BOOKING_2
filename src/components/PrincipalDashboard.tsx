import React, { useState, useEffect } from 'react';
import { User, Event, EventInventoryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  History, 
  CheckCircle, 
  XCircle, 
  Filter, 
  ArrowUpDown,
  Users,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Package,
  Clock,
  Trash2
} from 'lucide-react';

interface PrincipalDashboardProps {
  user: User;
  activeTab: string;
}

export default function PrincipalDashboard({ user, activeTab }: PrincipalDashboardProps) {
  const [view, setView] = useState<'Upcoming' | 'History'>('Upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [inventory, setInventory] = useState<EventInventoryItem[]>([]);
  const [filterDept, setFilterDept] = useState('All');
  const [sortField, setSortField] = useState<'date' | 'student_count'>('date');

  useEffect(() => {
    if (activeTab === 'Dashboard') setView('Upcoming');
    else if (activeTab === 'Events') setView('History');
  }, [activeTab]);

  useEffect(() => {
    fetchEvents();
  }, [view]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (!Array.isArray(data)) {
        setEvents([]);
        return;
      }
      if (view === 'Upcoming') {
        setEvents(data.filter((e: Event) => e.status === 'Pending_Principal'));
      } else {
        setEvents(data.filter((e: Event) => e.status === 'Approved' || e.status === 'Declined'));
      }
    } catch (err) {
      console.error('Fetch events error:', err);
      setEvents([]);
    }
  };

  const fetchInventory = async (eventId: number) => {
    const res = await fetch(`/api/event-inventory/${eventId}`);
    const data = await res.json();
    setInventory(data);
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    fetchInventory(event.id);
  };

  const handleApprove = async (status: 'Approved' | 'Declined') => {
    if (!selectedEvent) return;
    await fetch(`/api/events/${selectedEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    alert(`Event ${status.toLowerCase()} successfully.`);
    setSelectedEvent(null);
    fetchEvents();
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
      fetchEvents();
      if (selectedEvent?.id === id) setSelectedEvent(null);
    } catch (err) {
      console.error('Delete event error:', err);
    }
  };

  const filteredEvents = events
    .filter(e => filterDept === 'All' || e.department === filterDept)
    .sort((a, b) => {
      if (sortField === 'date') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return b.student_count - a.student_count;
    });

  const departments = ['All', ...new Set(events.map(e => e.department))];

  return (
    <div className="space-y-8">
      {/* View Switcher */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 w-fit shadow-sm">
          <button
            onClick={() => { setView('Upcoming'); setSelectedEvent(null); }}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 ${
              view === 'Upcoming' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Calendar size={18} /> Upcoming Events
          </button>
          <button
            onClick={() => { setView('History'); setSelectedEvent(null); }}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 ${
              view === 'History' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <History size={18} /> Event History
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            <Filter size={14} className="text-gray-400" />
            <select 
              className="text-sm font-bold bg-transparent outline-none"
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            <ArrowUpDown size={14} className="text-gray-400" />
            <select 
              className="text-sm font-bold bg-transparent outline-none"
              value={sortField}
              onChange={e => setSortField(e.target.value as any)}
            >
              <option value="date">Sort by Date</option>
              <option value="student_count">Sort by Students</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Event List */}
        <div className="col-span-5 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
              <Calendar className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No events found</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className={`w-full text-left p-6 rounded-3xl border-2 transition-all group ${
                  selectedEvent?.id === event.id ? 'border-emerald-500 bg-emerald-50' : 'border-white bg-white hover:border-emerald-100 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors">{event.name}</h4>
                    <p className="text-sm text-gray-500 font-medium">{event.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                      event.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                      event.status === 'Declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {event.status.replace('_', ' ')}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteEvent(e, event.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={14} className="text-emerald-500" /> {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users size={14} className="text-emerald-500" /> {event.student_count} Students
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={14} className="text-emerald-500" /> {event.hall_name}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Details View */}
        <div className="col-span-7">
          <AnimatePresence mode="wait">
            {!selectedEvent ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="h-full bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="text-gray-300" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select an event to review</h3>
                <p className="text-gray-500 max-w-xs">View full details and inventory allocation before final approval.</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedEvent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"
              >
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <button 
                        onClick={() => setSelectedEvent(null)}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{selectedEvent.name}</h2>
                    </div>
                    <p className="text-gray-500 mt-1 ml-14">Full Event Proposal & Inventory Allocation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coordinator</p>
                    <p className="font-bold text-gray-900">{selectedEvent.coordinator_name}</p>
                    <p className="text-sm text-gray-500">{selectedEvent.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-10">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hall</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500" /> {selectedEvent.hall_name}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time Slot</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Clock size={14} className="text-emerald-500" /> {selectedEvent.time_slot}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Resource Person</p>
                    <p className="font-bold text-gray-900">{selectedEvent.resource_person}</p>
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package size={16} className="text-emerald-500" /> Allocated Inventory
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-gray-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dept</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Allocated Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {Array.isArray(inventory) && inventory.map(item => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 font-semibold text-sm text-gray-700">{item.name}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                item.department === 'IT' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                              }`}>
                                {item.department}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-emerald-600">{item.allocated_qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {view === 'Upcoming' && (
                  <div className="flex gap-4">
                    <button 
                      onClick={(e) => handleDeleteEvent(e, selectedEvent.id)}
                      className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
                      title="Delete Event"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleApprove('Declined')}
                      className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={20} /> Reject Event
                    </button>
                    <button 
                      onClick={() => handleApprove('Approved')}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} /> Approve Event
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
