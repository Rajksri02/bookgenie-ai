/**
 * Wraps async functions to catch errors and pass them to the Express error handler.
 * Eliminates the need for try/catch blocks in every controller.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
