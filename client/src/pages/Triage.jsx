import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import ThinkingIndicator from '../components/ThinkingIndicator';
import { api } from '../context/AuthContext';
import { Send, AlertTriangle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Triage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', content: string }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReadyToAssess, setIsReadyToAssess] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-focus input
  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/triage/message', {
        message: text.trim(),
        conversationHistory: messages,
        language
      });

      const { message: reply, isReadyToAssess: ready, isEmergency: emergency, questionCount: qc } = res.data;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setIsReadyToAssess(ready);
      setIsEmergency(emergency);
      setQuestionCount(qc);
    } catch (err) {
      const msg = err.response?.data?.error || t('error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAssess = async () => {
    setAssessing(true);
    try {
      const res = await api.post('/api/triage/assess', {
        conversationHistory: messages,
        patientName: user?.name
      });
      navigate('/severity', { state: { result: res.data, history: messages } });
    } catch (err) {
      const msg = err.response?.data?.error || 'Assessment failed. Please try again.';
      toast.error(msg);
      setAssessing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const progressPercent = Math.min(100, (questionCount / 6) * 100);

  return (
    <Layout>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-serif font-bold text-umber">{t('triageTitle')}</h1>
        <p className="text-sm text-muted mt-0.5">{t('triageSubtitle')}</p>
      </div>

      {/* Progress bar */}
      {messages.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>{t('questionOf')} {questionCount}</span>
            {isReadyToAssess && <span className="text-forest-600 font-medium">Ready to assess ✓</span>}
          </div>
          <div className="h-1.5 bg-sand rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isReadyToAssess ? 'bg-forest-500' : 'bg-terracotta-400'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Emergency alert */}
      {isEmergency && (
        <div className="mb-4 bg-red-50 border-2 border-urgent-red rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={22} className="text-urgent-red shrink-0" />
          <div>
            <p className="font-bold text-urgent-red">{t('emergencyAlert')}</p>
            <a href="tel:108" className="text-sm font-semibold text-urgent-red underline">Tap here to call 108 now</a>
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="space-y-3 mb-4 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-terracotta-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🩺</span>
            </div>
            <p className="text-muted text-sm max-w-xs mx-auto">
              {language === 'gu'
                ? 'આજે તમે કેવા અનુભવો છો? શરૂ કરવા નીચે ટાઇપ કરો.'
                : 'Tell me how you are feeling today. Type your symptoms below to get started.'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 max-w-xs mx-auto">
              {(language === 'gu'
                ? ['મને તાવ છે', 'પેટ દુખે છે', 'ઉધરસ છે', 'નબળાઈ લાગે છે']
                : ['I have a fever', 'I have stomach pain', 'I have a cough', 'I feel weak']
              ).map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className={`card-surface text-sm text-muted hover:text-umber hover:shadow-card transition-all py-2 px-3 text-left rounded-lg ${language === 'gu' ? 'font-gujarati' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-terracotta-700 text-parchment rounded-br-sm'
                  : 'bg-white border border-border text-umber rounded-bl-sm shadow-card'
                }`}
            >
              {msg.role === 'assistant' && (
                <p className="text-xs font-semibold text-muted mb-1">{t('vaidinMessage')}</p>
              )}
              <p className={language === 'gu' ? 'font-gujarati' : ''}>{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
              <p className="text-xs font-semibold text-muted mb-2">{t('vaidinMessage')}</p>
              <ThinkingIndicator label={t('vaidiThinking')} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Assess button */}
      {isReadyToAssess && !isEmergency && (
        <button
          onClick={handleAssess}
          disabled={assessing}
          className="w-full mb-3 bg-forest-600 text-white font-semibold rounded-xl py-4 px-5
                     flex items-center justify-between
                     hover:bg-forest-500 active:bg-forest-700 transition-colors
                     disabled:opacity-70 animate-slide-up"
        >
          <span>
            {assessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Assessing...
              </span>
            ) : t('assessBtn')}
          </span>
          <ChevronRight size={20} />
        </button>
      )}

      {/* Input area */}
      {!isEmergency && (
        <div className="sticky bottom-0 bg-parchment pt-2 pb-safe">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('triageInputPlaceholder')}
              disabled={loading || assessing}
              rows={1}
              className="input-field resize-none flex-1 min-h-[48px] max-h-32 py-3 leading-relaxed"
              style={{ height: 'auto' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading || assessing}
              className="btn-primary px-4 py-3 shrink-0"
              aria-label={t('sendBtn')}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-muted mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>
      )}
    </Layout>
  );
}
