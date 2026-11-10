/**
 * Reads an interview question the way a research coach would: is it open,
 * does it lead the witness, does it ask about an imagined future or about
 * something that happened? Pure rules on the text, no ground truth, so the
 * same question always gets the same reading.
 */

export type QuestionForm = "open" | "closed" | "smalltalk";
export type QuestionQuality = "good" | "ok" | "poor" | "none";

export interface QuestionAnalysis {
  form: QuestionForm;
  /** Suggests the answer it wants to hear. */
  leading: boolean;
  /** Asks about an imagined future instead of real behaviour. */
  hypothetical: boolean;
  /** Asks about a specific thing that happened. */
  pastBehavior: boolean;
  /** Digs into the previous answer ("why?", "what happened next?"). */
  followUp: boolean;
  /** Two questions in one. */
  double: boolean;
  quality: QuestionQuality;
}

const clean = (text: string) =>
  text.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();

const POLITE_OPEN =
  /^(can|could|would|will) you (please )?(tell|describe|walk|talk|explain|show|share|give|take)\b/;
const OPEN_START =
  /^(so,? |and,? |ok,? |okay,? |interesting[.,!]? )?(what|how|why|when|where|which|who|tell|describe|walk|talk|explain|show|share|give me)\b/;
const CLOSED_START =
  /^(so,? |and,? |ok,? |okay,? )?(do|does|did|is|are|was|were|would|will|can|could|have|has|had|should|shall|may|might|am|isn't|aren't|don't|doesn't|didn't|wouldn't|won't|haven't)\b/;
const SMALLTALK =
  /^(hi|hello|hey|good (morning|afternoon|evening)|thanks|thank you|nice to meet|great to meet|bye|goodbye)\b/;

const LEADING = [
  /\b(don't|doesn't|didn't|wouldn't|isn't|aren't|won't|shouldn't|can't) (you|it|that|they|this)\b/,
  /\b(right|correct|isn't it|don't you think|wouldn't you say)\?/,
  /\bwould you agree\b/,
  /\byou (must|probably|surely|obviously|clearly)\b/,
  /\bi (assume|guess|bet|imagine|suppose) (you|it|that)\b/,
  /\bhow (much|badly) do you (love|like|enjoy|hate|want|need)\b/,
  /\bhow (great|good|amazing|awesome|bad|terrible|annoying|frustrating|painful|easy|useful|helpful|important) (is|was|are|were|would)\b/,
  /\b(is|was|isn't) (it|that) (annoying|frustrating|painful|great|a problem|a pain|hard|difficult)\b/,
  /\bdo you (love|hate)\b/,
  /\b(surely|obviously|clearly)\b/,
  /\bit must be\b/,
];

const HYPOTHETICAL = [
  /\bwould you (use|pay|buy|want|like|prefer|switch|recommend|consider|try|be willing|be interested|find)\b/,
  /\bwould (it|that|this) (help|be useful|be helpful|be better|work|make)\b/,
  /\bif (we|i|rosterly|ledgerline|docketly|the app|there) (built|added|made|offered|gave|had|was|were|launched|shipped|could)\b/,
  /\bif you (could|had|were)\b/,
  /\b(imagine|suppose|let's say|in the future|in an ideal world|ideally|magic wand)\b/,
  /\bhow much would you\b/,
  /\bwhat (would|if)\b/,
  /\bwill you\b/,
  /\bhow likely\b/,
];

const PAST_BEHAVIOR = [
  /\b(the )?last time\b/,
  /\b(most recent|recently|yesterday|this week|this month|earlier today)\b/,
  /\blast (week|month|shift|year|quarter|friday|monday|invoice|payment|time)\b/,
  /\ba time (when|you|that)\b/,
  /\bwalk me through\b/,
  /\btake me through\b/,
  /\bwhat happened\b/,
  /\bwhen did you (last|first)\b/,
  /\bwhat did you (do|say|think|try|end up)\b/,
  /\bhow did (you|that|it|they)\b/,
  /\b(an|a specific|a concrete|a recent|one) example\b/,
  /\bspecific(ally)?\b/,
  /\bwhen was the last\b/,
  /\bwhat was (it|that) like\b/,
  /\bhave you ever\b/,
  /\b(your|the|my) last\b/,
];

const FOLLOW_UP = [
  /^(and )?why( is that| was that| not| do you think that is)?\??$/,
  /^(why|how come)\b/,
  /\b(tell|say) me more\b/,
  /\bsay more\b/,
  /^(can|could) you (say|tell me) more\b/,
  /\bwhat do you mean\b/,
  /^how so\b/,
  /\b(and|what happened) (then|next|after)\b/,
  /^what happened\b/,
  /^(can|could) you give me an example\b/,
  /^(for|an) example\b/,
  /^go on\b/,
  /\bhow did that (go|feel|end|work out|turn out)\b/,
  /\bwhat did you do (then|next|about (it|that))\b/,
  /\bhow did you (feel|deal|handle|react|fix|solve|sort)\b/,
  /\bwhat made (that|it)\b/,
];

const any = (patterns: readonly RegExp[], text: string) =>
  patterns.some((pattern) => pattern.test(text));

export function classifyQuestion(raw: string): QuestionAnalysis {
  const text = clean(raw);
  const smalltalk = SMALLTALK.test(text) && !text.includes("?");
  const politeOpen = POLITE_OPEN.test(text);
  const form: QuestionForm = smalltalk
    ? "smalltalk"
    : politeOpen || (OPEN_START.test(text) && !CLOSED_START.test(text))
      ? "open"
      : CLOSED_START.test(text)
        ? "closed"
        : // No recognisable start: "And the payroll side?" is an open prompt.
          "open";

  const leading = !smalltalk && any(LEADING, text);
  // "Could you walk me through..." asks for a story, not for a prediction.
  const hypothetical = !smalltalk && !politeOpen && any(HYPOTHETICAL, text);
  const pastBehavior = !smalltalk && !hypothetical && any(PAST_BEHAVIOR, text);
  const followUp = !smalltalk && any(FOLLOW_UP, text);
  const double = (text.match(/\?/g) ?? []).length > 1;

  const quality: QuestionQuality = smalltalk
    ? "none"
    : leading || hypothetical
      ? "poor"
      : form === "closed" || double
        ? "ok"
        : "good";

  return {
    form,
    leading,
    hypothetical,
    pastBehavior,
    followUp,
    double,
    quality,
  };
}
