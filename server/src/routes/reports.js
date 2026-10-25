const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');

router.get('/team-players',     ctrl.getTeamPlayerCounts);
router.get('/team-wins',        ctrl.getWinsPerTeam);
router.get('/matches-per-team', ctrl.getMatchesPerTeam);
router.get('/venue-matches',    ctrl.getVenueMatchCounts);
router.get('/top-batsmen',      ctrl.getTopBatsmen);
router.get('/top-bowlers',      ctrl.getTopBowlers);
router.get('/season-summary',   ctrl.getSeasonSummary);
router.get('/player-of-match',  ctrl.getPlayerOfMatchLeaderboard);

module.exports = router;
