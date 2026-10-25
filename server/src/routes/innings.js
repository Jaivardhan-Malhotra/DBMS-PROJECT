const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/inningsController');

const inningsValidation = [
  body('match_id').isInt({ min: 1 }).withMessage('Valid match_id required'),
  body('innings_no').isInt({ min: 1, max: 2 }).withMessage('innings_no must be 1 or 2'),
  body('batting_team_id').isInt({ min: 1 }).withMessage('Valid batting_team_id required'),
  body('bowling_team_id').isInt({ min: 1 }).withMessage('Valid bowling_team_id required'),
];

router.get('/',       ctrl.getAllInnings);
router.get('/:id',    ctrl.getInningsById);
router.post('/',      inningsValidation, validate, ctrl.createInnings);
router.put('/:id',    ctrl.updateInnings);
router.delete('/:id', ctrl.deleteInnings);

module.exports = router;
