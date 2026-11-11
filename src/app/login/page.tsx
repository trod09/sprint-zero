import type { Metadata } from "next";

import { AttractScreen } from "@/components/auth/attract-screen";
import { LoginForm } from "@/components/auth/login-form";
import { SKILLS } from "@/core/case-engine";
import { getMessages } from "@/i18n";
import { moduleCatalog } from "@/modules/catalog";
import { listCaseSummaries } from "@/modules/case-summaries.server";

export const metadata: Metadata = { title: getMessages().auth.signIn };

export default async function LoginPage() {
  const cases = await listCaseSummaries();
  const worlds = moduleCatalog
    .filter((meta) => meta.status !== "coming_soon")
    .map(({ id, name }) => ({ id, name }));
  return (
    <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-12">
      <AttractScreen
        worlds={worlds}
        cases={cases.length}
        skills={SKILLS.length}
      />
      <LoginForm />
    </div>
  );
}
