/**
 * Centralized error handling middleware.
 * All errors passed to next(err) will end up here.
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log the stack trace for debugging

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = 'Validation Error';
    statusCode = 400;
    details = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // In production, we might want to hide detailed error messages
  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      ...(details && { details }),
      // Only include stack in development mode
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
