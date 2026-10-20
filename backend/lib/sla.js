// SLA deadlines by priority (hours). Unknown priorities fall back to the "medium" window.
export const SLA_HOURS = { critical: 1, high: 4, medium: 24, low: 72 };

export function slaDeadline(priority, now = Date.now()) {
  const hours = SLA_HOURS[priority] || SLA_HOURS.medium;
  return new Date(now + hours * 60 * 60 * 1000);
}
