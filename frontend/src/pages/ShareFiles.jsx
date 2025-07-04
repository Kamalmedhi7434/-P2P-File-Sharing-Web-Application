import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Wifi, Users, Key, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';

const ShareFiles = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState('wifi');
  const [pin, setPin] = useState(null);
  const [localPeers, setLocalPeers] = useState([]);
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState(null);
  const [transferProgress, setTransferProgress] = useState({});
  
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Simulate peer discovery
  useEffect(() => {
    if (connectionMethod === 'wifi') {
      // In a real app, this would come from the WebSocket connection
      setTimeout(() => {
        setLocalPeers([
          { id: 'peer1', name: 'John's MacBook', lastSeen: new Date() },
          { id: 'peer2', name: 'Sarah's iPhone', lastSeen: new Date() }
        ]);
      }, 2000);
    }
  }, [connectionMethod]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'ready' // ready, sending, complete, error
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const generatePin = () => {
    setIsGeneratingPin(true);
    
    // Simulate PIN generation (in a real app, this would come from the server)
    setTimeout(() => {
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      setPin(newPin);
      setIsGeneratingPin(false);
      
      toast({
        title: "PIN Generated",
        description: \`Share this PIN: \${newPin} with the recipient to establish connection.\`,
      });
    }, 1500);
  };

  const connectToPeer = (peerId) => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please select files to share before connecting.",
      });
      return;
    }
    
    setIsConnecting(true);
    
    // Simulate connection (in a real app, this would use WebRTC)
    setTimeout(() => {
      const peer = localPeers.find(p => p.id === peerId);
      setConnectedPeer(peer);
      setIsConnecting(false);
      
      toast({
        title: "Connected",
        description: \`Connected to \${peer.name}. Ready to transfer files.\`,
      });
      
      // Start simulated file transfer
      startFileTransfer();
    }, 2000);
  };

  const startFileTransfer = () => {
    // Simulate file transfer progress
    files.forEach(file => {
      simulateFileTransfer(file.id);
    });
  };

  const simulateFileTransfer = (fileId) => {
    let progress = 0;
    
    // Update file status
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'sending', progress: 0 } : f
    ));
    
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Mark file as complete
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'complete', progress: 100 } : f
        ));
        
        // Check if all files are complete
        setTimeout(() => {
          const allComplete = files.every(f => f.id === fileId || f.status === 'complete');
          if (allComplete) {
            toast({
              title: "Transfer Complete",
              description: "All files have been successfully transferred.",
            });
          }
        }, 500);
      } else {
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }
    }, 300);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Share Files</h1>
        <p className="text-gray-600">
          Select files to share and choose how you want to connect with the recipient.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File Selection Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div
                className={\`border-2 border-dashed rounded-lg p-8 text-center \${
                  isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                } transition-colors\`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    or click to browse your device
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    Select Files
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileInputChange}
                    multiple
                  />
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Selected Files</h3>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="flex-shrink-0">
                            {file.status === 'complete' ? (
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="h-5 w-5 text-green-600" />
                              </div>
                            ) : file.status === 'error' ? (
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Upload className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {file.status === 'sending' && (
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: \`\${file.progress}%\` }}
                              ></div>
                            </div>
                          )}
                          {file.status === 'complete' ? (
                            <span className="text-xs text-green-600 font-medium">Complete</span>
                          ) : file.status === 'error' ? (
                            <span className="text-xs text-red-600 font-medium">Failed</span>
                          ) : file.status === 'sending' ? (
                            <span className="text-xs text-blue-600 font-medium">{Math.round(file.progress)}%</span>
                          ) : (
                            <button
                              onClick={() => removeFile(file.id)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connection Methods */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Connection Method</h3>
              
              <Tabs defaultValue="wifi" onValueChange={setConnectionMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="wifi">
                    <Wifi className="h-4 w-4 mr-2" />
                    WiFi
                  </TabsTrigger>
                  <TabsTrigger value="pin">
                    <Key className="h-4 w-4 mr-2" />
                    PIN
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="wifi" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Discover and connect to devices on the same WiFi network.
                    </p>
                    
                    {localPeers.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Available Devices
                        </h4>
                        
                        {localPeers.map((peer) => (
                          <motion.div
                            key={peer.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{peer.name}</p>
                              <p className="text-xs text-gray-500">
                                Available
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => connectToPeer(peer.id)}
                              disabled={isConnecting || connectedPeer}
                            >
                              {isConnecting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Connecting
                                </>
                              ) : connectedPeer && connectedPeer.id === peer.id ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Connected
                                </>
                              ) : (
                                "Connect"
                              )}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin mr-2" />
                        <span className="text-gray-500">Scanning for devices...</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="pin" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Generate a PIN code to connect with devices on different networks.
                    </p>
                    
                    {pin ? (
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Your PIN Code</h4>
                        <div className="text-3xl font-bold tracking-wider mb-4 text-primary">
                          {pin.split('').map((digit, i) => (
                            <span key={i} className="inline-block mx-1">{digit}</span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                          Share this PIN with the recipient to establish connection.
                          <br />
                          PIN is valid for 10 minutes.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generatePin}
                        >
                          Generate New PIN
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={generatePin}
                        disabled={isGeneratingPin}
                      >
                        {isGeneratingPin ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating PIN
                          </>
                        ) : (
                          <>
                            <Key className="h-4 w-4 mr-2" />
                            Generate PIN
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShareFiles;

