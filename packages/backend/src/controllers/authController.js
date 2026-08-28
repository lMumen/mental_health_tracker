import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db.js';
import { getJwtSecret } from '../middleware/auth.js';

const googleClient = new OAuth2Client();

export async function googleLogin(req, res) {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Google credential is required' });

  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) throw new Error('GOOGLE_CLIENT_ID is required');
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();
    const db = await getDb();

    await db.run(
      `INSERT INTO users (id, email, name, picture)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, picture=excluded.picture`,
      [googleId, email, name, picture]
    );

    const token = jwt.sign({ id: googleId, email, name, picture }, getJwtSecret(), {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: googleId, email, name, picture } });
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}
