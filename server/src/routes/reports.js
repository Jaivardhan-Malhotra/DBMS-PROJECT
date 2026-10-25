const express = require('express');
const router = express.Router();
const controller = require('../controllers/teamStatisticsController');

router.get('/', controller.getTeamStatistics);

module.exports = router;
