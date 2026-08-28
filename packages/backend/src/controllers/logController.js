import { getDb } from '../config/db.js';
import { logSchema } from '../schemas/logSchema.js';
import { SAMPLE_LOG_DATASET } from '../data/sampleLogDataset.js';

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


function dateFromDaysAgo(today, daysAgo) {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export async function applySampleData(req, res) {
  const timeZone = process.env.APP_TIME_ZONE || 'America/Santiago';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  const db = await getDb();
  let inserted = 0;

  try {
    await db.exec('BEGIN');
    for (const sample of SAMPLE_LOG_DATASET) {
      const logDate = dateFromDaysAgo(today, sample.daysAgo);
      const result = await db.run(
        `INSERT OR IGNORE INTO daily_logs (
          user_id, mood_rating, anxiety_level, activity_type, activity_duration,
          sleep_hours, sleep_quality, sleep_disturbances, social_engagements,
          stress_level, symptoms, log_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          sample.moodRating,
          sample.anxietyLevel,
          sample.activityType,
          sample.activityDuration,
          sample.sleepHours,
          sample.sleepQuality,
          JSON.stringify(sample.sleepDisturbances),
          sample.socialEngagements,
          sample.stressLevel,
          JSON.stringify(sample.symptoms),
          logDate,
          `${logDate} 20:00:00`,
        ],
      );
      inserted += result.changes;
    }
    await db.exec('COMMIT');

    const range = {
      from: dateFromDaysAgo(today, 90),
      to: dateFromDaysAgo(today, 1),
    };
    req.app.get('io')?.to(req.user.id).emit('sample_data_added', { inserted, range });
    res.status(201).json({
      message: inserted
        ? 'Sample wellbeing data was added successfully.'
        : 'The sample dates are already present in your history.',
      inserted,
      total: SAMPLE_LOG_DATASET.length,
      range,
    });
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Error applying sample data:', error);
    res.status(500).json({ error: 'Could not add the sample wellbeing data.' });
  }
}

export async function getLogs(req, res) {
  try {
    const db = await getDb();
    const requestedPage = Number.parseInt(req.query.page, 10);

    if (Number.isInteger(requestedPage) && requestedPage > 0) {
      const requestedLimit = Number.parseInt(req.query.limit, 10);
      const limit = Number.isInteger(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 50)
        : 10;
      const offset = (requestedPage - 1) * limit;
      const { total } = await db.get(
        'SELECT COUNT(*) AS total FROM daily_logs WHERE user_id = ?',
        [req.user.id],
      );
      const logs = await db.all(
        `SELECT * FROM daily_logs
         WHERE user_id = ?
         ORDER BY log_date DESC, created_at DESC
         LIMIT ? OFFSET ?`,
        [req.user.id, limit, offset],
      );

      return res.json({
        logs,
        pagination: {
          page: requestedPage,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    }

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
