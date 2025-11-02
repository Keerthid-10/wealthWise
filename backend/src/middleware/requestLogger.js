const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  logger.request(req.method, req.url, req.userId);
  next();
};

module.exports = requestLogger;
