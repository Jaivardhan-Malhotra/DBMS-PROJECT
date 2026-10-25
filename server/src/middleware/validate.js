const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator validation errors.
 * Can be used either as direct middleware: router.post('/', [rules], validate, handler)
 * Or as a factory wrapper: router.post('/', validate([rules]), handler)
 */
const validate = (validationsOrReq, res, next) => {
  // If used directly as middleware: router.post('/', [rules], validate, handler)
  if (res && typeof next === 'function') {
    const req = validationsOrReq;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedErrors = errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      const error = new Error('Validation failed. Please correct the specified fields.');
      error.statusCode = 400;
      error.isValidationError = true;
      error.errors = extractedErrors;
      return next(error);
    }
    return next();
  }

  // If used as wrapper: validate([rules])
  const validations = validationsOrReq;
  return async (req, responseObj, nextMiddleware) => {
    if (Array.isArray(validations)) {
      for (const validation of validations) {
        await validation.run(req);
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedErrors = errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      const error = new Error('Validation failed. Please correct the specified fields.');
      error.statusCode = 400;
      error.isValidationError = true;
      error.errors = extractedErrors;
      return nextMiddleware(error);
    }
    return nextMiddleware();
  };
};

/**
 * Pagination middleware that extracts and validates page and limit query params.
 * Defaults: page = 1, limit = 10, max limit = 100
 */
const paginate = (req, res, next) => {
  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = 10;
  } else if (limit > 100) {
    limit = 100;
  }

  const offset = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    offset
  };

  next();
};

/**
 * Helper to construct pagination metadata object for API responses.
 * @param {number} totalItems - Total matching rows
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object}
 */
const getPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    totalItems: Number(totalItems),
    totalPages,
    currentPage: Number(page),
    limit: Number(limit),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

module.exports = {
  validate,
  paginate,
  getPaginationMeta
};
