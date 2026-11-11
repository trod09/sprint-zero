/** The panel that holds a product preview phone, with its caption. */
import type { ReactNode } from "react";

import { Panel } from "@/components/arcade/panel";
import { getMessages } from "@/i18n";

import { PhoneFrame } from "./phone-frame";

export function ProductPreview({
  company,
  children,
}: {
  company: string;
  children: ReactNode;
}) {
  const copy = getMessages().preview;
  return (
    <Panel icon="phone" title={copy.title} subtitle={copy.subtitle}>
      <PhoneFrame label={copy.label(company)}>{children}</PhoneFrame>
    </Panel>
  );
}
