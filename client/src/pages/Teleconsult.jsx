import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import ThinkingIndicator from '../components/ThinkingIndicator';
import { api } from '../context/AuthContext';
import { CheckCircle, Calendar, Clock, Star, User, ChevronRight, HelpCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Teleconsult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const result = location.state?.result;

  const [step, setStep] = useState('doctors'); // 'doctors' | 'slots' | 'prepare' | 'confirmed'
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [preparation, setPreparation] = useState(null);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!result) { navigate('/triage'); return; }
    fetchDoctors();
  }, [result]);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await api.get(`/api/teleconsult/doctors?specialty=${encodeURIComponent(result?.specialist_type || 'General Physician')}`);
      setDoctors(res.data.doctors);
    } catch {
      toast.error('Could not load doctors. Please try again.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const selectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setLoadingSlots(true);
    setStep('slots');
    try {
      const res = await api.get(`/api/teleconsult/slots/${doctor.id}`);
      setSlots(res.data.slots);
    } catch {
      toast.error('Could not load slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    try {
      const res = await api.post('/api/teleconsult/book', {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        slotDate: selectedSlot.date,
        slotTime: selectedSlot.time,
        specialty: selectedDoctor.specialty,
        consultationId: result?.consultation_id
      });
      setBooking(res.data.booking);

      // Fetch preparation advice
      setLoadingPrep(true);
      const prepRes = await api.post('/api/teleconsult/prepare', { severityResult: result });
      setPreparation(prepRes.data);
      setLoadingPrep(false);

      setStep('confirmed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  if (!result) return null;

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
          <button onClick={() => navigate('/severity', { state: { result } })} className="hover:text-umber">Assessment</button>
          <ChevronRight size={12} />
          <span className={step === 'doctors' ? 'text-umber font-medium' : ''}>Doctors</span>
          {(step === 'slots' || step === 'confirmed') && <><ChevronRight size={12} /><span className={step === 'slots' ? 'text-umber font-medium' : ''}>Slots</span></>}
          {step === 'confirmed' && <><ChevronRight size={12} /><span className="text-umber font-medium">Confirmed</span></>}
        </div>

        <h1 className="text-2xl font-serif font-bold text-umber mb-1">{t('teleconsultTitle')}</h1>
        {result.primary_concern && (
          <p className="text-sm text-muted mb-5">For: <span className="font-medium text-umber">{result.primary_concern}</span></p>
        )}

        {/* STEP: Doctors */}
        {step === 'doctors' && (
          <>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{t('chooseDoctorTitle')}</h2>
            {loadingDoctors ? (
              <ThinkingIndicator label="Finding available doctors..." />
            ) : (
              <div className="space-y-3">
                {doctors.map(doctor => (
                  <button
                    key={doctor.id}
                    onClick={() => selectDoctor(doctor)}
                    className="w-full card hover:shadow-card-hover transition-shadow text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-terracotta-100 flex items-center justify-center shrink-0">
                        <User size={20} className="text-terracotta-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-umber">{doctor.name}</p>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star size={12} className="fill-current" />
                            <span className="text-xs font-medium">{doctor.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted">{doctor.specialty} · {doctor.experience}</p>
                        <p className="text-xs text-forest-600 font-medium mt-1">
                          <Clock size={12} className="inline mr-1" />
                          Next available: {doctor.available_from}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          Languages: {doctor.languages.join(', ')}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-muted shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP: Slots */}
        {step === 'slots' && (
          <>
            <button
              onClick={() => setStep('doctors')}
              className="text-sm text-muted hover:text-umber mb-4 inline-flex items-center gap-1"
            >
              ← {selectedDoctor?.name}
            </button>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{t('chooseSlotTitle')}</h2>

            {loadingSlots ? (
              <ThinkingIndicator label="Loading available slots..." />
            ) : (
              <div className="space-y-5 mb-6">
                {Object.entries(slotsByDate).map(([date, daySlots]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={14} className="text-muted" />
                      <span className="text-sm font-semibold text-umber">{date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {daySlots.map(slot => (
                        <button
                          key={slot.id}
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all
                            ${!slot.available
                              ? 'bg-sand text-muted border-border line-through cursor-not-allowed opacity-50'
                              : selectedSlot?.id === slot.id
                                ? 'bg-terracotta-700 text-parchment border-terracotta-700'
                                : 'bg-white text-umber border-border hover:border-terracotta-300 hover:bg-terracotta-50'
                            }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSlot && (
              <div className="sticky bottom-0 bg-parchment pt-3">
                <div className="card-surface mb-3 p-3 text-sm">
                  <p className="text-muted text-xs">Selected</p>
                  <p className="font-semibold text-umber">{selectedDoctor?.name} · {selectedSlot.date} at {selectedSlot.time}</p>
                </div>
                <button
                  onClick={confirmBooking}
                  disabled={bookingLoading}
                  className="btn-primary w-full"
                >
                  {bookingLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full animate-spin" />
                      Confirming...
                    </span>
                  ) : t('bookNow')}
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP: Confirmed */}
        {step === 'confirmed' && booking && (
          <div className="animate-fade-in">
            <div className="card mb-5 text-center">
              <div className="w-14 h-14 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-forest-600" />
              </div>
              <h2 className="text-xl font-serif font-bold text-umber mb-1">{t('bookingConfirmed')}</h2>
              <p className="text-muted text-sm mb-4">Your teleconsultation has been scheduled</p>

              <div className="bg-sand rounded-xl p-4 text-sm text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Doctor</span>
                  <span className="font-semibold text-umber">{booking.doctor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Date & Time</span>
                  <span className="font-semibold text-umber">{booking.slot_date} · {booking.slot_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Specialty</span>
                  <span className="font-semibold text-umber">{booking.specialty}</span>
                </div>
              </div>
            </div>

            {/* Preparation advice */}
            {loadingPrep ? (
              <ThinkingIndicator label="Preparing consultation advice..." />
            ) : preparation && (
              <>
                <div className="card mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle size={16} className="text-terracotta-700" />
                    <h3 className="font-semibold text-umber">{t('preparationTitle')}</h3>
                  </div>
                  <ul className="space-y-2">
                    {(language === 'gu' ? preparation.preparation_tips_gu : preparation.preparation_tips)?.map((tip, i) => (
                      <li key={i} className={`flex items-start gap-2.5 text-sm text-umber ${language === 'gu' ? 'font-gujarati' : ''}`}>
                        <span className="w-5 h-5 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={16} className="text-forest-600" />
                    <h3 className="font-semibold text-umber">{t('haveReadyTitle')}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {(language === 'gu' ? preparation.what_to_have_ready_gu : preparation.what_to_have_ready)?.map((item, i) => (
                      <li key={i} className={`flex items-center gap-2 text-sm text-umber ${language === 'gu' ? 'font-gujarati' : ''}`}>
                        <CheckCircle size={14} className="text-forest-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle size={16} className="text-amber-500" />
                    <h3 className="font-semibold text-umber">{t('questionsTitle')}</h3>
                  </div>
                  <ul className="space-y-2">
                    {(language === 'gu' ? preparation.questions_to_ask_doctor_gu : preparation.questions_to_ask_doctor)?.map((q, i) => (
                      <li key={i} className={`text-sm text-muted pl-4 border-l-2 border-amber-200 ${language === 'gu' ? 'font-gujarati' : ''}`}>{q}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <button onClick={() => navigate('/home')} className="btn-secondary w-full">
              Back to Home
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
