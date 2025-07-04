/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Network error class for connection-related errors
 */
class NetworkError extends AppError {
  constructor(message, details = null) {
    super(message, 'NETWORK_ERROR', details);
  }
}

/**
 * File error class for file-related errors
 */
class FileError extends AppError {
  constructor(message, details = null) {
    super(message, 'FILE_ERROR', details);
  }
}

/**
 * Integrity error class for file integrity check failures
 */
class IntegrityError extends AppError {
  constructor(message, details = null) {
    super(message, 'INTEGRITY_ERROR', details);
  }
}

/**
 * Connection error class for peer connection issues
 */
class ConnectionError extends AppError {
  constructor(message, details = null) {
    super(message, 'CONNECTION_ERROR', details);
  }
}

/**
 * Error handler for API routes
 */
function apiErrorHandler(err, req, res, next) {
  console.error('API Error:', err);
  
  // Default error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  };
  
  // Add details if available
  if (err.details) {
    errorResponse.error.details = err.details;
  }
  
  // Set appropriate status code
  let statusCode = 500;
  
  if (err instanceof NetworkError) {
    statusCode = 503; // Service Unavailable
  } else if (err instanceof FileError) {
    statusCode = 400; // Bad Request
  } else if (err instanceof IntegrityError) {
    statusCode = 400; // Bad Request
  } else if (err instanceof ConnectionError) {
    statusCode = 503; // Service Unavailable
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler to catch errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Format error for client-side display
 */
function formatErrorForClient(error) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    };
  }
  
  // For standard errors or other objects
  return {
    message: error.message || 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    details: null
  };
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error) {
  // Network errors
  if (error instanceof NetworkError || error.code === 'NETWORK_ERROR') {
    return 'Connection issue detected. Please check your internet connection and try again.';
  }
  
  // File errors
  if (error instanceof FileError || error.code === 'FILE_ERROR') {
    return 'There was a problem with the file. Please try again with a different file.';
  }
  
  // Integrity errors
  if (error instanceof IntegrityError || error.code === 'INTEGRITY_ERROR') {
    return 'File integrity check failed. The file may be corrupted or incomplete.';
  }
  
  // Connection errors
  if (error instanceof ConnectionError || error.code === 'CONNECTION_ERROR') {
    return 'Connection to peer failed. Please try again or use a different connection method.';
  }
  
  // Default message for unknown errors
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error to console with additional context
 */
function logError(error, context = {}) {
  console.error('Error:', {
    message: error.message,
    code: error.code,
    name: error.name,
    stack: error.stack,
    context
  });
}

module.exports = {
  AppError,
  NetworkError,
  FileError,
  IntegrityError,
  ConnectionError,
  apiErrorHandler,
  asyncHandler,
  formatErrorForClient,
  getUserFriendlyMessage,
  logError
};

