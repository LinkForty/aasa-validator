import { check } from '../check.js';
import type { AASAFile, Check } from '../types.js';

const KNOWN_TOP_LEVEL = ['applinks', 'webcredentials', 'appclips'];
const KNOWN_COMPONENT_KEYS = [
  '/',
  '?',
  '#',
  'exclude',
  'comment',
  'caseSensitive',
  'percentEncoded',
];
// Team ID (10 alphanumeric) + "." + reverse-DNS bundle id.
const APPID_RE = /^[A-Za-z0-9]{10}\.[A-Za-z0-9.*-]+$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Which recognized top-level keys are present? */
export function checkTopLevel(parsed: AASAFile): Check {
  const present = KNOWN_TOP_LEVEL.filter((k) => k in parsed);
  if (present.length === 0) {
    return check(
      'top-level-keys',
      'fail',
      'The file has no recognized top-level keys (expected one of: applinks, webcredentials, appclips).',
    );
  }
  if (!('applinks' in parsed)) {
    return check(
      'top-level-keys',
      'warn',
      `Found ${present.join(', ')}, but no "applinks" key. Universal Links require an "applinks" entry.`,
    );
  }
  return check('top-level-keys', 'pass', `Found top-level keys: ${present.join(', ')}.`);
}

/** Collect every app identifier referenced by applinks details. */
export function collectAppIDs(parsed: AASAFile): string[] {
  const ids: string[] = [];
  const details = parsed.applinks?.details;
  if (!Array.isArray(details)) return ids;
  for (const detail of details) {
    if (!isObject(detail)) continue;
    if (typeof detail.appID === 'string') ids.push(detail.appID);
    if (Array.isArray(detail.appIDs)) {
      for (const id of detail.appIDs) if (typeof id === 'string') ids.push(id);
    }
  }
  return ids;
}

/** Validate the shape of the `applinks` object. */
export function checkApplinks(parsed: AASAFile): Check {
  const errors: string[] = [];
  const warnings: string[] = [];

  const applinks = parsed.applinks;
  if (!isObject(applinks)) {
    return check('applinks-structure', 'fail', 'The "applinks" value must be an object.');
  }

  const details = applinks.details;
  if (!Array.isArray(details)) {
    return check(
      'applinks-structure',
      'fail',
      'The "applinks" object must contain a "details" array.',
    );
  }
  if (details.length === 0) {
    warnings.push('"details" is empty, so no apps are associated with this domain.');
  }

  // Legacy files include an "apps" array which must be empty.
  if ('apps' in applinks) {
    if (!Array.isArray(applinks.apps)) {
      errors.push('"apps" must be an array.');
    } else if (applinks.apps.length > 0) {
      errors.push('"apps" must be an empty array ([]).');
    }
  }

  let modernCount = 0;
  let legacyCount = 0;

  details.forEach((detail, i) => {
    if (!isObject(detail)) {
      errors.push(`details[${i}] must be an object.`);
      return;
    }
    const hasModernId = Array.isArray(detail.appIDs);
    const hasLegacyId = typeof detail.appID === 'string';
    const hasComponents = Array.isArray(detail.components);
    const hasPaths = Array.isArray(detail.paths);

    if (!hasModernId && !hasLegacyId) {
      errors.push(`details[${i}] is missing "appIDs" (or legacy "appID").`);
    }
    if (!hasComponents && !hasPaths) {
      warnings.push(
        `details[${i}] has no "components" (or legacy "paths"), so it matches no links.`,
      );
    }
    if (hasModernId || hasComponents) modernCount++;
    if (hasLegacyId || hasPaths) legacyCount++;
  });

  // Coverage hint: modern-only is the current best practice, so it is not flagged.
  // Legacy-only misses iOS 13+ component features, so suggest adopting the modern format.
  if (details.length > 0 && legacyCount > 0 && modernCount === 0) {
    warnings.push(
      'Only the legacy format is used. Consider adding "appIDs"/"components" for iOS 13+ features.',
    );
  }

  if (errors.length > 0) {
    return check('applinks-structure', 'fail', 'The applinks structure has errors.', [
      ...errors,
      ...warnings,
    ]);
  }
  if (warnings.length > 0) {
    return check(
      'applinks-structure',
      'warn',
      'The applinks structure is usable but has warnings.',
      warnings,
    );
  }
  return check('applinks-structure', 'pass', 'The applinks structure is well-formed.');
}

/** Validate the format of every app ID. */
export function checkAppIDs(parsed: AASAFile): Check {
  const ids = collectAppIDs(parsed);
  if (ids.length === 0) {
    return check('appid-format', 'skip', 'No app IDs to check.');
  }
  const malformed = ids.filter((id) => !APPID_RE.test(id));
  if (malformed.length > 0) {
    return check(
      'appid-format',
      'fail',
      'One or more app IDs are malformed. Expected "<TeamID>.<BundleID>", e.g. "ABCDE12345.com.example.app".',
      malformed,
    );
  }
  return check('appid-format', 'pass', `All ${ids.length} app ID(s) are well-formed.`);
}

/** Validate the keys of every component matcher. */
export function checkComponents(parsed: AASAFile): Check {
  const details = parsed.applinks?.details;
  if (!Array.isArray(details)) {
    return check('components', 'skip', 'No components to check.');
  }
  const warnings: string[] = [];
  let componentCount = 0;

  details.forEach((detail, i) => {
    if (!isObject(detail) || !Array.isArray(detail.components)) return;
    detail.components.forEach((component, j) => {
      componentCount++;
      if (!isObject(component)) {
        warnings.push(`details[${i}].components[${j}] must be an object.`);
        return;
      }
      for (const key of Object.keys(component)) {
        if (!KNOWN_COMPONENT_KEYS.includes(key)) {
          warnings.push(`details[${i}].components[${j}] has unknown key "${key}".`);
        }
      }
      if ('/' in component && typeof component['/'] !== 'string') {
        warnings.push(`details[${i}].components[${j}] "/" must be a string.`);
      }
    });
  });

  if (componentCount === 0) {
    return check('components', 'skip', 'No components to check.');
  }
  if (warnings.length > 0) {
    return check('components', 'warn', 'Some component patterns have issues.', warnings);
  }
  return check('components', 'pass', `All ${componentCount} component pattern(s) look valid.`);
}
