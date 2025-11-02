const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const logToFile = (level, message, data = null) => {
  const logFile = path.join(logsDir, `${level}.log`);
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    data
  };

  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
};

const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${getTimestamp()} - ${message}`, data || '');
    logToFile('info', message, data);
  },

  error: (message, error = null) => {
    console.error(`[ERROR] ${getTimestamp()} - ${message}`, error || '');
    logToFile('error', message, error ? error.stack || error : null);
  },

  warn: (message, data = null) => {
    console.warn(`[WARN] ${getTimestamp()} - ${message}`, data || '');
    logToFile('warn', message, data);
  },

  request: (method, url, userId = null) => {
    const message = `${method} ${url}`;
    console.log(`[REQUEST] ${getTimestamp()} - ${message}`, userId ? `User: ${userId}` : '');
    logToFile('request', message, { userId });
  }
};

module.exports = logger;
