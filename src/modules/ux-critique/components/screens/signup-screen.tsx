"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  noteClass,
  Region,
  regionProps,
  type Regions,
  useMockTabIndex,
} from "./region";

const inputClass =
  "h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none";

export function SignupScreen({
  regions,
  product,
  accent,
}: {
  regions: Regions;
  product: string;
  accent: string;
}) {
  const t = useMockTabIndex();
  const [submitted, setSubmitted] = useState(false);
  const header = regionProps(regions, "header");
  const title = regionProps(regions, "title");
  const social = regionProps(regions, "social");
  const form = regionProps(regions, "form");
  const consent = regionProps(regions, "consent");
  const actions = regionProps(regions, "actions");
  const note = regionProps(regions, "trial_note");

  const heading = (
    <h2
      className={cn(
        "text-zinc-900",
        title.text("headingSize") === "small"
          ? "text-sm font-normal"
          : "text-2xl font-semibold tracking-tight",
      )}
    >
      {title.text("heading")}
    </h2>
  );
  const subtitle = (
    <p className="text-sm text-zinc-600">{title.text("subtitle")}</p>
  );
  const placeholderOnly = form.text("labelStyle") === "placeholder";
  const primaryStyle = { background: accent };

  return (
    <div className="bg-white text-zinc-900">
      <Region id="header" className="border-b border-zinc-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: accent }}>
            {product}
          </span>
          <nav className="flex gap-4 text-sm text-zinc-600">
            {header.list("links").map((link) => (
              <span key={link}>{link}</span>
            ))}
          </nav>
        </div>
      </Region>

      <div className="mx-auto max-w-sm space-y-5 px-6 py-8">
        <Region id="title" className="space-y-1 text-center">
          {title.flag("subtitleFirst") ? (
            <>
              {subtitle}
              {heading}
            </>
          ) : (
            <>
              {heading}
              {subtitle}
            </>
          )}
        </Region>

        <Region id="social" className="space-y-2">
          {social.flag("showLabels") ? (
            social.list("buttons").map((label) => (
              <button
                key={label}
                type="button"
                tabIndex={t}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 text-sm font-medium"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white">
                  {label.includes("Google") ? "G" : "A"}
                </span>
                {label}
              </button>
            ))
          ) : (
            <div className="flex justify-center gap-3">
              {social.list("buttons").map((label) => (
                <button
                  key={label}
                  type="button"
                  tabIndex={t}
                  className="flex size-10 items-center justify-center rounded-md border border-zinc-300"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white">
                    {label.includes("Google") ? "G" : "A"}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="text-center text-xs text-zinc-500">or</p>
        </Region>

        <Region id="form" className="space-y-3">
          {form.list("fields").map((field) => (
            <label key={field} className="block space-y-1">
              {!placeholderOnly && (
                <span className="text-sm font-medium text-zinc-800">
                  {field}
                </span>
              )}
              <input
                tabIndex={t}
                type={
                  field.toLowerCase().includes("password") ? "password" : "text"
                }
                placeholder={placeholderOnly ? field : ""}
                className={inputClass}
              />
              {field === "Password" && form.text("hint") && (
                <span className="text-xs text-zinc-500">
                  {form.text("hint")}
                </span>
              )}
            </label>
          ))}
        </Region>

        <Region id="consent">
          <label className="flex items-start gap-2 text-xs text-zinc-700">
            <input type="checkbox" tabIndex={t} className="mt-0.5" />
            <span>{consent.text("text")}</span>
          </label>
        </Region>

        <Region id="actions" className="space-y-2">
          <button
            type="button"
            tabIndex={t}
            onClick={() => setSubmitted(true)}
            className="h-10 w-full rounded-md text-sm font-medium text-white"
            style={primaryStyle}
          >
            {actions.text("primary")}
          </button>
          {actions.text("secondaryStyle") === "primary" ? (
            <button
              type="button"
              tabIndex={t}
              className="h-10 w-full rounded-md text-sm font-medium text-white"
              style={primaryStyle}
            >
              {actions.text("secondary")}
            </button>
          ) : (
            <p className="text-center text-sm text-zinc-600 underline">
              {actions.text("secondary")}
            </p>
          )}
          {submitted && actions.text("onSubmit") && (
            <p
              role="status"
              className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800"
            >
              {actions.text("onSubmit")}
            </p>
          )}
        </Region>

        <Region id="trial_note">
          <p className={cn("text-center", noteClass(note.text("tone")))}>
            {note.text("text")}
          </p>
        </Region>
      </div>
    </div>
  );
}
