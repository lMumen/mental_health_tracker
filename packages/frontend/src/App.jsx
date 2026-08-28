import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import GoogleAuthButton from './components/Auth/GoogleAuthButton.jsx';
import DailyLogForm from './Form/DailyLogForm.jsx';
import TrendsChart from './Charts/TrendsChart.jsx';
import LogHistory from './History/LogHistory.jsx';
import SampleDataPrompt from './components/SampleDataPrompt.jsx';
import { Brain, Heart } from 'lucide-react';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Dashboard() {
  const { user, token, logout } = useAuth();
  const [view, setView] = useState('welcome');
  const [editingLog, setEditingLog] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLeavingWelcome, setIsLeavingWelcome] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  const handleStartCheckIn = () => {
    if (isLeavingWelcome) return;
    setIsLeavingWelcome(true);
    window.setTimeout(() => {
      setView('survey');
      setIsLeavingWelcome(false);
    }, 380);
  };

  return (
    <div className="min-h-screen bg-[#fbf8ec] text-[#173f3b]">
      <header className="relative z-20 border-b border-[#214d47] bg-[#285b54] px-4 py-4 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <button type="button" onClick={() => { setView('welcome'); setMenuOpen(false); }} className="min-w-0 text-left">
            <span className="block truncate text-base font-bold text-[#fff9e8] sm:text-lg">Mental Health Tracker</span>
            <span className="block truncate text-xs text-[#dce8de]">Welcome, {user.name}</span>
          </button>

          <nav className="hidden items-center gap-2 sm:flex" aria-label="Main navigation">
            <button type="button" onClick={() => setView('history')} className="rounded-lg px-3 py-2 text-sm font-medium text-[#f7f2df] hover:bg-[#356a62]">History</button>
            <button type="button" onClick={() => setView('trends')} className="rounded-lg px-3 py-2 text-sm font-medium text-[#f7f2df] hover:bg-[#356a62]">
              View trends
            </button>
            <button type="button" onClick={logout} className="rounded-lg border border-[#6d8d86] px-3 py-2 text-sm font-semibold text-[#f7f2df] hover:bg-[#356a62] hover:text-white">
              Sign out
            </button>
          </nav>

          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#6d8d86] text-[#fff9e8] transition hover:bg-[#356a62] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffcf62] sm:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden="true" className="flex w-5 flex-col gap-1.5">
              <span className={`h-0.5 w-full rounded bg-current transition ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`h-0.5 w-full rounded bg-current transition ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-full rounded bg-current transition ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </span>
          </button>
        </div>

        <nav
          id="mobile-navigation"
          className={`absolute left-0 right-0 top-full origin-top overflow-hidden border-t border-[#3d6d66] bg-[#285b54] px-4 shadow-lg transition-all duration-300 ease-out sm:hidden ${menuOpen ? 'visible max-h-72 translate-y-0 py-3 opacity-100' : 'invisible max-h-0 -translate-y-2 py-0 opacity-0 pointer-events-none'}`}
          aria-label="Mobile navigation"
          aria-hidden={!menuOpen}
        >
            <div className="mx-auto flex max-w-5xl flex-col gap-2">
              <button type="button" onClick={() => { setView('history'); setMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#fff9e8] hover:bg-[#356a62]">History</button>
              <button type="button" onClick={() => { setView('trends'); setMenuOpen(false); }} className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#fff9e8] hover:bg-[#356a62]">View trends</button>
              <button type="button" onClick={() => { setMenuOpen(false); logout(); }} className="rounded-xl border border-[#6d8d86] px-4 py-3 text-left text-sm font-semibold text-[#fff9e8] hover:bg-[#356a62]">Sign out</button>
            </div>
        </nav>
      </header>
      <SampleDataPrompt
        user={user}
        token={token}
        onApplied={() => setView('welcome')}
        onDismiss={() => setView('welcome')}
      />
      <main className={`relative mx-auto w-full max-w-5xl p-6 md:p-10 ${view === 'survey' ? 'survey-stage view-enter' : ''}`}>
        {view === 'welcome' && (
          <section className={`overflow-hidden rounded-3xl border border-[#dbe5d9] bg-[#fffdf7] shadow-sm ${isLeavingWelcome ? 'welcome-view-exit' : ''}`}>
            <div className="welcome-hero bg-gradient-to-br from-[#f2f0df] via-[#fffdf7] to-[#e5eee4] px-6 py-14 md:px-14 md:py-20">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#2d6b62]">Your daily wellbeing space</p>
              <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-[#173f3b] md:text-5xl">
                Take a quiet moment to check in with yourself
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#426b65]">
                Record how you are feeling today. Your answers will help you notice patterns over time and stay connected with your wellbeing.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button type="button" onClick={handleStartCheckIn} disabled={isLeavingWelcome} className="rounded-xl bg-[#285b54] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c4943] disabled:cursor-wait disabled:opacity-80">
                  Start daily check-in
                </button>
                <button type="button" onClick={() => setView('trends')} className="rounded-xl border border-[#d9d8c7] bg-[#fffdf7] px-6 py-3 text-sm font-semibold text-[#426b65] transition hover:bg-[#fbf8ec]">
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
              onLogSubmitted={() => {
                const wasEditing = Boolean(editingLog);
                setEditingLog(null);
                setView(wasEditing ? 'history' : 'trends');
                setShowCompletionMessage(true);
              }}
              onEditExisting={(id, formData) => { setEditingLog({ id, formData }); setView('survey'); }}
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
              <button type="button" onClick={() => setView('welcome')} className="text-sm font-medium text-[#648079] hover:text-[#173f3b]">← Back home</button>
              <button type="button" onClick={() => setView('survey')} className="rounded-lg bg-[#285b54] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c4943]">New check-in</button>
            </div>
            <TrendsChart />
          </div>
        )}
      </main>

      {showCompletionMessage && (
        <div className="completion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[rgba(23,63,59,0.35)] p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="completion-title" aria-describedby="completion-description" className="completion-dialog w-full max-w-md overflow-hidden rounded-3xl border border-[#d7e2d5] bg-[#fffdf7] p-7 text-center shadow-2xl sm:p-9">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e5eee4] text-[#285b54]">
              <Brain aria-hidden="true" size={38} strokeWidth={1.7} />
              <Heart aria-hidden="true" className="-ml-2 mt-8 fill-[#f4c96b] text-[#d79a20]" size={22} strokeWidth={2} />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#2d6b62]">A moment of care</p>
            <h2 id="completion-title" className="mt-2 text-2xl font-bold leading-tight text-[#173f3b]">Thank you for completing today’s check-in</h2>
            <p id="completion-description" className="mt-4 text-sm leading-6 text-[#426b65]">Taking time to notice how you feel is a meaningful act of self-care. Be gentle with yourself as you move through the rest of your day.</p>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => { setShowCompletionMessage(false); setView('welcome'); }} className="rounded-xl px-5 py-3 text-sm font-semibold text-[#426b65] transition hover:bg-[#edf3e8]">Return home</button>
              <button type="button" autoFocus onClick={() => { setShowCompletionMessage(false); setView('trends'); }} className="rounded-xl bg-[#285b54] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c4943]">View my wellbeing trends</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MainContent() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Dashboard />;
  return <main className="login-stage flex min-h-screen items-center justify-center p-6"><GoogleAuthButton /></main>;
}

export default function App() {
  if (!googleClientId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf8ec] p-6">
        <div className="max-w-lg rounded-2xl border border-amber-200 bg-[#fffdf7] p-6 text-left shadow-sm">
          <h1 className="text-xl font-bold text-[#173f3b]">Google login needs configuration</h1>
          <p className="mt-2 text-sm text-[#426b65]">Add VITE_GOOGLE_CLIENT_ID to packages/frontend/.env, then restart the development server.</p>
        </div>
      </main>
    );
  }
  return <GoogleOAuthProvider clientId={googleClientId}><AuthProvider><MainContent /></AuthProvider></GoogleOAuthProvider>;
}
