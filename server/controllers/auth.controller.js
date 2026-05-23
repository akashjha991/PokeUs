const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies } = require('../utils/jwt');
const sendEmail = require('../utils/sendEmail');

// Helper for audit logging
const logAudit = async (userId, email, action, status, req, details = {}) => {
  try {
    await AuditLog.create({
      userId,
      email,
      action,
      status,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details,
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
    });

    // Generate Verification Token
    const verificationToken = user.getVerificationToken();

    await user.save();

    // Create verification url
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const message = `
      <h1>You have requested to register an account</h1>
      <p>Please go to this link to verify your email address:</p>
      <a href=${verificationUrl} clicktracking=off>${verificationUrl}</a>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'PokeUs - Email Verification',
        html: message,
      });

      await logAudit(user._id, user.email, 'EMAIL_VERIFICATION_REQUESTED', 'SUCCESS', req);

      res.status(201).json({
        success: true,
        message: 'Account created! Please check your email to verify your account.',
      });
    } catch (err) {
      console.error(err);
      user.verificationToken = undefined;
      user.verificationTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Invalid or missing token' });
    }

    // Get hashed token
    const verificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Set user to verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();
    
    await logAudit(user._id, user.email, 'EMAIL_VERIFIED', 'SUCCESS', req);

    res.status(200).json({
      success: true,
      message: 'Email successfully verified. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await logAudit(null, email, 'LOGIN_FAILED', 'FAILURE', req, { reason: 'User not found' });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      return res.status(403).json({ success: false, message: 'Account is temporarily locked due to multiple failed login attempts.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;
      
      // Lock out after 5 attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
        await logAudit(user._id, email, 'ACCOUNT_LOCKED', 'WARNING', req);
      }
      await user.save({ validateBeforeSave: false });
      
      await logAudit(user._id, email, 'LOGIN_FAILED', 'FAILURE', req, { reason: 'Invalid password' });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check verification status
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email address before logging in.' });
    }

    // Reset failed login attempts on success
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    await logAudit(user._id, email, 'LOGIN_SUCCESS', 'SUCCESS', req);

    sendTokenResponse(user, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    // Find the session
    const session = await Session.findOne({ refreshToken: token });

    if (!session || !session.isValid || session.expiresAt < Date.now()) {
      clearTokenCookies(res);
      // If token is compromised (someone reused an invalid one), you could revoke all user sessions here
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(session.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Issue new tokens (Rotation)
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update session
    session.refreshToken = newRefreshToken;
    session.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    session.ipAddress = req.ip;
    session.userAgent = req.headers['user-agent'];
    await session.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);
    await logAudit(user._id, user.email, 'TOKEN_REFRESH', 'SUCCESS', req);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Invalidate the session
      await Session.findOneAndUpdate(
        { refreshToken: token },
        { isValid: false }
      );
    }

    clearTokenCookies(res);
    await logAudit(req.user._id, req.user.email, 'LOGOUT', 'SUCCESS', req);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = async (user, req, res) => {
  // Create token
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in db session
  await Session.create({
    userId: user._id,
    refreshToken,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  setTokenCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  });
};
