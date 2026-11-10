/**
 * User Interview Simulator: a customer with a few things worth learning,
 * who only shares them when asked well. The learner asks up to twelve
 * questions, then says what the interview showed.
 *
 * Ground truth is what the persona says at each depth of each topic, and
 * which findings the interview can actually support.
 */
import { z } from "zod";

import { baseCaseSchema, publicBaseCaseSchema } from "@/core/case-engine";

export const USER_INTERVIEW_MODULE_ID = "user-interview";

export const MAX_QUESTIONS = 12;
export const MIN_QUESTIONS = 3;
export const MAX_QUESTION_LENGTH = 300;
export const MAX_TEXT = 1200;

const idSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9_]+$/);

const sharedShape = {
  moduleId: z.literal(USER_INTERVIEW_MODULE_ID),
  persona: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    /** What the learner knows before the call. */
    context: z.string().min(1),
  }),
  /** What the team wants to learn from this interview. */
  researchGoal: z.string().min(1),
  /** Statements the learner can claim the interview showed. */
  findings: z
    .array(z.object({ id: idSchema, text: z.string().min(1) }))
    .min(5)
    .max(10),
};

const topicSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  /** Word stems that say a question is about this topic. */
  keywords: z.array(z.string().min(2)).min(2),
  /** Reply to a closed question: short and polite. */
  surface: z.string().min(1),
  /** Reply to an open question: the general picture and a thread to pull. */
  open: z.string().min(1),
  /** Reply to a question about what actually happened: the real story. */
  deep: z.string().min(1),
  /** A question that would have reached the deep reply. */
  exampleQuestion: z.string().min(1),
});
export type Topic = z.infer<typeof topicSchema>;

export const interviewCaseSchema = baseCaseSchema
  .extend({
    ...sharedShape,
    hidden: z.object({
      /** Guarded people only open up about specific past events. */
      guarded: z.boolean(),
      topics: z.array(topicSchema).min(3).max(8),
      findings: z.array(
        z.object({
          id: idSchema,
          supported: z.boolean(),
          /** The topic whose deep reply shows a supported finding. */
          topicId: idSchema.nullable(),
          why: z.string().min(1),
        }),
      ),
      replies: z.object({
        greeting: z.string().min(1),
        leading: z.array(z.string().min(1)).min(2),
        hypothetical: z.array(z.string().min(1)).min(2),
        offTopic: z.array(z.string().min(1)).min(2),
      }),
      principle: z.string().min(1),
    }),
  })
  .superRefine((caseData, context) => {
    const issue = (message: string) =>
      context.addIssue({ code: "custom", message });
    const publicIds = caseData.findings
      .map((f) => f.id)
      .sort()
      .join();
    const hiddenIds = caseData.hidden.findings
      .map((f) => f.id)
      .sort()
      .join();
    if (publicIds !== hiddenIds) issue("Hidden findings do not match");
    const topicIds = caseData.hidden.topics.map((t) => t.id);
    if (new Set(topicIds).size !== topicIds.length) issue("Topic ids repeat");
    const used = new Set<string>();
    for (const finding of caseData.hidden.findings) {
      if (finding.supported) {
        if (!finding.topicId || !topicIds.includes(finding.topicId)) {
          issue(`Finding "${finding.id}" needs the topic that shows it`);
        } else if (used.has(finding.topicId)) {
          issue(`Topic "${finding.topicId}" shows two findings`);
        } else {
          used.add(finding.topicId);
        }
      } else if (finding.topicId !== null) {
        issue(`Unsupported finding "${finding.id}" cannot have a topic`);
      }
    }
    const supported = caseData.hidden.findings.filter((f) => f.supported);
    if (supported.length < 3) issue("A case needs three supported findings");
    if (supported.length === caseData.hidden.findings.length) {
      issue("A case needs findings the interview does not support");
    }
  });
export type InterviewCase = z.infer<typeof interviewCaseSchema>;

export const publicInterviewCaseSchema =
  publicBaseCaseSchema.extend(sharedShape);
export type PublicInterviewCase = z.infer<typeof publicInterviewCaseSchema>;

export const questionSchema = z.string().trim().min(2).max(MAX_QUESTION_LENGTH);

export const interviewAnswerSchema = z.object({
  /** Everything the learner asked, in order. Replies are rebuilt from it. */
  questions: z.array(questionSchema).max(MAX_QUESTIONS),
  /** The findings the learner says the interview supports. */
  findingIds: z.array(idSchema).max(10),
  /** Their summary for the team: read by the AI coach, never scored. */
  summary: z.string().max(MAX_TEXT).default(""),
});
export type InterviewAnswer = z.infer<typeof interviewAnswerSchema>;
