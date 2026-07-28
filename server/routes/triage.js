const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { llmLimiter } = require('../middleware/rateLimiter');
const { symptomValidators } = require('../middleware/validate');
const { runTriageAgent } = require('../agents/triageAgent');
const { runSeverityAgent } = require('../agents/severityAgent');
const db = require('../db/database');

// POST /api/triage/message — one triage turn
router.post('/message', authMiddleware, llmLimiter, symptomValidators, async (req, res) => {
  const { message, conversationHistory = [], language = 'en' } = req.body;

  try {
    const result = await runTriageAgent(message, conversationHistory, language);

    // If emergency detected, save and return immediately
    if (result.isEmergency) {
      return res.json({
        message: result.message,
        isEmergency: true,
        isReadyToAssess: false,
        questionCount: result.questionCount
      });
    }

    res.json({
      message: result.message,
      isReadyToAssess: result.isReadyToAssess,
      isEmergency: false,
      questionCount: result.questionCount
    });
  } catch (err) {
    console.error('[Triage Error]', err);
    res.status(500).json({
      error: err.message === 'AI service temporarily unavailable'
        ? 'Our health assistant is temporarily unavailable. Please try again in a moment.'
        : 'Something went wrong. Please try again.'
    });
  }
});

// POST /api/triage/assess — run severity classification
router.post('/assess', authMiddleware, llmLimiter, async (req, res) => {
  const { conversationHistory = [], patientName } = req.body;

  if (!Array.isArray(conversationHistory) || conversationHistory.length < 2) {
    return res.status(400).json({ error: 'Insufficient conversation to assess.' });
  }

  try {
    const severityResult = await runSeverityAgent(conversationHistory);

    // Save consultation to DB
    const consultation = {
      id: uuidv4(),
      patient_id: req.user.id,
      patient_name: patientName || req.user.name,
      severity: severityResult.severity,
      severity_score: severityResult.severity_score,
      primary_concern: severityResult.primary_concern,
      explanation: severityResult.explanation,
      self_care: severityResult.self_care,
      needs_teleconsult: severityResult.needs_teleconsult,
      specialist_type: severityResult.specialist_type,
      conversation_length: conversationHistory.length,
      created_at: new Date().toISOString(),
      status: 'assessed'
    };
    db.get('consultations').push(consultation).write();

    // If teleconsult needed, schedule a follow-up
    if (severityResult.needs_teleconsult) {
      const followupDate = new Date();
      followupDate.setDate(followupDate.getDate() + (severityResult.severity === 'URGENT' ? 1 : 3));
      db.get('followups').push({
        id: uuidv4(),
        patient_name: patientName || req.user.name,
        village: req.user.village,
        age: null,
        condition: severityResult.primary_concern,
        last_visit: new Date().toISOString(),
        next_due: followupDate.toISOString(),
        status: 'upcoming',
        assigned_to: 'Unassigned',
        notes: severityResult.explanation,
        consultation_id: consultation.id
      }).write();
    }

    res.json({ ...severityResult, consultation_id: consultation.id });
  } catch (err) {
    console.error('[Severity Error]', err);
    res.status(500).json({
      error: 'Could not complete health assessment. Please try again or visit your nearest health centre.'
    });
  }
});

module.exports = router;
