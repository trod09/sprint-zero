import { Badge } from "@/components/ui/badge";
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
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
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
  const { company, experiment } = publicCase;
  const { plan } = experiment;

  return (
    <div className="space-y-8">
      <section aria-labelledby="case-title" className="space-y-5">
        <div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <span className="text-foreground font-medium">{company.name}</span>
            <span aria-hidden="true">·</span>
            <span>{company.industry}</span>
            <span aria-hidden="true">·</span>
            <span>{company.stage}</span>
            <Badge variant="outline" className="ml-1">
              {messages.difficulty[publicCase.difficulty]}
            </Badge>
          </div>
          <h1
            id="case-title"
            className="font-heading mt-2 text-2xl font-semibold tracking-tight text-balance"
          >
            {publicCase.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {company.description}
          </p>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {copy.label}
          </h2>
          <p className="mt-2 leading-relaxed text-pretty">{publicCase.brief}</p>
        </div>

        <section
          aria-labelledby="design-title"
          className="bg-card rounded-xl border p-4"
        >
          <h2 id="design-title" className="font-heading font-semibold">
            {copy.design}: {experiment.name}
          </h2>
          <dl className="mt-3 grid gap-4 md:grid-cols-2">
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
        </section>
      </section>
      <Readout publicCase={publicCase} submit={submit} />
    </div>
  );
}
