/**
 * Centralized Error Handling Middleware for Express
 * Handles MySQL error codes, validation errors, and custom application errors.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'An unexpected internal server error occurred.';
  let errors = err.errors || null;

  // Handle MySQL specific errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
      case '1062':
        statusCode = 409;
        message = 'A record with the specified unique field already exists.';
        break;

      case 'ER_NO_REFERENCED_ROW_2':
      case 'ER_NO_REFERENCED_ROW':
      case '1452':
        statusCode = 400;
        message = 'Invalid reference: The referenced related entity (foreign key) does not exist.';
        break;

      case 'ER_ROW_IS_REFERENCED_2':
      case 'ER_ROW_IS_REFERENCED':
      case '1451':
        statusCode = 409;
        message = 'Cannot delete or update record: It is referenced by other records in the database.';
        break;

      case 'ER_BAD_FIELD_ERROR':
      case '1054':
        statusCode = 400;
        message = 'Unknown column referenced in query.';
        break;

      case 'ER_PARSE_ERROR':
      case '1064':
        statusCode = 500;
        message = 'Database query syntax error.';
        break;

      case 'ECONNREFUSED':
      case 'PROTOCOL_CONNECTION_LOST':
        statusCode = 503;
        message = 'Database service unavailable. Please check database connection.';
        break;

      default:
        break;
    }
  }

  // Handle express-validator / custom validation errors
  if (err.isValidationError || (Array.isArray(err.errors) && err.errors.length > 0)) {
    statusCode = err.statusCode || 400;
    message = err.message || 'Validation failed. Please verify input data.';
    errors = err.errors;
  }

  const response = {
    success: false,
    message,
    errors
  };

  // Never expose stack trace in production environment
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  // Log server errors for observability
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
