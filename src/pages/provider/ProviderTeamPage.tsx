import React, { useState } from 'react';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Trash2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { ProviderService, PracticeTeamMember } from '../../lib/provider/provider-service';

export const ProviderTeamPage: React.FC = () => {
  const [team, setTeam] = useState<PracticeTeamMember[]>(
    ProviderService.getPracticeTeam('prov-001')
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<
    'PROVIDER' | 'PRACTICE_MANAGER' | 'RECEPTION_SCHEDULER' | 'FINANCE_BILLING'
  >('RECEPTION_SCHEDULER');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember = ProviderService.addTeamMember({
      practiceId: 'prov-001',
      name,
      email,
      phone,
      role,
    });

    setTeam([...ProviderService.getPracticeTeam('prov-001')]);
    setName('');
    setEmail('');
    setPhone('');
    setShowInviteModal(false);
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 4000);
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'PROVIDER':
        return <Badge variant="verified" size="sm">Provider (Clinician)</Badge>;
      case 'PRACTICE_MANAGER':
        return <Badge variant="brand" size="sm">Practice Manager</Badge>;
      case 'RECEPTION_SCHEDULER':
        return <Badge variant="warning" size="sm">Reception Scheduler</Badge>;
      case 'FINANCE_BILLING':
        return <Badge variant="neutral" size="sm">Finance & Billing</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{r}</Badge>;
    }
  };

  return (
    <ProviderLayout
      title="Practice Team & Delegation Access"
      subtitle="Grant role-based access for practice managers, receptionists, billing officers, and associate clinicians."
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Practice Staff & Permissions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hatfield Family Medical Centre • 4 Active Accounts
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowInviteModal(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite Practice Staff
          </Button>
        </div>

        {inviteSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Invitation dispatched to practice staff member with assigned permissions.
          </div>
        )}

        {/* Team Members List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="space-y-3">
            {team.map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#176BFF] flex items-center justify-center font-black text-sm flex-shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{member.name}</span>
                      {getRoleBadge(member.role)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {member.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {member.phone}
                      </span>
                      <span className="text-slate-400">
                        Joined {member.joinedAt}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md">
                    {member.status}
                  </span>
                  <Button variant="outline" size="sm">
                    Manage Roles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Breakdown Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#176BFF]" />
              Provider
            </div>
            <p className="text-slate-500 leading-relaxed">
              Clinical doctor or specialist. Manages patient consults, clinical notes, and availability.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Practice Manager
            </div>
            <p className="text-slate-500 leading-relaxed">
              Full practice administration, room locations, staff invitations, and profile authority.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              Reception Scheduler
            </div>
            <p className="text-slate-500 leading-relaxed">
              Manages daily appointments, walk-ins, patient arrivals, and slot blockouts.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-600" />
              Finance & Billing
            </div>
            <p className="text-slate-500 leading-relaxed">
              Handles medical-aid claims reconciliation, consultation fee pricing, and invoices.
            </p>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Invite Practice Team Member
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send an email invitation with delegated role permissions.
                </p>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grace Sibeko"
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="grace@practice.co.za"
                  required
                />

                <Input
                  label="Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27 82 000 0000"
                  required
                />

                <Select
                  label="Assigned Practice Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  options={[
                    { value: 'PRACTICE_MANAGER', label: 'Practice Manager (Full Practice Admin)' },
                    { value: 'RECEPTION_SCHEDULER', label: 'Reception & Appointment Scheduler' },
                    { value: 'FINANCE_BILLING', label: 'Finance & Medical Aid Billing' },
                    { value: 'PROVIDER', label: 'Associate Healthcare Provider' },
                  ]}
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" leftIcon={<UserPlus className="w-4 h-4" />}>
                    Send Invitation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
};
