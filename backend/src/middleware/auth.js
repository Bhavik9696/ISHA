const jwt = require('jsonwebtoken');

/**
 * Express middleware: validates the Authorization: Bearer <token> header.
 * Attaches req.admin = true if valid.
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: no token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.admin) throw new Error('Not an admin token');
    req.admin = true;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}

module.exports = { requireAdmin };

