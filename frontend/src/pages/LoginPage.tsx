import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { TrendingUp, AlertCircle, LogIn, Lock } from 'lucide-react';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await api.post('/auth/login', { email, password });
      const authData = res?.token ? res : (res?.data || res);
      if (!authData || !authData.token) {
        throw new Error('Invalid email or password');
      }
      login(authData.token, authData.user);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res: any = await api.post('/auth/login', {
        email: 'trader@quantflow.io',
        password: 'Password123!',
      });
      const authData = res?.token ? res : (res?.data || res);
      login(authData.token, authData.user);
      navigate('/');
    } catch {
      try {
        const res: any = await api.post('/auth/register', {
          email: 'trader@quantflow.io',
          password: 'Password123!',
          name: 'Trader Demo User',
        });
        const authData = res?.token ? res : (res?.data || res);
        login(authData.token, authData.user);
        navigate('/');
      } catch (err: any) {
        setError(err?.message || 'Demo login failed');
      }
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
          <h1 className="text-2xl font-extrabold font-mono text-[#131722] tracking-wide">QuantFlow Workstation</h1>
          <p className="text-xs text-[#707a8a] font-medium">Sign in to access real-time market data and paper portfolio</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 bg-[#fdecee] border border-[#f23645]/30 p-3 rounded-lg text-xs font-mono text-[#f23645] font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Login */}
        <div className="space-y-3">
          <GoogleLoginButton onSuccess={() => navigate('/')} onError={(err) => setError(err)} />
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#e0e3eb]"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono font-bold text-[#707a8a] uppercase">Or with Email</span>
            <div className="flex-grow border-t border-[#e0e3eb]"></div>
          </div>
        </div>

        {/* Form Login */}
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[#707a8a] uppercase font-bold text-[10px]">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-mono text-[#2962ff] hover:underline font-semibold flex items-center space-x-1">
                <Lock className="w-3 h-3 mr-0.5" />
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg px-3.5 py-2.5 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2962ff] hover:bg-[#1e54e4] text-white font-bold py-2.5 rounded-lg transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'SIGN IN'}</span>
          </button>
        </form>

        {/* Demo Login & Footer */}
        <div className="border-t border-[#f0f3fa] pt-4 text-center space-y-3">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full bg-[#e6f4f1] hover:bg-[#d0ece7] border border-[#089981]/30 text-[#089981] font-mono text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
          >
            ⚡ ONE-CLICK DEMO ACCOUNT LOGIN
          </button>

          <p className="text-xs text-[#707a8a] font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2962ff] hover:underline font-mono font-bold">
              Sign Up Free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
