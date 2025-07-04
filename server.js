const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const os = require('os');
const { getLocalNetworkInfo, getDeviceInfo, areOnSameNetwork } = require('./utils/network');
const pinManager = require('./utils/pin');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Store active connections and peers
const activeConnections = new Map();
const localPeers = new Map();

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log('New client connected:', socket.id);
  
  // Get device info for the new connection
  const deviceInfo = await getDeviceInfo();
  
  // Store connection info
  activeConnections.set(socket.id, {
    id: socket.id,
    connectedAt: new Date(),
    deviceInfo,
    deviceName: deviceInfo.hostname || 'Unknown Device'
  });

  // Handle peer registration
  socket.on('register-peer', async (data, callback) => {
    const { deviceName, customDeviceInfo } = data;
    const connectionInfo = activeConnections.get(socket.id);
    
    // Update connection info with custom device name if provided
    if (deviceName) {
      connectionInfo.deviceName = deviceName;
    }
    
    // Use custom device info if provided, otherwise use the one we detected
    const finalDeviceInfo = customDeviceInfo || connectionInfo.deviceInfo;
    connectionInfo.deviceInfo = finalDeviceInfo;
    
    activeConnections.set(socket.id, connectionInfo);
    
    // Add to local peers
    localPeers.set(socket.id, {
      id: socket.id,
      deviceName: connectionInfo.deviceName,
      deviceInfo: finalDeviceInfo,
      lastSeen: new Date()
    });
    
    // Find peers on the same network
    const peersOnSameNetwork = findPeersOnSameNetwork(socket.id);
    
    // Notify the new peer about existing peers on the same network
    socket.emit('local-peers', peersOnSameNetwork);
    
    // Notify existing peers about the new peer
    for (const peer of peersOnSameNetwork) {
      io.to(peer.id).emit('peer-discovered', {
        id: socket.id,
        deviceName: connectionInfo.deviceName,
        deviceInfo: finalDeviceInfo
      });
    }
    
    if (callback) {
      callback({ success: true });
    }
  });

  // Find peers on the same network
  function findPeersOnSameNetwork(excludeId) {
    const peers = [];
    const sourceConnection = activeConnections.get(excludeId);
    
    if (!sourceConnection || !sourceConnection.deviceInfo) {
      return peers;
    }
    
    for (const [peerId, connection] of activeConnections.entries()) {
      // Skip self and connections without device info
      if (peerId === excludeId || !connection.deviceInfo) {
        continue;
      }
      
      // Check if on same network
      if (areOnSameNetwork(
        sourceConnection.deviceInfo.networkInfo,
        connection.deviceInfo.networkInfo
      )) {
        peers.push({
          id: peerId,
          deviceName: connection.deviceName,
          deviceInfo: connection.deviceInfo,
          lastSeen: connection.lastSeen || new Date()
        });
      }
    }
    
    return peers;
  }

  // Handle PIN generation for remote connections
  socket.on('generate-pin', (callback) => {
    const pinData = pinManager.createPIN(socket.id);
    
    callback({ 
      success: true, 
      pin: pinData.pin,
      expiresAt: pinData.expiresAt
    });
    
    console.log(`PIN generated for ${socket.id}: ${pinData.pin}`);
  });

  // Handle PIN connection
  socket.on('connect-with-pin', (data, callback) => {
    const { pin } = data;
    
    // Validate PIN
    const pinData = pinManager.usePIN(pin);
    
    if (!pinData) {
      callback({ success: false, error: 'Invalid or expired PIN' });
      return;
    }
    
    const targetSocketId = pinData.socketId;
    const targetConnection = activeConnections.get(targetSocketId);
    
    if (!targetConnection) {
      callback({ success: false, error: 'Target peer is no longer connected' });
      return;
    }
    
    // Notify both peers about the connection
    socket.emit('pin-connection-established', { 
      peerId: targetSocketId,
      peerInfo: {
        deviceName: targetConnection.deviceName,
        deviceInfo: targetConnection.deviceInfo
      },
      role: 'receiver'
    });
    
    const sourceConnection = activeConnections.get(socket.id);
    io.to(targetSocketId).emit('pin-connection-established', { 
      peerId: socket.id,
      peerInfo: {
        deviceName: sourceConnection.deviceName,
        deviceInfo: sourceConnection.deviceInfo
      },
      role: 'sender'
    });
    
    console.log(`PIN connection established between ${socket.id} and ${targetSocketId}`);
    
    callback({ 
      success: true, 
      peerId: targetSocketId,
      peerInfo: {
        deviceName: targetConnection.deviceName,
        deviceInfo: targetConnection.deviceInfo
      }
    });
  });

  // Handle WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    const { targetPeerId, offer } = data;
    io.to(targetPeerId).emit('webrtc-offer', {
      fromPeerId: socket.id,
      offer
    });
  });

  socket.on('webrtc-answer', (data) => {
    const { targetPeerId, answer } = data;
    io.to(targetPeerId).emit('webrtc-answer', {
      fromPeerId: socket.id,
      answer
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { targetPeerId, candidate } = data;
    io.to(targetPeerId).emit('webrtc-ice-candidate', {
      fromPeerId: socket.id,
      candidate
    });
  });

  // Handle file transfer metadata
  socket.on('file-transfer-start', (data) => {
    const { targetPeerId, fileInfo } = data;
    io.to(targetPeerId).emit('file-transfer-start', {
      fromPeerId: socket.id,
      fileInfo
    });
  });

  socket.on('file-transfer-progress', (data) => {
    const { targetPeerId, progress } = data;
    io.to(targetPeerId).emit('file-transfer-progress', {
      fromPeerId: socket.id,
      progress
    });
  });

  socket.on('file-transfer-complete', (data) => {
    const { targetPeerId, fileHash } = data;
    io.to(targetPeerId).emit('file-transfer-complete', {
      fromPeerId: socket.id,
      fileHash
    });
  });

  socket.on('file-transfer-error', (data) => {
    const { targetPeerId, error } = data;
    io.to(targetPeerId).emit('file-transfer-error', {
      fromPeerId: socket.id,
      error
    });
  });

  // Handle peer heartbeat to keep track of active peers
  socket.on('heartbeat', () => {
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.lastSeen = new Date();
      activeConnections.set(socket.id, connection);
      
      const peer = localPeers.get(socket.id);
      if (peer) {
        peer.lastSeen = new Date();
        localPeers.set(socket.id, peer);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove from active connections
    activeConnections.delete(socket.id);
    
    // Remove from local peers
    localPeers.delete(socket.id);
    
    // Remove any PINs associated with this socket
    pinManager.removeSocketPINs(socket.id);
    
    // Notify other peers about disconnection
    socket.broadcast.emit('peer-disconnected', { id: socket.id });
  });
});

// API Routes
app.get('/api/network-info', async (req, res) => {
  const networkInfo = getLocalNetworkInfo();
  const deviceInfo = await getDeviceInfo();
  res.json({ networkInfo, deviceInfo });
});

app.get('/api/active-peers', (req, res) => {
  const peers = Array.from(localPeers.values());
  res.json({ peers });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeConnections: activeConnections.size,
    activePINs: pinManager.getActivePINCount(),
    localPeers: localPeers.size
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`P2P File Sharing Server running on port ${PORT}`);
  console.log(`Local network info:`, getLocalNetworkInfo());
});

