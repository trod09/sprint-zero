"use client";

import { CalendarDays, Mail, MessageSquare } from "lucide-react";
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
  "h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none";

const TOGGLE_ICONS = [Mail, CalendarDays, MessageSquare];

export function SettingsScreen({
  regions,
  product,
  accent,
}: {
  regions: Regions;
  product: string;
  accent: string;
}) {
  const t = useMockTabIndex();
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState<"idle" | "confirm" | "deleted">(
    "idle",
  );
  const [toggles, setToggles] = useState([true, false, true]);
  const title = regionProps(regions, "page_title");
  const profile = regionProps(regions, "profile");
  const notifications = regionProps(regions, "notifications");
  const plan = regionProps(regions, "plan");
  const save = regionProps(regions, "save_row");
  const danger = regionProps(regions, "danger");
  const help = regionProps(regions, "help_text");

  const sectionClass =
    title.text("sectionSize") === "large"
      ? "text-2xl font-bold"
      : "text-base font-semibold";
  const values: Record<string, string> = {
    Name: "Alex Morgan",
    Email: `alex@${product.toLowerCase().replace(/\s+/g, "")}.com`,
    "Job title": "",
  };
  const labelStyle = profile.text("labelStyle");

  return (
    <div className="bg-white text-zinc-900">
      <div className="space-y-6 px-6 py-6">
        <Region id="page_title" className="space-y-3">
          <h2
            className={cn(
              title.text("titleSize") === "small"
                ? "text-xs font-medium text-zinc-500"
                : "text-2xl font-semibold tracking-tight",
            )}
          >
            {title.text("title")}
          </h2>
          <div className="flex gap-4 border-b border-zinc-200 text-sm">
            {title.list("tabs").map((tab, index) => (
              <span
                key={tab}
                className={cn(
                  "pb-2",
                  index === 0
                    ? "border-b-2 font-medium text-zinc-900"
                    : "text-zinc-500",
                )}
                style={index === 0 ? { borderColor: accent } : undefined}
              >
                {tab}
              </span>
            ))}
          </div>
        </Region>

        <Region id="profile" className="space-y-3">
          <h3 className={sectionClass}>Profile</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {profile.list("fields").map((field) => (
              <label key={field} className="block space-y-1">
                {labelStyle !== "none" && (
                  <span className="text-sm font-medium text-zinc-800">
                    {field}
                  </span>
                )}
                <input
                  tabIndex={t}
                  defaultValue={values[field] ?? ""}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        </Region>

        <div className="space-y-2">
          <Region id="notifications" className="space-y-2">
            <h3 className={sectionClass}>Notifications</h3>
            {notifications.list("toggles").map((label, index) => {
              const Icon = TOGGLE_ICONS[index % TOGGLE_ICONS.length];
              return (
                <div
                  key={label}
                  className="flex items-center gap-3 text-sm text-zinc-800"
                >
                  <button
                    type="button"
                    role="switch"
                    tabIndex={t}
                    aria-checked={toggles[index]}
                    onClick={() =>
                      setToggles((current) =>
                        current.map((on, i) => (i === index ? !on : on)),
                      )
                    }
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      toggles[index] ? "" : "bg-zinc-300",
                    )}
                    style={toggles[index] ? { background: accent } : undefined}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-4 rounded-full bg-white transition-all",
                        toggles[index] ? "left-4.5" : "left-0.5",
                      )}
                    />
                  </button>
                  {notifications.flag("showLabels") ? (
                    <span>{label}</span>
                  ) : (
                    <Icon className="size-4 text-zinc-500" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </Region>
          <Region id="help_text">
            <p className={noteClass(help.text("tone"))}>{help.text("text")}</p>
          </Region>
        </div>

        <Region id="plan" className="space-y-1">
          <h3 className={sectionClass}>Plan</h3>
          {plan.list("lines").map((line) => (
            <p key={line} className="text-sm text-zinc-700">
              {line}
            </p>
          ))}
          <p
            className="text-sm font-medium underline"
            style={{ color: accent }}
          >
            {plan.text("action")}
          </p>
        </Region>

        <Region id="save_row" className="flex items-center gap-3">
          <button
            type="button"
            tabIndex={t}
            onClick={() => setSaved(true)}
            className="h-9 rounded-md px-4 text-sm font-medium text-white"
            style={{ background: accent }}
          >
            {save.text("label")}
          </button>
          {saved && save.text("onSave") && (
            <span role="status" className="text-sm text-emerald-700">
              {save.text("onSave")}
            </span>
          )}
        </Region>

        <Region id="danger" className="space-y-2 border-t border-zinc-200 pt-4">
          {deleting === "deleted" ? (
            <p role="status" className="text-sm font-medium text-red-700">
              Workspace deleted.
            </p>
          ) : (
            <button
              type="button"
              tabIndex={t}
              onClick={() =>
                setDeleting(danger.flag("confirm") ? "confirm" : "deleted")
              }
              className={cn(
                "h-9 rounded-md px-4 text-sm font-medium",
                danger.text("style") === "primary"
                  ? "w-full text-white"
                  : "border border-red-300 text-red-700",
              )}
              style={
                danger.text("style") === "primary"
                  ? { background: accent }
                  : undefined
              }
            >
              {danger.text("label")}
            </button>
          )}
          {deleting === "confirm" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              This deletes every project for everyone. Type the workspace name
              to confirm.
              <div className="mt-2 flex gap-2">
                <input tabIndex={t} className={cn(inputClass, "max-w-48")} />
                <button
                  type="button"
                  tabIndex={t}
                  onClick={() => setDeleting("idle")}
                  className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Region>
      </div>
    </div>
  );
}
