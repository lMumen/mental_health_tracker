import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function parseJson(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function toFormData(log) {
  const symptoms = parseJson(log.symptoms, { present: false, types: [], severity: 0, notes: log.symptoms || '' });
  const sleep = parseJson(log.sleep_disturbances, { present: false, types: [], notes: '' });
  return {
    logDate: log.log_date,
    moodRating: log.mood_rating,
    anxietyLevel: log.anxiety_level,
    stressLevel: log.stress_level,
    sleepHours: log.sleep_hours,
    sleepQuality: log.sleep_quality,
    sleepDisturbancesPresent: Boolean(sleep.present),
    sleepDisturbanceTypes: sleep.types ?? [],
    sleepDisturbanceNotes: sleep.notes ?? '',
    socialEngagements: log.social_engagements,
    activityPerformed: log.activity_type !== 'None' && log.activity_duration > 0,
    activityType: log.activity_type === 'None' ? '' : log.activity_type,
    activityDuration: log.activity_duration,
    symptomsPresent: Boolean(symptoms.present),
    symptomTypes: symptoms.types ?? [],
    symptomSeverity: symptoms.severity ?? 0,
    symptoms: symptoms.notes ?? '',
  };
}

export default function LogHistory({ onBack, onEdit }) {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/logs', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load history');
        setLogs(Array.isArray(data) ? [...data].reverse() : []);
      })
      .catch((requestError) => setError(requestError.message));
  }, [token]);

  const today = localToday();

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <button type="button" onClick={onBack} className="mb-2 text-sm font-medium text-slate-500 hover:text-slate-800">← Back home</button>
          <h1 className="text-2xl font-bold text-slate-800">Check-in history</h1>
          <p className="mt-1 text-sm text-slate-500">Review previous entries and edit today’s check-in.</p>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {!error && logs.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No check-ins recorded yet.</div>}

      <div className="space-y-4">
        {logs.map((log) => {
          const symptoms = parseJson(log.symptoms, { present: false, types: [], severity: 0 });
          return (
            <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-sky-700">{new Date(`${log.log_date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-sky-50 px-3 py-1">Mood: {log.mood_rating}/5</span>
                    <span className="rounded-full bg-rose-50 px-3 py-1">Anxiety: {log.anxiety_level}/5</span>
                    <span className="rounded-full bg-violet-50 px-3 py-1">Sleep: {log.sleep_hours}h</span>
                    <span className="rounded-full bg-amber-50 px-3 py-1">Stress: {log.stress_level}/5</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">Activity: {log.activity_type === 'None' ? 'None recorded' : `${log.activity_type} · ${log.activity_duration} min`}</p>
                  {symptoms.present && <p className="mt-1 text-sm text-slate-500">Symptoms: severity {symptoms.severity}/5</p>}
                </div>
                {log.log_date === today && (
                  <button type="button" onClick={() => onEdit(log.id, toFormData(log))} className="shrink-0 rounded-lg border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50">Edit today’s log</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
