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

function toEditableFormData(log) {
  const parseJson = (value, fallback) => {
    try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  };
  const symptoms = parseJson(log.symptoms, { present: false, types: [], severity: 0, notes: '' });
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

function RatingButtons({ label, name, value, onSelect, disabled = false }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map((rating) => {
        const selected = Number(value) === rating;
        return (
          <button
            key={rating}
            type="button"
            name={name}
            aria-label={`${label}: ${rating} of 5`}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onSelect(rating)}
            className={`flex min-h-11 items-center justify-center rounded-xl border text-sm font-bold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d79a20] disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? 'border-[#d79a20] bg-[#ffdf91] text-[#173f3b] shadow-sm'
                : 'border-[#cbd4c8] bg-[rgba(255,253,247,0.72)] text-[#426b65] hover:border-[#8fac9f] hover:bg-[#edf3e8]'
            }`}
          >
            {rating}
          </button>
        );
      })}
    </div>
  );
}

export default function DailyLogForm({ onLogSubmitted, onCancel, onEditExisting, initialData, logId }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => initialData ? { ...createInitialFormData(), ...initialData } : createInitialFormData());
  const [statusMessage, setStatusMessage] = useState(null);
  const handleRatingChange = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const [duplicateNotice, setDuplicateNotice] = useState(null);
  const [checkingDate, setCheckingDate] = useState(false);
  const [isStepLeaving, setIsStepLeaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'logDate') {
      setDuplicateNotice(null);
      setStatusMessage(null);
    }

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
      if (name === 'symptomsPresent' && checked) {
        return { ...prev, symptomsPresent: true, symptomSeverity: prev.symptomSeverity || 1 };
      }

        return { ...prev, sleepDisturbancesPresent: false, sleepDisturbanceTypes: [], sleepDisturbanceNotes: '' };
      }

      if (name === 'symptomsPresent' && !checked) {
        return { ...prev, symptomsPresent: false, symptomTypes: [], symptomSeverity: 0, symptoms: '' };
      }

      return { ...prev, [name]: nextValue };
    });
  };

  const transitionToStep = (nextStep) => {
    if (isStepLeaving || nextStep === step) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(nextStep);
      return;
    }

    setIsStepLeaving(true);
    window.setTimeout(() => {
      setStep(nextStep);
      setIsStepLeaving(false);
    }, 190);
  };

  const handleNext = async () => {
    if (step !== 1 || logId) {
      transitionToStep(step + 1);
      return;
    }

    if (!formData.logDate) {
      setDuplicateNotice({ type: 'past', text: 'Selecciona una fecha antes de continuar.' });
      return;
    }

    setCheckingDate(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const logs = await response.json();
      if (!response.ok) throw new Error(logs.error || 'Could not verify the selected date.');

      const existingLog = Array.isArray(logs)
        ? logs.find((log) => log.log_date === formData.logDate)
        : null;

      if (existingLog) {
        const today = createInitialFormData().logDate;
        setDuplicateNotice(existingLog.log_date === today
          ? { type: 'today', log: existingLog, text: 'You already have an entry for today. Would you like to update it?' }
          : { type: 'past', text: 'An entry already exists for this date. Please feel free to choose another day.' });
        return;
      }

      setDuplicateNotice(null);
      transitionToStep(2);
    } catch (error) {
      setDuplicateNotice({ type: 'past', text: error.message });
    } finally {
      setCheckingDate(false);
    }
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

      if (res.status === 409) {
        const logsResponse = await fetch('/api/logs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const logs = await logsResponse.json();
        const existingLog = Array.isArray(logs)
          ? logs.find((log) => log.log_date === formData.logDate)
          : null;
        const today = createInitialFormData().logDate;
        setDuplicateNotice(existingLog?.log_date === today
          ? { type: 'today', log: existingLog, text: 'You already have an entry for today. Would you like to update it?' }
          : { type: 'past', text: 'An entry already exists for this date. Please feel free to choose another day.' });
        setStep(1);
        return;
      }

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
    <div className="daily-log-form relative z-10 mx-auto max-w-xl rounded-2xl border border-[#e8e5d5] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#173f3b]">{logId ? 'Edit Today’s Check-in' : 'Daily Health Tracker'}</h2>
        <span className="text-xs text-[#81958f] font-medium">Step {step} of 3</span>
      </div>

      {statusMessage && (
        <div
          className={`p-3 text-sm rounded-lg mb-4 ${
            statusMessage.type === 'success'
              ? 'bg-[#edf3e8] text-[#356a55] border border-[#c9dbc8]'
              : 'border border-[#e8c86a] bg-[#fff2cf] text-[#5f4a16]'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {duplicateNotice && (
        <aside
          role="alert"
          className="duplicate-notice fixed left-4 right-4 top-24 z-50 mx-auto max-w-md rounded-2xl border border-[#e8c86a] bg-[#fff2cf] p-5 text-left text-[#5f4a16] shadow-xl"
        >
          <p className="text-sm font-semibold leading-6">{duplicateNotice.text}</p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setDuplicateNotice(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#6d5923] hover:bg-[#f8dda0]">
              {duplicateNotice.type === 'today' ? 'Not for now' : 'Choose another date'}
            </button>
            {duplicateNotice.type === 'today' && (
              <button
                type="button"
                onClick={() => onEditExisting?.(duplicateNotice.log.id, toEditableFormData(duplicateNotice.log))}
                className="rounded-lg bg-[#285b54] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c4943]"
              >
                Update todays check-in
              </button>
            )}
          </div>
        </aside>
      )}

      <form onSubmit={(event) => event.preventDefault()}>
        <div>
          {step === 1 && (
            <div className={`form-step space-y-4 ${isStepLeaving ? 'form-step-leaving' : ''}`}>
              <div className="rounded-xl border border-[#d9d8c7] bg-[#fbf8ec] p-4">
                <label htmlFor="logDate" className="mb-1 block text-sm font-medium text-[#285b54]">Check-in date</label>
                <input id="logDate" type="date" name="logDate" value={formData.logDate} onChange={handleChange} required disabled={Boolean(logId)} className="w-full rounded-lg border border-[#b8c5bb] bg-[#fffdf7] px-3 py-2 text-sm text-[#173f3b] disabled:cursor-not-allowed disabled:opacity-70" />
              </div>
              <h3 className="text-md font-semibold text-[#285b54]">1. Mood & Stress Levels</h3>
              <div>
                <label className="block text-sm text-[#426b65] mb-1">
                  Mood Rating (1: Very Sad, 5: Very Happy)
                </label>
                <RatingButtons label="Mood rating" name="moodRating" value={formData.moodRating} onSelect={(value) => handleRatingChange('moodRating', value)} />
              </div>

              <div>
                <label className="block text-sm text-[#426b65] mb-1">
                  Anxiety Level (1: Low, 5: High)
                </label>
                <RatingButtons label="Anxiety level" name="anxietyLevel" value={formData.anxietyLevel} onSelect={(value) => handleRatingChange('anxietyLevel', value)} />
              </div>

              <div>
                <label className="block text-sm text-[#426b65] mb-1">
                  Stress Level (1: Low, 5: High)
                </label>
                <RatingButtons label="Stress level" name="stressLevel" value={formData.stressLevel} onSelect={(value) => handleRatingChange('stressLevel', value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={`form-step space-y-4 ${isStepLeaving ? 'form-step-leaving' : ''}`}>
              <h3 className="text-md font-semibold text-[#285b54]">2. Sleep & Social Engagement</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#426b65] mb-1">Sleep Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    name="sleepHours"
                    value={formData.sleepHours}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 text-sm text-[#173f3b]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#426b65] mb-1">Sleep Quality</label>
                  <select
                    name="sleepQuality"
                    value={formData.sleepQuality}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 text-sm text-[#173f3b]"
                  >
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>
              </div>

              <fieldset className="rounded-xl border border-[#d9d8c7] p-4">
                <legend className="px-1 text-sm font-semibold text-[#285b54]">Sleep disturbances</legend>
                <label className="flex items-center gap-3 text-sm text-[#285b54]">
                  <input type="checkbox" name="sleepDisturbancesPresent" checked={formData.sleepDisturbancesPresent} onChange={handleChange} className="h-4 w-4 rounded accent-[#eaa51a]" />
                  I experienced sleep disturbances
                </label>

                <div className={`mt-4 space-y-3 ${!formData.sleepDisturbancesPresent ? 'opacity-50' : ''}`}>
                  <p className="text-sm text-[#426b65]">What affected your sleep?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ['difficulty_falling_asleep', 'Difficulty falling asleep'],
                      ['frequent_awakenings', 'Frequent awakenings'],
                      ['early_waking', 'Waking too early'],
                      ['nightmares', 'Nightmares'],
                      ['restless_sleep', 'Restless sleep'],
                      ['other', 'Other disturbance'],
                    ].map(([value, label]) => (
                      <label key={value} className="flex items-start gap-2 text-sm text-[#285b54]">
                        <input type="checkbox" name="sleepDisturbanceTypes" value={value} checked={(formData.sleepDisturbanceTypes ?? []).includes(value)} onChange={handleChange} disabled={!formData.sleepDisturbancesPresent} className="mt-0.5 h-4 w-4 rounded accent-[#eaa51a]" />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="sleepDisturbanceNotes" className="mb-1 block text-sm text-[#426b65]">Additional details (optional)</label>
                    <textarea id="sleepDisturbanceNotes" name="sleepDisturbanceNotes" rows="2" value={formData.sleepDisturbanceNotes} onChange={handleChange} disabled={!formData.sleepDisturbancesPresent} placeholder="Describe anything else that disrupted your sleep" className="w-full rounded-lg border border-[#b8c5bb] p-2 text-sm text-[#173f3b]" />
                  </div>
                </div>
              </fieldset>

              <div>
                <label className="block text-sm text-[#426b65] mb-1">
                  Social Engagement Frequency (1: Low, 5: High)
                </label>
                <RatingButtons label="Social engagement frequency" name="socialEngagements" value={formData.socialEngagements} onSelect={(value) => handleRatingChange('socialEngagements', value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={`form-step space-y-4 ${isStepLeaving ? 'form-step-leaving' : ''}`}>
              <h3 className="text-md font-semibold text-[#285b54]">3. Physical Activity & Symptoms</h3>

              <fieldset className="rounded-xl border border-[#d9d8c7] p-4">
                <legend className="px-1 text-sm font-semibold text-[#285b54]">Physical activity</legend>
                <label className="flex items-center gap-3 text-sm text-[#285b54]">
                  <input type="checkbox" name="activityPerformed" checked={formData.activityPerformed} onChange={handleChange} className="h-4 w-4 rounded accent-[#eaa51a]" />
                  I did physical activity on this date
                </label>

                <div className={`mt-4 grid gap-4 sm:grid-cols-2 ${!formData.activityPerformed ? 'opacity-50' : ''}`}>
                    <div>
                      <label htmlFor="activityType" className="mb-1 block text-sm text-[#426b65]">What type of activity?</label>
                      <input id="activityType" type="text" name="activityType" value={formData.activityType} onChange={handleChange} required={formData.activityPerformed} disabled={!formData.activityPerformed} placeholder="Walking, yoga, running..." className="w-full rounded-lg border border-[#b8c5bb] p-2 text-sm text-[#173f3b]" />
                    </div>
                    <div>
                      <label htmlFor="activityDuration" className="mb-1 block text-sm text-[#426b65]">How long? (minutes)</label>
                      <input id="activityDuration" type="number" min="1" name="activityDuration" value={formData.activityDuration} onChange={handleChange} required={formData.activityPerformed} disabled={!formData.activityPerformed} className="w-full rounded-lg border border-[#b8c5bb] p-2 text-sm text-[#173f3b]" />
                    </div>
                </div>
              </fieldset>

              <fieldset className="rounded-xl border border-[#d9d8c7] p-4">
                <legend className="px-1 text-sm font-semibold text-[#285b54]">Depression or anxiety symptoms</legend>
                <label className="flex items-center gap-3 text-sm text-[#285b54]">
                  <input type="checkbox" name="symptomsPresent" checked={formData.symptomsPresent} onChange={handleChange} className="h-4 w-4 rounded accent-[#eaa51a]" />
                  I experienced depression or anxiety symptoms
                </label>

                <div className={`mt-4 space-y-4 ${!formData.symptomsPresent ? 'opacity-50' : ''}`}>
                    <div>
                      <p className="mb-2 text-sm text-[#426b65]">Which symptoms were present?</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          ['low_mood', 'Low mood or sadness'],
                          ['loss_of_interest', 'Loss of interest'],
                          ['excessive_worry', 'Excessive worry'],
                          ['panic', 'Panic or intense fear'],
                          ['fatigue', 'Fatigue or low energy'],
                          ['sleep_changes', 'Changes in sleep'],
                        ].map(([value, label]) => (
                          <label key={value} className="flex items-start gap-2 text-sm text-[#285b54]">
                            <input type="checkbox" name="symptomTypes" value={value} checked={(formData.symptomTypes ?? []).includes(value)} onChange={handleChange} disabled={!formData.symptomsPresent} className="mt-0.5 h-4 w-4 rounded accent-[#eaa51a]" />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-[#426b65]">Overall symptom severity (1: Mild, 5: Severe)</label>
                      <RatingButtons label="Overall symptom severity" name="symptomSeverity" value={formData.symptomSeverity || 1} disabled={!formData.symptomsPresent} onSelect={(value) => handleRatingChange('symptomSeverity', value)} />
                    </div>

                    <div>
                      <label htmlFor="symptoms" className="mb-1 block text-sm text-[#426b65]">Additional notes (optional)</label>
                      <textarea id="symptoms" name="symptoms" rows="3" value={formData.symptoms} onChange={handleChange} disabled={!formData.symptomsPresent} placeholder="Anything else you would like to record?" className="w-full rounded-lg border border-[#b8c5bb] p-2 text-sm text-[#173f3b]" />
                    </div>
                </div>
              </fieldset>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t border-[#e8e5d5]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => transitionToStep(step - 1)}
              disabled={isStepLeaving}
              className="px-4 py-2 text-sm font-medium text-[#426b65] hover:text-[#173f3b] disabled:cursor-wait disabled:opacity-60"
            >
              Previous
            </button>
          ) : onCancel ? (
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-[#648079] hover:text-[#173f3b]">Cancel</button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={checkingDate || isStepLeaving}
              className="rounded-lg bg-[#2d6b62] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#285b54] disabled:cursor-wait disabled:opacity-60"
            >
              {checkingDate ? 'Checking date...' : 'Next'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium bg-[#356a55] text-white rounded-lg hover:bg-[#295845] transition"
            >
              {logId ? 'Save Changes' : 'Submit Daily Log'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}