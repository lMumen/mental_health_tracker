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
    <section className="rounded-2xl border border-[#e8e5d5] bg-[#fffdf7] p-6 shadow-sm">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-bold text-[#173f3b]">Wellness Trends</h2>
          <p className="mt-1 text-xs text-[#81958f]">Real-time mood, anxiety and sleep trends</p>
        </div>
        <div className="inline-flex self-start rounded-lg bg-[#eef0e2] p-1" aria-label="Trend period">
          {Object.entries(PERIODS).map(([value, config]) => (
            <button key={value} type="button" onClick={() => setPeriod(value)} aria-pressed={period === value} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${period === value ? 'bg-[#fffdf7] text-[#1f5a52] shadow-sm' : 'text-[#648079] hover:text-[#285b54]'}`}>
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {formattedData.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#81958f]">No entries in the selected {PERIODS[period].label.toLowerCase()} period.</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e4d3" />
            <XAxis dataKey="date" stroke="#78908a" fontSize={12} />
            <YAxis stroke="#78908a" fontSize={12} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Mood" stroke="#2d6b62" strokeWidth={2} name="Mood Rating (1-5)" />
            <Line type="monotone" dataKey="Anxiety" stroke="#d79032" strokeWidth={2} name="Anxiety Level (1-5)" />
            <Line type="monotone" dataKey="Sleep" stroke="#7d9170" strokeWidth={2} name="Sleep (Hours)" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
