import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { TrendingUp, AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res: any = await api.post('/auth/forgot-password', { email: email.trim() });
      const msg = res?.data?.message || res?.message || 'Password reset link has been sent to your email address.';
      setSuccessMessage(msg);
    } catch (err: any) {
      setError(err?.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e0e3eb] rounded-xl p-8 space-y-6 shadow-md text-[#131722]">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-[#2962ff] p-3 rounded-xl mb-1 shadow-sm">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold font-mono text-[#131722] tracking-wide">Reset Password</h1>
          <p className="text-xs text-[#707a8a] font-medium">Enter your registered email address to receive a secure password reset link</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-[#fdecee] border border-[#f23645]/30 p-3 rounded-lg text-xs font-mono text-[#f23645] font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start space-x-2 bg-[#e6f4ea] border border-[#089981]/30 p-3 rounded-lg text-xs font-mono text-[#089981] font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-[#707a8a] uppercase font-bold text-[10px] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@domain.com"
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg px-3.5 py-2.5 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2962ff] hover:bg-[#1e54e4] text-white font-bold py-2.5 rounded-lg transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>{loading ? 'Sending Instructions...' : 'SEND RESET LINK'}</span>
          </button>
        </form>

        <div className="border-t border-[#f0f3fa] pt-4 text-center">
          <Link to="/login" className="text-xs font-mono font-bold text-[#2962ff] hover:underline flex items-center justify-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
