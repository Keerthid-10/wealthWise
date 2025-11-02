const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Register
router.post('/register', async (req, res) => {
  try {
    const result = await authController.register(req.body);

    if (!result.success) {
      return res.status(400).json({ errors: result.errors });
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Register error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const result = await authController.login(req.body);

    if (!result.success) {
      return res.status(400).json({ errors: result.errors });
    }

    res.json(result);
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await authController.getProfile(req.userId);

    if (!result.success) {
      return res.status(404).json({ errors: result.errors });
    }

    res.json(result);
  } catch (error) {
    logger.error('Get profile error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const result = await authController.updateProfile(req.userId, req.body);

    if (!result.success) {
      return res.status(400).json({ errors: result.errors });
    }

    res.json(result);
  } catch (error) {
    logger.error('Update profile error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request Password Reset (generates OTP)
router.post('/password-reset/request', async (req, res) => {
  try {
    const result = await authController.requestPasswordReset(req.body.email);

    if (!result.success) {
      return res.status(400).json({ errors: result.errors });
    }

    // Return OTP to be displayed in frontend (as per requirement)
    res.json({ message: 'OTP generated successfully', otp: result.otp, email: result.email });
  } catch (error) {
    logger.error('Password reset request error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/password-reset/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await authController.verifyOTP(email, otp);

    if (!result.success) {
      return res.status(400).json({ errors: result.errors });
    }

    res.json(result);
  } catch (error) {
    logger.error('OTP verification error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password with OTP
router.post('/password-reset/confirm', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authController.resetUserPassword(email, otp, newPassword);

    if (!result.success) {
      return res.status(400).json({ errors: result.errors });
    }

    res.json(result);
  } catch (error) {
    logger.error('Password reset error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
