import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-terracotta-200 border-t-terracotta-700 rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireWorker({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'worker') return <Navigate to="/home" replace />;
  return children;
}

export function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'worker' ? '/worker' : '/home'} replace />;
  return children;
}
