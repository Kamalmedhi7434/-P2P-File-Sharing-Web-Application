# ShareWave - P2P File Sharing Web Application

ShareWave is a professional peer-to-peer file sharing web application that enables seamless file sharing via WiFi detection for local users and PIN-based connections for remote users. It features comprehensive error handling and file integrity checks to ensure secure and reliable file transfers.

## Features

- **Local WiFi Discovery**: Automatically detects devices on the same WiFi network for quick local file transfers
- **PIN-Based Remote Sharing**: Share files with anyone, anywhere using a secure 6-digit PIN code
- **End-to-End Encryption**: Files are encrypted during transfer for maximum security
- **File Integrity Verification**: Automatic checksums ensure files arrive uncorrupted
- **Responsive Design**: Works on desktop and mobile devices
- **Drag & Drop Interface**: Easy-to-use interface for selecting files
- **Multiple File Support**: Share multiple files of any size
- **Error Handling**: Robust error recovery and user-friendly error messages

## Technology Stack

- **Frontend**: React, TailwindCSS, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **P2P Communication**: WebRTC
- **Network Detection**: Node-WiFi, OS
- **File Integrity**: Crypto (SHA-256)

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or pnpm

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/Kamalmedhi7434/sharewave.git
   cd sharewave
   ```

2. Install dependencies:
   ```
   npm install
   cd frontend
   npm install
   cd ..
   ```

3. Build the frontend:
   ```
   cd frontend
   npm run build
   cd ..
   ```

4. Start the server:
   ```
   npm start
   ```

5. Access the application:
   Open your browser and navigate to `http://localhost:3000`

## Usage

### Sharing Files

1. Click on "Share Files" in the navigation menu
2. Drag and drop files or click to select files
3. Choose a connection method:
   - **WiFi**: Connect to devices on the same network
   - **PIN**: Generate a PIN for remote connections
4. Wait for the recipient to connect
5. Files will transfer automatically once connected

### Receiving Files

1. Click on "Receive Files" in the navigation menu
2. Choose a connection method:
   - **WiFi**: Connect to devices on the same network
   - **PIN**: Enter the PIN provided by the sender
3. Wait for the connection to establish
4. Files will be received automatically

## Development

### Running in Development Mode

1. Start the backend server:
   ```
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Access the development version at `http://localhost:5173`

## Security Considerations

- PIN codes are temporary and expire after 10 minutes
- File integrity is verified using SHA-256 checksums
- All connections are secured with WebRTC encryption
- No files are stored on any server; all transfers are direct peer-to-peer

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Copyright

© 2025 Kamal Medhi. All rights reserved.

GitHub: [https://github.com/Kamalmedhi7434](https://github.com/Kamalmedhi7434)

## Acknowledgments

- WebRTC for enabling peer-to-peer communication
- Socket.io for signaling
- React and TailwindCSS for the frontend interface

