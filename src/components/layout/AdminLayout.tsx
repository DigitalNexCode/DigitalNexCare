import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Database,
  Search,
  HardDrive,
  Activity,
  Layers,
  Settings,
  CreditCard,
  Lock,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isSuperAdmin?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  isSuperAdmin = false,
}) => {
  const location = useLocation();

  const adminNav = [
    { label: 'Overview Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Launch Readiness QA', path: '/admin/launch-readiness', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
    { label: 'System Health Telemetry', path: '/admin/system-health', icon: <Activity className="w-4 h-4 text-[#00E5D4]" /> },
    { label: 'National Directory', path: '/admin/providers', icon: <Users className="w-4 h-4" /> },
    { label: 'Duplicates & Merging', path: '/admin/duplicates', icon: <Layers className="w-4 h-4 text-amber-500" /> },
    { label: 'Data Conflicts', path: '/admin/conflicts', icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
    { label: 'Verifications Queue', path: '/admin/verifications', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Claim Requests', path: '/admin/claims', icon: <FileText className="w-4 h-4" /> },
    { label: 'Trust & Safety Cases', path: '/admin/trust', icon: <Lock className="w-4 h-4 text-indigo-500" /> },
    { label: 'External Discovery Ops', path: '/admin/external-discovery', icon: <Search className="w-4 h-4" /> },
    { label: 'Ingestion Jobs', path: '/admin/ingestion-jobs', icon: <Database className="w-4 h-4" /> },
    { label: 'Snapshot Storage', path: '/admin/snapshots', icon: <HardDrive className="w-4 h-4" /> },
    { label: 'Subscriptions Admin', path: '/admin/subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Database & Security', path: '/admin/database', icon: <Database className="w-4 h-4 text-[#00E5D4]" /> },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: <Activity className="w-4 h-4" /> },
  ];

  const superAdminNav = [
    { label: 'Admin User Access', path: '/super-admin/admin-users', icon: <Lock className="w-4 h-4" /> },
    { label: 'Platform Controls', path: '/super-admin/platform-settings', icon: <Settings className="w-4 h-4" /> },
    { label: 'Payment Gateways', path: '/super-admin/payment-gateways', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Enterprise Tenants', path: '/super-admin/enterprise-partners', icon: <Layers className="w-4 h-4" /> },
    { label: 'Database Health', path: '/super-admin/database-health', icon: <Database className="w-4 h-4" /> },
    { label: 'System Audit', path: '/super-admin/system-audit', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#07111F] text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <BrandLogo variant="dark" size="sm" />
            </Link>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                isSuperAdmin
                  ? 'bg-rose-950 text-rose-400 border-rose-800'
                  : 'bg-indigo-950 text-indigo-400 border-indigo-800'
              }`}
            >
              {isSuperAdmin ? 'Super-Admin Operations' : 'Platform Operations'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/find-care" className="text-slate-400 hover:text-white">
              Public Discovery Site →
            </Link>
          </div>
        </div>
      </header>

      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs sticky top-24 space-y-4">
            <div>
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Ops & Verification
              </div>
              <nav className="space-y-1 mt-1">
                {adminNav.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="px-3 py-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                Super-Admin Control
              </div>
              <nav className="space-y-1 mt-1">
                {superAdminNav.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-rose-50 text-rose-900 font-bold border border-rose-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={isActive ? 'text-rose-600' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
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
