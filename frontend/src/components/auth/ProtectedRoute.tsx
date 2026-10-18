import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
        <div className="relative h-10 w-10">
          <span className="absolute inset-0 rounded-md border border-accent/40" />
          <span className="absolute inset-0 animate-spin rounded-md border-2 border-transparent border-t-accent [animation-duration:900ms]" />
        </div>
        <div className="font-mono text-2xs uppercase tracking-[0.2em] text-fg-subtle">Authenticating QuantFlow Terminal</div>
        <div className="h-px w-40 overflow-hidden bg-line">
          <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-accent to-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
