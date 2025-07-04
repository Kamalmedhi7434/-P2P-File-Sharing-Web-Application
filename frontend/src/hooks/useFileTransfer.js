import { useState, useCallback } from 'react';
import { useToast } from '../components/ui/use-toast';
import { getSocket } from '../lib/api';

/**
 * Calculate SHA-256 hash of a file
 * @param {File} file - File to hash
 * @returns {Promise<string>} Hex hash string
 */
async function calculateFileHash(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        resolve(hashHex);
      } catch (error) {
        reject(new Error(\`Failed to calculate file hash: \${error.message}\`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Hook for handling file transfers with integrity checks
 * @param {Object} connectedPeer - Connected peer information
 */
export function useFileTransfer(connectedPeer) {
  const [files, setFiles] = useState([]);
  const [transferProgress, setTransferProgress] = useState({});
  const [isTransferring, setIsTransferring] = useState(false);
  const [completedTransfers, setCompletedTransfers] = useState([]);
  const [failedTransfers, setFailedTransfers] = useState([]);
  
  const { toast } = useToast();
  
  // Add files to the transfer queue
  const addFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles);
    
    const processedFiles = fileArray.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'ready', // ready, sending, receiving, complete, error
      error: null,
      hash: null
    }));
    
    setFiles(prev => [...prev, ...processedFiles]);
    
    return processedFiles;
  }, []);
  
  // Remove a file from the queue
  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);
  
  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setTransferProgress({});
    setCompletedTransfers([]);
    setFailedTransfers([]);
  }, []);
  
  // Start sending files to peer
  const sendFiles = useCallback(async () => {
    if (!connectedPeer) {
      toast({
        variant: "destructive",
        title: "No Connection",
        description: "You must be connected to a peer to send files.",
      });
      return;
    }
    
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No Files",
        description: "Please select files to send first.",
      });
      return;
    }
    
    setIsTransferring(true);
    
    // In a real implementation, this would use WebRTC data channels
    // For now, we'll simulate the transfer
    
    const socket = getSocket();
    
    // Process each file
    for (const file of files) {
      try {
        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'sending', progress: 0 } : f
        ));
        
        // Calculate file hash for integrity check
        const hash = await calculateFileHash(file.file);
        
        // Notify peer about the file
        socket.emit('file-transfer-start', {
          targetPeerId: connectedPeer.id,
          fileInfo: {
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            hash
          }
        });
        
        // Simulate file transfer progress
        await simulateFileTransfer(file.id, connectedPeer.id, socket);
        
        // Mark as complete
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'complete', progress: 100, hash } : f
        ));
        
        setCompletedTransfers(prev => [...prev, { ...file, hash }]);
        
        // Notify peer about completion
        socket.emit('file-transfer-complete', {
          targetPeerId: connectedPeer.id,
          fileHash: hash
        });
        
      } catch (error) {
        console.error('File transfer error:', error);
        
        // Mark as error
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error', error: error.message } : f
        ));
        
        setFailedTransfers(prev => [...prev, { ...file, error: error.message }]);
        
        // Notify peer about error
        socket.emit('file-transfer-error', {
          targetPeerId: connectedPeer.id,
          error: error.message
        });
        
        toast({
          variant: "destructive",
          title: "Transfer Failed",
          description: \`Failed to send \${file.name}: \${error.message}\`,
        });
      }
    }
    
    setIsTransferring(false);
    
    // Check if all transfers completed successfully
    const allComplete = files.every(f => f.status === 'complete');
    if (allComplete) {
      toast({
        title: "Transfer Complete",
        description: "All files have been successfully sent.",
      });
    }
  }, [connectedPeer, files, toast]);
  
  // Simulate file transfer progress
  const simulateFileTransfer = async (fileId, peerId, socket) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Update progress state
          setTransferProgress(prev => ({
            ...prev,
            [fileId]: 100
          }));
          
          // Update file progress
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: 100 } : f
          ));
          
          resolve();
        } else {
          // Update progress state
          setTransferProgress(prev => ({
            ...prev,
            [fileId]: Math.round(progress)
          }));
          
          // Update file progress
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: Math.round(progress) } : f
          ));
          
          // Notify peer about progress
          socket.emit('file-transfer-progress', {
            targetPeerId: peerId,
            progress: Math.round(progress)
          });
        }
      }, 300);
    });
  };
  
  // Set up socket listeners for file transfers
  const setupFileTransferListeners = useCallback(() => {
    const socket = getSocket();
    
    // Handle file transfer start
    const handleFileTransferStart = (data) => {
      const { fromPeerId, fileInfo } = data;
      
      // Add file to the list
      const newFile = {
        id: fileInfo.id,
        name: fileInfo.name,
        size: fileInfo.size,
        type: fileInfo.type,
        progress: 0,
        status: 'receiving',
        error: null,
        hash: fileInfo.hash,
        fromPeerId
      };
      
      setFiles(prev => [...prev, newFile]);
      
      toast({
        title: "Receiving File",
        description: \`\${fileInfo.name} is being transferred.\`,
      });
    };
    
    // Handle file transfer progress
    const handleFileTransferProgress = (data) => {
      const { fromPeerId, progress } = data;
      
      // Update progress for all files from this peer
      setFiles(prev => prev.map(file => 
        file.fromPeerId === fromPeerId && file.status === 'receiving'
          ? { ...file, progress }
          : file
      ));
    };
    
    // Handle file transfer complete
    const handleFileTransferComplete = (data) => {
      const { fromPeerId, fileHash } = data;
      
      // Mark files as complete
      setFiles(prev => prev.map(file => {
        if (file.fromPeerId === fromPeerId && file.status === 'receiving') {
          // Verify hash if available
          const isValid = file.hash === fileHash;
          
          if (isValid) {
            setCompletedTransfers(prevComplete => [...prevComplete, file]);
            
            return { ...file, status: 'complete', progress: 100 };
          } else {
            setFailedTransfers(prevFailed => [
              ...prevFailed, 
              { ...file, error: 'File integrity check failed' }
            ]);
            
            toast({
              variant: "destructive",
              title: "Integrity Check Failed",
              description: \`\${file.name} failed integrity verification.\`,
            });
            
            return { 
              ...file, 
              status: 'error', 
              error: 'File integrity check failed' 
            };
          }
        }
        return file;
      }));
    };
    
    // Handle file transfer error
    const handleFileTransferError = (data) => {
      const { fromPeerId, error } = data;
      
      // Mark files as error
      setFiles(prev => prev.map(file => {
        if (file.fromPeerId === fromPeerId && file.status === 'receiving') {
          setFailedTransfers(prevFailed => [
            ...prevFailed, 
            { ...file, error }
          ]);
          
          toast({
            variant: "destructive",
            title: "Transfer Failed",
            description: \`\${file.name} transfer failed: \${error}\`,
          });
          
          return { ...file, status: 'error', error };
        }
        return file;
      }));
    };
    
    socket.on('file-transfer-start', handleFileTransferStart);
    socket.on('file-transfer-progress', handleFileTransferProgress);
    socket.on('file-transfer-complete', handleFileTransferComplete);
    socket.on('file-transfer-error', handleFileTransferError);
    
    return () => {
      socket.off('file-transfer-start', handleFileTransferStart);
      socket.off('file-transfer-progress', handleFileTransferProgress);
      socket.off('file-transfer-complete', handleFileTransferComplete);
      socket.off('file-transfer-error', handleFileTransferError);
    };
  }, [toast]);
  
  return {
    files,
    transferProgress,
    isTransferring,
    completedTransfers,
    failedTransfers,
    addFiles,
    removeFile,
    clearFiles,
    sendFiles,
    setupFileTransferListeners
  };
}

