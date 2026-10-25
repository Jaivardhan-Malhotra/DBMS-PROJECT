/**
 * Central route registry — mounts all API routers onto the Express app.
 * Imported as `mountRoutes(app)` in src/app.js
 */

const teamsRouter     = require('./teams');
const playersRouter   = require('./players');
const matchesRouter   = require('./matches');
const seasonsRouter   = require('./seasons');
const venuesRouter    = require('./venues');
const umpiresRouter   = require('./umpires');
const sponsorsRouter  = require('./sponsors');
const awardsRouter    = require('./awards');
const inningsRouter   = require('./innings');
const ownersRouter    = require('./owners');
const dashboardRouter = require('./dashboard');
const reportsRouter   = require('./reports');

/**
 * @param {import('express').Application} app
 */
function mountRoutes(app) {
  app.use('/api/teams',     teamsRouter);
  app.use('/api/players',   playersRouter);
  app.use('/api/matches',   matchesRouter);
  app.use('/api/seasons',   seasonsRouter);
  app.use('/api/venues',    venuesRouter);
  app.use('/api/umpires',   umpiresRouter);
  app.use('/api/sponsors',  sponsorsRouter);
  app.use('/api/awards',    awardsRouter);
  app.use('/api/innings',   inningsRouter);
  app.use('/api/owners',    ownersRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/reports',   reportsRouter);
}

module.exports = mountRoutes;
