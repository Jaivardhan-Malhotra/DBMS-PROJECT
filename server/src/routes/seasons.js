const express = require('express');
const seasonsController = require('../controllers/seasonsController');

const router = express.Router();

router.get('/', seasonsController.getAllSeasons);

module.exports = router;
