import { describe, expect, it, vi } from "vitest";

import type { AIClient, StructuredRequest } from "@/core/ai";
import { prdSpecData } from "@/modules/prd-writer/content/specs";
import { DRAFT_SYSTEM, draftPrdSpec } from "@/modules/prd-writer/draft";
import type { PrdSpecData } from "@/modules/prd-writer/spec-data";

const example = prdSpecData[0];

/** A fresh, valid draft: the example with another company and key. */
const valid: PrdSpecData = {
  ...example,
  key: "loopcart-rebook",
  company: { ...example.company, name: "Loopcart" },
};
const broken: PrdSpecData = {
  ...valid,
  requirements: valid.requirements.filter((r) => r.bucket !== "out"),
};

function mockClient(responses: PrdSpecData[]) {
  const requests: StructuredRequest<never>[] = [];
  const generateStructured = vi.fn(
    async (request: StructuredRequest<never>) => {
      requests.push(request);
      const data =
        responses[Math.min(requests.length - 1, responses.length - 1)];
      return {
        data,
        model: "mock",
        attempts: 1,
        usage: { inputTokens: 100, outputTokens: 50 },
      };
    },
  );
  const client = { model: "mock", generateStructured } as unknown as AIClient;
  return { client, requests };
}

const request = {
  industry: "marketplace" as const,
  difficulty: "senior" as const,
  avoid: ["Fixly (Rebook the same tradesperson)"],
};

describe("drafting a PRD case", () => {
  it("accepts a draft that passes every check in one round", async () => {
    const { client, requests } = mockClient([valid]);
    const outcome = await draftPrdSpec(client, request, example);
    expect(outcome.data?.key).toBe("loopcart-rebook");
    expect(outcome.rounds).toBe(1);
    expect(outcome.usage).toEqual({ inputTokens: 100, outputTokens: 50 });
    const [first] = requests;
    expect(first.system).toBe(DRAFT_SYSTEM);
    expect(first.effort).toBe("high");
    expect(first.prompt).toContain('"marketplace" industry');
    expect(first.prompt).toContain("Fixly (Rebook the same tradesperson)");
    expect(first.prompt).toContain(JSON.stringify(example));
  });

  it("keeps the requested industry and level whatever the model says", async () => {
    const { client } = mockClient([
      { ...valid, industry: "saas", difficulty: "apm" },
    ]);
    const outcome = await draftPrdSpec(client, request, example);
    expect(outcome.data?.industry).toBe("marketplace");
    expect(outcome.data?.difficulty).toBe("senior");
  });

  it("sends the problems back and accepts the fixed draft", async () => {
    const { client, requests } = mockClient([broken, valid]);
    const outcome = await draftPrdSpec(client, request, example);
    expect(outcome.data).not.toBeNull();
    expect(outcome.rounds).toBe(2);
    expect(requests[1].prompt).toContain(
      'no requirement is in the "out" bucket',
    );
    expect(requests[1].prompt).toContain('"loopcart-rebook"');
    expect(outcome.usage.inputTokens).toBe(200);
  });

  it("gives up after the last round with what is still wrong", async () => {
    const { client, requests } = mockClient([broken]);
    const outcome = await draftPrdSpec(client, request, example, 2);
    expect(outcome.data).toBeNull();
    expect(requests).toHaveLength(2);
    expect(outcome.issues.join("\n")).toMatch(/"out" bucket/);
  });
});
