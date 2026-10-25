const express = require('express');
const { body, param } = require('express-validator');
const venuesController = require('../controllers/venuesController');
const { validate, paginate } = require('../middleware/validate');

const router = express.Router();

// Validation chains
const createVenueValidation = [
  body('venue_name')
    .trim()
    .notEmpty()
    .withMessage('venue_name is required')
    .isLength({ max: 150 })
    .withMessage('venue_name cannot exceed 150 characters'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('city is required')
    .isLength({ max: 100 })
    .withMessage('city cannot exceed 100 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('country cannot exceed 100 characters'),
  body('capacity')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('capacity must be a positive integer'),
  body('established_year')
    .optional({ nullable: true })
    .isInt({ min: 1800, max: 2100 })
    .withMessage('established_year must be a valid year')
];

const updateVenueValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid venue ID parameter'),
  body('venue_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('venue_name cannot be empty')
    .isLength({ max: 150 })
    .withMessage('venue_name cannot exceed 150 characters'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('city cannot be empty')
    .isLength({ max: 100 })
    .withMessage('city cannot exceed 100 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('country cannot exceed 100 characters'),
  body('capacity')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('capacity must be a positive integer'),
  body('established_year')
    .optional({ nullable: true })
    .isInt({ min: 1800, max: 2100 })
    .withMessage('established_year must be a valid year')
];

// Routes
router.get('/', paginate, venuesController.getAllVenues);
router.get('/:id', venuesController.getVenueById);
router.get('/:id/matches', venuesController.getVenueMatches);
router.get('/:id/stats', venuesController.getVenueStats);
router.post('/', createVenueValidation, validate, venuesController.createVenue);
router.put('/:id', updateVenueValidation, validate, venuesController.updateVenue);
router.delete('/:id', venuesController.deleteVenue);

module.exports = router;
