/**
 * Check authentication status endpoint
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      cookies[parts[0]] = parts[1];
    });
  }

  const sessionToken = cookies.session;
  const sessionExpiry = cookies.sessionExpiry;

  if (!sessionToken || !sessionExpiry) {
    return res.status(401).json({ authenticated: false });
  }

  // Check if session has expired
  const expiryTime = parseInt(sessionExpiry, 10);
  if (Date.now() > expiryTime) {
    return res.status(401).json({ authenticated: false, expired: true });
  }

  return res.status(200).json({ 
    authenticated: true,
    expiresAt: expiryTime
  });
}

