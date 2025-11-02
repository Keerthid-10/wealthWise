const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');
const { validateUserSignup, validateLogin } = require('../utils/validation');
const crypto = require('crypto');

/**
 * Register new user (pure function approach)
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Result with user and token or error
 */
const registerUser = async (userData) => {
  // Validate input
  const validation = validateUserSignup(userData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
  if (existingUser) {
    return { success: false, errors: ['Email already registered'] };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Create user
  const user = await User.create({
    name: userData.name,
    email: userData.email.toLowerCase(),
    password: hashedPassword,
    dob: userData.dob,
    phone: userData.phone || '',
    currency: userData.currency || 'INR'
  });

  // Generate token
  const token = generateToken({ userId: user._id, email: user.email });

  // Return user without password
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    dob: user.dob,
    phone: user.phone,
    currency: user.currency
  };

  return { success: true, user: userResponse, token };
};

/**
 * Login user
 * @param {object} credentials - Login credentials
 * @returns {Promise<object>} Result with user and token or error
 */
const loginUser = async (credentials) => {
  // Validate input
  const validation = validateLogin(credentials);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  // Find user
  const user = await User.findOne({ email: credentials.email.toLowerCase() });
  if (!user) {
    return { success: false, errors: ['Invalid email or password'] };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
  if (!isPasswordValid) {
    return { success: false, errors: ['Invalid email or password'] };
  }

  // Generate token
  const token = generateToken({ userId: user._id, email: user.email });

  // Return user without password
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    dob: user.dob,
    phone: user.phone,
    currency: user.currency
  };

  return { success: true, user: userResponse, token };
};

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<object>} User profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    return { success: false, errors: ['User not found'] };
  }

  return { success: true, user };
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} Updated user
 */
const updateUserProfile = async (userId, updateData) => {
  const allowedUpdates = ['name', 'phone', 'currency'];
  const updates = {};

  Object.keys(updateData).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = updateData[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return { success: false, errors: ['User not found'] };
  }

  return { success: true, user };
};

/**
 * Generate 4-digit OTP
 * @returns {string} 4-digit OTP
 */
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Initiate password reset with OTP
 * @param {string} email - User email
 * @returns {Promise<object>} Result with OTP (shown in frontend instead of email)
 */
const initiatePasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { success: false, errors: ['User not found'] };
  }

  // Generate 4-digit OTP
  const otp = generateOTP();

  // Store OTP hash
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  user.resetPasswordOTP = hashedOTP;
  user.resetPasswordOTPExpires = Date.now() + 600000; // 10 minutes
  await user.save();

  // Return OTP to be displayed in frontend (requirement: show in another tab instead of email)
  return { success: true, otp, email: user.email };
};

/**
 * Verify OTP
 * @param {string} email - User email
 * @param {string} otp - OTP to verify
 * @returns {Promise<object>} Result
 */
const verifyOTP = async (email, otp) => {
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordOTP: hashedOTP,
    resetPasswordOTPExpires: { $gt: Date.now() }
  });

  if (!user) {
    return { success: false, errors: ['Invalid or expired OTP'] };
  }

  return { success: true, message: 'OTP verified successfully' };
};

/**
 * Reset password with OTP
 * @param {string} email - User email
 * @param {string} otp - OTP
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Result
 */
const resetPassword = async (email, otp, newPassword) => {
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordOTP: hashedOTP,
    resetPasswordOTPExpires: { $gt: Date.now() }
  });

  if (!user) {
    return { success: false, errors: ['Invalid or expired OTP'] };
  }

  // Validate new password
  if (!newPassword || newPassword.length < 6) {
    return { success: false, errors: ['Password must be at least 6 characters long'] };
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;
  await user.save();

  return { success: true, message: 'Password reset successful' };
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  initiatePasswordReset,
  verifyOTP,
  resetPassword
};
