import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { LogOut, Home, ClipboardList, Package, Stethoscope } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isWorker = user?.role === 'worker';
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(isWorker ? '/worker' : '/home')}
            className="flex items-center gap-2.5 focus:outline-none"
          >
            {/* Vaidi logo mark */}
            <div className="w-8 h-8 rounded-lg bg-terracotta-700 flex items-center justify-center">
              <Stethoscope size={16} className="text-parchment" />
            </div>
            <div className="leading-tight">
              <div className="font-serif text-lg font-bold text-umber">{t('appName')}</div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            {user && (
              <button
                onClick={handleLogout}
                className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2"
                title={t('logout')}
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 page-enter">
        {children}
      </main>

      {/* Bottom nav for worker */}
      {isWorker && (
        <nav className="bg-white border-t border-border sticky bottom-0 z-40">
          <div className="max-w-2xl mx-auto flex">
            <NavItem
              icon={Home}
              label="Home"
              active={isActive('/worker')}
              onClick={() => navigate('/worker')}
            />
            <NavItem
              icon={ClipboardList}
              label="Follow-ups"
              active={isActive('/worker/followups')}
              onClick={() => navigate('/worker/followups')}
            />
            <NavItem
              icon={Package}
              label="Stock"
              active={isActive('/worker/stock')}
              onClick={() => navigate('/worker/stock')}
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors
        ${active
          ? 'text-terracotta-700 border-t-2 border-terracotta-700 -mt-px'
          : 'text-muted hover:text-umber border-t-2 border-transparent -mt-px'
        }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );
}
