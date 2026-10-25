const express = require('express');
const { body, param } = require('express-validator');
const sponsorsController = require('../controllers/sponsorsController');
const { validate, paginate } = require('../middleware/validate');

const router = express.Router();

const VALID_SPONSORSHIP_TYPES = ['Title', 'Kit', 'Associate', 'Official Partner'];

// Validation chains
const createSponsorValidation = [
  body('sponsor_name')
    .trim()
    .notEmpty()
    .withMessage('sponsor_name is required')
    .isLength({ max: 150 })
    .withMessage('sponsor_name cannot exceed 150 characters'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('industry cannot exceed 100 characters'),
  body('website')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('website cannot exceed 255 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('country cannot exceed 100 characters')
];

const updateSponsorValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid sponsor ID parameter'),
  body('sponsor_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('sponsor_name cannot be empty')
    .isLength({ max: 150 })
    .withMessage('sponsor_name cannot exceed 150 characters'),
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('industry cannot exceed 100 characters'),
  body('website')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('website cannot exceed 255 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('country cannot exceed 100 characters')
];

const addTeamSponsorValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid sponsor ID parameter'),
  body('team_id')
    .notEmpty()
    .withMessage('team_id is required')
    .isInt({ min: 1 })
    .withMessage('team_id must be a positive integer'),
  body('contract_value')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('contract_value must be a positive number'),
  body('start_year')
    .optional({ nullable: true })
    .isInt({ min: 2008, max: 2100 })
    .withMessage('start_year must be a valid year'),
  body('end_year')
    .optional({ nullable: true })
    .isInt({ min: 2008, max: 2100 })
    .withMessage('end_year must be a valid year'),
  body('sponsorship_type')
    .optional()
    .isIn(VALID_SPONSORSHIP_TYPES)
    .withMessage(`sponsorship_type must be one of: ${VALID_SPONSORSHIP_TYPES.join(', ')}`)
];

// Routes
router.get('/', paginate, sponsorsController.getAllSponsors);
router.get('/:id', sponsorsController.getSponsorById);
router.get('/:id/teams', sponsorsController.getSponsorTeams);
router.post('/', createSponsorValidation, validate, sponsorsController.createSponsor);
router.put('/:id', updateSponsorValidation, validate, sponsorsController.updateSponsor);
router.delete('/:id', sponsorsController.deleteSponsor);
router.post('/:id/teams', addTeamSponsorValidation, validate, sponsorsController.addTeamSponsor);
router.delete('/:id/teams/:teamId', sponsorsController.removeTeamSponsor);

module.exports = router;
