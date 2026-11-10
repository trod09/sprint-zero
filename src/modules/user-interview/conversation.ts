/**
 * The interview itself: given the case and everything asked so far, what
 * the persona answers to each question. Deterministic, so the transcript can
 * always be rebuilt from the questions alone.
 *
 * - Leading questions get agreement, hypothetical ones get a polite "sure":
 *   both sound like answers and reveal nothing.
 * - A closed question gets a short reply.
 * - An open question gets the general picture. The real story comes out
 *   when the learner asks about something that happened, or digs into the
 *   same topic again.
 */
import { classifyQuestion, type QuestionAnalysis } from "./analysis";
import type { InterviewCase, Topic } from "./schema";

export type ReplyDepth =
  | "greeting"
  | "off_topic"
  | "agree"
  | "hypothetical"
  | "surface"
  | "open"
  | "deep";

export interface Turn {
  question: string;
  analysis: QuestionAnalysis;
  topicId: string | null;
  depth: ReplyDepth;
  reply: string;
  /** The finding this reply shows for the first time, if any. */
  revealedFindingId: string | null;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The topic a question is about: the one with the most keyword stems in it. */
export function matchTopic(
  topics: readonly Topic[],
  question: string,
): Topic | null {
  const text = question.toLowerCase();
  let best: Topic | null = null;
  let bestHits = 0;
  for (const topic of topics) {
    const hits = topic.keywords.filter((keyword) => {
      // A stem by default; "app$" only matches the whole word.
      const whole = keyword.endsWith("$");
      const stem = escape(keyword.toLowerCase().replace(/\$$/, ""));
      return new RegExp(`\\b${stem}${whole ? "\\b" : ""}`).test(text);
    }).length;
    // On a tie the later topic wins: general topics are listed first.
    if (hits > 0 && hits >= bestHits) {
      best = topic;
      bestHits = hits;
    }
  }
  return best;
}

export function runInterview(
  caseData: InterviewCase,
  questions: readonly string[],
): Turn[] {
  const { topics, replies, guarded, findings } = caseData.hidden;
  const findingOf = new Map(
    findings.filter((f) => f.topicId).map((f) => [f.topicId!, f.id]),
  );
  const askedOpen = new Set<string>();
  const revealed = new Set<string>();
  const used = { leading: 0, hypothetical: 0, offTopic: 0 };
  const rotate = (list: readonly string[], key: keyof typeof used) =>
    list[used[key]++ % list.length];
  let lastTopic: Topic | null = null;

  return questions.map((question) => {
    const analysis = classifyQuestion(question);
    const turn = (
      depth: ReplyDepth,
      reply: string,
      topic: Topic | null = null,
    ): Turn => {
      let revealedFindingId: string | null = null;
      if (depth === "deep" && topic) {
        const findingId = findingOf.get(topic.id);
        if (findingId && !revealed.has(findingId)) {
          revealed.add(findingId);
          revealedFindingId = findingId;
        }
      }
      return {
        question,
        analysis,
        topicId: topic?.id ?? null,
        depth,
        reply,
        revealedFindingId,
      };
    };

    if (analysis.form === "smalltalk")
      return turn("greeting", replies.greeting);

    const matched = matchTopic(topics, question);
    const topic = matched ?? (analysis.followUp ? lastTopic : null);
    if (topic) lastTopic = topic;

    if (analysis.leading) {
      return turn("agree", rotate(replies.leading, "leading"), topic);
    }
    if (analysis.hypothetical) {
      return turn(
        "hypothetical",
        rotate(replies.hypothetical, "hypothetical"),
        topic,
      );
    }
    if (!topic) return turn("off_topic", rotate(replies.offTopic, "offTopic"));
    if (analysis.form === "closed")
      return turn("surface", topic.surface, topic);

    // An open question. Does it reach the real story?
    const digging = askedOpen.has(topic.id);
    askedOpen.add(topic.id);
    const reaches = guarded
      ? analysis.pastBehavior || (digging && analysis.followUp)
      : analysis.pastBehavior || digging;
    return reaches
      ? turn("deep", topic.deep, topic)
      : turn("open", topic.open, topic);
  });
}
