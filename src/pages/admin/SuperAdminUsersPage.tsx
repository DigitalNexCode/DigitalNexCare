import React from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { UserPlus, Shield } from 'lucide-react';

export const SuperAdminUsersPage: React.FC = () => {
  return (
    <AdminLayout
      title="Super-Admin Access Control & Staff Roles"
      subtitle="Manage internal platform operator roles: Platform Admin, Verifier / Trust Ops, Practice Manager, Finance."
      isSuperAdmin
    >
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700">Internal Staff Access Directory</span>
          <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
            Add Internal User
          </Button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Thabo Sithole</div>
              <div className="text-slate-500">thabo.sithole@digitalnexcare.co.za • Role: SUPER_ADMIN</div>
            </div>
            <Badge variant="verified" size="sm">
              Full Access
            </Badge>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Amina Jacobs</div>
              <div className="text-slate-500">amina.jacobs@digitalnexcare.co.za • Role: VERIFIER_TRUST_OPS</div>
            </div>
            <Badge variant="brand" size="sm">
              Compliance Queue
            </Badge>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
