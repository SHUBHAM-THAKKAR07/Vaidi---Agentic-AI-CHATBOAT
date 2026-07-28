import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { Activity, MapPin, ChevronRight, Phone } from 'lucide-react';

export default function PatientHome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Welcome header */}
      <div className="mb-6">
        <p className="text-sm text-muted">Welcome back,</p>
        <h1 className="text-2xl font-serif font-bold text-umber">{user?.name?.split(' ')[0]}</h1>
        {user?.village && (
          <p className="flex items-center gap-1 text-sm text-muted mt-0.5">
            <MapPin size={13} />
            {user.village}
          </p>
        )}
      </div>

      {/* Main CTA */}
      <button
        onClick={() => navigate('/triage')}
        className="w-full bg-terracotta-700 text-parchment rounded-2xl p-6 text-left mb-4 
                   hover:bg-terracotta-600 transition-colors active:bg-terracotta-800 shadow-card"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mb-3">
              <Activity size={20} className="text-parchment" />
            </div>
            <h2 className="text-xl font-serif font-bold text-parchment mb-1">
              {t('triageTitle')}
            </h2>
            <p className="text-sm text-parchment/70">
              {t('triageSubtitle')}
            </p>
          </div>
          <ChevronRight size={24} className="text-parchment/50 mt-1 shrink-0" />
        </div>
      </button>

      {/* Information cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4">
          <div className="w-8 h-8 bg-forest-50 rounded-lg flex items-center justify-center mb-2">
            <span className="text-forest-600 text-lg">🌿</span>
          </div>
          <h3 className="font-semibold text-sm text-umber mb-1">Teleconsult</h3>
          <p className="text-xs text-muted">Video/audio doctor consultation from your village</p>
        </div>
        <div className="card p-4">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-2">
            <span className="text-amber-600 text-lg">📋</span>
          </div>
          <h3 className="font-semibold text-sm text-umber mb-1">Health Records</h3>
          <p className="text-xs text-muted">Your consultation history in one place</p>
        </div>
      </div>

      {/* Emergency banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-urgent-red rounded-xl flex items-center justify-center shrink-0">
          <Phone size={18} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-umber text-sm">Emergency? Call 108</p>
          <p className="text-xs text-muted">Free ambulance service available 24×7</p>
        </div>
        <a
          href="tel:108"
          className="ml-auto bg-urgent-red text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shrink-0"
        >
          Call
        </a>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted mt-6">
        Vaidi is not a substitute for emergency medical care.<br />
        Powered by IBM Granite AI · watsonx.ai
      </p>
    </Layout>
  );
}
