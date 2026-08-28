import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';

const PERIODS = {
  weekly: { label: 'Weekly', days: 7 },
  monthly: { label: 'Monthly', days: 30 },
};

export default function TrendsChart() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    fetch('/api/logs', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setLogs(data); })
      .catch(console.error);

    const socket = io({ auth: { token } });
    socket.on('log_added', (newLog) => setLogs((prev) => [...prev, newLog]));
    socket.on('log_updated', (updatedLog) => setLogs((prev) => prev.map((log) => log.id === updatedLog.id ? updatedLog : log)));
    return () => socket.disconnect();
  }, [token, user.id]);

  const formattedData = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - (PERIODS[period].days - 1));

    return logs
      .map((log) => {
        const rawDate = log.log_date || log.created_at.slice(0, 10);
        const dateValue = new Date(`${rawDate}T12:00:00`);
        return {
          dateValue,
          date: dateValue.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          Mood: log.mood_rating,
          Anxiety: log.anxiety_level,
          Sleep: log.sleep_hours,
        };
      })
      .filter((log) => log.dateValue >= cutoff && log.dateValue <= today)
      .sort((a, b) => a.dateValue - b.dateValue);
  }, [logs, period]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Wellness Trends</h2>
          <p className="mt-1 text-xs text-slate-400">Real-time mood, anxiety and sleep trends</p>
        </div>
        <div className="inline-flex self-start rounded-lg bg-slate-100 p-1" aria-label="Trend period">
          {Object.entries(PERIODS).map(([value, config]) => (
            <button key={value} type="button" onClick={() => setPeriod(value)} aria-pressed={period === value} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${period === value ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {formattedData.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">No entries in the selected {PERIODS[period].label.toLowerCase()} period.</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Mood" stroke="#0ea5e9" strokeWidth={2} name="Mood Rating (1-5)" />
            <Line type="monotone" dataKey="Anxiety" stroke="#ef4444" strokeWidth={2} name="Anxiety Level (1-5)" />
            <Line type="monotone" dataKey="Sleep" stroke="#8b5cf6" strokeWidth={2} name="Sleep (Hours)" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
