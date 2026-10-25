const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/ownersController');

const ownerValidation = [
  body('owner_name').trim().notEmpty().withMessage('Owner name is required'),
];

router.get('/',       ctrl.getAllOwners);
router.get('/:id',    ctrl.getOwnerById);
router.post('/',      ownerValidation, validate, ctrl.createOwner);
router.put('/:id',    ownerValidation, validate, ctrl.updateOwner);
router.delete('/:id', ctrl.deleteOwner);

module.exports = router;
