// WebRTC configuration with STUN servers for NAT traversal
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

class WebRTCManager {
  constructor(socket) {
    this.socket = socket;
    this.peerConnections = new Map();
    this.dataChannels = new Map();
    this.fileTransfers = new Map();
  }

  // Create a new peer connection
  async createPeerConnection(peerId, isInitiator = false) {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc-ice-candidate', {
          targetPeerId: peerId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'failed') {
        this.handleConnectionError(peerId, 'Connection failed');
      }
    };

    // Create data channel for file transfer
    if (isInitiator) {
      const dataChannel = peerConnection.createDataChannel('fileTransfer', {
        ordered: true
      });
      this.setupDataChannel(peerId, dataChannel);
    } else {
      peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(peerId, event.channel);
      };
    }

    this.peerConnections.set(peerId, peerConnection);
    return peerConnection;
  }

  // Setup data channel for file transfer
  setupDataChannel(peerId, dataChannel) {
    this.dataChannels.set(peerId, dataChannel);

    dataChannel.onopen = () => {
      console.log(`Data channel opened with ${peerId}`);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with ${peerId}`);
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with ${peerId}:`, error);
      this.handleConnectionError(peerId, 'Data channel error');
    };

    dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(peerId, event.data);
    };
  }

  // Handle incoming data channel messages
  handleDataChannelMessage(peerId, data) {
    try {
      if (typeof data === 'string') {
        const message = JSON.parse(data);
        this.handleControlMessage(peerId, message);
      } else {
        // Binary data (file chunk)
        this.handleFileChunk(peerId, data);
      }
    } catch (error) {
      console.error('Error handling data channel message:', error);
    }
  }

  // Handle control messages
  handleControlMessage(peerId, message) {
    const transfer = this.fileTransfers.get(peerId);
    
    switch (message.type) {
      case 'file-start':
        this.startFileReceive(peerId, message.fileInfo);
        break;
      case 'file-chunk':
        // Chunk metadata
        break;
      case 'file-complete':
        this.completeFileReceive(peerId, message.hash);
        break;
      case 'file-error':
        this.handleFileError(peerId, message.error);
        break;
    }
  }

  // Start file transfer
  async startFileTransfer(peerId, file) {
    const dataChannel = this.dataChannels.get(peerId);
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };

    // Calculate file hash
    const hash = await this.calculateFileHash(file);
    fileInfo.hash = hash;

    // Send file start message
    dataChannel.send(JSON.stringify({
      type: 'file-start',
      fileInfo
    }));

    // Start sending file chunks
    await this.sendFileChunks(peerId, file);
    
    return hash;
  }

  // Send file in chunks
  async sendFileChunks(peerId, file) {
    const dataChannel = this.dataChannels.get(peerId);
    const chunkSize = 16384; // 16KB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    this.fileTransfers.set(peerId, {
      file,
      totalChunks,
      sentChunks: 0,
      startTime: Date.now()
    });

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const arrayBuffer = await chunk.arrayBuffer();
      dataChannel.send(arrayBuffer);
      
      const transfer = this.fileTransfers.get(peerId);
      transfer.sentChunks++;
      
      // Emit progress
      const progress = (transfer.sentChunks / transfer.totalChunks) * 100;
      this.socket.emit('file-transfer-progress', {
        targetPeerId: peerId,
        progress
      });
      
      // Add small delay to prevent overwhelming the connection
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    // Send completion message
    const hash = await this.calculateFileHash(file);
    dataChannel.send(JSON.stringify({
      type: 'file-complete',
      hash
    }));
  }

  // Start receiving file
  startFileReceive(peerId, fileInfo) {
    this.fileTransfers.set(peerId, {
      fileInfo,
      receivedChunks: [],
      receivedSize: 0,
      startTime: Date.now()
    });

    this.socket.emit('file-transfer-start', {
      targetPeerId: peerId,
      fileInfo
    });
  }

  // Handle received file chunk
  handleFileChunk(peerId, chunk) {
    const transfer = this.fileTransfers.get(peerId);
    if (!transfer) return;

    transfer.receivedChunks.push(chunk);
    transfer.receivedSize += chunk.byteLength;

    // Emit progress
    const progress = (transfer.receivedSize / transfer.fileInfo.size) * 100;
    this.socket.emit('file-transfer-progress', {
      targetPeerId: peerId,
      progress
    });
  }

  // Complete file receive
  async completeFileReceive(peerId, expectedHash) {
    const transfer = this.fileTransfers.get(peerId);
    if (!transfer) return;

    // Combine all chunks into a single blob
    const blob = new Blob(transfer.receivedChunks, { 
      type: transfer.fileInfo.type 
    });

    // Verify file integrity
    const actualHash = await this.calculateFileHash(blob);
    
    if (actualHash !== expectedHash) {
      this.handleFileError(peerId, 'File integrity check failed');
      return;
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = transfer.fileInfo.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.socket.emit('file-transfer-complete', {
      targetPeerId: peerId,
      fileHash: actualHash
    });

    this.fileTransfers.delete(peerId);
  }

  // Calculate file hash for integrity checking
  async calculateFileHash(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Handle file transfer errors
  handleFileError(peerId, error) {
    console.error(`File transfer error with ${peerId}:`, error);
    this.socket.emit('file-transfer-error', {
      targetPeerId: peerId,
      error
    });
    this.fileTransfers.delete(peerId);
  }

  // Handle connection errors
  handleConnectionError(peerId, error) {
    console.error(`Connection error with ${peerId}:`, error);
    this.closePeerConnection(peerId);
  }

  // Close peer connection
  closePeerConnection(peerId) {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }

    const dataChannel = this.dataChannels.get(peerId);
    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(peerId);
    }

    this.fileTransfers.delete(peerId);
  }

  // Create offer
  async createOffer(peerId) {
    const peerConnection = await this.createPeerConnection(peerId, true);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    this.socket.emit('webrtc-offer', {
      targetPeerId: peerId,
      offer
    });
  }

  // Handle received offer
  async handleOffer(peerId, offer) {
    const peerConnection = await this.createPeerConnection(peerId, false);
    await peerConnection.setRemoteDescription(offer);
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    this.socket.emit('webrtc-answer', {
      targetPeerId: peerId,
      answer
    });
  }

  // Handle received answer
  async handleAnswer(peerId, answer) {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }

  // Handle received ICE candidate
  async handleIceCandidate(peerId, candidate) {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }
}

module.exports = { WebRTCManager, rtcConfiguration };

