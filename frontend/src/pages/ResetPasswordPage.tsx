import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { TrendingUp, AlertCircle, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing from the link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Password reset failed. Token may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e0e3eb] rounded-xl p-8 space-y-6 shadow-md text-[#131722]">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-[#2962ff] p-3 rounded-xl mb-1 shadow-sm">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold font-mono text-[#131722] tracking-wide">Set New Password</h1>
          <p className="text-xs text-[#707a8a] font-medium">Create a strong new password for your QuantFlow account</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-[#fdecee] border border-[#f23645]/30 p-3 rounded-lg text-xs font-mono text-[#f23645] font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center space-x-2 bg-[#e6f4ea] border border-[#089981]/30 p-4 rounded-lg text-xs font-mono text-[#089981] font-bold">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>Password updated successfully! Redirecting to login...</span>
            </div>
            <Link to="/login" className="inline-block text-xs font-mono font-bold text-[#2962ff] hover:underline">
              Click here if not redirected automatically
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-[#707a8a] uppercase font-bold text-[10px] mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters (Upper, Lower, Number)"
                className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg px-3.5 py-2.5 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] font-semibold"
              />
            </div>

            <div>
              <label className="block text-[#707a8a] uppercase font-bold text-[10px] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg px-3.5 py-2.5 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2962ff] hover:bg-[#1e54e4] text-white font-bold py-2.5 rounded-lg transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Updating Password...' : 'UPDATE PASSWORD'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
