import { CHECK_META, type Check, type CheckId, type CheckStatus } from './types.js';

/** Build a {@link Check}, pulling label + group from the central registry. */
export function check(
  id: CheckId,
  status: CheckStatus,
  message: string,
  details?: string[],
): Check {
  const meta = CHECK_META[id];
  return {
    id,
    label: meta.label,
    group: meta.group,
    status,
    message,
    ...(details && details.length > 0 ? { details } : {}),
  };
}

/** Build `skip` checks for a set of ids that could not run. */
export function skip(ids: CheckId[], message: string): Check[] {
  return ids.map((id) => check(id, 'skip', message));
}
