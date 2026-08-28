import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';

export default function TrendsChart() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // 1. Fetch historical logs
    fetch('/api/logs', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(console.error);

    // 2. Connect to WebSockets with private room
    const socket = io({
      auth: { token },
    });

    socket.on('log_added', (newLog) => {
      setLogs((prev) => [...prev, newLog]);
    });

    return () => socket.disconnect();
  }, [token, user.id]);

  const formattedData = logs.map((log) => ({
    date: new Date(log.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    Mood: log.mood_rating,
    Anxiety: log.anxiety_level,
    Sleep: log.sleep_hours,
  }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Wellness Trends</h2>
      <p className="text-xs text-slate-400 mb-6">Real-time updates as logs are submitted</p>

      {formattedData.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          No logs available yet. Submit your first daily entry above.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="Mood"
              stroke="#0ea5e9"
              strokeWidth={2}
              name="Mood Rating (1-5)"
            />
            <Line
              type="monotone"
              dataKey="Anxiety"
              stroke="#ef4444"
              strokeWidth={2}
              name="Anxiety Level (1-5)"
            />
            <Line
              type="monotone"
              dataKey="Sleep"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Sleep (Hours)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
