const User = require('../models/User.model');
const catchAsync = require('../utils/catchAsync');
const generateTokens = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');

// Helper to set cookies
const setTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Prevents CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      error: { message: 'User already exists' },
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  const { accessToken, refreshToken } = generateTokens(user._id);
  setTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  });
});

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Explicitly selecting password because we set it to 'select: false' in the model
  const user = await User.findOne({ email }).select('+password');

  // We return a generic error to prevent leaking whether an email is registered or not
  const authFailedMsg = 'Invalid email or password';

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: authFailedMsg },
    });
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: { message: authFailedMsg },
    });
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  setTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  });
});

/**
 * @route   POST /api/auth/refresh
 * @access  Public (requires valid refreshToken in cookies)
 */
const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: { message: 'No refresh token provided' },
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error();
    }

    // Issue a new access token
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Optionally rotate the refresh token
    setTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    res.clearCookie('refreshToken');
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid refresh token, please login again' },
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = catchAsync(async (req, res) => {
  // req.user is set by the requireAuth middleware
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

/**
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = catchAsync(async (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  register,
  login,
  refresh,
  getMe,
  logout,
};
