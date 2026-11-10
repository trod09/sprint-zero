import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { submitAttempt } from "@/app/actions/attempts";
import { RecordLastCase } from "@/components/arcade/record-last-case";
import { getMessages } from "@/i18n";
import { getModuleMeta } from "@/modules/catalog";
import { CaseView } from "@/modules/case-view";
import { caseRepository, moduleRegistry } from "@/modules/registry.server";

export async function generateStaticParams() {
  const params: { caseId: string }[] = [];
  for (const registered of moduleRegistry.list()) {
    for (const record of await registered.loadCases()) {
      params.push({ caseId: record.id });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: PageProps<"/case/[caseId]">): Promise<Metadata> {
  const { caseId } = await params;
  const publicCase = await caseRepository.getPublicCase(caseId);
  return publicCase
    ? { title: publicCase.title, description: publicCase.company.description }
    : {};
}

export default function CasePage({ params }: PageProps<"/case/[caseId]">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-20 sm:px-6">
      <Suspense fallback={<CaseSkeleton />}>
        <CaseContent params={params} />
      </Suspense>
    </div>
  );
}

async function CaseContent({
  params,
}: {
  params: PageProps<"/case/[caseId]">["params"];
}) {
  const { caseId } = await params;
  // Public view only: the ground truth stays on the server until submit.
  const publicCase = await caseRepository.getPublicCase(caseId);
  if (!publicCase) notFound();
  const meta = getModuleMeta(publicCase.moduleId);
  if (!meta) notFound();
  const messages = getMessages();

  return (
    <>
      <RecordLastCase caseId={publicCase.id} />
      <Link
        href={`/modules/${meta.id}`}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-md text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {messages.caseView.backToModule(meta.name)}
      </Link>
      <div className="mt-5">
        <CaseView publicCase={publicCase} submit={submitAttempt} />
      </div>
    </>
  );
}

function CaseSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="bg-muted h-4 w-40 rounded" />
      <div className="space-y-2">
        <div className="bg-muted h-4 w-56 rounded" />
        <div className="bg-muted h-7 w-96 max-w-full rounded" />
      </div>
      <div className="bg-muted h-40 rounded-md" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="bg-muted h-96 rounded-md" />
        <div className="bg-muted h-72 rounded-md" />
      </div>
    </div>
  );
}
