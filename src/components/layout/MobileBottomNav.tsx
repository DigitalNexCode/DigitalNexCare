import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/context';
import { AICareNavigatorModal } from '../ai/AICareNavigatorModal';
import {
  Search,
  MapPin,
  Sparkles,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user, role } = useAuth();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Compute profile/account target link and label based on auth status and role
  const getAccountTab = () => {
    if (!user) {
      return {
        to: '/auth/sign-in',
        label: 'Sign In',
        icon: User,
        isActive: location.pathname.startsWith('/auth'),
      };
    }
    if (role === 'PROVIDER' || role === 'PRACTICE_MANAGER') {
      return {
        to: '/provider/dashboard',
        label: 'Practice',
        icon: Building2,
        isActive: location.pathname.startsWith('/provider'),
      };
    }
    if (role === 'PLATFORM_ADMIN' || role === 'SUPER_ADMIN' || role === 'VERIFIER_TRUST_OPS') {
      return {
        to: '/admin/dashboard',
        label: 'Admin',
        icon: ShieldCheck,
        isActive: location.pathname.startsWith('/admin') || location.pathname.startsWith('/super-admin'),
      };
    }
    // Default patient
    return {
      to: '/patient/dashboard',
      label: 'Account',
      icon: User,
      isActive: location.pathname.startsWith('/patient'),
    };
  };

  const accountTab = getAccountTab();

  const isSearchActive =
    location.pathname === '/find-care' ||
    location.pathname === '/search' ||
    location.pathname === '/' ||
    location.pathname.startsWith('/specialties') ||
    location.pathname.startsWith('/locations');

  const isNearMeActive = location.pathname === '/near-me';

  const isBookingsActive =
    location.pathname.startsWith('/patient/appointments') ||
    location.pathname.startsWith('/book') ||
    location.pathname === '/pricing';

  return (
    <>
      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-1.5 px-2 transition-all duration-200"
      >
        <div className="grid grid-cols-5 items-center justify-around max-w-lg mx-auto">
          {/* 1. Find Care / Search */}
          <Link
            to="/find-care"
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] ${
              isSearchActive
                ? 'text-[#176BFF] font-black'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isSearchActive ? 'bg-blue-50 text-[#176BFF]' : 'text-slate-500'
              }`}
            >
              <Search className="w-5 h-5" strokeWidth={isSearchActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              Find Care
            </span>
          </Link>

          {/* 2. Near Me (GPS) */}
          <Link
            to="/near-me"
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] ${
              isNearMeActive
                ? 'text-[#176BFF] font-black'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isNearMeActive ? 'bg-blue-50 text-[#176BFF]' : 'text-slate-500'
              }`}
            >
              <MapPin className="w-5 h-5" strokeWidth={isNearMeActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              Near Me
            </span>
          </Link>

          {/* 3. AI Healthcare Navigator (Interactive Prominent Button) */}
          <button
            type="button"
            onClick={() => setIsAIModalOpen(true)}
            className="flex flex-col items-center justify-center py-0.5 px-1 group min-h-[48px]"
            title="Open AI Healthcare Navigator"
          >
            <div className="relative -mt-3.5 flex items-center justify-center">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#176BFF] to-[#00E5D4] text-slate-950 flex items-center justify-center shadow-lg shadow-blue-500/25 group-active:scale-95 transition-transform">
                <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5D4] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00E5D4]"></span>
              </span>
            </div>
            <span className="text-[10px] font-extrabold text-[#176BFF] tracking-tight mt-1 whitespace-nowrap">
              AI Care
            </span>
          </button>

          {/* 4. Bookings / Appointments */}
          <Link
            to={user ? '/patient/appointments' : '/pricing'}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] ${
              isBookingsActive
                ? 'text-[#176BFF] font-black'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isBookingsActive ? 'bg-blue-50 text-[#176BFF]' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-5 h-5" strokeWidth={isBookingsActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              {user ? 'Bookings' : 'Plans'}
            </span>
          </Link>

          {/* 5. Account / Role Portal */}
          <Link
            to={accountTab.to}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] ${
              accountTab.isActive
                ? 'text-[#176BFF] font-black'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                accountTab.isActive ? 'bg-blue-50 text-[#176BFF]' : 'text-slate-500'
              }`}
            >
              <accountTab.icon className="w-5 h-5" strokeWidth={accountTab.isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              {accountTab.label}
            </span>
          </Link>
        </div>
      </nav>

      {/* Global AI Care Navigator Modal for mobile access */}
      <AICareNavigatorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </>
  );
};
