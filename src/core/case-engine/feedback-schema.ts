/**
 * Shape of the AI coach's feedback. Client-safe: the results screen validates
 * stored feedback with it.
 */
import { z } from "zod";

export const aiFeedbackSchema = z.object({
  /** Two or three sentences on the overall plan. */
  summary: z.string().min(1).max(800),
  strengths: z.array(z.string().min(1).max(500)).min(1).max(3),
  improvements: z.array(z.string().min(1).max(500)).min(1).max(3),
  /** One PM principle to remember, in one sentence. */
  principle: z.string().min(1).max(300),
});
export type AIFeedback = z.infer<typeof aiFeedbackSchema>;
