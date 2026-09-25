/**
 * Middleware to validate request bodies against a Zod schema.
 * 
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 */
const validateRequest = (schema) => (req, res, next) => {
  try {
    // Parse throws an error if validation fails
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    const issues = error.issues || error.errors;
    if (!issues) {
      console.error('Validation Middleware caught non-Zod error:', error);
    }
    // Format Zod errors into a readable structure
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation Error',
        details: issues ? issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })) : [{ message: error.message || 'Unknown validation error' }]
      }
    });
  }
};

module.exports = validateRequest;
