import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth/context';
import { Mail, CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, pendingVerificationEmail, verifyEmail, resendVerificationCode } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const targetEmail = user?.email || pendingVerificationEmail || 'patient@digitalnexcare.co.za';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);
    setErrorMessage('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length < 4) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const res = await verifyEmail(fullCode);
    setIsLoading(false);

    if (res.success) {
      navigate('/auth/complete-profile');
    } else {
      setErrorMessage(res.message || 'Invalid verification code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    const res = await resendVerificationCode();
    setSuccessNotice(res.message || 'A fresh verification code has been dispatched.');
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  const handleFillDemoCode = () => {
    setOtp(['4', '8', '2', '9', '1', '0']);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-block">
          <BrandLogo variant="master" size="lg" />
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Verify Your Email Address
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          We have sent a 6-digit statutory security code to{' '}
          <strong className="text-slate-800 font-bold">{targetEmail}</strong>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-3xl sm:px-10 border border-slate-200">
          <div className="w-12 h-12 bg-blue-50 text-[#176BFF] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-6 h-6" />
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Enter 6-Digit Security Code
              </label>

              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-[#176BFF] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify & Complete Profile
            </Button>
          </form>

          {/* Resend & Demo Helper */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-center">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Didn't receive the email?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-bold text-[#176BFF] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Resend Code
                </button>
              ) : (
                <span className="text-slate-400 font-medium">Resend in {countdown}s</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleFillDemoCode}
              className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1.5 px-3 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Fill Demo Code (482910)
            </button>
          </div>

          <div className="mt-4 text-center text-xs">
            <Link to="/auth/sign-in" className="text-slate-500 hover:text-slate-900 font-medium">
              ← Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
