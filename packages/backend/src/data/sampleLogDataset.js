const NOTES = [
  'Energy was very low today, and anxious thoughts felt difficult to interrupt.',
  'The day felt heavy, but I wrote down how I was feeling.',
  'A short walk helped me feel present for a few minutes.',
  'I reached out to someone I trust and felt a little less alone.',
  'My mood is becoming steadier, even though anxiety still comes and goes.',
  'I had more energy today and followed through with a healthy routine.',
  'Exercise and social connection helped me feel grounded.',
  'I felt more balanced and hopeful, and anxiety was easier to manage.',
];

const SLEEP_NOTES = [
  'Sleep was interrupted by anxious thoughts.',
  'I woke several times and found it difficult to settle again.',
  'Some restlessness remained, but sleep felt more restorative.',
  'I used a calming routine before bed and slept more consistently.',
  '',
];

function stageFor(index) {
  if (index < 18) return 0;
  if (index < 38) return 1;
  if (index < 58) return 2;
  if (index < 74) return 3;
  return 4;
}

export const SAMPLE_LOG_DATASET = Object.freeze(
  Array.from({ length: 90 }, (_, index) => {
    const stage = stageFor(index);
    const weeklyVariation = [0, 0, 1, 0, -1, 0, 1][index % 7];
    const mood = Math.max(1, Math.min(5, [1, 2, 3, 4, 4][stage] + (weeklyVariation > 0 && index % 3 === 0 ? 1 : 0)));
    const anxiety = Math.max(1, Math.min(5, [5, 4, 3, 2, 2][stage] + (weeklyVariation < 0 ? 1 : 0)));
    const stress = Math.max(1, Math.min(5, [5, 4, 3, 3, 2][stage] + (index % 13 === 0 ? 1 : 0)));
    const social = Math.max(1, Math.min(5, [1, 2, 3, 4, 4][stage] + (index > 78 && index % 8 === 0 ? 1 : 0)));
    const sleepHours = Number(Math.max(4.2, Math.min(8.2, 4.7 + (index * 3 / 89) + weeklyVariation * 0.12)).toFixed(1));
    const sleepQuality = sleepHours < 5.5 ? 'poor' : sleepHours < 6.5 ? 'fair' : sleepHours < 7.5 ? 'good' : 'excellent';

    let activityType = 'None';
    let activityDuration = 0;
    if (index >= 12 && index < 40 && [1, 3, 5].includes(index % 7)) {
      activityType = 'Walking';
      activityDuration = 15 + (index % 4) * 5;
    } else if (index >= 40 && index < 65) {
      if ([2, 5].includes(index % 7)) {
        activityType = 'Gym';
        activityDuration = 35 + (index % 3) * 5;
      } else if ([0, 3, 6].includes(index % 7)) {
        activityType = 'Walking';
        activityDuration = 25 + (index % 4) * 5;
      }
    } else if (index >= 65) {
      if ([1, 3, 5].includes(index % 7)) {
        activityType = 'Gym';
        activityDuration = 45 + (index % 3) * 5;
      } else if ([0, 2, 4].includes(index % 7)) {
        activityType = 'Walking';
        activityDuration = 35 + (index % 4) * 5;
      }
    } else if ([5, 10].includes(index)) {
      activityType = 'Walking';
      activityDuration = 10 + index;
    }

    const panicPresent = index < 22 || (index < 58 && index % 9 === 0);
    const symptomsPresent = index < 74 || index % 11 === 0;
    const symptomTypes = symptomsPresent
      ? [
          ...(index < 58 ? ['low_mood'] : []),
          ...(index < 45 ? ['loss_of_interest'] : []),
          'excessive_worry',
          ...(panicPresent ? ['panic'] : []),
          ...(index < 65 ? ['fatigue'] : []),
          ...(index < 38 ? ['sleep_changes'] : []),
        ]
      : [];
    const symptomSeverity = symptomsPresent ? [5, 4, 3, 2, 1][stage] : 0;
    const sleepDisturbancesPresent = index < 58 || index % 13 === 0;
    const sleepTypes = sleepDisturbancesPresent
      ? index < 24
        ? ['difficulty_falling_asleep', 'frequent_awakenings', 'early_waking']
        : index < 58
          ? ['difficulty_falling_asleep', 'frequent_awakenings']
          : ['restless_sleep']
      : [];

    return Object.freeze({
      daysAgo: 90 - index,
      moodRating: mood,
      anxietyLevel: anxiety,
      stressLevel: stress,
      socialEngagements: social,
      sleepHours,
      sleepQuality,
      activityType,
      activityDuration,
      symptoms: {
        present: symptomsPresent,
        types: symptomTypes,
        severity: symptomSeverity,
        notes: NOTES[Math.min(NOTES.length - 1, Math.floor(index / 12))],
      },
      sleepDisturbances: {
        present: sleepDisturbancesPresent,
        types: sleepTypes,
        notes: SLEEP_NOTES[Math.min(SLEEP_NOTES.length - 1, stage)],
      },
    });
  }),
);
