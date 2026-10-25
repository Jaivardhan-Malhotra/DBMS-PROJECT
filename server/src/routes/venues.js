const express = require('express');
const venuesController = require('../controllers/venuesController');

const router = express.Router();

router.get('/', venuesController.getAllVenues);

module.exports = router;
