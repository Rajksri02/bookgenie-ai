/**
 * Centralized error handling middleware.
 * All errors passed to next(err) will end up here.
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log the stack trace for debugging

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // In production, we might want to hide detailed error messages
  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      // Only include stack in development mode
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
