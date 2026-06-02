import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role, permissions: user.permissions || [] },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET || 'your_super_secret_refresh_token_key',
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { firstName, lastName, email, phone, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: role || 'staff'
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          phone: user.phone,
          permissions: user.permissions || []
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user account is locked
    if (user.isLocked && user.isLocked()) {
      return res.status(423).json({
        status: 'error',
        message: 'Account is temporarily locked. Please try again later.'
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }
      await user.save();

      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          department: user.department,
          phone: user.phone,
          permissions: user.permissions || []
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || 'your_super_secret_refresh_token_key',
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({
            status: 'error',
            message: 'Invalid refresh token'
          });
        }

        try {
          const user = await User.findById(decoded.id);

          if (!user) {
            return res.status(404).json({
              status: 'error',
              message: 'User not found'
            });
          }

          const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

          res.status(200).json({
            status: 'success',
            message: 'Token refreshed successfully',
            data: {
              accessToken,
              refreshToken: newRefreshToken
            }
          });
        } catch (error) {
          next(error);
        }
      }
    );
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // In a real application, you might want to store the token in a blacklist
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
