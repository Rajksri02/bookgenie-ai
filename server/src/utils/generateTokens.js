const jwt = require('jsonwebtoken');

/**
 * Generates an access token and a refresh token for a given user ID.
 * @param {string} userId - The user's database ID.
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokens = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // Access Token: Short-lived (15 minutes)
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Refresh Token: Long-lived (7 days)
  // In a production app, consider using a separate JWT_REFRESH_SECRET
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

module.exports = generateTokens;
