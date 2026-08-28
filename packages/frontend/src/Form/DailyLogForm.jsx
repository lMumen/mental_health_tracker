import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

const initialFormData = {
  moodRating: 3,
  anxietyLevel: 3,
  activityType: 'Walking',
  activityDuration: 30,
  sleepHours: 7,
  sleepQuality: 'good',
  socialEngagements: 3,
  stressLevel: 3,
  symptoms: '',
};

export default function DailyLogForm({ onLogSubmitted }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['number', 'range'].includes(type) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
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

      setStatusMessage({ type: 'success', text: 'Daily log submitted successfully!' });
      setFormData(initialFormData);
      setStep(1);
      if (onLogSubmitted) onLogSubmitted();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Daily Health Tracker</h2>
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

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
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
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
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
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-md font-semibold text-slate-700">3. Physical Activity & Symptoms</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Activity Type</label>
                  <input
                    type="text"
                    name="activityType"
                    value={formData.activityType}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    name="activityDuration"
                    value={formData.activityDuration}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Symptoms or Additional Notes</label>
                <textarea
                  name="symptoms"
                  rows="3"
                  value={formData.symptoms}
                  onChange={handleChange}
                  placeholder="Describe any symptoms experienced today..."
                  className="w-full border rounded-lg p-2 text-sm text-slate-800"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Previous
            </button>
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
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              Submit Daily Log
            </button>
          )}
        </div>
      </form>
    </div>
  );
}