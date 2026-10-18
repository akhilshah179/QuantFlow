import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { AlertCircle, UserPlus } from 'lucide-react';
import { AuthShell } from '../components/layout/AuthShell';
import { Button } from '../components/ui/Button';
import { FieldLabel } from '../components/ui/misc';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await api.post('/auth/register', { name, email, password });
      const authData = res?.token ? res : (res?.data || res);
      if (!authData || !authData.token) {
        throw new Error('Invalid registration response from server.');
      }
      login(authData.token, authData.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
          <p className="mt-1 text-sm text-fg-subtle">
            Start with <span className="num font-semibold text-up">$100,000</span> in virtual cash for paper trading.
          </p>
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
            <FieldLabel htmlFor="name">Full Name</FieldLabel>
            <input id="name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alexander Elder" className="qf-input h-10" />
          </div>
          <div>
            <FieldLabel htmlFor="email">Email Address</FieldLabel>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="trader@domain.com" className="qf-input h-10" />
          </div>
          <div>
            <FieldLabel htmlFor="password" aside="min 6 chars">Password</FieldLabel>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="qf-input h-10"
            />
          </div>

          <Button type="submit" variant="primary" size="md" loading={loading} className="h-10 w-full">
            <UserPlus className="h-4 w-4" />
            Register Account
          </Button>
        </form>

        <p className="text-center text-xs text-fg-subtle">
          Already have an account?{' '}
          <Link to="/login" className="font-mono font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};
