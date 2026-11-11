"use client";

/**
 * The sign-in card: Google, or a magic link by email, for signing in or
 * creating an account. Everything goes through `src/lib/auth.ts`, which
 * says "not configured" until accounts exist.
 */
import Link from "next/link";
import { useState, useTransition } from "react";

import { PixelIcon } from "@/components/arcade/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getMessages } from "@/i18n";
import {
  isValidEmail,
  requestMagicLink,
  signInWithGoogle,
  type AuthResult,
} from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "sign_in" | "sign_up";
type Notice = { tone: "info" | "error" | "success"; text: string } | null;

/** A plain four-color "G" mark, drawn in pixels like the rest of the UI. */
function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      className="size-4"
    >
      <path fill="#ea4335" d="M2 0h4v1H2zM1 1h1v1H1zM6 1h1v1H6z" />
      <path fill="#fbbc05" d="M0 2h1v4H0zM1 6h1v1H1z" />
      <path fill="#34a853" d="M2 7h4v1H2zM6 6h1v1H6z" />
      <path fill="#4285f4" d="M4 3h4v1H4zM7 4h1v2H7z" />
    </svg>
  );
}

export function LoginForm() {
  const copy = getMessages().auth.card;
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();

  const emailInvalid = touched && email !== "" && !isValidEmail(email);

  const show = (result: AuthResult, sentTo?: string) => {
    if (result.ok) {
      setNotice(sentTo ? { tone: "success", text: copy.sent(sentTo) } : null);
      return;
    }
    setNotice(
      result.reason === "not_configured"
        ? { tone: "info", text: copy.notConfigured }
        : result.reason === "invalid_email"
          ? { tone: "error", text: copy.invalidEmail }
          : { tone: "error", text: copy.failed },
    );
  };

  return (
    <section
      aria-labelledby="login-title"
      className="pixel-card relative flex flex-col gap-6 p-6 sm:p-8"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-pixel text-ink flex items-center gap-2 text-sm tracking-widest uppercase">
            <span
              aria-hidden="true"
              className="border-frame bg-primary inline-block size-3 rounded-full border-2"
            />
            {copy.eyebrow}
          </p>
          <SegmentedControl<Mode>
            label={copy.modes}
            value={mode}
            onValueChange={(next) => {
              setMode(next);
              setNotice(null);
            }}
            options={[
              { value: "sign_in", label: copy.signIn },
              { value: "sign_up", label: copy.signUp },
            ]}
          />
        </div>
        <div>
          <h2 id="login-title" className="font-pixel text-3xl leading-tight">
            {mode === "sign_in" ? copy.titleSignIn : copy.titleSignUp}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "sign_in" ? copy.subtitleSignIn : copy.subtitleSignUp}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => show(await signInWithGoogle()))
        }
      >
        <GoogleMark />
        {copy.google}
      </Button>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-border h-0.5 flex-1" aria-hidden="true" />
        {copy.or}
        <span className="bg-border h-0.5 flex-1" aria-hidden="true" />
      </div>

      <form
        className="space-y-3"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          const address = email.trim();
          startTransition(async () =>
            show(await requestMagicLink(address), address),
          );
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="login-email">{copy.email}</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            aria-invalid={emailInvalid || undefined}
            aria-describedby="login-email-hint"
            onBlur={() => setTouched(true)}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11"
          />
          <p id="login-email-hint" className="text-muted-foreground text-xs">
            {emailInvalid ? copy.invalidEmail : copy.noPassword}
          </p>
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending || email.trim() === ""}
        >
          {pending ? copy.sending : copy.magicLink}
          <PixelIcon name="play" size={12} />
        </Button>
      </form>

      {notice && (
        <p
          role="status"
          className={cn(
            "animate-pixel-pop rounded-md border-2 px-3 py-2 text-sm",
            notice.tone === "error" && "border-destructive bg-destructive/10",
            notice.tone === "info" && "border-warning bg-warning/10",
            notice.tone === "success" && "border-success bg-success/10",
          )}
        >
          {notice.text}
        </p>
      )}

      <div className="border-border space-y-2 rounded-md border-2 border-dashed p-4">
        <p className="font-pixel text-ink text-xs tracking-wide uppercase">
          {copy.perksTitle}
        </p>
        <ul className="space-y-1.5 text-sm">
          {copy.perks.map((perk, index) => (
            <li key={perk} className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5">
                <PixelIcon
                  name={(["xp", "star", "level"] as const)[index % 3]}
                  size={14}
                />
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 pt-4">
        <p className="text-muted-foreground text-xs">{copy.guestHint}</p>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            {copy.guest}
            <PixelIcon name="play" size={10} />
          </Link>
        </Button>
      </div>
    </section>
  );
}
