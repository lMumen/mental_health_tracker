import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext.jsx';

export default function GoogleAuthButton() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  async function handleSuccess(response) {
    setError('');
    try {
      const result = await fetch('/api/auth/google', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || 'Authentication failed');
      login(data.user, data.token);
    } catch (requestError) { setError(requestError.message); }
  }
  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-800">Mental Health Tracker</h1>
      <p className="mb-6 mt-2 text-sm text-slate-500">Record your daily wellbeing and follow your progress over time.</p>
      <div className="flex justify-center">
        <GoogleLogin onSuccess={handleSuccess} onError={() => setError('Google login could not be completed')} useOneTap />
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}
    </section>
  );
}
