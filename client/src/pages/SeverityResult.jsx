import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import SeverityBadge from '../components/SeverityBadge';
import { ChevronRight, Home, CheckCircle, Phone } from 'lucide-react';

export default function SeverityResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const result = location.state?.result;

  useEffect(() => {
    if (!result) navigate('/triage');
  }, [result, navigate]);

  if (!result) return null;

  const explanation = language === 'gu' && result.explanation_gu
    ? result.explanation_gu
    : result.explanation;

  const selfCare = language === 'gu' && result.self_care_gu
    ? result.self_care_gu
    : result.self_care;

  const recommendedAction = language === 'gu' && result.recommended_action_gu
    ? result.recommended_action_gu
    : result.recommended_action;

  return (
    <Layout>
      <div className="animate-fade-in">
        <p className="text-sm text-muted mb-1">{t('severityExplain')}</p>
        <h1 className="text-2xl font-serif font-bold text-umber mb-4">{t('severityTitle')}</h1>

        {/* Severity badge */}
        <div className="mb-5">
          <SeverityBadge severity={result.severity} language={language} />
        </div>

        {/* Primary concern */}
        {result.primary_concern && (
          <div className="card mb-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Primary Concern</p>
            <p className="font-semibold text-umber">{result.primary_concern}</p>
          </div>
        )}

        {/* Explanation */}
        <div className="card mb-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Assessment</p>
          <p className={`text-sm text-umber leading-relaxed ${language === 'gu' ? 'font-gujarati' : ''}`}>
            {explanation}
          </p>
        </div>

        {/* Self-care guidance */}
        {selfCare && selfCare.length > 0 && (
          <div className="card mb-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">{t('selfCare')}</p>
            <ul className="space-y-2">
              {selfCare.map((item, i) => (
                <li key={i} className={`flex items-start gap-2.5 text-sm text-umber ${language === 'gu' ? 'font-gujarati' : ''}`}>
                  <CheckCircle size={16} className="text-forest-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended action */}
        {recommendedAction && (
          <div className={`rounded-xl border p-4 mb-5 ${
            result.severity === 'URGENT' ? 'bg-red-50 border-red-200' :
            result.severity === 'ATTENTION' ? 'bg-amber-50 border-amber-200' :
            'bg-forest-50 border-forest-200'
          }`}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{t('nextSteps')}</p>
            <p className={`text-sm font-medium text-umber ${language === 'gu' ? 'font-gujarati' : ''}`}>
              {recommendedAction}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {result.needs_teleconsult ? (
            <button
              onClick={() => navigate('/teleconsult', { state: { result } })}
              className="btn-primary w-full flex items-center justify-between"
            >
              <span>{t('bookConsult')}</span>
              <ChevronRight size={18} />
            </button>
          ) : (
            <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 text-center">
              <p className="text-forest-700 font-semibold text-sm">✓ Home care is appropriate</p>
              <p className="text-xs text-forest-600 mt-1">Follow the self-care guidance above. Visit a doctor if symptoms worsen or persist beyond 3–5 days.</p>
            </div>
          )}

          <button
            onClick={() => navigate('/triage')}
            className="btn-secondary w-full"
          >
            {t('newConsult')}
          </button>

          <button
            onClick={() => navigate('/home')}
            className="btn-ghost w-full flex items-center justify-center gap-2"
          >
            <Home size={16} />
            {t('goHome')}
          </button>
        </div>

        {/* Emergency note */}
        {result.severity === 'URGENT' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <Phone size={18} className="text-urgent-red shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-urgent-red text-sm">If condition worsens — call 108 immediately</p>
            </div>
            <a href="tel:108" className="bg-urgent-red text-white text-sm font-bold px-3 py-1.5 rounded-lg">108</a>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted mt-6">
          This assessment is AI-generated guidance only, not a medical diagnosis.<br />
          Always consult a qualified doctor for medical advice.
        </p>
      </div>
    </Layout>
  );
}
