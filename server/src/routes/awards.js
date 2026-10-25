const express = require('express');
const { body, param } = require('express-validator');
const awardsController = require('../controllers/awardsController');
const { validate, paginate } = require('../middleware/validate');

const router = express.Router();

const VALID_AWARD_TYPES = ['Batting', 'Bowling', 'Fielding', 'Overall', 'Team', 'Special'];

// Validation chains
const createAwardValidation = [
  body('award_name')
    .trim()
    .notEmpty()
    .withMessage('award_name is required')
    .isLength({ max: 150 })
    .withMessage('award_name cannot exceed 150 characters'),
  body('award_type')
    .optional()
    .isIn(VALID_AWARD_TYPES)
    .withMessage(`award_type must be one of: ${VALID_AWARD_TYPES.join(', ')}`),
  body('description')
    .optional()
    .trim(),
  body('season_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('season_id must be a positive integer')
];

const updateAwardValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid award ID parameter'),
  body('award_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('award_name cannot be empty')
    .isLength({ max: 150 })
    .withMessage('award_name cannot exceed 150 characters'),
  body('award_type')
    .optional()
    .isIn(VALID_AWARD_TYPES)
    .withMessage(`award_type must be one of: ${VALID_AWARD_TYPES.join(', ')}`),
  body('description')
    .optional()
    .trim(),
  body('season_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('season_id must be a positive integer')
];

const assignAwardValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid award ID parameter'),
  body('player_id')
    .notEmpty()
    .withMessage('player_id is required')
    .isInt({ min: 1 })
    .withMessage('player_id must be a positive integer'),
  body('season_id')
    .notEmpty()
    .withMessage('season_id is required')
    .isInt({ min: 1 })
    .withMessage('season_id must be a positive integer'),
  body('awarded_on')
    .optional()
    .isISO8601()
    .withMessage('awarded_on must be a valid date in YYYY-MM-DD format')
];

// Routes
router.get('/', paginate, awardsController.getAllAwards);
router.get('/:id', awardsController.getAwardById);
router.get('/:id/winners', awardsController.getAwardWinners);
router.post('/', createAwardValidation, validate, awardsController.createAward);
router.put('/:id', updateAwardValidation, validate, awardsController.updateAward);
router.delete('/:id', awardsController.deleteAward);
router.post('/:id/players', assignAwardValidation, validate, awardsController.assignAward);
router.delete('/:id/players/:playerId', awardsController.removeAward);

module.exports = router;
