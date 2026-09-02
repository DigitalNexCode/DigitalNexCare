import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../lib/auth/context';
import { Mail, Lock, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'PATIENT' | 'PROVIDER'>('PATIENT');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await signUp({
      fullName,
      email,
      phone,
      password,
      role: accountType,
    });

    setIsLoading(false);
    if (res.success) {
      navigate('/auth/verify-email');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-block">
          <BrandLogo variant="master" size="lg" />
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Create your DigitalNexCare account
        </h2>
        <p className="text-xs text-slate-500">
          Join thousands of South Africans accessing and managing modern healthcare
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-3xl sm:px-10 border border-slate-200">
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              I am registering as
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('PATIENT')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  accountType === 'PATIENT'
                    ? 'border-[#176BFF] bg-blue-50 text-[#176BFF]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Patient / Family
              </button>
              <button
                type="button"
                onClick={() => setAccountType('PROVIDER')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  accountType === 'PROVIDER'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Healthcare Provider
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={accountType === 'PROVIDER' ? 'e.g. Dr. Naledi Mokoena' : 'e.g. Lerato Khumalo'}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.co.za"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="South African Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27 82 555 0192"
              leftIcon={<Phone className="w-4 h-4" />}
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

            <div className="flex items-start gap-2 pt-1 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded text-[#176BFF] focus:ring-[#176BFF]"
                required
              />
              <span>
                I agree to the{' '}
                <Link to="/legal/terms" className="text-[#176BFF] underline">
                  Terms of Service
                </Link>{' '}
                and consent to POPIA medical data handling under the{' '}
                <Link to="/legal/privacy" className="text-[#176BFF] underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Email Verification
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/auth/sign-in" className="font-bold text-[#176BFF] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
