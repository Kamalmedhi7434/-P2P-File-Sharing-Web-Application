import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Wifi, Key, Loader2, Check, AlertCircle, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';

const ReceiveFiles = () => {
  const [connectionMethod, setConnectionMethod] = useState('wifi');
  const [pinInput, setPinInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedPeer, setConnectedPeer] = useState(null);
  const [localPeers, setLocalPeers] = useState([]);
  const [incomingFiles, setIncomingFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  
  const { toast } = useToast();

  // Simulate peer discovery
  useEffect(() => {
    if (connectionMethod === 'wifi') {
      setTimeout(() => {
        setLocalPeers([
          { id: 'peer1', name: 'John's MacBook', lastSeen: new Date() },
          { id: 'peer2', name: 'Sarah's iPhone', lastSeen: new Date() }
        ]);
        setIsScanning(false);
      }, 2000);
    }
  }, [connectionMethod]);

  const connectToPeer = (peerId) => {
    setIsConnecting(true);
    
    // Simulate connection (in a real app, this would use WebRTC)
    setTimeout(() => {
      const peer = localPeers.find(p => p.id === peerId);
      setConnectedPeer(peer);
      setIsConnecting(false);
      
      toast({
        title: "Connected",
        description: \`Connected to \${peer.name}. Ready to receive files.\`,
      });
      
      // Simulate receiving files after a delay
      setTimeout(() => {
        simulateIncomingFiles();
      }, 3000);
    }, 2000);
  };

  const connectWithPin = () => {
    if (pinInput.length !== 6 || !/^\d+$/.test(pinInput)) {
      toast({
        variant: "destructive",
        title: "Invalid PIN",
        description: "Please enter a valid 6-digit PIN code.",
      });
      return;
    }
    
    setIsConnecting(true);
    
    // Simulate PIN connection (in a real app, this would connect to the server)
    setTimeout(() => {
      setConnectedPeer({
        id: 'remote-peer',
        name: 'Remote Device',
        pin: pinInput
      });
      setIsConnecting(false);
      
      toast({
        title: "Connected via PIN",
        description: "Connected to remote device. Ready to receive files.",
      });
      
      // Simulate receiving files after a delay
      setTimeout(() => {
        simulateIncomingFiles();
      }, 3000);
    }, 2000);
  };

  const simulateIncomingFiles = () => {
    // Simulate receiving files
    const files = [
      {
        id: 'file1',
        name: 'Project Presentation.pdf',
        size: 2500000,
        type: 'application/pdf',
        progress: 0,
        status: 'receiving'
      },
      {
        id: 'file2',
        name: 'Meeting Notes.docx',
        size: 350000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        progress: 0,
        status: 'receiving'
      },
      {
        id: 'file3',
        name: 'Product Image.jpg',
        size: 1200000,
        type: 'image/jpeg',
        progress: 0,
        status: 'receiving'
      }
    ];
    
    setIncomingFiles(files);
    
    // Simulate progress for each file
    files.forEach(file => {
      simulateFileReceive(file.id);
    });
  };

  const simulateFileReceive = (fileId) => {
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Mark file as complete
        setIncomingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'complete', progress: 100 } : f
        ));
        
        // Check if all files are complete
        setTimeout(() => {
          const allComplete = incomingFiles.every(f => f.id === fileId || f.status === 'complete');
          if (allComplete) {
            toast({
              title: "Transfer Complete",
              description: "All files have been successfully received.",
            });
          }
        }, 500);
      } else {
        // Update progress
        setIncomingFiles(prev => prev.map(f => 
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
        <h1 className="text-3xl font-bold mb-2">Receive Files</h1>
        <p className="text-gray-600">
          Connect to a sender and receive files securely.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    
                    {isScanning ? (
                      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin mr-2" />
                        <span className="text-gray-500">Scanning for devices...</span>
                      </div>
                    ) : localPeers.length > 0 ? (
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
                      <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-500">No devices found.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setIsScanning(true);
                            setTimeout(() => {
                              setLocalPeers([
                                { id: 'peer1', name: 'John's MacBook', lastSeen: new Date() },
                                { id: 'peer2', name: 'Sarah's iPhone', lastSeen: new Date() }
                              ]);
                              setIsScanning(false);
                            }, 2000);
                          }}
                        >
                          Scan Again
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="pin" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Enter the PIN code provided by the sender to connect.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label htmlFor="pin" className="text-sm font-medium">
                          Enter 6-digit PIN
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            id="pin"
                            placeholder="123456"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.slice(0, 6))}
                            maxLength={6}
                            className="text-center text-lg tracking-wider"
                          />
                          <Button
                            onClick={connectWithPin}
                            disabled={pinInput.length !== 6 || isConnecting || connectedPeer}
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Connecting
                              </>
                            ) : connectedPeer && connectedPeer.pin === pinInput ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Connected
                              </>
                            ) : (
                              "Connect"
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Ask the sender to generate a PIN code and enter it here.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* File Receiving Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {connectedPeer ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-medium">Connected to {connectedPeer.name}</h3>
                      <p className="text-sm text-gray-500">Ready to receive files</p>
                    </div>
                    <div className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                      <Check className="h-4 w-4" />
                      <span>Connected</span>
                    </div>
                  </div>
                  
                  {incomingFiles.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Incoming Files</h4>
                      <div className="space-y-3">
                        {incomingFiles.map((file) => (
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
                                    <Download className="h-5 w-5 text-blue-600" />
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
                              {file.status === 'receiving' && (
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
                              ) : file.status === 'receiving' ? (
                                <span className="text-xs text-blue-600 font-medium">{Math.round(file.progress)}%</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg">
                      <Download className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Waiting for files</h3>
                      <p className="text-sm text-gray-500 text-center">
                        Ask the sender to select files and start the transfer.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-10">
                  <Download className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Receive</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    Connect to a sender using WiFi discovery or PIN code to start receiving files.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant={connectionMethod === 'wifi' ? 'default' : 'outline'}
                      onClick={() => setConnectionMethod('wifi')}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Connect via WiFi
                    </Button>
                    <Button
                      variant={connectionMethod === 'pin' ? 'default' : 'outline'}
                      onClick={() => setConnectionMethod('pin')}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Connect via PIN
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReceiveFiles;

