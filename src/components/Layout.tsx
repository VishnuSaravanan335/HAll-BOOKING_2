import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  Users, 
  Settings, 
  FileText,
  History,
  LogOut, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronRight,
  Menu,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Role } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ user, onLogout, children, activeTab, setActiveTab }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', roles: ['Booker', 'IT', 'Reception', 'Principal', 'Admin'] },
    { icon: Calendar, label: 'Events', roles: ['Booker', 'Principal', 'Admin'] },
    { icon: Clock, label: 'Schedule', roles: ['IT', 'Reception'] },
    { icon: Package, label: 'Inventory', roles: ['IT', 'Reception', 'Admin'] },
    { icon: FileText, label: 'Reports', roles: ['IT', 'Reception'] },
    { icon: History, label: 'History', roles: ['IT', 'Reception'] },
    { icon: Users, label: 'Users', roles: ['Admin'] },
    { icon: Settings, label: 'Settings', roles: ['Admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex font-sans text-[#1E293B]">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white flex flex-col border-r border-slate-200 shadow-sm z-20"
      >
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-600/20">K</div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-slate-900">KPR HUB</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {filteredMenu.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all group ${
                activeTab === item.label 
                  ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'
              }`}
            >
              <item.icon size={20} className={activeTab === item.label ? 'text-emerald-600' : 'group-hover:text-emerald-600 transition-colors'} />
              {isSidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-10">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
              <Menu size={22} />
            </button>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">{user.role} Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-8">
            <button className="relative p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-4 pl-8 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{user.username}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{user.department}</p>
              </div>
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm">
                {user.username[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
