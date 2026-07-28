import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const config = {
  ROUTINE: {
    label: { en: 'Routine — Home Care', gu: 'સામાન્ય — ઘરે ઉપચાર' },
    icon: CheckCircle,
    bg: 'bg-forest-50',
    border: 'border-forest-300',
    text: 'text-forest-600',
    iconColor: 'text-forest-500',
    barColor: 'bg-forest-500',
    barWidth: 'w-1/4',
  },
  ATTENTION: {
    label: { en: 'See a Doctor Soon', gu: 'ટૂંક સમયમાં ડૉક્ટરને મળો' },
    icon: Clock,
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-600',
    iconColor: 'text-amber-500',
    barColor: 'bg-amber-400',
    barWidth: 'w-1/2',
  },
  URGENT: {
    label: { en: 'Urgent — Seek Immediate Care', gu: 'તાત્કાલિક — ડૉક્ટર જરૂરી' },
    icon: AlertTriangle,
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-urgent-red',
    iconColor: 'text-urgent-red',
    barColor: 'bg-urgent-red',
    barWidth: 'w-3/4',
  },
};

export default function SeverityBadge({ severity, language = 'en', size = 'md' }) {
  const c = config[severity] || config['ATTENTION'];
  const Icon = c.icon;

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-semibold ${c.bg} ${c.border} ${c.text}`}>
        <Icon size={13} />
        {c.label[language] || c.label.en}
      </span>
    );
  }

  return (
    <div className={`rounded-xl border-2 p-4 ${c.bg} ${c.border} animate-fade-in`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${c.bg} ${c.border} border`}>
          <Icon size={20} className={c.iconColor} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Assessment</p>
          <p className={`text-lg font-bold ${c.text}`}>{c.label[language] || c.label.en}</p>
        </div>
      </div>
      {/* Severity bar */}
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mt-1">
        <div className={`h-full rounded-full transition-all duration-700 ${c.barColor} ${c.barWidth}`} />
      </div>
    </div>
  );
}
