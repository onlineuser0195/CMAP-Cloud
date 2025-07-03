import crypto from 'crypto';
import stream from 'stream';
import util from 'util';

const pipeline = util.promisify(stream.pipeline);
const algorithm = 'aes-256-cbc';
const IV_LENGTH = 16;

export function encryptBuffer(buffer, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

export function decryptBuffer(encrypted, key) {
  const iv = encrypted.subarray(0, IV_LENGTH);
  const data = encrypted.subarray(IV_LENGTH);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

export async function encryptStream(inputStream, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  const ivStream = new stream.PassThrough();
  ivStream.end(iv);
  
  return stream.pipeline([
    ivStream,
    cipher,
    inputStream
  ], { end: true });
}

export async function decryptStream(inputStream, key) {
  const iv = await new Promise((resolve) => {
    const ivChunks = [];
    inputStream.once('readable', () => {
      let chunk;
      while (null !== (chunk = inputStream.read(IV_LENGTH))) {
        ivChunks.push(chunk);
        if (Buffer.concat(ivChunks).length >= IV_LENGTH) break;
      }
      resolve(Buffer.concat(ivChunks));
    });
  });

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return stream.pipeline([
    inputStream,
    decipher
  ], { end: true });
}