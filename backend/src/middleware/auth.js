const { verifyToken } = require('../utils/jwtUtils');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      logger.warn('Invalid token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth middleware error', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth;
