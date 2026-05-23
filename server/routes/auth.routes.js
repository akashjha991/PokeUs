const express = require('express');
const {
  signup,
  login,
  logout,
  getMe,
  verifyEmail,
  refreshToken,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/verify-email', verifyEmail);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);

// Forgot and Reset password routes would go here (similar implementation to verify email)

module.exports = router;
