import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { TrendingUp, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password strength checks
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumOrSpec = /[0-9]|[^A-Za-z0-9]/.test(password);
  const isMinLen = password.length >= 8;
  const isMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isMinLen || !hasUpper || !hasLower || !hasNumOrSpec) {
      setError('Password must be at least 8 characters with upper, lower, and number/special character.');
      return;
    }

    if (!isMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res: any = await api.post('/auth/register', { name: name.trim(), email: email.trim(), password });
      const authData = res?.token ? res : (res?.data || res);
      if (!authData || !authData.token) {
        throw new Error('Invalid registration response from server.');
      }
      login(authData.token, authData.user);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e0e3eb] rounded-xl p-8 space-y-6 shadow-md text-[#131722]">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-[#2962ff] p-3 rounded-xl mb-1 shadow-sm">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold font-mono text-[#131722] tracking-wide">Create QuantFlow Account</h1>
          <p className="text-xs text-[#707a8a] font-medium">Get $100,000 in virtual cash for paper trading & analytics</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 bg-[#fdecee] border border-[#f23645]/30 p-3 rounded-lg text-xs font-mono text-[#f23645] font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Signup */}
        <div className="space-y-3">
          <GoogleLoginButton onSuccess={() => navigate('/')} onError={(err) => setError(err)} text="Sign Up with Google" />
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#e0e3eb]"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono font-bold text-[#707a8a] uppercase">Or with Email</span>
            <div className="flex-grow border-t border-[#e0e3eb]"></div>
          </div>
        </div>

        {/* Form Signup */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs font-mono">
          <div>
            <label className="block text-[#707a8a] uppercase font-bold text-[10px] mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alexander Elder"
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg px-3.5 py-2 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[#707a8a] uppercase font-bold text-[10px] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@domain.com"
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg px-3.5 py-2 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[#707a8a] uppercase font-bold text-[10px] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg px-3.5 py-2 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[#707a8a] uppercase font-bold text-[10px] mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg px-3.5 py-2 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] font-semibold"
            />
          </div>

          {/* Password Validation Indicator */}
          {password.length > 0 && (
            <div className="bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg p-2.5 space-y-1 text-[11px]">
              <div className="text-[#707a8a] font-bold uppercase text-[9px] mb-1">Password Requirements:</div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className={`flex items-center ${isMinLen ? 'text-[#089981]' : 'text-[#707a8a]'}`}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> 8+ Characters
                </span>
                <span className={`flex items-center ${hasUpper ? 'text-[#089981]' : 'text-[#707a8a]'}`}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Uppercase Letter
                </span>
                <span className={`flex items-center ${hasLower ? 'text-[#089981]' : 'text-[#707a8a]'}`}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Lowercase Letter
                </span>
                <span className={`flex items-center ${hasNumOrSpec ? 'text-[#089981]' : 'text-[#707a8a]'}`}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Number or Symbol
                </span>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`text-[10px] font-bold mt-1 ${isMatch ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                  {isMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2962ff] hover:bg-[#1e54e4] text-white font-bold py-2.5 rounded-lg transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'CREATE ACCOUNT'}</span>
          </button>
        </form>

        <div className="border-t border-[#f0f3fa] pt-4 text-center">
          <p className="text-xs text-[#707a8a] font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2962ff] hover:underline font-mono font-bold">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
