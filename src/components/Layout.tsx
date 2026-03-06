import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  Users, 
  Settings, 
  FileText,
  History as HistoryIcon,
  LogOut, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronRight,
  Menu,
  Bell,
  Map as MapIcon,
  ArrowRight
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', roles: ['Booker', 'IT', 'Reception', 'Principal', 'Admin'] },
    { icon: Calendar, label: 'Events', roles: ['Booker', 'Principal', 'Admin'] },
    { icon: Clock, label: 'Schedule', roles: ['IT', 'Reception'] },
    { icon: ArrowRight, label: 'Returns', roles: ['IT', 'Reception'] },
    { icon: Package, label: 'Inventory', roles: ['IT', 'Reception'] },
    { icon: MapIcon, label: 'Halls', roles: ['Admin'] },
    { icon: FileText, label: 'Reports', roles: ['IT', 'Reception'] },
    { icon: HistoryIcon, label: 'History', roles: ['IT', 'Reception'] },
    { icon: Users, label: 'Users', roles: ['Admin'] },
    { icon: Settings, label: 'Settings', roles: ['Admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  const SidebarContent = () => (
    <>
      <div className="p-8 flex items-center gap-3">
        <div className="w-24 h-24 flex items-center justify-center bg-white rounded-2xl p-2 shadow-lg border border-slate-100">
          <img 
            src="https://kprcas.ac.in/wp-content/uploads/2022/01/KPRCAS-Logo.png" 
            alt="KPRCAS Logo" 
            className="max-w-full max-h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        {(isSidebarOpen || isMobileMenuOpen) && <span className="font-black text-2xl tracking-tighter text-white">KPR HUB</span>}
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {filteredMenu.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              setActiveTab(item.label);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
              activeTab === item.label 
                ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} className={activeTab === item.label ? 'text-white' : 'group-hover:text-emerald-400 transition-colors'} />
            {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-bold tracking-wide">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all"
        >
          <LogOut size={20} />
          {(isSidebarOpen || isMobileMenuOpen) && <span className="text-sm font-semibold">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="hidden lg:flex bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 flex-col shadow-2xl z-20"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-gradient-to-b from-slate-900 to-blue-950 flex flex-col z-50 lg:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 z-10 relative">
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-600 to-emerald-600 opacity-50" />
          <div className="flex items-center gap-4 lg:gap-6">
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(true);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }} 
              className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <Menu size={22} />
            </button>
            <h1 className="font-bold text-lg lg:text-xl text-slate-900 tracking-tight truncate max-w-[150px] sm:max-w-none">
              {user.role} Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-8">
            <button className="relative p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 lg:gap-4 pl-4 lg:pl-8 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user.username}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{user.department}</p>
              </div>
              <div className="w-10 h-10 lg:w-11 lg:h-11 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm">
                {user.username[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
