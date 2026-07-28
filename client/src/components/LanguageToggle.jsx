import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-md
        text-sm font-semibold
        border border-terracotta-300 text-terracotta-700
        bg-parchment hover:bg-terracotta-50
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:ring-offset-1
        ${className}
      `}
      title={t('switchLang')}
      aria-label={t('switchLang')}
    >
      <span className="text-xs leading-none">
        {language === 'en' ? 'ગુ' : 'EN'}
      </span>
      <span className="text-xs opacity-60">|</span>
      <span className="text-xs leading-none">
        {language === 'en' ? 'Gujarati' : 'English'}
      </span>
    </button>
  );
}
