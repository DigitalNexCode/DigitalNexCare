import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import { useAuth } from '../../lib/auth/context';
import {
  LayoutDashboard,
  Calendar,
  User,
  Users,
  Shield,
  FileText,
  Bookmark,
  Unlock,
  CreditCard,
  Bell,
  Star,
  Settings,
  ShieldAlert,
  ArrowLeft,
  Eye,
} from 'lucide-react';

interface PatientLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const PatientLayout: React.FC<PatientLayoutProps> = ({ children, title, subtitle }) => {
  const location = useLocation();
  const { user, subscriptionPlan, revealsRemaining } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/patient/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Appointments', path: '/patient/appointments', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Profile & Preferences', path: '/patient/profile', icon: <User className="w-4 h-4" /> },
    { label: 'Dependants', path: '/patient/dependants', icon: <Users className="w-4 h-4" /> },
    { label: 'Medical Aid & Gap Cover', path: '/patient/medical-aid', icon: <Shield className="w-4 h-4" /> },
    { label: 'Pre-Visit Intake Forms', path: '/patient/intake', icon: <FileText className="w-4 h-4" /> },
    { label: 'Saved Practitioners', path: '/patient/saved', icon: <Bookmark className="w-4 h-4" /> },
    { label: 'External Unlocks', path: '/patient/external-unlocks', icon: <Unlock className="w-4 h-4" /> },
    { label: 'Subscription Plan', path: '/patient/subscription', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Usage & Quota', path: '/patient/subscription/usage', icon: <Eye className="w-4 h-4" /> },
    { label: 'Notifications', path: '/patient/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'My Reviews', path: '/patient/reviews', icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <BrandLogo variant="master" size="sm" />
            </Link>
            <span className="text-xs font-bold bg-blue-50 text-[#176BFF] px-2.5 py-1 rounded-md border border-blue-100">
              Patient Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-500">Plan:</span>
              <span className="font-bold text-slate-900">{subscriptionPlan.replace('NEXCARE_', '')}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-bold">{revealsRemaining} reveals left</span>
            </div>

            <Link to="/find-care" className="text-xs font-semibold text-[#176BFF] hover:underline">
              ← Back to Discovery
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs sticky top-24">
            <div className="px-3 py-2 mb-2 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-sm">{user?.fullName || 'Patient Account'}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
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
                        ? 'bg-blue-50 text-[#176BFF] font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={isActive ? 'text-[#176BFF]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Dynamic Content Body */}
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
