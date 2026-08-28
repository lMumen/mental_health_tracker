import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function createInitialFormData() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  return {
  logDate: localDate,
  moodRating: 3,
  anxietyLevel: 3,
  activityPerformed: true,
  activityType: 'Walking',
  activityDuration: 30,
  sleepHours: 7,
  sleepQuality: 'good',
  sleepDisturbancesPresent: false,
  sleepDisturbanceTypes: [],
  sleepDisturbanceNotes: '',
  socialEngagements: 3,
  stressLevel: 3,
  symptomsPresent: false,
  symptomTypes: [],
  symptomSeverity: 0,
  symptoms: '',
  };
}

export default function DailyLogForm({ onLogSubmitted, onCancel, initialData, logId }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => initialData ? { ...createInitialFormData(), ...initialData } : createInitialFormData());
  const [statusMessage, setStatusMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      if (name === 'symptomTypes' || name === 'sleepDisturbanceTypes') {
        const currentValues = prev[name] ?? [];
        const nextValues = checked
          ? [...currentValues, value]
          : currentValues.filter((item) => item !== value);
        return { ...prev, [name]: nextValues };
      }

      const nextValue = type === 'checkbox'
        ? checked
        : ['number', 'range'].includes(type) ? Number(value) : value;

      if (name === 'activityPerformed' && !checked) {
        return { ...prev, activityPerformed: false, activityType: '', activityDuration: 0 };
      }

      if (name === 'sleepDisturbancesPresent' && !checked) {
        return { ...prev, sleepDisturbancesPresent: false, sleepDisturbanceTypes: [], sleepDisturbanceNotes: '' };
      }

      if (name === 'symptomsPresent' && !checked) {
        return { ...prev, symptomsPresent: false, symptomTypes: [], symptomSeverity: 0, symptoms: '' };
      }

      return { ...prev, [name]: nextValue };
    });
  };

  const handleSubmit = async () => {
    if (step !== 3) return;
    setStatusMessage(null);

    try {
      const res = await fetch(logId ? `/api/logs/${logId}` : '/api/log', {
        method: logId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit log');
      }

      setStatusMessage({ type: 'success', text: logId ? 'Today’s log updated successfully!' : 'Daily log submitted successfully!' });
      setFormData(createInitialFormData());
      setStep(1);
      if (onLogSubmitted) onLogSubmitted();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">{logId ? 'Edit Today’s Check-in' : 'Daily Health Tracker'}</h2>
        <span className="text-xs text-slate-400 font-medium">Step {step} of 3</span>
      </div>

      {statusMessage && (
        <div
          className={`p-3 text-sm rounded-lg mb-4 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={(event) => event.preventDefault()}>
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label htmlFor="logDate" className="mb-1 block text-sm font-medium text-slate-700">Check-in date</label>
          <input id="logDate" type="date" name="logDate" value={formData.logDate} onChange={handleChange} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" />
        </div>
        <div>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-slate-700">1. Mood & Stress Levels</h3>
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Mood Rating (1: Very Sad, 5: Very Happy): {formData.moodRating}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  name="moodRating"
                  value={formData.moodRating}
                  onChange={handleChange}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Anxiety Level (1: Low, 5: High): {formData.anxietyLevel}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  name="anxietyLevel"
                  value={formData.anxietyLevel}
                  onChange={handleChange}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Stress Level (1: Low, 5: High): {formData.stressLevel}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  name="stressLevel"
                  value={formData.stressLevel}
                  onChange={handleChange}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-slate-700">2. Sleep & Social Engagement</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Sleep Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    name="sleepHours"
                    value={formData.sleepHours}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Sleep Quality</label>
                  <select
                    name="sleepQuality"
                    value={formData.sleepQuality}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 text-sm text-slate-800"
                  >
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>
              </div>

              <fieldset className="rounded-xl border border-slate-200 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-700">Sleep disturbances</legend>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" name="sleepDisturbancesPresent" checked={formData.sleepDisturbancesPresent} onChange={handleChange} className="h-4 w-4 rounded accent-sky-600" />
                  I experienced sleep disturbances
                </label>

                <div className={`mt-4 space-y-3 ${!formData.sleepDisturbancesPresent ? 'opacity-50' : ''}`}>
                  <p className="text-sm text-slate-600">What affected your sleep?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ['difficulty_falling_asleep', 'Difficulty falling asleep'],
                      ['frequent_awakenings', 'Frequent awakenings'],
                      ['early_waking', 'Waking too early'],
                      ['nightmares', 'Nightmares'],
                      ['restless_sleep', 'Restless sleep'],
                      ['other', 'Other disturbance'],
                    ].map(([value, label]) => (
                      <label key={value} className="flex items-start gap-2 text-sm text-slate-700">
                        <input type="checkbox" name="sleepDisturbanceTypes" value={value} checked={(formData.sleepDisturbanceTypes ?? []).includes(value)} onChange={handleChange} disabled={!formData.sleepDisturbancesPresent} className="mt-0.5 h-4 w-4 rounded accent-sky-600" />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="sleepDisturbanceNotes" className="mb-1 block text-sm text-slate-600">Additional details (optional)</label>
                    <textarea id="sleepDisturbanceNotes" name="sleepDisturbanceNotes" rows="2" value={formData.sleepDisturbanceNotes} onChange={handleChange} disabled={!formData.sleepDisturbancesPresent} placeholder="Describe anything else that disrupted your sleep" className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800" />
                  </div>
                </div>
              </fieldset>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Social Engagement Frequency (1: Low, 5: High): {formData.socialEngagements}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  name="socialEngagements"
                  value={formData.socialEngagements}
                  onChange={handleChange}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-md font-semibold text-slate-700">3. Physical Activity & Symptoms</h3>

              <fieldset className="rounded-xl border border-slate-200 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-700">Physical activity</legend>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" name="activityPerformed" checked={formData.activityPerformed} onChange={handleChange} className="h-4 w-4 rounded accent-sky-600" />
                  I did physical activity on this date
                </label>

                <div className={`mt-4 grid gap-4 sm:grid-cols-2 ${!formData.activityPerformed ? 'opacity-50' : ''}`}>
                    <div>
                      <label htmlFor="activityType" className="mb-1 block text-sm text-slate-600">What type of activity?</label>
                      <input id="activityType" type="text" name="activityType" value={formData.activityType} onChange={handleChange} required={formData.activityPerformed} disabled={!formData.activityPerformed} placeholder="Walking, yoga, running..." className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800" />
                    </div>
                    <div>
                      <label htmlFor="activityDuration" className="mb-1 block text-sm text-slate-600">How long? (minutes)</label>
                      <input id="activityDuration" type="number" min="1" name="activityDuration" value={formData.activityDuration} onChange={handleChange} required={formData.activityPerformed} disabled={!formData.activityPerformed} className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800" />
                    </div>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-slate-200 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-700">Depression or anxiety symptoms</legend>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" name="symptomsPresent" checked={formData.symptomsPresent} onChange={handleChange} className="h-4 w-4 rounded accent-sky-600" />
                  I experienced depression or anxiety symptoms
                </label>

                <div className={`mt-4 space-y-4 ${!formData.symptomsPresent ? 'opacity-50' : ''}`}>
                    <div>
                      <p className="mb-2 text-sm text-slate-600">Which symptoms were present?</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          ['low_mood', 'Low mood or sadness'],
                          ['loss_of_interest', 'Loss of interest'],
                          ['excessive_worry', 'Excessive worry'],
                          ['panic', 'Panic or intense fear'],
                          ['fatigue', 'Fatigue or low energy'],
                          ['sleep_changes', 'Changes in sleep'],
                        ].map(([value, label]) => (
                          <label key={value} className="flex items-start gap-2 text-sm text-slate-700">
                            <input type="checkbox" name="symptomTypes" value={value} checked={(formData.symptomTypes ?? []).includes(value)} onChange={handleChange} disabled={!formData.symptomsPresent} className="mt-0.5 h-4 w-4 rounded accent-sky-600" />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-slate-600">Overall symptom severity (1: Mild, 5: Severe): {formData.symptomSeverity}</label>
                      <input type="range" min="1" max="5" name="symptomSeverity" value={formData.symptomSeverity || 1} onChange={handleChange} disabled={!formData.symptomsPresent} className="w-full accent-sky-500" />
                    </div>

                    <div>
                      <label htmlFor="symptoms" className="mb-1 block text-sm text-slate-600">Additional notes (optional)</label>
                      <textarea id="symptoms" name="symptoms" rows="3" value={formData.symptoms} onChange={handleChange} disabled={!formData.symptomsPresent} placeholder="Anything else you would like to record?" className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800" />
                    </div>
                </div>
              </fieldset>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Previous
            </button>
          ) : onCancel ? (
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800">Cancel</button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-4 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              {logId ? 'Save Changes' : 'Submit Daily Log'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}