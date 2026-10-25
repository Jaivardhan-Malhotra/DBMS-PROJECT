const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

// All dashboard data is consolidated into a single endpoint.
// The frontend's individual helpers (getRecentMatches, getTopTeams, etc.)
// also call this combined /stats route; they parse the sub-keys they need.
router.get('/stats',           getDashboardStats);
router.get('/recent-matches',  getDashboardStats);   // alias — returns same payload
router.get('/top-teams',       getDashboardStats);   // alias — returns same payload
router.get('/upcoming-matches', getDashboardStats);  // alias — returns same payload

module.exports = router;
