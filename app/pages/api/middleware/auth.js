/**
 * Authentication middleware for API routes
 * Wraps API handlers to require authentication
 * 
 * Usage:
 * import { withAuth } from '../middleware/auth';
 * export default withAuth(handler);
 */

import { getDB } from '../db';

export function withAuth(handler) {
  return async (req, res) => {
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

    // Check if session exists and is valid
    if (!sessionToken || !sessionExpiry) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Check if session has expired
    const expiryTime = parseInt(sessionExpiry, 10);
    if (Date.now() > expiryTime) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Session expired'
      });
    }

    // Session is valid, proceed to handler
    return handler(req, res);
  };
}

/**
 * Enhanced version of createApiHandler that includes authentication
 */
export function createAuthenticatedApiHandler({ query, validate, transform }) {
  return withAuth(async function handler(req, res) {
    const client = await getDB();

    try {
      if (validate) {
        const validationError = await validate(req);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }
      }

      const { sql, params = [] } = await query(req);
      const result = await client.query(sql, params);
      const data = transform ? await transform(result, req) : result.rows;

      res.status(200).json(data);
    } catch (error) {
      console.error("Error executing query:", error);
      res.status(500).json({ 
        error: "Internal Server Error"
        // SECURITY: Don't expose error details to client
      });
    } finally {
      client.release();
    }
  });
}

