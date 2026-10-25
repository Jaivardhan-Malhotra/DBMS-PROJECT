const express = require('express');
const { body, param } = require('express-validator');
const teamsController = require('../controllers/teamsController');
const { validate, paginate } = require('../middleware/validate');

const router = express.Router();

// Validation chains
const createTeamValidation = [
  body('team_name')
    .trim()
    .notEmpty()
    .withMessage('team_name is required')
    .isLength({ max: 150 })
    .withMessage('team_name cannot exceed 150 characters'),
  body('short_name')
    .trim()
    .notEmpty()
    .withMessage('short_name is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('short_name must be between 2 and 10 characters'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('city is required')
    .isLength({ max: 100 })
    .withMessage('city cannot exceed 100 characters'),
  body('home_venue_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('home_venue_id must be a positive integer'),
  body('captain_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('captain_id must be a positive integer'),
  body('founded_year')
    .optional({ nullable: true })
    .isInt({ min: 1900, max: 2100 })
    .withMessage('founded_year must be a valid year'),
  body('titles_won')
    .optional()
    .isInt({ min: 0 })
    .withMessage('titles_won must be an integer >= 0')
];

const updateTeamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid team ID parameter'),
  body('team_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('team_name cannot be empty')
    .isLength({ max: 150 })
    .withMessage('team_name cannot exceed 150 characters'),
  body('short_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('short_name cannot be empty')
    .isLength({ min: 2, max: 10 })
    .withMessage('short_name must be between 2 and 10 characters'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('city cannot be empty')
    .isLength({ max: 100 })
    .withMessage('city cannot exceed 100 characters'),
  body('home_venue_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('home_venue_id must be a positive integer'),
  body('captain_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('captain_id must be a positive integer'),
  body('founded_year')
    .optional({ nullable: true })
    .isInt({ min: 1900, max: 2100 })
    .withMessage('founded_year must be a valid year'),
  body('titles_won')
    .optional()
    .isInt({ min: 0 })
    .withMessage('titles_won must be an integer >= 0')
];

// Routes
router.get('/', paginate, teamsController.getAllTeams);
router.get('/:id', teamsController.getTeamById);
router.get('/:id/players', teamsController.getTeamPlayers);
router.get('/:id/matches', teamsController.getTeamMatches);
router.post('/', createTeamValidation, validate, teamsController.createTeam);
router.put('/:id', updateTeamValidation, validate, teamsController.updateTeam);
router.delete('/:id', teamsController.deleteTeam);

module.exports = router;
