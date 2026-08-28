import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import GoogleAuthButton from './components/Auth/GoogleAuthButton.jsx';
import DailyLogForm from './Form/DailyLogForm.jsx';
import TrendsChart from './Charts/TrendsChart.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-slate-800">LunaJoy Tracker</h1>
          <p className="text-xs text-slate-500">Welcome, {user.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 border px-3 py-1.5 rounded-lg"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <DailyLogForm />
        <TrendsChart />
      </main>
    </div>
  );
}

function MainContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      {!isAuthenticated ? <GoogleAuthButton /> : <Dashboard />}
    </div>
  );
}

export default function App() {
  if (!googleClientId) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-6 text-left shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">Google login needs configuration</h1>
          <p className="mt-2 text-sm text-slate-600">
            Add VITE_GOOGLE_CLIENT_ID to packages/frontend/.env, then restart the development server.
          </p>
        </div>
      </main>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider><MainContent /></AuthProvider>
    </GoogleOAuthProvider>
  );
}
