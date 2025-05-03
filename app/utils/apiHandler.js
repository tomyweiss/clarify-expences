export function createApiHandler({ validate, query, transform }) {
  return async (req, res) => {
    try {
      // Validate request
      const validationError = validate?.(req);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      // Execute query
      const queryResult = await query?.(req);
      if (!queryResult) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      // Ensure queryResult has rows property
      if (queryResult.rows === undefined) {
        return res.status(400).json({ error: 'Invalid query result format' });
      }

      // Transform result
      let transformedResult;
      if (transform) {
        transformedResult = transform(queryResult);
      } else {
        // Default transformation if none provided
        transformedResult = Array.isArray(queryResult.rows) ? queryResult.rows : [queryResult.rows];
      }

      // Send response
      return res.status(200).json(transformedResult);
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
} 