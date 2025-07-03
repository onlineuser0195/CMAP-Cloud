// utils/encryption.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.FILE_ENCRYPTION_KEY || crypto.randomBytes(32); // Use environment variable in production
const IV_LENGTH = 16; // For GCM, this is the IV length
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Derives a key from the secret using PBKDF2
 */
function deriveKey(salt) {
  return crypto.pbkdf2Sync(SECRET_KEY, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts a file and saves it to the specified path
 * @param {Buffer} fileBuffer - The file buffer to encrypt
 * @param {string} outputPath - Where to save the encrypted file
 * @returns {Promise<Object>} - Returns encryption metadata
 */
export async function encryptFile(fileBuffer, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Derive key from secret using salt
      const key = deriveKey(salt);
      
      // Create cipher
      const cipher = crypto.createCipher(ALGORITHM, key);
      cipher.setAAD(salt); // Additional authenticated data
      
      // Create write stream
      const writeStream = fs.createWriteStream(outputPath);
      
      // Write salt and IV first
      writeStream.write(salt);
      writeStream.write(iv);
      
      let encryptedData = Buffer.alloc(0);
      
      // Encrypt the file buffer
      cipher.on('data', (chunk) => {
        encryptedData = Buffer.concat([encryptedData, chunk]);
      });
      
      cipher.on('end', () => {
        try {
          const tag = cipher.getAuthTag();
          
          // Write tag then encrypted data
          writeStream.write(tag);
          writeStream.write(encryptedData);
          writeStream.end();
          
          writeStream.on('finish', () => {
            resolve({
              success: true,
              encryptedPath: outputPath,
              salt: salt.toString('hex'),
              iv: iv.toString('hex'),
              tag: tag.toString('hex')
            });
          });
          
          writeStream.on('error', reject);
        } catch (error) {
          reject(error);
        }
      });
      
      cipher.on('error', reject);
      
      // Write file buffer to cipher
      cipher.write(fileBuffer);
      cipher.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Alternative simpler encryption method
 */
export function encryptFileSync(fileBuffer, outputPath) {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from secret using salt
    const key = deriveKey(salt);
    
    // Create cipher
    const cipher = crypto.createCipher(ALGORITHM, key);
    
    // Encrypt the data
    let encrypted = cipher.update(fileBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get the tag
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    
    // Write to file
    fs.writeFileSync(outputPath, result);
    
    return {
      success: true,
      encryptedPath: outputPath,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts a file and returns the buffer
 * @param {string} encryptedFilePath - Path to the encrypted file
 * @returns {Promise<Buffer>} - Returns decrypted file buffer
 */
export async function decryptFile(encryptedFilePath) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(encryptedFilePath)) {
        return reject(new Error('Encrypted file not found'));
      }
      
      // Read the encrypted file
      const encryptedBuffer = fs.readFileSync(encryptedFilePath);
      
      if (encryptedBuffer.length < ENCRYPTED_POSITION) {
        return reject(new Error('Invalid encrypted file format'));
      }
      
      // Extract components
      const salt = encryptedBuffer.slice(0, SALT_LENGTH);
      const iv = encryptedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const tag = encryptedBuffer.slice(TAG_POSITION, ENCRYPTED_POSITION);
      const encryptedData = encryptedBuffer.slice(ENCRYPTED_POSITION);
      
      // Derive key
      const key = deriveKey(salt);
      
      // Create decipher
      const decipher = crypto.createDecipher(ALGORITHM, key);
      decipher.setAuthTag(tag);
      
      let decrypted = Buffer.alloc(0);
      
      decipher.on('data', (chunk) => {
        decrypted = Buffer.concat([decrypted, chunk]);
      });
      
      decipher.on('end', () => {
        resolve(decrypted);
      });
      
      decipher.on('error', reject);
      
      // Decrypt
      decipher.write(encryptedData);
      decipher.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Synchronous decryption method
 */
export function decryptFileSync(encryptedFilePath) {
  try {
    if (!fs.existsSync(encryptedFilePath)) {
      throw new Error('Encrypted file not found');
    }
    
    // Read the encrypted file
    const encryptedBuffer = fs.readFileSync(encryptedFilePath);
    
    if (encryptedBuffer.length < ENCRYPTED_POSITION) {
      throw new Error('Invalid encrypted file format');
    }
    
    // Extract components
    const salt = encryptedBuffer.slice(0, SALT_LENGTH);
    const iv = encryptedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = encryptedBuffer.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encryptedData = encryptedBuffer.slice(ENCRYPTED_POSITION);
    
    // Derive key
    const key = deriveKey(salt);
    
    // Create decipher
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Checks if a file is encrypted by examining its structure
 */
export function isEncryptedFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.length >= ENCRYPTED_POSITION;
  } catch (error) {
    return false;
  }
}