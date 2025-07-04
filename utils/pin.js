const crypto = require('crypto');

/**
 * PIN Manager for handling secure PIN generation and validation
 */
class PINManager {
  constructor() {
    this.activePINs = new Map();
    this.expirationTime = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredPINs();
    }, 60 * 1000); // Check every minute
  }
  
  /**
   * Generate a secure random PIN
   * @param {number} length - Length of PIN (default: 6)
   * @returns {string} Generated PIN
   */
  generatePIN(length = 6) {
    // Generate a random number between 100000 and 999999 for 6 digits
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    
    // Use crypto for more secure random number generation
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = (randomBytes.readUInt32BE(0) % (max - min + 1)) + min;
    
    return randomNumber.toString();
  }
  
  /**
   * Create a new PIN for a socket
   * @param {string} socketId - Socket ID to associate with the PIN
   * @returns {Object} PIN data
   */
  createPIN(socketId) {
    const pin = this.generatePIN();
    const pinData = {
      pin,
      socketId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.expirationTime)
    };
    
    this.activePINs.set(pin, pinData);
    
    // Schedule automatic cleanup
    setTimeout(() => {
      this.activePINs.delete(pin);
    }, this.expirationTime);
    
    return pinData;
  }
  
  /**
   * Validate a PIN and get associated socket
   * @param {string} pin - PIN to validate
   * @returns {Object|null} PIN data if valid, null if invalid
   */
  validatePIN(pin) {
    const pinData = this.activePINs.get(pin);
    
    if (!pinData) {
      return null; // PIN not found
    }
    
    if (pinData.expiresAt < new Date()) {
      this.activePINs.delete(pin); // PIN expired
      return null;
    }
    
    return pinData;
  }
  
  /**
   * Use a PIN (validate and remove)
   * @param {string} pin - PIN to use
   * @returns {Object|null} PIN data if valid, null if invalid
   */
  usePIN(pin) {
    const pinData = this.validatePIN(pin);
    
    if (pinData) {
      this.activePINs.delete(pin); // Remove PIN after use
    }
    
    return pinData;
  }
  
  /**
   * Clean up expired PINs
   */
  cleanupExpiredPINs() {
    const now = new Date();
    
    for (const [pin, pinData] of this.activePINs.entries()) {
      if (pinData.expiresAt < now) {
        this.activePINs.delete(pin);
      }
    }
  }
  
  /**
   * Get all active PINs
   * @returns {Map} Map of active PINs
   */
  getActivePINs() {
    return this.activePINs;
  }
  
  /**
   * Get count of active PINs
   * @returns {number} Count of active PINs
   */
  getActivePINCount() {
    return this.activePINs.size;
  }
  
  /**
   * Remove all PINs for a socket
   * @param {string} socketId - Socket ID
   */
  removeSocketPINs(socketId) {
    for (const [pin, pinData] of this.activePINs.entries()) {
      if (pinData.socketId === socketId) {
        this.activePINs.delete(pin);
      }
    }
  }
  
  /**
   * Stop the cleanup interval
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = new PINManager();

