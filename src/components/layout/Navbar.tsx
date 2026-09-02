import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import { Button } from '../ui/Button';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { useAuth } from '../../lib/auth/context';
import { UserRole } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Search,
  MapPin,
  Shield,
  User,
  ChevronDown,
  ChevronRight,
  Stethoscope,
  Building,
  Lock,
  CreditCard,
  Compass,
  Activity,
  Heart,
  Smile,
  Eye,
  Baby,
  Brain,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [locationsDropdownOpen, setLocationsDropdownOpen] = useState(false);
  const [specialtiesDropdownOpen, setSpecialtiesDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile accordion states
  const [mobileLocationsOpen, setMobileLocationsOpen] = useState(true);
  const [mobileSpecialtiesOpen, setMobileSpecialtiesOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useAuth();

  const locationsDropdownRef = useRef<HTMLDivElement>(null);
  const specialtiesDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Scroll detection for header animation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setMobileOpen(false);
    setLocationsDropdownOpen(false);
    setSpecialtiesDropdownOpen(false);
    setRoleMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close desktop dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationsDropdownRef.current &&
        !locationsDropdownRef.current.contains(event.target as Node)
      ) {
        setLocationsDropdownOpen(false);
      }
      if (
        specialtiesDropdownRef.current &&
        !specialtiesDropdownRef.current.contains(event.target as Node)
      ) {
        setSpecialtiesDropdownOpen(false);
      }
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setRoleMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setRoleMenuOpen(false);
    if (newRole === 'PATIENT') navigate('/patient/dashboard');
    else if (newRole === 'PROVIDER') navigate('/provider/dashboard');
    else if (newRole === 'PLATFORM_ADMIN') navigate('/admin/dashboard');
    else if (newRole === 'SUPER_ADMIN') navigate('/super-admin/admin-users');
  };

  // Locations submenu items with rich imagery and descriptions
  const locationSubmenuItems = [
    {
      title: 'Find Care',
      subtitle: 'National healthcare practitioner directory across all 9 provinces',
      path: '/find-care',
      badge: 'National Index',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=120&h=120&q=80',
      icon: <Search className="w-5 h-5 text-[#176BFF]" />,
    },
    {
      title: 'Near Me',
      subtitle: 'Instant GPS radius discovery for clinics, GPs & dentists',
      path: '/near-me',
      badge: 'GPS Radar',
      imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=120&h=120&q=80',
      icon: <Navigation className="w-5 h-5 text-[#00E5D4]" />,
    },
    {
      title: 'Locations & Provinces',
      subtitle: 'Browse Gauteng, Western Cape, KZN, Eastern Cape & more',
      path: '/locations',
      badge: 'All Provinces',
      imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=120&h=120&q=80',
      icon: <MapPin className="w-5 h-5 text-[#FF3D71]" />,
    },
  ];

  // Specialties quick list with images
  const popularSpecialties = [
    {
      name: 'General Practitioner',
      path: '/find-care?q=General+Practitioner',
      icon: <Stethoscope className="w-4 h-4 text-[#176BFF]" />,
      imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=80&h=80&q=80',
    },
    {
      name: 'Dentist & Orthodontics',
      path: '/find-care?q=Dentist',
      icon: <Smile className="w-4 h-4 text-[#00E5D4]" />,
      imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=80&h=80&q=80',
    },
    {
      name: 'Psychologist & Therapy',
      path: '/find-care?q=Psychologist',
      icon: <Brain className="w-4 h-4 text-[#FF3D71]" />,
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&h=80&q=80',
    },
    {
      name: 'Paediatrician & Child Health',
      path: '/find-care?q=Paediatrician',
      icon: <Baby className="w-4 h-4 text-[#176BFF]" />,
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=80&h=80&q=80',
    },
    {
      name: 'Physiotherapist',
      path: '/find-care?q=Physiotherapist',
      icon: <Activity className="w-4 h-4 text-[#B7F34A]" />,
      imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=80&h=80&q=80',
    },
    {
      name: 'Optometrist & Vision',
      path: '/find-care?q=Optometrist',
      icon: <Eye className="w-4 h-4 text-[#176BFF]" />,
      imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=80&h=80&q=80',
    },
  ];

  const isLocationActive =
    location.pathname === '/locations' ||
    location.pathname === '/find-care' ||
    location.pathname === '/near-me';

  return (
    <header
      className={`sticky top-0 z-40 bg-white transition-all duration-300 ${
        isScrolled
          ? 'shadow-md shadow-slate-200/50 border-b border-slate-200 py-0'
          : 'border-b border-slate-100 py-1'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <BrandLogo variant="master" size="md" />
          </Link>

          {/* Desktop Clean Main Menu */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* 1. Locations Dropdown (Contains Find Care, Near Me, Locations) */}
            <div className="relative" ref={locationsDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setLocationsDropdownOpen(!locationsDropdownOpen);
                  setSpecialtiesDropdownOpen(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  isLocationActive || locationsDropdownOpen
                    ? 'bg-blue-50 text-[#176BFF]'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-4 h-4 text-[#176BFF]" />
                <span>Locations</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    locationsDropdownOpen ? 'rotate-180 text-[#176BFF]' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Locations Rich Submenu with Images */}
              <AnimatePresence>
                {locationsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute left-0 mt-2 w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-3 z-50"
                  >
                    <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 flex items-center justify-between">
                      <span>Healthcare Discovery & Locations</span>
                      <span className="text-[#176BFF] font-black">South Africa</span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      {locationSubmenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setLocationsDropdownOpen(false)}
                          className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200/80 group"
                        >
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-[#07111F]/20" />
                            <div className="absolute bottom-1 right-1 bg-white p-0.5 rounded-md shadow-xs">
                              {item.icon}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-900 group-hover:text-[#176BFF] transition-colors">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-bold text-[#176BFF] bg-blue-50 px-2 py-0.5 rounded-md">
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Specialties Dropdown */}
            <div className="relative" ref={specialtiesDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setSpecialtiesDropdownOpen(!specialtiesDropdownOpen);
                  setLocationsDropdownOpen(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  location.pathname === '/specialties' || specialtiesDropdownOpen
                    ? 'bg-blue-50 text-[#176BFF]'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-[#176BFF]" />
                <span>Specialties</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    specialtiesDropdownOpen ? 'rotate-180 text-[#176BFF]' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Specialties Submenu with Images */}
              <AnimatePresence>
                {specialtiesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute left-0 mt-2 w-[460px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-3 z-50"
                  >
                    <div className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 flex items-center justify-between">
                      <span>Popular Healthcare Disciplines</span>
                      <Link
                        to="/specialties"
                        onClick={() => setSpecialtiesDropdownOpen(false)}
                        className="text-[11px] font-bold text-[#176BFF] hover:underline"
                      >
                        View All
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {popularSpecialties.map((spec) => (
                        <Link
                          key={spec.name}
                          to={spec.path}
                          onClick={() => setSpecialtiesDropdownOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group"
                        >
                          <img
                            src={spec.imageUrl}
                            alt={spec.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#176BFF] transition-colors block truncate">
                              {spec.name}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Medical Aid */}
            <Link
              to="/medical-aid"
              className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/medical-aid'
                  ? 'bg-blue-50 text-[#176BFF]'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4 text-[#176BFF]" />
              <span>Medical Aid</span>
            </Link>

            {/* 4. Pricing */}
            <Link
              to="/pricing"
              className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/pricing'
                  ? 'bg-blue-50 text-[#176BFF]'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#176BFF]" />
              <span>Pricing</span>
            </Link>

            {/* 5. For Providers */}
            <Link
              to="/for-providers"
              className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/for-providers'
                  ? 'bg-blue-50 text-[#176BFF]'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <span>For Providers</span>
            </Link>
          </nav>

          {/* Right Action Bar (Portal Switcher + Sign In + Book Appointment) */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Quick Portal Switcher */}
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                title="Switch portal view for testing"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Portal: {role.replace('_', ' ')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {roleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Switch Workspace Portal
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('PATIENT')}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#176BFF] flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-[#176BFF]" /> Patient Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('PROVIDER')}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#176BFF] flex items-center gap-2"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Provider Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('PLATFORM_ADMIN')}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#176BFF] flex items-center gap-2"
                    >
                      <Building className="w-3.5 h-3.5 text-indigo-600" /> Admin Ops Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('SUPER_ADMIN')}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#176BFF] flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#FF3D71]" /> Super Admin Portal
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PWA App Install Button */}
            <PWAInstallButton />

            {/* Auth CTA */}
            <Link to="/auth/sign-in">
              <Button variant="outline" size="sm" className="font-bold border-slate-300">
                Sign In
              </Button>
            </Link>

            <Link to="/find-care">
              <Button variant="primary" size="sm" className="font-extrabold uppercase tracking-wide text-xs">
                Book Appointment
              </Button>
            </Link>
          </div>

          {/* Mobile & Tablet Hamburger Button (Visible below lg / 1024px) */}
          <div className="flex lg:hidden items-center gap-2">
            <Link to="/find-care" className="hidden sm:block">
              <Button variant="primary" size="sm" className="text-xs font-bold">
                Find Care
              </Button>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 rounded-2xl bg-slate-100 text-slate-800 hover:text-slate-950 hover:bg-slate-200 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Slide-down / Overlay) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden border-t border-slate-200 bg-white overflow-hidden shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* 1. Locations Submenu Accordion */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => setMobileLocationsOpen(!mobileLocationsOpen)}
                  className="w-full flex items-center justify-between p-3.5 text-sm font-extrabold text-slate-900 bg-slate-100/80"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#176BFF]" />
                    Locations & Care Discovery
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileLocationsOpen ? 'rotate-180 text-[#176BFF]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {mobileLocationsOpen && (
                  <div className="p-2 space-y-2 bg-white">
                    {locationSubmenuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 transition-colors border border-slate-100"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{item.title}</span>
                            <span className="text-[10px] font-bold text-[#176BFF] bg-blue-50 px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Specialties Submenu Accordion */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => setMobileSpecialtiesOpen(!mobileSpecialtiesOpen)}
                  className="w-full flex items-center justify-between p-3.5 text-sm font-extrabold text-slate-900 bg-slate-100/80"
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#176BFF]" />
                    Healthcare Specialties
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileSpecialtiesOpen ? 'rotate-180 text-[#176BFF]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {mobileSpecialtiesOpen && (
                  <div className="p-2 grid grid-cols-2 gap-2 bg-white">
                    {popularSpecialties.map((spec) => (
                      <Link
                        key={spec.name}
                        to={spec.path}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-50 transition-colors border border-slate-100 text-xs font-bold text-slate-800"
                      >
                        <img
                          src={spec.imageUrl}
                          alt={spec.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <span className="truncate">{spec.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Navigation Items */}
              <div className="space-y-1 pt-1">
                <Link
                  to="/medical-aid"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-[#176BFF]" /> Medical Aid
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-[#176BFF]" /> Patient Pricing
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/for-providers"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-emerald-600" /> For Healthcare Providers
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Mobile Role Switcher */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                  Portal Switcher
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('PATIENT')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                      role === 'PATIENT'
                        ? 'bg-blue-50 text-[#176BFF] border-[#176BFF]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('PROVIDER')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                      role === 'PROVIDER'
                        ? 'bg-blue-50 text-[#176BFF] border-[#176BFF]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> Provider
                  </button>
                </div>
              </div>

              {/* Mobile CTA Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col gap-2.5">
                <Link to="/auth/sign-in" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full font-bold">
                    Sign In
                  </Button>
                </Link>
                <Link to="/find-care" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" className="w-full font-extrabold uppercase tracking-wide">
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
