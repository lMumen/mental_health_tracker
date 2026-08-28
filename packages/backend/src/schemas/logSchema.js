import { z } from 'zod';

export const logSchema = z.object({
  moodRating: z.number().int().min(1).max(5),
  anxietyLevel: z.number().int().min(1).max(5),
  activityType: z.string().min(1, 'Activity type is required'),
  activityDuration: z.number().positive('Duration must be greater than 0'),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
  socialEngagements: z.number().int().min(1).max(5),
  stressLevel: z.number().int().min(1).max(5),
  symptoms: z.string().optional().default('None'),
});
