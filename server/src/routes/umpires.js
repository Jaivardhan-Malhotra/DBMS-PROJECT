const express = require('express');
const { body, param } = require('express-validator');
const umpiresController = require('../controllers/umpiresController');
const { validate, paginate } = require('../middleware/validate');

const router = express.Router();

const VALID_UMPIRE_TYPES = ['On-Field', 'Third Umpire', 'Match Referee'];

// Validation chains
const createUmpireValidation = [
  body('umpire_name')
    .trim()
    .notEmpty()
    .withMessage('umpire_name is required')
    .isLength({ max: 150 })
    .withMessage('umpire_name cannot exceed 150 characters'),
  body('nationality')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('nationality cannot exceed 100 characters'),
  body('umpire_type')
    .optional()
    .isIn(VALID_UMPIRE_TYPES)
    .withMessage(`umpire_type must be one of: ${VALID_UMPIRE_TYPES.join(', ')}`),
  body('experience_years')
    .optional()
    .isInt({ min: 0 })
    .withMessage('experience_years must be an integer >= 0'),
  body('matches_officiated')
    .optional()
    .isInt({ min: 0 })
    .withMessage('matches_officiated must be an integer >= 0'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean or 0/1')
];

const updateUmpireValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid umpire ID parameter'),
  body('umpire_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('umpire_name cannot be empty')
    .isLength({ max: 150 })
    .withMessage('umpire_name cannot exceed 150 characters'),
  body('nationality')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('nationality cannot exceed 100 characters'),
  body('umpire_type')
    .optional()
    .isIn(VALID_UMPIRE_TYPES)
    .withMessage(`umpire_type must be one of: ${VALID_UMPIRE_TYPES.join(', ')}`),
  body('experience_years')
    .optional()
    .isInt({ min: 0 })
    .withMessage('experience_years must be an integer >= 0'),
  body('matches_officiated')
    .optional()
    .isInt({ min: 0 })
    .withMessage('matches_officiated must be an integer >= 0'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean or 0/1')
];

// Routes
router.get('/', paginate, umpiresController.getAllUmpires);
router.get('/:id', umpiresController.getUmpireById);
router.get('/:id/matches', umpiresController.getUmpireMatches);
router.post('/', createUmpireValidation, validate, umpiresController.createUmpire);
router.put('/:id', updateUmpireValidation, validate, umpiresController.updateUmpire);
router.delete('/:id', umpiresController.deleteUmpire);

module.exports = router;
