"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const messages = getMessages();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-start px-4 py-24 sm:px-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {messages.errors.title}
      </h1>
      <p className="text-muted-foreground mt-2">{messages.errors.body}</p>
      <div className="mt-6 flex gap-2">
        <Button type="button" onClick={reset}>
          {messages.errors.retry}
        </Button>
        <Button asChild variant="outline">
          <Link href="/#modules">{messages.notFound.cta}</Link>
        </Button>
      </div>
    </div>
  );
}
