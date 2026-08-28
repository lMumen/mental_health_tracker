import { useEffect, useState } from 'react';

export default function SampleDataPrompt({ user, token, onApplied, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const dismissalKey = 'sample-data-prompt-dismissed:' + user.id;

  useEffect(() => {
    if (localStorage.getItem(dismissalKey)) return;

    fetch('/api/logs', { headers: { Authorization: 'Bearer ' + token } })
      .then(async (response) => {
        const logs = await response.json();
        if (!response.ok) throw new Error(logs.error || 'Could not check your history.');
        const hasAnyData = Array.isArray(logs) && logs.length > 0;
        if (!hasAnyData) setVisible(true);
      })
      .catch(() => {});
  }, [dismissalKey, token]);

  const dismiss = () => {
    localStorage.setItem(dismissalKey, 'true');
    setVisible(false);
    setError('');
    onDismiss?.();
  };

  const applySampleData = async () => {
    setApplying(true);
    setError('');
    try {
      const response = await fetch('/api/logs/sample-data', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not add the sample data.');
      localStorage.setItem(dismissalKey, 'true');
      setVisible(false);
      onApplied?.(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setApplying(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(23,63,59,0.28)] p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="sample-data-title" className="duplicate-notice w-full max-w-lg rounded-3xl border border-[#e8c86a] bg-[#fff8df] p-6 text-left shadow-2xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a741c]">Explore at your own pace</p>
        <h2 id="sample-data-title" className="mt-2 text-2xl font-bold text-[#173f3b]">Would you like to explore some sample insights?</h2>
        <p className="mt-3 text-sm leading-6 text-[#426b65]">
          We can add the same prepared 90-day wellbeing journey used for every test account. It shows gradual improvements in mood, sleep, social connection, anxiety, and physical activity.
        </p>
        <p className="mt-3 rounded-xl bg-[#f5edce] p-3 text-sm text-[#5f582f]">
          The sample ends yesterday, so today remains open for your own check-in.
        </p>
        {error && <p role="alert" className="mt-3 text-sm font-medium text-[#7a5c16]">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={dismiss} disabled={applying} className="rounded-xl px-4 py-3 text-sm font-semibold text-[#5f6f69] hover:bg-[#eee8cf] disabled:opacity-60">
            Not right now
          </button>
          <button type="button" onClick={applySampleData} disabled={applying} className="rounded-xl bg-[#285b54] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1c4943] disabled:cursor-wait disabled:opacity-60">
            {applying ? 'Adding sample data...' : 'Add sample data'}
          </button>
        </div>
      </section>
    </div>
  );
}
