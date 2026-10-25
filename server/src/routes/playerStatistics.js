const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/playerStatisticsController');
const { validate } = require('../middleware/validate');

const router = express.Router();

const recordFields = [
  body('match_id').isInt({ min: 1 }).withMessage('match_id must be a positive integer'),
  body('player_id').isInt({ min: 1 }).withMessage('player_id must be a positive integer'),
  body('team_id').isInt({ min: 1 }).withMessage('team_id must be a positive integer')
];
const metricValidation = () => [
  body('runs_scored')
    .optional()
    .isInt({ min: 0, max: 65535 })
    .withMessage('runs_scored must be an integer between 0 and 65535'),
  body('balls_faced')
    .optional()
    .isInt({ min: 0, max: 65535 })
    .withMessage('balls_faced must be an integer between 0 and 65535'),
  body('wickets_taken')
    .optional()
    .isInt({ min: 0, max: 255 })
    .withMessage('wickets_taken must be an integer between 0 and 255'),
  body('is_out')
    .optional()
    .isBoolean()
    .withMessage('is_out must be a boolean or 0/1')
];

router.get('/', controller.getPlayerStatistics);
router.get('/records', controller.getMatchRecords);
router.post('/records', recordFields, metricValidation(), validate, controller.createMatchRecord);
router.put(
  '/records/:id',
  param('id').isInt({ min: 1 }).withMessage('Invalid record ID'),
  body('match_id').optional().isInt({ min: 1 }).withMessage('match_id must be a positive integer'),
  body('player_id').optional().isInt({ min: 1 }).withMessage('player_id must be a positive integer'),
  body('team_id').optional().isInt({ min: 1 }).withMessage('team_id must be a positive integer'),
  metricValidation(),
  validate,
  controller.updateMatchRecord
);
router.delete(
  '/records/:id',
  param('id').isInt({ min: 1 }).withMessage('Invalid record ID'),
  validate,
  controller.deleteMatchRecord
);

module.exports = router;
