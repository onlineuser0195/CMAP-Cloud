// decryptFile.js
import fs from 'fs';
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = Buffer.from(process.env.FILE_SECRET || '48ba0d4d0a7a821eb996581c82d93956e569032bad1aaeb24774635ef2b4c635', 'hex');

export function decryptFile(filePath, res) {
  const input = fs.createReadStream(filePath);

  input.once('readable', () => {
    try {
      const iv = input.read(16);
      if (!iv || iv.length !== 16) {
        throw new Error('Invalid IV length');
      }
      
      const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
      decipher.on('error', (err) => {
        console.error('Decryption error:', err);
        res.status(500).end();
      });
      
      input.pipe(decipher).pipe(res);
    } catch (err) {
      console.error('Decryption failed:', err);
      res.status(500).json({ message: 'File decryption failed' });
    }
  });
}