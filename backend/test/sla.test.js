import test from "node:test";
import assert from "node:assert/strict";
import { slaDeadline, SLA_HOURS } from "../lib/sla.js";

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);
const HOUR = 60 * 60 * 1000;

test("deadline is priority hours after now", () => {
  assert.equal(slaDeadline("critical", NOW).getTime(), NOW + 1 * HOUR);
  assert.equal(slaDeadline("high", NOW).getTime(), NOW + 4 * HOUR);
  assert.equal(slaDeadline("medium", NOW).getTime(), NOW + 24 * HOUR);
  assert.equal(slaDeadline("low", NOW).getTime(), NOW + 72 * HOUR);
});

test("unknown or missing priority falls back to the medium window", () => {
  assert.equal(slaDeadline("urgent", NOW).getTime(), NOW + SLA_HOURS.medium * HOUR);
  assert.equal(slaDeadline(undefined, NOW).getTime(), NOW + SLA_HOURS.medium * HOUR);
});

test("windows get longer as priority drops", () => {
  assert.ok(SLA_HOURS.critical < SLA_HOURS.high);
  assert.ok(SLA_HOURS.high < SLA_HOURS.medium);
  assert.ok(SLA_HOURS.medium < SLA_HOURS.low);
});
