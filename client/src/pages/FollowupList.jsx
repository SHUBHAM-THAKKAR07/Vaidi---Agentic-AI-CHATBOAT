import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import ThinkingIndicator from '../components/ThinkingIndicator';
import { api } from '../context/AuthContext';
import { AlertTriangle, Clock, ChevronDown, CheckCircle, Sparkles, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  overdue:  { label: 'Overdue',  color: 'text-urgent-red',  bg: 'bg-red-50',    border: 'border-red-200',   icon: AlertTriangle },
  upcoming: { label: 'Upcoming', color: 'text-amber-600',   bg: 'bg-amber-50',  border: 'border-amber-200', icon: Clock },
  completed:{ label: 'Completed',color: 'text-forest-600',  bg: 'bg-forest-50', border: 'border-forest-200',icon: CheckCircle },
};

export default function FollowupList() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [followups, setFollowups] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [advice, setAdvice] = useState({});
  const [loadingAdvice, setLoadingAdvice] = useState({});

  const urlStatus = new URLSearchParams(location.search).get('status');
  useEffect(() => {
    if (urlStatus && urlStatus !== filter) setFilter(urlStatus);
  }, [urlStatus]);

  useEffect(() => {
    loadFollowups();
  }, [filter]);

  const loadFollowups = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/worker/followups?status=${filter}`);
      setFollowups(res.data.followups);
    } catch {
      toast.error('Could not load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const markVisited = async (id) => {
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 7);
    try {
      await api.put(`/api/worker/followups/${id}`, {
        status: 'completed',
        next_due: nextDue.toISOString()
      });
      toast.success('Marked as visited');
      loadFollowups();
    } catch {
      toast.error('Update failed');
    }
  };

  const fetchAdvice = async (id) => {
    if (advice[id]) return;
    setLoadingAdvice(prev => ({ ...prev, [id]: true }));
    try {
      const res = await api.get(`/api/worker/followups/${id}/advice`);
      setAdvice(prev => ({ ...prev, [id]: res.data }));
    } catch {
      toast.error('Could not get AI advice');
    } finally {
      setLoadingAdvice(prev => ({ ...prev, [id]: false }));
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === -1) return '1 day ago';
    if (diff < 0) return `${Math.abs(diff)} days ago`;
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  const filters = [
    { key: 'all', label: t('allStatuses') },
    { key: 'overdue', label: t('overdueOnly') },
    { key: 'upcoming', label: t('upcomingOnly') },
    { key: 'completed', label: t('completed') },
  ];

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-2xl font-serif font-bold text-umber">{t('followupList')}</h1>
        <p className="text-sm text-muted mt-0.5">{followups.length} patient{followups.length !== 1 ? 's' : ''} · {filter === 'all' ? 'all statuses' : filter}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors border
              ${filter === f.key
                ? 'bg-terracotta-700 text-parchment border-terracotta-700'
                : 'bg-white text-muted border-border hover:border-terracotta-300 hover:text-umber'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ThinkingIndicator label="Loading follow-ups..." />
      ) : followups.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <CheckCircle size={40} className="mx-auto mb-3 text-forest-300" />
          <p className="font-medium">No {filter !== 'all' ? filter : ''} follow-ups</p>
        </div>
      ) : (
        <div className="space-y-3">
          {followups.map(f => {
            const sc = STATUS_CONFIG[f.status] || STATUS_CONFIG.upcoming;
            const StatusIcon = sc.icon;
            const isOpen = expanded === f.id;

            return (
              <div
                key={f.id}
                className={`card border-l-4 ${f.status === 'overdue' ? 'border-l-urgent-red' : f.status === 'upcoming' ? 'border-l-amber-400' : 'border-l-forest-400'}`}
              >
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : f.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${sc.bg}`}>
                      <StatusIcon size={14} className={sc.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-umber">{f.patient_name}</p>
                        {f.age && <span className="text-xs text-muted">age {f.age}</span>}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${sc.bg} ${sc.border} ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted mt-0.5">{f.condition}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {f.village}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          Due: {formatDate(f.next_due)}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                    {f.notes && (
                      <div className="bg-sand rounded-lg p-3 text-sm text-umber">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Notes</p>
                        <p>{f.notes}</p>
                      </div>
                    )}

                    {/* AI Advice */}
                    <div>
                      <button
                        onClick={() => fetchAdvice(f.id)}
                        className="flex items-center gap-2 text-sm text-terracotta-700 font-semibold hover:underline"
                      >
                        <Sparkles size={14} />
                        {t('getAdvice')}
                      </button>

                      {loadingAdvice[f.id] && (
                        <div className="mt-2">
                          <ThinkingIndicator label="Getting AI advice..." />
                        </div>
                      )}

                      {advice[f.id] && (
                        <div className="mt-2 bg-terracotta-50 border border-terracotta-200 rounded-lg p-3 text-sm animate-fade-in">
                          <p className={`text-umber leading-relaxed ${language === 'gu' ? 'font-gujarati' : ''}`}>
                            {language === 'gu' && advice[f.id].suggested_action_gu
                              ? advice[f.id].suggested_action_gu
                              : advice[f.id].suggested_action}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                              advice[f.id].priority === 'high' ? 'bg-red-100 text-urgent-red' :
                              advice[f.id].priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                              'bg-forest-50 text-forest-600'
                            }`}>
                              {advice[f.id].priority?.toUpperCase()} priority
                            </span>
                            <span className="text-xs text-muted">· {advice[f.id].estimated_visit_duration}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {f.status !== 'completed' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => markVisited(f.id)}
                          className="flex-1 bg-forest-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-forest-500 transition-colors"
                        >
                          ✓ {t('markVisited')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
