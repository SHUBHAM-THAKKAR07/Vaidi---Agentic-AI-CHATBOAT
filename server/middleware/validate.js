const { body, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => e.msg)
    });
  }
  next();
}

const loginValidators = [
  body('phone')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be 6–100 characters')
    .trim(),
  handleValidation
];

const registerValidators = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2–80 characters')
    .matches(/^[a-zA-Z\u0A80-\u0AFF\s.'-]+$/)
    .withMessage('Name contains invalid characters'),
  body('phone')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be 6–100 characters'),
  body('village')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Village name must be 2–80 characters')
    .escape(),
  handleValidation
];

const symptomValidators = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .escape(),
  body('conversationHistory')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Conversation history cannot exceed 50 messages'),
  handleValidation
];

const stockUpdateValidators = [
  body('current_stock')
    .isInt({ min: 0, max: 100000 })
    .withMessage('Stock must be a non-negative integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .escape(),
  handleValidation
];

module.exports = { loginValidators, registerValidators, symptomValidators, stockUpdateValidators };
