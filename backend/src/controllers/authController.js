const authService = require('../services/authService');

// Pure functions - no req/res here
const register = async (userData) => {
  return await authService.registerUser(userData);
};

const login = async (credentials) => {
  return await authService.loginUser(credentials);
};

const getProfile = async (userId) => {
  return await authService.getUserProfile(userId);
};

const updateProfile = async (userId, updateData) => {
  return await authService.updateUserProfile(userId, updateData);
};

const requestPasswordReset = async (email) => {
  return await authService.initiatePasswordReset(email);
};

const verifyOTP = async (email, otp) => {
  return await authService.verifyOTP(email, otp);
};

const resetUserPassword = async (email, otp, newPassword) => {
  return await authService.resetPassword(email, otp, newPassword);
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  requestPasswordReset,
  verifyOTP,
  resetUserPassword
};
