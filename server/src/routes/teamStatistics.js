const express = require('express');
const controller = require('../controllers/teamStatisticsController');

const router = express.Router();

router.get('/', controller.getTeamStatistics);

module.exports = router;
