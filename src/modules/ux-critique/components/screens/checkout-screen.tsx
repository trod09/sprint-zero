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

export function CheckoutScreen({
  regions,
  product,
  accent,
}: {
  regions: Regions;
  product: string;
  accent: string;
}) {
  const t = useMockTabIndex();
  const [promoApplied, setPromoApplied] = useState(false);
  const [emptied, setEmptied] = useState(false);
  const [paid, setPaid] = useState(false);
  const header = regionProps(regions, "header");
  const shipping = regionProps(regions, "shipping");
  const delivery = regionProps(regions, "delivery");
  const promo = regionProps(regions, "promo");
  const summary = regionProps(regions, "summary");
  const order = regionProps(regions, "place_order");
  const note = regionProps(regions, "footer_note");
  const placeholderOnly = shipping.text("labelStyle") === "placeholder";
  const current = header.number("current");
  const primaryStyle = { background: accent };

  return (
    <div className="bg-white text-zinc-900">
      <Region id="header" className="border-b border-zinc-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: accent }}>
            {product}
          </span>
          <ol className="flex gap-3 text-xs">
            {header.list("steps").map((step, index) => (
              <li
                key={step}
                className={cn(
                  index === current
                    ? "font-semibold text-zinc-900"
                    : "text-zinc-500",
                )}
              >
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </div>
      </Region>

      <div className="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="space-y-5">
          <Region id="shipping" className="space-y-3">
            <h3 className="font-semibold">Delivery address</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {shipping.list("fields").map((field) => (
                <label key={field} className="block space-y-1">
                  {!placeholderOnly && (
                    <span className="text-sm font-medium text-zinc-800">
                      {field}
                    </span>
                  )}
                  <input
                    tabIndex={t}
                    placeholder={placeholderOnly ? field : ""}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          </Region>

          <Region id="delivery" className="space-y-2">
            <h3 className="font-semibold">Delivery</h3>
            {delivery.list("options").map((option, index) => (
              <label
                key={option}
                className="flex items-center gap-2 rounded-md border border-zinc-300 p-2.5 text-sm"
              >
                <input
                  type="radio"
                  name="delivery-option"
                  tabIndex={t}
                  defaultChecked={index === 0}
                />
                {option}
              </label>
            ))}
          </Region>

          <Region id="promo" className="space-y-2">
            <h3 className="font-semibold">Promo code</h3>
            <div className="flex gap-2">
              <input
                tabIndex={t}
                defaultValue="SAVE10"
                className={cn(inputClass, "max-w-40")}
              />
              <button
                type="button"
                tabIndex={t}
                onClick={() => setPromoApplied(true)}
                className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium"
              >
                Apply
              </button>
            </div>
            {promoApplied && promo.text("result") && (
              <p role="status" className="text-sm text-emerald-700">
                {promo.text("result")}
              </p>
            )}
          </Region>
        </div>

        <div className="space-y-4">
          <Region id="summary" className="rounded-lg bg-zinc-50 p-4">
            <h3 className="font-semibold">Order summary</h3>
            {emptied ? (
              <p className="mt-2 text-sm text-zinc-600">Your cart is empty.</p>
            ) : (
              <dl className="mt-2 space-y-1.5 text-sm">
                {summary.pairs("lines").map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-zinc-600">{label}</dt>
                    <dd>
                      {label === "Items (12)" &&
                      promoApplied &&
                      promo.text("result")
                        ? "$34.61"
                        : value}
                    </dd>
                  </div>
                ))}
                {summary.text("total") && (
                  <div className="flex justify-between border-t border-zinc-200 pt-2 text-lg font-semibold">
                    <dt>Total</dt>
                    <dd>{summary.text("total")}</dd>
                  </div>
                )}
              </dl>
            )}
          </Region>

          <Region id="place_order" className="space-y-2">
            <button
              type="button"
              tabIndex={t}
              onClick={() => setPaid(true)}
              className="h-10 w-full rounded-md text-sm font-medium text-white"
              style={primaryStyle}
            >
              {order.text("primary")}
            </button>
            {order.text("secondaryStyle") === "primary" ? (
              <button
                type="button"
                tabIndex={t}
                onClick={() => {
                  if (order.text("secondaryEffect") === "empty") {
                    setEmptied(true);
                  }
                }}
                className="h-10 w-full rounded-md text-sm font-medium text-white"
                style={primaryStyle}
              >
                {order.text("secondary")}
              </button>
            ) : (
              <p className="text-center text-sm text-zinc-600 underline">
                {order.text("secondary")}
              </p>
            )}
            {paid && (
              <p role="status" className="text-xs text-zinc-500">
                (Mock screen: no payment is made.)
              </p>
            )}
          </Region>

          <Region id="footer_note">
            <p className={noteClass(note.text("tone"))}>{note.text("text")}</p>
          </Region>
        </div>
      </div>
    </div>
  );
}
