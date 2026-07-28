import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { Stethoscope, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, register } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState(null); // 'patient' | 'worker'
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ phone: '', password: '', name: '', village: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (mode === 'register') {
      if (!form.name.trim() || form.name.length < 2) e.name = 'Please enter your full name';
      if (!form.village.trim() || form.village.length < 2) e.village = 'Please enter your village name';
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      let user;
      if (mode === 'register') {
        user = await register(form.name, form.phone, form.password, form.village);
      } else {
        user = await login(form.phone, form.password);
      }
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'worker' ? '/worker' : '/home');
    } catch (err) {
      const msg = err.response?.data?.error || t('error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const InputError = ({ field }) =>
    errors[field] ? <p className="text-xs text-urgent-red mt-1">{errors[field]}</p> : null;

  // Role selection screen
  if (!role) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col">
        <div className="flex justify-end p-4">
          <LanguageToggle />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-terracotta-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Stethoscope size={32} className="text-parchment" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-umber">{t('appName')}</h1>
            <p className="text-muted mt-1 text-base">{t('appTagline')}</p>
            <p className="text-xs text-muted mt-0.5">{t('appSubtagline')}</p>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <p className="text-center text-sm font-medium text-muted mb-4">Who are you?</p>

            <button
              onClick={() => setRole('patient')}
              className="w-full card hover:shadow-card-hover transition-shadow text-left flex items-start gap-4 p-5 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-terracotta-100 flex items-center justify-center shrink-0">
                <User size={20} className="text-terracotta-700" />
              </div>
              <div>
                <p className="font-semibold text-umber">{t('iAmPatient')}</p>
                <p className="text-sm text-muted mt-0.5">{t('patientLoginDesc')}</p>
              </div>
            </button>

            <button
              onClick={() => setRole('worker')}
              className="w-full card hover:shadow-card-hover transition-shadow text-left flex items-start gap-4 p-5 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-forest-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-forest-600" />
              </div>
              <div>
                <p className="font-semibold text-umber">{t('iAmWorker')}</p>
                <p className="text-sm text-muted mt-0.5">{t('workerLoginDesc')}</p>
              </div>
            </button>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 w-full max-w-sm">
            <div className="card-surface text-xs text-muted space-y-1 p-3">
              <p className="font-semibold text-umber">{t('demoCredentials')}:</p>
              <p>{t('demoPatient')}</p>
              <p>{t('demoWorker')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login / Register form
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <div className="flex justify-between items-center p-4">
        <button onClick={() => setRole(null)} className="text-sm text-muted hover:text-umber font-medium">← Back</button>
        <LanguageToggle />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${role === 'worker' ? 'bg-forest-100' : 'bg-terracotta-100'}`}>
              {role === 'worker' ? <ShieldCheck size={22} className="text-forest-600" /> : <User size={22} className="text-terracotta-700" />}
            </div>
            <h2 className="text-2xl font-serif font-bold text-umber">
              {role === 'worker' ? t('iAmWorker').split('(')[0].trim() : t('iAmPatient')}
            </h2>
          </div>

          {/* Mode toggle */}
          {role === 'patient' && (
            <div className="flex rounded-lg border border-border overflow-hidden mb-6 bg-white">
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErrors({}); }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors
                    ${mode === m ? 'bg-terracotta-700 text-parchment' : 'text-muted hover:text-umber'}`}
                >
                  {m === 'login' ? t('login') : t('register')}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="input-label">{t('namePlaceholder')}</label>
                  <input
                    className="input-field"
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={t('namePlaceholder')}
                    autoComplete="name"
                  />
                  <InputError field="name" />
                </div>
                <div>
                  <label className="input-label">{t('villagePlaceholder')}</label>
                  <input
                    className="input-field"
                    type="text"
                    value={form.village}
                    onChange={e => setForm(f => ({ ...f, village: e.target.value }))}
                    placeholder={t('villagePlaceholder')}
                  />
                  <InputError field="village" />
                </div>
              </>
            )}

            <div>
              <label className="input-label">Mobile Number</label>
              <input
                className="input-field"
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder={t('phonePlaceholder')}
                autoComplete="tel"
              />
              <InputError field="phone" />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  className="input-field pr-12"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={t('passwordPlaceholder')}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-umber p-1"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <InputError field="password" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full animate-spin" />
                  {t('loading')}
                </span>
              ) : (
                mode === 'register' ? t('registerBtn') : t('loginBtn')
              )}
            </button>
          </form>

          {role === 'patient' && (
            <p className="text-center text-sm text-muted mt-4">
              {mode === 'login' ? t('noAccount') : t('alreadyHaveAccount')}{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }}
                className="text-terracotta-700 font-semibold hover:underline"
              >
                {mode === 'login' ? t('registerHere') : t('loginHere')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
