import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import SeverityBadge from '../components/SeverityBadge';
import { api } from '../context/AuthContext';
import { AlertTriangle, Clock, Package, Activity, ChevronRight, Users, MapPin } from 'lucide-react';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/worker/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-terracotta-200 border-t-terracotta-700 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recent_consultations || [];

  return (
    <Layout>
      {/* Worker greeting */}
      <div className="mb-6">
        <p className="text-sm text-muted">{t('welcomeWorker')}</p>
        <h1 className="text-2xl font-serif font-bold text-umber">{user?.name}</h1>
        {user?.village && (
          <p className="flex items-center gap-1 text-sm text-muted mt-0.5">
            <MapPin size={13} />
            {user.village}
          </p>
        )}
        <p className="text-xs text-muted mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Alert banner for overdue */}
      {stats.overdue_followups > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertTriangle size={18} className="text-urgent-red shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-urgent-red">
              {stats.overdue_followups} overdue follow-up{stats.overdue_followups > 1 ? 's' : ''} need attention
            </p>
          </div>
          <button
            onClick={() => navigate('/worker/followups')}
            className="text-xs font-semibold text-urgent-red hover:underline"
          >
            View
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={AlertTriangle}
          iconBg="bg-red-100"
          iconColor="text-urgent-red"
          label={t('overdueFollowups')}
          value={stats.overdue_followups ?? '—'}
          urgent={stats.overdue_followups > 0}
          onClick={() => navigate('/worker/followups?status=overdue')}
        />
        <StatCard
          icon={Clock}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label={t('upcomingFollowups')}
          value={stats.upcoming_followups ?? '—'}
          onClick={() => navigate('/worker/followups?status=upcoming')}
        />
        <StatCard
          icon={Package}
          iconBg="bg-forest-50"
          iconColor="text-forest-600"
          label={t('criticalStock')}
          value={stats.critical_stock_items ?? '—'}
          urgent={stats.critical_stock_items > 0}
          onClick={() => navigate('/worker/stock')}
        />
        <StatCard
          icon={Activity}
          iconBg="bg-terracotta-100"
          iconColor="text-terracotta-700"
          label={t('todayConsults')}
          value={stats.todays_consultations ?? '—'}
        />
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/worker/followups')}
            className="card text-left hover:shadow-card-hover transition-shadow"
          >
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center mb-2">
              <Users size={18} className="text-amber-600" />
            </div>
            <p className="font-semibold text-sm text-umber">Follow-up Register</p>
            <p className="text-xs text-muted mt-0.5">Patient visit tracking</p>
          </button>
          <button
            onClick={() => navigate('/worker/stock')}
            className="card text-left hover:shadow-card-hover transition-shadow"
          >
            <div className="w-9 h-9 bg-forest-100 rounded-lg flex items-center justify-center mb-2">
              <Package size={18} className="text-forest-600" />
            </div>
            <p className="font-semibold text-sm text-umber">Medicine Stock</p>
            <p className="text-xs text-muted mt-0.5">Update stock levels</p>
          </button>
        </div>
      </div>

      {/* Recent consultations */}
      {recent.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{t('recentConsultations')}</h2>
          <div className="space-y-2">
            {recent.map(c => (
              <div key={c.id} className="card flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-umber truncate">{c.patient_name}</p>
                  <p className="text-xs text-muted truncate">{c.primary_concern}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <SeverityBadge severity={c.severity} language={language} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, urgent, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`card text-left transition-shadow hover:shadow-card-hover ${urgent ? 'border-red-200 bg-red-50/30' : ''}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <p className={`text-2xl font-bold ${urgent ? 'text-urgent-red' : 'text-umber'}`}>{value}</p>
      <p className="text-xs text-muted mt-0.5 leading-tight">{label}</p>
    </button>
  );
}
