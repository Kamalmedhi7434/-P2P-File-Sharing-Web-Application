const os = require('os');
const nodeWifi = require('node-wifi');
const { networkInterfaces } = require('os');

// Initialize node-wifi
nodeWifi.init({
  iface: null // Use default WiFi interface
});

/**
 * Get local network information
 * @returns {Array} Array of network interfaces
 */
function getLocalNetworkInfo() {
  const interfaces = networkInterfaces();
  const networkInfo = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 interfaces
      if (interface.family === 'IPv4' && !interface.internal) {
        networkInfo.push({
          name,
          address: interface.address,
          netmask: interface.netmask,
          mac: interface.mac,
          cidr: calculateCIDR(interface.address, interface.netmask)
        });
      }
    }
  }
  
  return networkInfo;
}

/**
 * Calculate CIDR notation from IP and netmask
 * @param {string} ip - IP address
 * @param {string} netmask - Network mask
 * @returns {string} CIDR notation
 */
function calculateCIDR(ip, netmask) {
  const maskNodes = netmask.split('.');
  let cidr = 0;
  for (let i = 0; i < maskNodes.length; i++) {
    cidr += (((maskNodes[i] >>> 0).toString(2)).match(/1/g) || []).length;
  }
  return \`\${ip}/\${cidr}\`;
}

/**
 * Check if two devices are on the same network
 * @param {Object} networkInfo1 - Network info of first device
 * @param {Object} networkInfo2 - Network info of second device
 * @returns {boolean} True if on same network
 */
function areOnSameNetwork(networkInfo1, networkInfo2) {
  // If either device doesn't have network info, they can't be on the same network
  if (!networkInfo1 || !networkInfo2) return false;
  
  // Check if any of the network interfaces match
  for (const interface1 of networkInfo1) {
    for (const interface2 of networkInfo2) {
      // If they have the same CIDR, they're on the same network
      if (interface1.cidr === interface2.cidr) {
        return true;
      }
      
      // Alternative check: IP in same subnet
      const ip1Parts = interface1.address.split('.');
      const ip2Parts = interface2.address.split('.');
      const mask = interface1.netmask.split('.');
      
      let sameSubnet = true;
      for (let i = 0; i < 4; i++) {
        if ((ip1Parts[i] & mask[i]) !== (ip2Parts[i] & mask[i])) {
          sameSubnet = false;
          break;
        }
      }
      
      if (sameSubnet) return true;
    }
  }
  
  return false;
}

/**
 * Get current WiFi network information
 * @returns {Promise<Object>} WiFi network info
 */
async function getCurrentWifiNetwork() {
  try {
    const currentConnections = await nodeWifi.getCurrentConnections();
    
    if (currentConnections && currentConnections.length > 0) {
      return {
        ssid: currentConnections[0].ssid,
        bssid: currentConnections[0].bssid,
        mac: currentConnections[0].mac,
        channel: currentConnections[0].channel,
        frequency: currentConnections[0].frequency,
        signal_level: currentConnections[0].signal_level
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting WiFi information:', error);
    return null;
  }
}

/**
 * Get device information for peer discovery
 * @returns {Object} Device info
 */
async function getDeviceInfo() {
  const networkInfo = getLocalNetworkInfo();
  const wifiInfo = await getCurrentWifiNetwork();
  
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    networkInfo,
    wifiInfo
  };
}

module.exports = {
  getLocalNetworkInfo,
  getCurrentWifiNetwork,
  getDeviceInfo,
  areOnSameNetwork
};

