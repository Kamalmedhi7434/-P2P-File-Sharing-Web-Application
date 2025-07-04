import { useState, useEffect, useCallback } from 'react';
import { getSocket, registerAsPeer } from '../lib/api';
import { useToast } from '../components/ui/use-toast';

/**
 * Hook for managing local peer discovery
 * @param {string} deviceName - Custom device name
 */
export function useLocalPeers(deviceName = null) {
  const [localPeers, setLocalPeers] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  const { toast } = useToast();
  
  // Register as a peer for discovery
  const register = useCallback(async (customDeviceName = null) => {
    setIsScanning(true);
    setError(null);
    
    try {
      await registerAsPeer(customDeviceName || deviceName);
      setIsRegistered(true);
    } catch (err) {
      setError('Failed to register for peer discovery');
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Failed to register for peer discovery. Please try again.",
      });
    } finally {
      setIsScanning(false);
    }
  }, [deviceName, toast]);
  
  // Connect to a local peer
  const connectToPeer = useCallback((peerId) => {
    const peer = localPeers.find(p => p.id === peerId);
    
    if (!peer) {
      setError('Peer not found');
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    // In a real implementation, this would initiate WebRTC connection
    // For now, we'll just simulate the connection
    setTimeout(() => {
      setConnectedPeer(peer);
      setIsConnecting(false);
      
      toast({
        title: "Connected",
        description: \`Connected to \${peer.deviceName}. Ready to transfer files.\`,
      });
    }, 1000);
  }, [localPeers, toast]);
  
  // Disconnect from peer
  const disconnectPeer = useCallback(() => {
    setConnectedPeer(null);
    
    toast({
      title: "Disconnected",
      description: "Disconnected from peer.",
    });
  }, [toast]);
  
  // Set up socket listeners for peer discovery
  useEffect(() => {
    const socket = getSocket();
    
    // Handle local peers list
    const handleLocalPeers = (peers) => {
      setLocalPeers(peers);
      setIsScanning(false);
    };
    
    // Handle new peer discovered
    const handlePeerDiscovered = (peer) => {
      setLocalPeers(prev => {
        // Check if peer already exists
        const exists = prev.some(p => p.id === peer.id);
        if (exists) {
          // Update existing peer
          return prev.map(p => p.id === peer.id ? { ...p, ...peer } : p);
        } else {
          // Add new peer
          return [...prev, peer];
        }
      });
    };
    
    // Handle peer disconnected
    const handlePeerDisconnected = (data) => {
      setLocalPeers(prev => prev.filter(p => p.id !== data.id));
      
      // If connected peer disconnected, reset connection
      if (connectedPeer && connectedPeer.id === data.id) {
        setConnectedPeer(null);
        
        toast({
          variant: "destructive",
          title: "Peer Disconnected",
          description: \`\${connectedPeer.deviceName} has disconnected.\`,
        });
      }
    };
    
    socket.on('local-peers', handleLocalPeers);
    socket.on('peer-discovered', handlePeerDiscovered);
    socket.on('peer-disconnected', handlePeerDisconnected);
    
    // Register as a peer when the component mounts
    if (!isRegistered) {
      register();
    }
    
    return () => {
      socket.off('local-peers', handleLocalPeers);
      socket.off('peer-discovered', handlePeerDiscovered);
      socket.off('peer-disconnected', handlePeerDisconnected);
    };
  }, [isRegistered, register, connectedPeer, toast]);
  
  // Refresh peer list
  const refreshPeers = useCallback(() => {
    setIsScanning(true);
    register();
  }, [register]);
  
  return {
    localPeers,
    isScanning,
    isRegistered,
    connectedPeer,
    isConnecting,
    error,
    register,
    connectToPeer,
    disconnectPeer,
    refreshPeers
  };
}

