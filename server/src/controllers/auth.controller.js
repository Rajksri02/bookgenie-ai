const User = require('../models/User.model');
const catchAsync = require('../utils/catchAsync');
const generateTokens = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../services/emailService');

// Helper to set cookies
const setTokenCookie = (res, refreshToken, rememberMe = true) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  };
  
  if (rememberMe) {
    options.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  res.cookie('refreshToken', refreshToken, options);
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

  const { accessToken, refreshToken } = generateTokens(user._id, true);
  setTokenCookie(res, refreshToken, true);

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
  const { email, password, rememberMe = false } = req.body;

  // Explicitly selecting password because we set it to 'select: false' in the model
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Email not found. Please register.' },
    });
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: { message: 'Incorrect password. Please try again.' },
    });
  }

  const { accessToken, refreshToken } = generateTokens(user._id, rememberMe);
  setTokenCookie(res, refreshToken, rememberMe);

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
    const rememberMe = decoded.rememberMe !== undefined ? decoded.rememberMe : true;
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, rememberMe);
    
    // Optionally rotate the refresh token
    setTokenCookie(res, newRefreshToken, rememberMe);

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
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });
  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // We send a generic success message so we don't leak registered emails
    return res.status(200).json({
      success: true,
      data: 'Email sent',
    });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset url
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
  const htmlMessage = `<p>You are receiving this email because you (or someone else) has requested the reset of a password.</p><p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
      html: htmlMessage
    });

    res.status(200).json({
      success: true,
      data: 'Email sent',
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      error: { message: 'Email could not be sent' },
    });
  }
});

/**
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = catchAsync(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid or expired token' },
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Send back new access token
  const { accessToken, refreshToken } = generateTokens(user._id, true);
  setTokenCookie(res, refreshToken, true);

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

module.exports = {
  register,
  login,
  refresh,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
};
