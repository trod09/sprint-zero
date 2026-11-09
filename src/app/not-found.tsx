import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";

export default function NotFound() {
  const messages = getMessages();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-start px-4 py-24 sm:px-6">
      <p className="text-muted-foreground font-mono text-xs tracking-wide uppercase">
        404
      </p>
      <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight">
        {messages.notFound.title}
      </h1>
      <p className="text-muted-foreground mt-2">{messages.notFound.body}</p>
      <Button asChild className="mt-6">
        <Link href="/#modules">{messages.notFound.cta}</Link>
      </Button>
    </div>
  );
}
