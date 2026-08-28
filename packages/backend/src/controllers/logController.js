import { getDb } from '../config/db.js';
import { logSchema } from '../schemas/logSchema.js';

export async function createLog(req, res) {
  const validation = logSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid inputs',
      details: validation.error.format(),
    });
  }

  const userId = req.user.id;
  const data = validation.data;

  try {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO daily_logs (
        user_id, mood_rating, anxiety_level, activity_type,
        activity_duration, sleep_hours, sleep_quality,
        social_engagements, stress_level, symptoms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.moodRating,
        data.anxietyLevel,
        data.activityType,
        data.activityDuration,
        data.sleepHours,
        data.sleepQuality,
        data.socialEngagements,
        data.stressLevel,
        data.symptoms,
      ]
    );

    const newLog = await db.get('SELECT * FROM daily_logs WHERE id = ?', [result.lastID]);

    // WebSocket broadcast to specific user room
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('log_added', newLog);
    }

    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error saving daily log:', error);
    res.status(500).json({ error: 'Failed to save daily log' });
  }
}

export async function getLogs(req, res) {
  try {
    const db = await getDb();
    const logs = await db.all(
      'SELECT * FROM daily_logs WHERE user_id = ? ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}
