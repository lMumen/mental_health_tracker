import { z } from 'zod';

export const logSchema = z.object({
  logDate: z.iso.date(),
  moodRating: z.number().int().min(1).max(5),
  anxietyLevel: z.number().int().min(1).max(5),
  activityPerformed: z.boolean(),
  activityType: z.string(),
  activityDuration: z.number().min(0),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
  sleepDisturbancesPresent: z.boolean(),
  sleepDisturbanceTypes: z.array(z.enum(['difficulty_falling_asleep', 'frequent_awakenings', 'early_waking', 'nightmares', 'restless_sleep', 'other'])),
  sleepDisturbanceNotes: z.string().optional().default(''),
  socialEngagements: z.number().int().min(1).max(5),
  stressLevel: z.number().int().min(1).max(5),
  symptomsPresent: z.boolean(),
  symptomTypes: z.array(z.enum(['low_mood', 'loss_of_interest', 'excessive_worry', 'panic', 'fatigue', 'sleep_changes'])),
  symptomSeverity: z.number().int().min(0).max(5),
  symptoms: z.string().optional().default(''),
});
