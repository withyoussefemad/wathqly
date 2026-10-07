import type { AutomationCondition, AutomationRepeatInterval } from "@/schemas/automation";

export type AutomationEvent = Record<string, unknown>;

export function matchesAutomationConditions(conditions: AutomationCondition[], event: AutomationEvent): boolean {
  return conditions.every(({ field, operator, value }) => {
    const actual = event[field];
    if (actual === null || actual === undefined) return false;
    const normalizedActual = String(actual).toLocaleLowerCase();
    const normalizedValue = value.toLocaleLowerCase();
    if (operator === "equals") return normalizedActual === normalizedValue;
    if (operator === "not_equals") return normalizedActual !== normalizedValue;
    return normalizedActual.includes(normalizedValue);
  });
}

export function getNextAutomationRun(runAt: Date, interval: AutomationRepeatInterval): Date | null {
  if (interval === "once") return null;
  const nextRun = new Date(runAt);
  if (interval === "daily") nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  if (interval === "weekly") nextRun.setUTCDate(nextRun.getUTCDate() + 7);
  if (interval === "monthly") {
    const dayOfMonth = nextRun.getUTCDate();
    nextRun.setUTCDate(1);
    nextRun.setUTCMonth(nextRun.getUTCMonth() + 1);
    const lastDay = new Date(Date.UTC(nextRun.getUTCFullYear(), nextRun.getUTCMonth() + 1, 0)).getUTCDate();
    nextRun.setUTCDate(Math.min(dayOfMonth, lastDay));
  }
  return nextRun;
}
