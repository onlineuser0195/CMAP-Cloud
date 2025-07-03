const VITE_API_URL = import.meta.env.VITE_API_URL;

export async function logEvent(userId, action, payload = {}) {
  try {
    await fetch(`${VITE_API_URL}/api/logs`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      // include credentials if you need cookies or JWT in headers
      credentials: 'include',
      body: JSON.stringify({ userId, action, payload })
    });
  } catch (err) {
    console.error('Failed to log event:', err);
  }
}