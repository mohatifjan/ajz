import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'No token provided. Please login first.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token expired. Please login again.'
        });
      }
      return res.status(403).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    req.user = user;
    next();
  });
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only administrators can access this resource'
    });
  }
  next();
};

export const managerOrAdmin = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user?.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Only managers and administrators can access this resource'
    });
  }
  next();
};
