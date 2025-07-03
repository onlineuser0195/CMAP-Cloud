// Alternative approach: Manual token validation without passport-azure-ad as that was having issues
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import dotenv from "dotenv";
dotenv.config();  

export const debugToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  // Decode without verification to see the payload
  const decoded = jwt.decode(token, { complete: true });
  
  console.log('=== TOKEN DEBUG INFO ===');
  console.log('Token Header:', JSON.stringify(decoded.header, null, 2));
  console.log('Token Payload:', JSON.stringify(decoded.payload, null, 2));
  console.log('Expected Audience:', `${process.env.CLIENT_ID}`);
  console.log('Actual Audience:', decoded.payload.aud);
  console.log('Issuer:', decoded.payload.iss);
  console.log('Scopes:', decoded.payload.scp);
  console.log('========================');

  // Continue to next middleware
  next();
};

// JWKS client to get public keys for token verification
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.TENANT_ID}/discovery/v2.0/keys`
});

// Function to get the signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Error getting signing key:', err);
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Middleware to verify Microsoft token
export const verifyMicrosoftToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = jwt.decode(token);
  // console.log('Token audience:', decoded.aud);
  // console.log('Token issuer:', decoded.iss);

  // const possibleAudiences = [
  //   '5a6ecf2d-6620-4611-92f8-65e3ed406a8e', // Your client ID
  //   'api://5a6ecf2d-6620-4611-92f8-65e3ed406a8e', // Your API URI
  //   `api://5a6ecf2d-6620-4611-92f8-65e3ed406a8e/access_as_user` // Full scope
  // ];

  // const possibleIssuers = [
  //   'https://login.microsoftonline.com/2e05a30e-e068-4b31-bc9a-a9440067a42f/v2.0',
  //   'https://sts.windows.net/2e05a30e-e068-4b31-bc9a-a9440067a42f/'
  // ];
  
  // Verify the token
  jwt.verify(token, getKey, {
    audience: `api://${process.env.AZURE_CLIENT_ID}`, // Accept any of these audiences
    issuer: `https://sts.windows.net/${process.env.TENANT_ID}/`, // Accept any of these issuers
    algorithms: ['RS256'],
    clockTolerance: 60 // Allow 60 seconds clock skew
  }, (err, verifiedToken) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      console.error('Expected audiences:', `api://${process.env.AZURE_CLIENT_ID}`);
      console.error('Actual audience:', decoded.aud);
      return res.status(401).json({ 
        error: 'Invalid token',
        details: err.message,
        expectedAudience: `api://${process.env.AZURE_CLIENT_ID}`,
        actualAudience: decoded.aud
      });
    }

    // console.log('Token successfully verified!');
    req.user = verifiedToken;
    next();
  });
  
};