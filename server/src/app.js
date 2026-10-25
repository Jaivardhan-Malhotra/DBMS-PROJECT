const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const mountRoutes = require('./routes');
const { testConnection } = require('./config/database');

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// HTTP Request Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏏 IPL Management System REST API is running',
    version: '1.0.0',
    endpoints: {
      teams: '/api/teams',
      players: '/api/players',
      matches: '/api/matches',
      seasons: '/api/seasons',
      venues: '/api/venues',
      umpires: '/api/umpires',
      sponsors: '/api/sponsors',
      awards: '/api/awards',
      innings: '/api/innings',
      owners: '/api/owners',
      dashboard: '/api/dashboard',
      reports: '/api/reports'
    }
  });
});

// Mount all application routes
mountRoutes(app);

// Global 404 handler for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Centralized error handling middleware
app.use(errorHandler);

// Attempt database connection check on startup
testConnection();

module.exports = app;
