import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import GoogleAuthButton from './components/Auth/GoogleAuthButton.jsx';
import DailyLogForm from './Form/DailyLogForm.jsx';
import TrendsChart from './Charts/TrendsChart.jsx';
import LogHistory from './History/LogHistory.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Dashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('welcome');
  const [editingLog, setEditingLog] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <button type="button" onClick={() => setView('welcome')} className="text-left">
            <span className="block text-lg font-bold text-slate-800">LunaJoy Tracker</span>
            <span className="block text-xs text-slate-500">Welcome, {user.name}</span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setView('history')} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">History</button>
            <button type="button" onClick={() => setView('trends')} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              View trends
            </button>
            <button type="button" onClick={logout} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6 md:p-10">
        {view === 'welcome' && (
          <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-6 py-14 text-center md:px-14 md:py-20">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">Your daily wellbeing space</p>
              <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-slate-800 md:text-5xl">
                Take a quiet moment to check in with yourself
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
                Record how you are feeling today. Your answers help you notice patterns over time and stay connected with your wellbeing.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button type="button" onClick={() => setView('survey')} className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
                  Start daily check-in
                </button>
                <button type="button" onClick={() => setView('trends')} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  See my progress
                </button>
              </div>
            </div>
          </section>
        )}

        {view === 'survey' && (
          <DailyLogForm
            key={editingLog?.id ?? 'new-log'}
            logId={editingLog?.id}
            initialData={editingLog?.formData}
            onCancel={() => { setEditingLog(null); setView(editingLog ? 'history' : 'welcome'); }}
            onLogSubmitted={() => { const wasEditing = Boolean(editingLog); setEditingLog(null); setView(wasEditing ? 'history' : 'trends'); }}
          />
        )}

        {view === 'history' && (
          <LogHistory
            onBack={() => setView('welcome')}
            onEdit={(id, formData) => { setEditingLog({ id, formData }); setView('survey'); }}
          />
        )}

        {view === 'trends' && (
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <button type="button" onClick={() => setView('welcome')} className="text-sm font-medium text-slate-500 hover:text-slate-800">← Back home</button>
              <button type="button" onClick={() => setView('survey')} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">New check-in</button>
            </div>
            <TrendsChart />
          </div>
        )}
      </main>
    </div>
  );
}

function MainContent() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Dashboard />;
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><GoogleAuthButton /></div>;
}

export default function App() {
  if (!googleClientId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-6 text-left shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Google login needs configuration</h1>
          <p className="mt-2 text-sm text-slate-600">Add VITE_GOOGLE_CLIENT_ID to packages/frontend/.env, then restart the development server.</p>
        </div>
      </main>
    );
  }
  return <GoogleOAuthProvider clientId={googleClientId}><AuthProvider><MainContent /></AuthProvider></GoogleOAuthProvider>;
}
