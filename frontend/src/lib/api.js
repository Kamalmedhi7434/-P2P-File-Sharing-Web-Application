import io from 'socket.io-client';

// API base URL - adjust for production
const API_BASE_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:3000';

// Socket.io instance
let socket = null;

/**
 * Initialize Socket.io connection
 * @returns {Object} Socket.io instance
 */
export function initializeSocket() {
  if (!socket) {
    socket = io(API_BASE_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Setup heartbeat
    setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat');
      }
    }, 30000); // 30 seconds
  }
  
  return socket;
}

/**
 * Get socket instance
 * @returns {Object} Socket.io instance
 */
export function getSocket() {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
}

/**
 * Register as a peer for discovery
 * @param {string} deviceName - Custom device name
 * @returns {Promise} Promise that resolves when registration is complete
 */
export function registerAsPeer(deviceName) {
  const socket = getSocket();
  
  return new Promise((resolve) => {
    socket.emit('register-peer', { deviceName }, (response) => {
      resolve(response);
    });
  });
}

/**
 * Generate a PIN for remote connection
 * @returns {Promise<Object>} Promise with PIN data
 */
export function generatePin() {
  const socket = getSocket();
  
  return new Promise((resolve) => {
    socket.emit('generate-pin', (response) => {
      resolve(response);
    });
  });
}

/**
 * Connect to a peer using PIN
 * @param {string} pin - PIN code
 * @returns {Promise<Object>} Promise with connection result
 */
export function connectWithPin(pin) {
  const socket = getSocket();
  
  return new Promise((resolve) => {
    socket.emit('connect-with-pin', { pin }, (response) => {
      resolve(response);
    });
  });
}

/**
 * Get network information
 * @returns {Promise<Object>} Network information
 */
export async function getNetworkInfo() {
  try {
    const response = await fetch(\`\${API_BASE_URL}/api/network-info\`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching network info:', error);
    return { error: 'Failed to fetch network information' };
  }
}

/**
 * Get active peers
 * @returns {Promise<Array>} List of active peers
 */
export async function getActivePeers() {
  try {
    const response = await fetch(\`\${API_BASE_URL}/api/active-peers\`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching active peers:', error);
    return { error: 'Failed to fetch active peers', peers: [] };
  }
}

/**
 * Check server health
 * @returns {Promise<Object>} Server health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(\`\${API_BASE_URL}/api/health\`);
    return await response.json();
  } catch (error) {
    console.error('Error checking server health:', error);
    return { status: 'unhealthy', error: 'Failed to connect to server' };
  }
}

// WebRTC signaling
export function sendWebRTCOffer(targetPeerId, offer) {
  const socket = getSocket();
  socket.emit('webrtc-offer', { targetPeerId, offer });
}

export function sendWebRTCAnswer(targetPeerId, answer) {
  const socket = getSocket();
  socket.emit('webrtc-answer', { targetPeerId, answer });
}

export function sendICECandidate(targetPeerId, candidate) {
  const socket = getSocket();
  socket.emit('webrtc-ice-candidate', { targetPeerId, candidate });
}

// File transfer events
export function sendFileTransferStart(targetPeerId, fileInfo) {
  const socket = getSocket();
  socket.emit('file-transfer-start', { targetPeerId, fileInfo });
}

export function sendFileTransferProgress(targetPeerId, progress) {
  const socket = getSocket();
  socket.emit('file-transfer-progress', { targetPeerId, progress });
}

export function sendFileTransferComplete(targetPeerId, fileHash) {
  const socket = getSocket();
  socket.emit('file-transfer-complete', { targetPeerId, fileHash });
}

export function sendFileTransferError(targetPeerId, error) {
  const socket = getSocket();
  socket.emit('file-transfer-error', { targetPeerId, error });
}

