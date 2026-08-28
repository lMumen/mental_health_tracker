import jwt from 'jsonwebtoken';

export function getJwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  return process.env.JWT_SECRET;
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, getJwtSecret(), (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}