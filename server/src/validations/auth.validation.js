const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please provide a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      // Optional: Add more strict password requirements here (regex for numbers/symbols)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(1, 'Password is required'), // Don't enforce length on login to prevent leaking requirements if they change
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
