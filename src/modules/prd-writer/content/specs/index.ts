/**
 * PRD specifications kept as data (`npm run draft:prd-writer` writes them;
 * people review them as JSON). This file is rewritten by the draft script:
 * add a spec by importing its JSON below.
 */
import { prdSpecDataSchema, type PrdSpecData } from "../../spec-data";

import fixlyRebook from "./fixly-rebook.json";

export const prdSpecData: readonly PrdSpecData[] = [fixlyRebook].map((raw) =>
  prdSpecDataSchema.parse(raw),
);
