import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { AlertCircle, LogIn, Zap } from 'lucide-react';
import { AuthShell } from '../components/layout/AuthShell';
import { Button } from '../components/ui/Button';
import { FieldLabel } from '../components/ui/misc';

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
        throw new Error('Invalid authentication response from server.');
      }
      login(authData.token, authData.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      try {
        const res: any = await api.post('/auth/login', {
          email: 'trader@quantflow.io',
          password: 'Password123!',
        });
        const authData = res?.token ? res : (res?.data || res);
        login(authData.token, authData.user);
        navigate('/');
      } catch {
        const res: any = await api.post('/auth/register', {
          email: 'trader@quantflow.io',
          password: 'Password123!',
          name: 'Trader Demo User',
        });
        const authData = res?.token ? res : (res?.data || res);
        login(authData.token, authData.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in to the terminal</h2>
          <p className="mt-1 text-sm text-fg-subtle">Access real-time market analytics and your paper portfolio.</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-md border border-down/30 bg-down/10 p-3 font-mono text-xs font-semibold text-down">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel htmlFor="email">Email Address</FieldLabel>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@domain.com"
              className="qf-input h-10"
            />
          </div>

          <div>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="qf-input h-10"
            />
          </div>

          <Button type="submit" variant="primary" size="md" loading={loading} className="h-10 w-full">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </form>

        <div className="relative flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="font-mono text-3xs uppercase tracking-[0.2em] text-fg-subtle">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="group relative flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-md border border-up/30 bg-up/10 font-mono text-xs font-bold text-up transition-[background-color,border-color,transform] duration-150 hover:border-up/50 hover:bg-up/15 active:scale-[0.98] disabled:opacity-50"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-up/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Zap className="relative h-4 w-4" />
          <span className="relative">One-click demo account</span>
        </button>

        <p className="text-center text-xs text-fg-subtle">
          Don't have an account?{' '}
          <Link to="/register" className="font-mono font-semibold text-accent hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};
