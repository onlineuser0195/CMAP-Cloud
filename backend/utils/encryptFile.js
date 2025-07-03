// encryptFile.js
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const algorithm = 'aes-256-cbc';
const secretKey = Buffer.from(process.env.FILE_SECRET || '12345678901234567890123456789012', 'hex');

export function encryptFile(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    
    const filename = path.basename(inputPath);
    const encryptedFilename = `${filename}.enc`;
    const outputPath = path.join(outputDir, encryptedFilename);

    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    output.write(iv); // Prepend IV to the file
    
    input.pipe(cipher)
      .pipe(output)
      .on('finish', () => resolve({
        encryptedPath: outputPath,
        originalName: filename,
        iv: iv.toString('hex')
      }))
      .on('error', reject);
  });
}