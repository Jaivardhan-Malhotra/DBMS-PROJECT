const express = require('express');
const { body, param } = require('express-validator');
const seasonsController = require('../controllers/seasonsController');
const { validate, paginate } = require('../middleware/validate');

const router = express.Router();

// Validation chains
const createSeasonValidation = [
  body('season_year')
    .notEmpty()
    .withMessage('season_year is required')
    .isInt({ min: 2008, max: 2100 })
    .withMessage('season_year must be between 2008 and 2100'),
  body('start_date')
    .notEmpty()
    .withMessage('start_date is required')
    .isISO8601()
    .withMessage('start_date must be a valid date'),
  body('end_date')
    .notEmpty()
    .withMessage('end_date is required')
    .isISO8601()
    .withMessage('end_date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('end_date must be after start_date');
      }
      return true;
    }),
  body('host_country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('host_country cannot exceed 100 characters'),
  body('total_teams')
    .optional()
    .isInt({ min: 2, max: 30 })
    .withMessage('total_teams must be between 2 and 30')
];

const updateSeasonValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid season ID parameter'),
  body('season_year')
    .optional()
    .isInt({ min: 2008, max: 2100 })
    .withMessage('season_year must be between 2008 and 2100'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('end_date must be after start_date');
      }
      return true;
    }),
  body('host_country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('host_country cannot exceed 100 characters'),
  body('total_teams')
    .optional()
    .isInt({ min: 2, max: 30 })
    .withMessage('total_teams must be between 2 and 30')
];

// Routes
router.get('/', paginate, seasonsController.getAllSeasons);
router.get('/:id', seasonsController.getSeasonById);
router.get('/:id/matches', seasonsController.getSeasonMatches);
router.get('/:id/stats', seasonsController.getSeasonStats);
router.post('/', createSeasonValidation, validate, seasonsController.createSeason);
router.put('/:id', updateSeasonValidation, validate, seasonsController.updateSeason);
router.delete('/:id', seasonsController.deleteSeason);

module.exports = router;
