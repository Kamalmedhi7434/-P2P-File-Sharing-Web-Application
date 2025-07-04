const crypto = require('crypto');
const fs = require('fs');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

/**
 * File Integrity Manager for handling file integrity checks
 */
class FileIntegrityManager {
  /**
   * Calculate hash for a file
   * @param {Buffer|string} data - File data or path to file
   * @param {string} algorithm - Hash algorithm (default: sha256)
   * @returns {Promise<string>} File hash
   */
  async calculateHash(data, algorithm = 'sha256') {
    try {
      let fileData;
      
      if (typeof data === 'string') {
        // If data is a file path, read the file
        fileData = await readFileAsync(data);
      } else {
        // Otherwise, assume it's already file data
        fileData = data;
      }
      
      const hash = crypto.createHash(algorithm);
      hash.update(fileData);
      return hash.digest('hex');
    } catch (error) {
      throw new Error(\`Failed to calculate file hash: \${error.message}\`);
    }
  }
  
  /**
   * Verify file integrity by comparing hashes
   * @param {Buffer|string} data - File data or path to file
   * @param {string} expectedHash - Expected hash value
   * @param {string} algorithm - Hash algorithm (default: sha256)
   * @returns {Promise<boolean>} True if hash matches
   */
  async verifyIntegrity(data, expectedHash, algorithm = 'sha256') {
    try {
      const actualHash = await this.calculateHash(data, algorithm);
      return actualHash === expectedHash;
    } catch (error) {
      throw new Error(\`Failed to verify file integrity: \${error.message}\`);
    }
  }
  
  /**
   * Create a manifest file with file hashes
   * @param {Array<{path: string, name: string}>} files - Array of file objects
   * @param {string} manifestPath - Path to save manifest
   * @param {string} algorithm - Hash algorithm (default: sha256)
   * @returns {Promise<Object>} Manifest object
   */
  async createManifest(files, manifestPath, algorithm = 'sha256') {
    try {
      const manifest = {
        createdAt: new Date().toISOString(),
        algorithm,
        files: []
      };
      
      for (const file of files) {
        const hash = await this.calculateHash(file.path, algorithm);
        manifest.files.push({
          name: file.name,
          path: file.path,
          hash,
          size: fs.statSync(file.path).size
        });
      }
      
      if (manifestPath) {
        await writeFileAsync(
          manifestPath, 
          JSON.stringify(manifest, null, 2)
        );
      }
      
      return manifest;
    } catch (error) {
      throw new Error(\`Failed to create manifest: \${error.message}\`);
    }
  }
  
  /**
   * Verify files against a manifest
   * @param {string|Object} manifest - Path to manifest file or manifest object
   * @returns {Promise<Array>} Array of verification results
   */
  async verifyManifest(manifest) {
    try {
      let manifestData;
      
      if (typeof manifest === 'string') {
        // If manifest is a file path, read the file
        const manifestContent = await readFileAsync(manifest, 'utf8');
        manifestData = JSON.parse(manifestContent);
      } else {
        // Otherwise, assume it's already a manifest object
        manifestData = manifest;
      }
      
      const results = [];
      
      for (const file of manifestData.files) {
        try {
          const isValid = await this.verifyIntegrity(
            file.path, 
            file.hash, 
            manifestData.algorithm
          );
          
          results.push({
            name: file.name,
            path: file.path,
            isValid,
            error: null
          });
        } catch (error) {
          results.push({
            name: file.name,
            path: file.path,
            isValid: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(\`Failed to verify manifest: \${error.message}\`);
    }
  }
  
  /**
   * Calculate hash for a Blob or File object (browser environment)
   * @param {Blob|File} file - File or Blob object
   * @returns {Promise<string>} File hash
   */
  async calculateBrowserFileHash(file) {
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
}

module.exports = new FileIntegrityManager();

