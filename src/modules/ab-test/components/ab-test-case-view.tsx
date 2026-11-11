import { CaseHeader } from "@/components/arcade/case-header";
import { Panel } from "@/components/arcade/panel";
import { getMessages } from "@/i18n";
import { formatInteger } from "@/lib/format";

import type { PublicAbTestCase } from "../schema";
import { Readout, type SubmitAttempt } from "./readout";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-pixel text-ink text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

/** A full A/B test case: the ask and the design, then the readout. */
export function AbTestCaseView({
  publicCase,
  submit,
}: {
  publicCase: PublicAbTestCase;
  submit: SubmitAttempt;
}) {
  const messages = getMessages();
  const copy = messages.abTest.brief;
  const { experiment } = publicCase;
  const { plan } = experiment;

  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <CaseHeader publicCase={publicCase} />

        <Panel icon="flag" title={copy.label}>
          <p className="leading-relaxed text-pretty">{publicCase.brief}</p>
        </Panel>

        <Panel
          icon="bulb"
          id="design-title"
          title={`${copy.design}: ${experiment.name}`}
        >
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label={copy.change}>{experiment.change}</Field>
            <Field label={copy.hypothesis}>{experiment.hypothesis}</Field>
            <Field label={copy.primaryMetric}>
              <span className="font-medium">
                {experiment.primaryMetric.label}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · {experiment.primaryMetric.description}
              </span>
            </Field>
            <Field label={copy.guardrails}>
              <ul className="space-y-1">
                {experiment.guardrails.map((guardrail) => (
                  <li key={guardrail.key}>
                    <span className="font-medium">{guardrail.label}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {guardrail.description}{" "}
                      {copy.tolerance(
                        guardrail.tolerance,
                        guardrail.goodDirection === "down",
                      )}
                      .
                    </span>
                  </li>
                ))}
              </ul>
            </Field>
            <Field label={copy.plan}>
              <ul className="space-y-0.5">
                <li>{copy.split(Math.round(plan.treatmentShare * 100))}</li>
                <li>{copy.duration(plan.days)}</li>
                <li>
                  {copy.sample(
                    formatInteger(plan.samplePerArm),
                    `${Math.round(plan.mde * 100)}%`,
                  )}
                </li>
              </ul>
            </Field>
          </dl>
        </Panel>
      </section>
      <Readout publicCase={publicCase} submit={submit} />
    </div>
  );
}
