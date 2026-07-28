const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { llmLimiter } = require('../middleware/rateLimiter');
const { getPreparationAdvice, getDoctorsForSpecialty, generateSlots } = require('../agents/teleconsultAgent');
const db = require('../db/database');

// GET /api/teleconsult/doctors?specialty=General+Physician
router.get('/doctors', authMiddleware, (req, res) => {
  const { specialty } = req.query;
  const doctors = getDoctorsForSpecialty(specialty);
  res.json({ doctors });
});

// GET /api/teleconsult/slots/:doctorId
router.get('/slots/:doctorId', authMiddleware, (req, res) => {
  const slots = generateSlots(req.params.doctorId);
  res.json({ slots });
});

// POST /api/teleconsult/prepare — get consultation preparation advice
router.post('/prepare', authMiddleware, llmLimiter, async (req, res) => {
  const { severityResult } = req.body;
  if (!severityResult) {
    return res.status(400).json({ error: 'Severity assessment data required.' });
  }
  try {
    const advice = await getPreparationAdvice(severityResult);
    res.json(advice);
  } catch (err) {
    console.error('[Teleconsult Prepare Error]', err);
    res.status(500).json({ error: 'Could not generate preparation advice.' });
  }
});

// POST /api/teleconsult/book — book a slot (simulated)
router.post('/book', authMiddleware, (req, res) => {
  const { doctorId, doctorName, slotDate, slotTime, consultationId, specialty } = req.body;
  if (!doctorId || !slotDate || !slotTime) {
    return res.status(400).json({ error: 'Doctor and time slot required.' });
  }

  const booking = {
    id: uuidv4(),
    patient_id: req.user.id,
    patient_name: req.user.name,
    patient_village: req.user.village,
    doctor_id: doctorId,
    doctor_name: doctorName,
    specialty: specialty || 'General Physician',
    slot_date: slotDate,
    slot_time: slotTime,
    consultation_id: consultationId,
    status: 'confirmed',
    meeting_link: `https://vaidi.health/meet/${uuidv4().substring(0, 8)}`,
    created_at: new Date().toISOString()
  };

  // Update consultation status
  if (consultationId) {
    db.get('consultations')
      .find({ id: consultationId })
      .assign({ status: 'teleconsult_booked', booking_id: booking.id })
      .write();
  }

  res.json({
    booking,
    message: 'Teleconsultation confirmed',
    reminder: `Your appointment with ${doctorName} is on ${slotDate} at ${slotTime}. Please keep your phone available.`
  });
});

module.exports = router;
