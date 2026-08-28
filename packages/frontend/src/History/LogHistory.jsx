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
    <section className="text-left">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <button type="button" onClick={onBack} className="mb-2 block text-sm font-medium text-[#648079] hover:text-[#173f3b]">← Back home</button>
          <h1 className="text-2xl font-bold text-[#173f3b]">Check-in history</h1>
          <p className="mt-1 text-sm text-[#648079]">Review previous entries and edit today’s check-in.</p>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {!error && logs.length === 0 && <div className="rounded-2xl border border-[#d9d8c7] bg-[#fffdf7] p-10 text-center text-sm text-[#648079]">No check-ins recorded yet.</div>}

      <div className="space-y-4">
        {logs.map((log) => {
          const symptoms = parseJson(log.symptoms, { present: false, types: [], severity: 0 });
          return (
            <article key={log.id} className="rounded-2xl border border-[#d9d8c7] bg-[#fffdf7] p-5 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1f5a52]">{new Date(`${log.log_date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#426b65]">
                    <span className="rounded-full bg-[#e9f0e8] px-3 py-1">Mood: {log.mood_rating}/5</span>
                    <span className="rounded-full bg-rose-50 px-3 py-1">Anxiety: {log.anxiety_level}/5</span>
                    <span className="rounded-full bg-violet-50 px-3 py-1">Sleep: {log.sleep_hours}h</span>
                    <span className="rounded-full bg-[#fff2cf] px-3 py-1">Stress: {log.stress_level}/5</span>
                  </div>
                </div>

                <div className="border-t border-[#e8e5d5] pt-4 text-sm text-[#648079] lg:border-l lg:border-t-0 lg:py-1 lg:pl-5 lg:text-right">
                  <p><span className="font-semibold text-[#426b65]">Activity:</span> {log.activity_type === 'None' ? 'None recorded' : `${log.activity_type} · ${log.activity_duration} min`}</p>
                  <p className="mt-1"><span className="font-semibold text-[#426b65]">Symptoms:</span> {symptoms.present ? `severity ${symptoms.severity}/5` : 'None recorded'}</p>
                </div>

                {log.log_date === today && (
                  <button type="button" onClick={() => onEdit(log.id, toFormData(log))} className="w-full shrink-0 rounded-lg border border-[#bfd2c8] px-4 py-2 text-sm font-semibold text-[#1f5a52] hover:bg-[#e9f0e8] lg:w-auto">Edit today’s log</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
