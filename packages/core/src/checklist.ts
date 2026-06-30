import type { ChecklistItem, ValidationResult } from './types.js';

/**
 * Map a {@link ValidationResult} to a presentation-neutral checklist. Both the
 * web component and the React component render from this, so pass/warn/fail
 * presentation stays identical and lives in one place.
 */
export function toChecklist(result: ValidationResult): ChecklistItem[] {
  return result.checks.map((c) => ({
    id: c.id,
    label: c.label,
    group: c.group,
    status: c.status,
    message: c.message,
    details: c.details ?? [],
  }));
}
