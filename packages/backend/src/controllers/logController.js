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
    const existingLog = await db.get(
      'SELECT id FROM daily_logs WHERE user_id = ? AND log_date = ?',
      [userId, data.logDate],
    );
    if (existingLog) {
      return res.status(409).json({
        error: 'A check-in already exists for this date. Open History to edit today’s log.',
        existingLogId: existingLog.id,
      });
    }

    const result = await db.run(
      `INSERT INTO daily_logs (
        user_id, mood_rating, anxiety_level, activity_type,
        activity_duration, sleep_hours, sleep_quality, sleep_disturbances,
        social_engagements, stress_level, symptoms, log_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.moodRating,
        data.anxietyLevel,
        data.activityPerformed ? data.activityType : 'None',
        data.activityPerformed ? data.activityDuration : 0,
        data.sleepHours,
        data.sleepQuality,
        JSON.stringify({
          present: data.sleepDisturbancesPresent,
          types: data.sleepDisturbanceTypes,
          notes: data.sleepDisturbanceNotes,
        }),
        data.socialEngagements,
        data.stressLevel,
        JSON.stringify({
          present: data.symptomsPresent,
          types: data.symptomTypes,
          severity: data.symptomsPresent ? data.symptomSeverity : 0,
          notes: data.symptoms,
        }),
        data.logDate,
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
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'A check-in already exists for this date.' });
    }
    console.error('Error saving daily log:', error);
    res.status(500).json({ error: 'Failed to save daily log' });
  }
}

export async function updateLog(req, res) {
  const validation = logSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid inputs', details: validation.error.format() });
  }

  const db = await getDb();
  const existing = await db.get('SELECT * FROM daily_logs WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Log not found' });

  const timeZone = process.env.APP_TIME_ZONE || 'America/Santiago';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  if (existing.log_date !== today) return res.status(403).json({ error: 'Only today’s log can be edited' });

  const data = validation.data;
  if (data.logDate !== today) return res.status(400).json({ error: 'Today’s log date cannot be changed' });

  await db.run(
    `UPDATE daily_logs SET
      mood_rating = ?, anxiety_level = ?, activity_type = ?, activity_duration = ?,
      sleep_hours = ?, sleep_quality = ?, sleep_disturbances = ?, social_engagements = ?,
      stress_level = ?, symptoms = ?, log_date = ?
     WHERE id = ? AND user_id = ?`,
    [
      data.moodRating,
      data.anxietyLevel,
      data.activityPerformed ? data.activityType : 'None',
      data.activityPerformed ? data.activityDuration : 0,
      data.sleepHours,
      data.sleepQuality,
      JSON.stringify({ present: data.sleepDisturbancesPresent, types: data.sleepDisturbanceTypes, notes: data.sleepDisturbanceNotes }),
      data.socialEngagements,
      data.stressLevel,
      JSON.stringify({ present: data.symptomsPresent, types: data.symptomTypes, severity: data.symptomsPresent ? data.symptomSeverity : 0, notes: data.symptoms }),
      data.logDate,
      req.params.id,
      req.user.id,
    ],
  );

  const updatedLog = await db.get('SELECT * FROM daily_logs WHERE id = ?', [req.params.id]);
  req.app.get('io')?.to(req.user.id).emit('log_updated', updatedLog);
  res.json(updatedLog);
}

export async function getLogs(req, res) {
  try {
    const db = await getDb();
    const logs = await db.all(
      'SELECT * FROM daily_logs WHERE user_id = ? ORDER BY log_date ASC, created_at ASC',
      [req.user.id]
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}
