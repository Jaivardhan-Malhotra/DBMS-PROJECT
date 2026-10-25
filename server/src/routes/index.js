/**
 * Central route registry — mounts all API routers onto the Express app.
 * Imported as `mountRoutes(app)` in src/app.js
 */

const teamsRouter     = require('./teams');
const playersRouter   = require('./players');
const matchesRouter   = require('./matches');
const seasonsRouter   = require('./seasons');
const venuesRouter    = require('./venues');
const playerStatisticsRouter = require('./playerStatistics');
const teamStatisticsRouter = require('./teamStatistics');

/**
 * @param {import('express').Application} app
 */
function mountRoutes(app) {
  app.use('/api/teams',     teamsRouter);
  app.use('/api/players',   playersRouter);
  app.use('/api/matches',   matchesRouter);
  app.use('/api/seasons',   seasonsRouter);
  app.use('/api/venues',    venuesRouter);
  app.use('/api/player-statistics', playerStatisticsRouter);
  app.use('/api/team-statistics', teamStatisticsRouter);
}

module.exports = mountRoutes;
