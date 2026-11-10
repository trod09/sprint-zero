import { describe, expect, it } from "vitest";

import { assertNoHiddenKeys } from "@/core/case-engine/public-case";
import { caseRepository } from "@/modules/registry.server";
import { classifyQuestion } from "@/modules/user-interview/analysis";
import { answerQuestion } from "@/modules/user-interview/ask.server";
import { interviewCases } from "@/modules/user-interview/content/cases";
import {
  matchTopic,
  runInterview,
} from "@/modules/user-interview/conversation";
import { toPublicInterviewCase } from "@/modules/user-interview/public";
import {
  interviewCaseSchema,
  type InterviewCase,
} from "@/modules/user-interview/schema";
import {
  INTERVIEW_WEIGHTS,
  scoreInterview,
} from "@/modules/user-interview/scoring";

const [maya, tomas, priya] = interviewCases;

describe("question analysis", () => {
  const read = classifyQuestion;

  it("tells open questions from closed ones", () => {
    expect(read("How do swaps usually happen?").form).toBe("open");
    expect(read("Tell me about your week.").form).toBe("open");
    expect(read("Could you walk me through last Friday?").form).toBe("open");
    expect(read("Do people swap shifts?").form).toBe("closed");
    expect(read("Is payroll a problem?").form).toBe("closed");
    expect(read("Hello, thanks for your time").form).toBe("smalltalk");
  });

  it("spots leading questions", () => {
    for (const question of [
      "Don't you think the app is slow?",
      "Swapping in the app is annoying, right?",
      "How frustrating is it when payments are late?",
      "You must hate chasing clients.",
      "Would you agree that reminders are useful?",
    ]) {
      expect(read(question).leading, question).toBe(true);
      expect(read(question).quality).toBe("poor");
    }
    expect(read("What makes that hard?").leading).toBe(false);
  });

  it("spots hypothetical questions", () => {
    for (const question of [
      "Would you use an automatic swap feature?",
      "If we built late fees, would that help?",
      "How much would you pay for that?",
      "Imagine the app approved swaps for you. Thoughts?",
    ]) {
      expect(read(question).hypothetical, question).toBe(true);
    }
    expect(read("Would you walk me through the last swap?").hypothetical).toBe(
      false,
    );
  });

  it("recognises questions about what actually happened", () => {
    for (const question of [
      "Tell me about the last time someone needed cover.",
      "Walk me through last Friday's payroll.",
      "What happened next?",
      "Can you give me a specific example?",
    ]) {
      expect(read(question).pastBehavior, question).toBe(true);
    }
    expect(read("How do you feel about payroll?").pastBehavior).toBe(false);
  });

  it("rates quality", () => {
    expect(read("What happened the last time payroll went out?").quality).toBe(
      "good",
    );
    expect(read("Do you check your bank?").quality).toBe("ok");
    expect(read("How do swaps work? And who approves them?").quality).toBe(
      "ok",
    );
    expect(read("Hi there").quality).toBe("none");
  });
});

describe("cases", () => {
  it("are valid and reachable through the repository", async () => {
    for (const caseData of interviewCases) {
      expect(() => interviewCaseSchema.parse(caseData)).not.toThrow();
      expect(await caseRepository.getPublicCase(caseData.id)).not.toBeNull();
    }
  });

  it("route every example question to its own topic, at full depth", () => {
    for (const caseData of interviewCases) {
      for (const topic of caseData.hidden.topics) {
        expect(
          matchTopic(caseData.hidden.topics, topic.exampleQuestion)?.id,
          `${caseData.id}: ${topic.exampleQuestion}`,
        ).toBe(topic.id);
        const [turn] = runInterview(caseData, [topic.exampleQuestion]);
        expect(turn.depth, topic.exampleQuestion).toBe("deep");
      }
    }
  });

  it("never expose replies or which findings are true", () => {
    for (const caseData of interviewCases) {
      const publicCase = toPublicInterviewCase(caseData);
      assertNoHiddenKeys(publicCase);
      const text = JSON.stringify(publicCase);
      expect(text).not.toContain('"supported"');
      expect(text).not.toContain('"deep"');
      expect(text).not.toContain(caseData.hidden.topics[1].deep.slice(0, 30));
    }
  });
});

describe("the conversation", () => {
  it("gives a short answer to a closed question and the story to a good one", () => {
    const turns = runInterview(maya, [
      "Do people swap shifts?",
      "How do swaps usually happen?",
      "Tell me about the last time someone needed their shift covered.",
    ]);
    expect(turns.map((t) => t.depth)).toEqual(["surface", "open", "deep"]);
    expect(turns[2].revealedFindingId).toBe("group_chat");
  });

  it("opens up on a second open question about the same topic", () => {
    const turns = runInterview(maya, [
      "How does payroll work for you?",
      "Why does payroll worry you?",
    ]);
    expect(turns[1].depth).toBe("deep");
    expect(turns[1].revealedFindingId).toBe("payroll_errors");
  });

  it("follows a short follow-up back to the last topic", () => {
    const turns = runInterview(maya, ["How do you approve changes?", "Why?"]);
    expect(turns[1].topicId).toBe("approval");
    expect(turns[1].depth).toBe("deep");
  });

  it("agrees with leading questions and says 'sure' to hypotheticals", () => {
    const turns = runInterview(maya, [
      "Swapping in the app is annoying, right?",
      "Would you use automatic swap matching?",
      "What is your favourite colour?",
    ]);
    expect(turns.map((t) => t.depth)).toEqual([
      "agree",
      "hypothetical",
      "off_topic",
    ]);
    expect(turns.every((t) => t.revealedFindingId === null)).toBe(true);
  });

  it("keeps a guarded persona closed until asked about a specific event", () => {
    const general = runInterview(priya, [
      "How is reporting to leadership going?",
      "What do you think about reporting?",
    ]);
    expect(general.map((t) => t.depth)).toEqual(["open", "open"]);
    const specific = runInterview(priya, [
      "How did you put together last Monday's report for the CEO?",
    ]);
    expect(specific[0].revealedFindingId).toBe("weekly_report");
    const probing = runInterview(priya, [
      "How is reporting to leadership going?",
      "Can you give me an example?",
    ]);
    expect(probing[1].depth).toBe("deep");
  });

  it("reveals each finding once and is deterministic", () => {
    const questions = [
      "Tell me about the last invoice that was paid late.",
      "What happened the last time an invoice was paid late?",
    ];
    const turns = runInterview(tomas, questions);
    expect(turns[0].revealedFindingId).toBe("cash_flow");
    expect(turns[1].revealedFindingId).toBeNull();
    expect(runInterview(tomas, questions)).toEqual(turns);
  });
});

/** The example question of every topic, then the true findings. */
function idealAnswer(caseData: InterviewCase) {
  return {
    questions: caseData.hidden.topics.map((t) => t.exampleQuestion),
    findingIds: caseData.hidden.findings
      .filter((f) => f.supported)
      .map((f) => f.id),
    summary: "",
  };
}

describe("scoring", () => {
  it("uses weights that add up to 100 and scores a model interview 100", () => {
    expect(Object.values(INTERVIEW_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(
      100,
    );
    for (const caseData of interviewCases) {
      expect(scoreInterview(caseData, idealAnswer(caseData)).total).toBe(100);
    }
  });

  it("scores an empty interview 0", () => {
    expect(
      scoreInterview(maya, { questions: [], findingIds: [], summary: "" })
        .total,
    ).toBe(0);
  });

  it("does not reward claiming findings the interview never showed", () => {
    const guessed = scoreInterview(maya, {
      questions: ["Do people swap shifts?", "Is payroll ok?", "Any issues?"],
      findingIds: idealAnswer(maya).findingIds,
      summary: "",
    });
    expect(guessed.criteria.find((c) => c.id === "synthesis")!.ratio).toBe(0);
    expect(guessed.criteria.find((c) => c.id === "insights")!.ratio).toBe(0);
  });

  it("penalises unsupported claims and biased questions", () => {
    const ideal = idealAnswer(maya);
    const overclaimed = scoreInterview(maya, {
      ...ideal,
      findingIds: [
        ...ideal.findingIds,
        "would_use_matching",
        "slow_scheduling",
      ],
    });
    expect(
      overclaimed.criteria.find((c) => c.id === "synthesis")!.ratio,
    ).toBeLessThan(1);

    const biased = scoreInterview(maya, {
      ...ideal,
      questions: [
        ...ideal.questions,
        "Swapping in the app is annoying, right?",
        "Would you use automatic matching?",
        "Don't you think approvals are slow?",
      ],
    });
    expect(biased.criteria.find((c) => c.id === "bias")!.ratio).toBe(0);
    expect(
      biased.criteria.find((c) => c.id === "questions")!.ratio,
    ).toBeLessThan(1);
  });
});

describe("asking through the server", () => {
  it("returns only the reply to the last question", async () => {
    const outcome = await answerQuestion(caseRepository, {
      caseId: maya.id,
      questions: ["Do people swap shifts?"],
    });
    expect(outcome).toEqual({ ok: true, reply: maya.hidden.topics[1].surface });
  });

  it("rejects bad requests and other modules' cases", async () => {
    expect(
      await answerQuestion(caseRepository, { caseId: maya.id, questions: [] }),
    ).toEqual({ ok: false, error: { code: "invalid_request" } });
    expect(
      await answerQuestion(caseRepository, {
        caseId: maya.id,
        questions: Array.from({ length: 13 }, () => "Why?"),
      }),
    ).toEqual({ ok: false, error: { code: "invalid_request" } });
    expect(
      await answerQuestion(caseRepository, {
        caseId: "backlog-fintech-01",
        questions: ["Why?"],
      }),
    ).toEqual({ ok: false, error: { code: "case_not_found" } });
  });
});
