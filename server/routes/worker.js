const express = require('express');
const router = express.Router();
const { authMiddleware, requireWorker } = require('../middleware/auth');
const { llmLimiter } = require('../middleware/rateLimiter');
const { stockUpdateValidators } = require('../middleware/validate');
const { getFollowupAdvice } = require('../agents/followupAgent');
const db = require('../db/database');

// GET /api/worker/dashboard — summary stats
router.get('/dashboard', authMiddleware, requireWorker, (req, res) => {
  const followups = db.get('followups').value();
  const stock = db.get('medicine_stock').value();
  const consultations = db.get('consultations').value();

  const overdue = followups.filter(f => f.status === 'overdue').length;
  const upcoming = followups.filter(f => f.status === 'upcoming').length;
  const criticalStock = stock.filter(s => s.current_stock < s.min_stock).length;
  const todayConsults = consultations.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const urgentCases = consultations.filter(c => c.severity === 'URGENT').length;
  const totalPatients = new Set(consultations.map(c => c.patient_id)).size;

  res.json({
    stats: {
      overdue_followups: overdue,
      upcoming_followups: upcoming,
      critical_stock_items: criticalStock,
      todays_consultations: todayConsults,
      total_urgent_cases: urgentCases,
      total_patients_seen: totalPatients
    },
    recent_consultations: consultations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        patient_name: c.patient_name,
        severity: c.severity,
        primary_concern: c.primary_concern,
        created_at: c.created_at
      }))
  });
});

// GET /api/worker/followups — follow-up list
router.get('/followups', authMiddleware, requireWorker, (req, res) => {
  const { status, village } = req.query;
  let followups = db.get('followups').value();

  if (status && status !== 'all') {
    followups = followups.filter(f => f.status === status);
  }
  if (village) {
    followups = followups.filter(f =>
      f.village.toLowerCase().includes(village.toLowerCase())
    );
  }

  // Sort: overdue first, then by due date
  followups.sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (b.status === 'overdue' && a.status !== 'overdue') return 1;
    return new Date(a.next_due) - new Date(b.next_due);
  });

  res.json({ followups });
});

// PUT /api/worker/followups/:id — update follow-up status
router.put('/followups/:id', authMiddleware, requireWorker, (req, res) => {
  const { id } = req.params;
  const { status, notes, next_due } = req.body;

  const followup = db.get('followups').find({ id }).value();
  if (!followup) {
    return res.status(404).json({ error: 'Follow-up record not found.' });
  }

  const updates = { last_updated: new Date().toISOString() };
  if (status) updates.status = status;
  if (notes) updates.notes = notes.substring(0, 500);
  if (next_due) updates.next_due = next_due;

  db.get('followups').find({ id }).assign(updates).write();
  res.json({ success: true, followup: db.get('followups').find({ id }).value() });
});

// GET /api/worker/followups/:id/advice — AI advice for a follow-up
router.get('/followups/:id/advice', authMiddleware, requireWorker, llmLimiter, async (req, res) => {
  const followup = db.get('followups').find({ id: req.params.id }).value();
  if (!followup) {
    return res.status(404).json({ error: 'Follow-up not found.' });
  }
  try {
    const advice = await getFollowupAdvice(followup);
    res.json(advice);
  } catch (err) {
    console.error('[FollowUp Advice Error]', err);
    res.status(500).json({ error: 'Could not generate advice.' });
  }
});

// GET /api/worker/stock — medicine stock list
router.get('/stock', authMiddleware, requireWorker, (req, res) => {
  const stock = db.get('medicine_stock').value();
  res.json({ stock });
});

// PUT /api/worker/stock/:id — update stock level
router.put('/stock/:id', authMiddleware, requireWorker, stockUpdateValidators, (req, res) => {
  const { id } = req.params;
  const { current_stock, notes } = req.body;

  const item = db.get('medicine_stock').find({ id }).value();
  if (!item) {
    return res.status(404).json({ error: 'Medicine not found.' });
  }

  db.get('medicine_stock').find({ id }).assign({
    current_stock: parseInt(current_stock),
    last_updated: new Date().toISOString(),
    updated_by: req.user.name,
    notes: notes || ''
  }).write();

  res.json({ success: true, item: db.get('medicine_stock').find({ id }).value() });
});

module.exports = router;
