/**
 * Logout endpoint - clears session cookies
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear session cookies
  res.setHeader('Set-Cookie', [
    'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'sessionExpiry=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
  ]);

  return res.status(200).json({ 
    success: true,
    message: 'Logged out successfully'
  });
}

