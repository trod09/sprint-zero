/**
 * Pregenerated PRD Writer cases (`npm run generate:prd-writer`). Server only:
 * they hold the ratings, the right scope and the ideal one-pager. This file
 * is written by the script.
 */
import "server-only";

import coinpathRoundUps from "./prd-writer-coinpath-round-ups.json";
import fixlyRebook from "./prd-writer-fixly-rebook.json";
import shiftlyShiftSwaps from "./prd-writer-shiftly-shift-swaps.json";
import trailheadOfflineMaps from "./prd-writer-trailhead-offline-maps.json";

export const prdRawCases: readonly unknown[] = [
  trailheadOfflineMaps,
  coinpathRoundUps,
  shiftlyShiftSwaps,
  fixlyRebook,
];
