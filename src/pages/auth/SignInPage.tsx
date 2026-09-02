import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../lib/auth/context';
import { UserRole } from '../../types';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('lerato.khumalo@example.co.za');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await signIn(email, selectedRole);
    setIsLoading(false);

    if (res.success) {
      if (selectedRole === 'PATIENT') navigate('/patient/dashboard');
      else if (selectedRole === 'PROVIDER') navigate('/provider/dashboard');
      else if (selectedRole === 'PLATFORM_ADMIN') navigate('/admin/dashboard');
      else navigate('/super-admin/admin-users');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-block">
          <BrandLogo variant="master" size="lg" />
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Sign in to your account
        </h2>
        <p className="text-xs text-slate-500">
          Access your appointments, medical aid records, and healthcare portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-3xl sm:px-10 border border-slate-200">
          {/* Quick Role Switcher for preview */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Select Workspace Portal
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('PATIENT');
                  setEmail('lerato.khumalo@example.co.za');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  selectedRole === 'PATIENT'
                    ? 'border-[#176BFF] bg-blue-50 text-[#176BFF]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Patient Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('PROVIDER');
                  setEmail('dr.mokoena@hatfieldmedical.co.za');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  selectedRole === 'PROVIDER'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Provider Account
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-[#176BFF] focus:ring-[#176BFF]"
                />
                Remember me
              </label>
              <Link to="/auth/forgot-password" className="font-semibold text-[#176BFF] hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to {selectedRole.replace('_', ' ')}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/auth/sign-up" className="font-bold text-[#176BFF] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
