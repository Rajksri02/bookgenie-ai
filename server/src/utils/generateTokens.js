const jwt = require('jsonwebtoken');

/**
 * Generates an access token and a refresh token for a given user ID.
 * @param {string} userId - The user's database ID.
 * @param {boolean} rememberMe - Whether to remember the user for long periods.
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokens = (userId, rememberMe = true) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // Access Token: Short-lived (15 minutes)
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Refresh Token
  const refreshToken = jwt.sign(
    { id: userId, rememberMe },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : '1d' }
  );

  return { accessToken, refreshToken };
};

module.exports = generateTokens;
