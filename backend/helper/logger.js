// export const logError = (functionName, error) => {
//     const errorInfo = {
//         function_name: functionName,
//         error_message: error.message,
//         stack_trace: error.stack,
//     };

//     console.error('Error Occurred:', JSON.stringify(errorInfo, null, 3));
// };
// /config/logger.js
// /config/logger.js
import fs from 'fs';
import path from 'path';
import { createStream } from 'rotating-file-stream';  // <-- named import
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ensure logs directory exists
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// ——— ACCESS LOG STREAM ———
export const accessLogStream = createStream(
  (time) => {
    if (!time) return 'access.log';
    const date = time.toISOString().slice(0, 10);
    return `${date}.log`;
  },
  {
    interval: '1d',       // rotate daily
    path:     logDirectory,
    maxFiles: 30          // keep 30 days
  }
);

// ——— ERROR LOG STREAM ———
export const errorLogStream = createStream(
  (time) => {
    if (!time) return 'error.log';
    const date = time.toISOString().slice(0, 10);
    return `error-${date}.log`;
  },
  {
    interval: '1d',
    path:     logDirectory,
    maxFiles: 30
  }
);

/**
 * Log an error to both the rotating error log and console.
 */
export function logError(functionName, error) {
  const entry = {
    timestamp:     new Date().toISOString(),
    function_name: functionName,
    message:       error.message,
    stack:         error.stack
  };
  const line = JSON.stringify(entry) + '\n';
  errorLogStream.write(line);
  console.error('Error Occurred:', line.trim());
}

export default {
  accessLogStream,
  errorLogStream,
  logError
};