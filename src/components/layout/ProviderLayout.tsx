import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  UserCheck,
  Search,
  Building,
  CreditCard,
  Star,
  Users,
  Bell,
  Settings,
  ShieldCheck,
  Globe,
  Activity,
} from 'lucide-react';

interface ProviderLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const ProviderLayout: React.FC<ProviderLayoutProps> = ({ children, title, subtitle }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Provider Dashboard', path: '/provider/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Find Existing Profile', path: '/provider/find-existing', icon: <Search className="w-4 h-4" /> },
    { label: 'HPCSA Verification', path: '/provider/verification', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Profile Management', path: '/provider/profile', icon: <Building className="w-4 h-4" /> },
    { label: 'Schedule & Availability', path: '/provider/schedule', icon: <Clock className="w-4 h-4" /> },
    { label: 'Appointments Manager', path: '/provider/appointments', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Services & Fees', path: '/provider/services', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Practice Team & Roles', path: '/provider/team', icon: <Users className="w-4 h-4" /> },
    { label: 'Locations & Rooms', path: '/provider/locations', icon: <Globe className="w-4 h-4" /> },
    { label: 'Practice Analytics', path: '/provider/analytics', icon: <Activity className="w-4 h-4" /> },
    { label: 'Patient Reviews', path: '/provider/reviews', icon: <Star className="w-4 h-4" /> },
    { label: 'Provider Settings', path: '/provider/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#07111F] text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <BrandLogo variant="dark" size="sm" />
            </Link>
            <span className="text-xs font-bold bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-800">
              Provider Workspace
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>HPCSA Reg: MP 0689441 (Active)</span>
            </div>
            <Link to="/" className="text-slate-400 hover:text-white">
              Public Site →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs sticky top-24">
            <div className="px-3 py-2 mb-2 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-sm">Dr. Naledi Mokoena</div>
              <div className="text-xs text-slate-500">Hatfield Medical Practice</div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>

          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
