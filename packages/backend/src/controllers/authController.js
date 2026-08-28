import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db.js';
import { JWT_SECRET } from '../middleware/auth.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function googleLogin(req, res) {
  const { credential } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();
    const db = await getDb();

    await db.run(
      `INSERT INTO users (id, email, name, picture)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, picture=excluded.picture`,
      [googleId, email, name, picture]
    );

    const token = jwt.sign({ id: googleId, email, name, picture }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: googleId, email, name, picture } });
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}
