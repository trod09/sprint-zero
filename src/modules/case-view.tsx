/**
 * Renders a case with the right module's interface. Server component.
 *
 * Adding a playable module means adding its case view here.
 */
import type { PublicBaseCase } from "@/core/case-engine";

import { ProductCaseView } from "./product-case/components/product-case-view";
import { publicProductCaseSchema } from "./product-case/schema";
import { UxCaseView } from "./ux-critique/components/ux-case-view";
import { publicUxCritiqueCaseSchema } from "./ux-critique/schema";
import { TriageCaseView } from "./feedback-triage/components/triage-case-view";
import { publicFeedbackTriageCaseSchema } from "./feedback-triage/schema";
import { AbTestCaseView } from "./ab-test/components/ab-test-case-view";
import { publicAbTestCaseSchema } from "./ab-test/schema";
import { BacklogCaseView } from "./backlog/components/backlog-case-view";
import type { SubmitAttempt } from "./backlog/components/backlog-workspace";
import { publicBacklogCaseSchema } from "./backlog/schema";
import { MetricDropCaseView } from "./metric-drop/components/metric-drop-case-view";
import { publicMetricDropCaseSchema } from "./metric-drop/schema";

export function CaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicBaseCase;
  submit: SubmitAttempt;
}) {
  switch (publicCase.moduleId) {
    case "backlog":
      return (
        <BacklogCaseView
          publicCase={publicBacklogCaseSchema.parse(publicCase)}
          submit={submit}
        />
      );
    case "metric-drop":
      return (
        <MetricDropCaseView
          publicCase={publicMetricDropCaseSchema.parse(publicCase)}
          submit={submit}
        />
      );
    case "ab-test":
      return (
        <AbTestCaseView
          publicCase={publicAbTestCaseSchema.parse(publicCase)}
          submit={submit}
        />
      );
    case "feedback-triage":
      return (
        <TriageCaseView
          publicCase={publicFeedbackTriageCaseSchema.parse(publicCase)}
          submit={submit}
        />
      );
    case "ux-critique":
      return (
        <UxCaseView
          publicCase={publicUxCritiqueCaseSchema.parse(publicCase)}
          submit={submit}
        />
      );
    case "product-case":
      return (
        <ProductCaseView
          publicCase={publicProductCaseSchema.parse(publicCase)}
          submit={submit}
        />
      );
    default:
      return null;
  }
}
