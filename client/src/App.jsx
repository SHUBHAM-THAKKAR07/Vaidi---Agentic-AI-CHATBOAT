import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { RequireAuth, RequireWorker, RedirectIfAuth } from './components/ProtectedRoute';

import Login from './pages/Login';
import PatientHome from './pages/PatientHome';
import Triage from './pages/Triage';
import SeverityResult from './pages/SeverityResult';
import Teleconsult from './pages/Teleconsult';
import WorkerDashboard from './pages/WorkerDashboard';
import FollowupList from './pages/FollowupList';
import StockManagement from './pages/StockManagement';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: '14px',
                background: '#1A1208',
                color: '#FDF6ED',
                borderRadius: '10px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#2D5016', secondary: '#FDF6ED' },
                duration: 3000,
              },
              error: {
                iconTheme: { primary: '#C0392B', secondary: '#FDF6ED' },
                duration: 5000,
              },
            }}
          />

          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public */}
            <Route path="/login" element={
              <RedirectIfAuth>
                <Login />
              </RedirectIfAuth>
            } />

            {/* Patient routes */}
            <Route path="/home" element={
              <RequireAuth>
                <PatientHome />
              </RequireAuth>
            } />
            <Route path="/triage" element={
              <RequireAuth>
                <Triage />
              </RequireAuth>
            } />
            <Route path="/severity" element={
              <RequireAuth>
                <SeverityResult />
              </RequireAuth>
            } />
            <Route path="/teleconsult" element={
              <RequireAuth>
                <Teleconsult />
              </RequireAuth>
            } />

            {/* Worker routes */}
            <Route path="/worker" element={
              <RequireWorker>
                <WorkerDashboard />
              </RequireWorker>
            } />
            <Route path="/worker/followups" element={
              <RequireWorker>
                <FollowupList />
              </RequireWorker>
            } />
            <Route path="/worker/stock" element={
              <RequireWorker>
                <StockManagement />
              </RequireWorker>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
