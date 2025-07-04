import { useState, useEffect, useCallback } from 'react';
import { generatePin, connectWithPin, getSocket } from '../lib/api';
import { useToast } from '../components/ui/use-toast';

/**
 * Hook for managing PIN-based connections
 */
export function usePinConnection() {
  const [pin, setPin] = useState(null);
  const [pinExpiry, setPinExpiry] = useState(null);
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState(null);
  const [error, setError] = useState(null);
  
  const { toast } = useToast();
  
  // Generate a new PIN
  const handleGeneratePin = useCallback(async () => {
    setIsGeneratingPin(true);
    setError(null);
    
    try {
      const response = await generatePin();
      
      if (response.success) {
        setPin(response.pin);
        setPinExpiry(response.expiresAt);
        
        toast({
          title: "PIN Generated",
          description: \`Share this PIN: \${response.pin} with the recipient to establish connection.\`,
        });
      } else {
        setError(response.error || 'Failed to generate PIN');
        toast({
          variant: "destructive",
          title: "PIN Generation Failed",
          description: response.error || 'Failed to generate PIN',
        });
      }
    } catch (err) {
      setError('Network error: Failed to generate PIN');
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setIsGeneratingPin(false);
    }
  }, [toast]);
  
  // Connect using a PIN
  const handleConnectWithPin = useCallback(async (pinToConnect) => {
    if (!pinToConnect || pinToConnect.length !== 6) {
      setError('Invalid PIN format');
      toast({
        variant: "destructive",
        title: "Invalid PIN",
        description: "Please enter a valid 6-digit PIN code.",
      });
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await connectWithPin(pinToConnect);
      
      if (response.success) {
        setConnectedPeer({
          id: response.peerId,
          deviceName: response.peerInfo?.deviceName || 'Remote Device',
          deviceInfo: response.peerInfo?.deviceInfo || {}
        });
        
        toast({
          title: "Connection Established",
          description: \`Connected to \${response.peerInfo?.deviceName || 'Remote Device'}.\`,
        });
      } else {
        setError(response.error || 'Failed to connect with PIN');
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: response.error || 'Failed to connect with PIN',
        });
      }
    } catch (err) {
      setError('Network error: Failed to connect with PIN');
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);
  
  // Listen for PIN connection events
  useEffect(() => {
    const socket = getSocket();
    
    const handlePinConnection = (data) => {
      setConnectedPeer({
        id: data.peerId,
        deviceName: data.peerInfo?.deviceName || 'Remote Device',
        deviceInfo: data.peerInfo?.deviceInfo || {},
        role: data.role
      });
      
      toast({
        title: "Connection Established",
        description: \`\${data.role === 'sender' ? 'Incoming' : 'Outgoing'} connection with \${data.peerInfo?.deviceName || 'Remote Device'}.\`,
      });
    };
    
    socket.on('pin-connection-established', handlePinConnection);
    
    return () => {
      socket.off('pin-connection-established', handlePinConnection);
    };
  }, [toast]);
  
  // Reset connection
  const resetConnection = useCallback(() => {
    setConnectedPeer(null);
    setPin(null);
    setPinExpiry(null);
    setError(null);
  }, []);
  
  return {
    pin,
    pinExpiry,
    isGeneratingPin,
    isConnecting,
    connectedPeer,
    error,
    generatePin: handleGeneratePin,
    connectWithPin: handleConnectWithPin,
    resetConnection
  };
}

