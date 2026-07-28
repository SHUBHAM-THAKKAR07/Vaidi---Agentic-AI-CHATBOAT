import React from 'react';

export default function ThinkingIndicator({ label = 'Thinking...' }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-sand rounded-xl border border-border w-fit animate-fade-in">
      <div className="flex items-center gap-1">
        <span className="thinking-dot" />
        <span className="thinking-dot" />
        <span className="thinking-dot" />
      </div>
      <span className="text-sm text-muted font-medium">{label}</span>
    </div>
  );
}
