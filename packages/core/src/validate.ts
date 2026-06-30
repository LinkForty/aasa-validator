import { skip } from './check.js';
import {
  checkBom,
  checkContentType,
  checkExtension,
  checkSize,
  parseJson,
} from './rules/format.js';
import {
  checkHttps,
  checkLocation,
  checkReachable,
  checkRedirect,
  checkStatus,
} from './rules/hosting.js';
import { checkIdentifier } from './rules/identifier.js';
import { checkAppIDs, checkApplinks, checkComponents, checkTopLevel } from './rules/structure.js';
import type { AASAFile, Check, CheckId, ValidationInput, ValidationResult } from './types.js';

function summarize(checks: Check[]): ValidationResult['summary'] {
  const summary = { pass: 0, warn: 0, fail: 0, skip: 0 };
  for (const c of checks) summary[c.status]++;
  return summary;
}

function finalize(
  domain: string,
  input: ValidationInput,
  checks: Check[],
  parsed: AASAFile | null,
): ValidationResult {
  const summary = summarize(checks);
  return {
    domain,
    ok: summary.fail === 0,
    fetchedFrom: input.fetched.location ? input.fetched.url : null,
    location: input.fetched.location,
    checks,
    summary,
    raw: input.fetched.body,
    parsed,
  };
}

/**
 * Validate an already-fetched AASA file. Pure and network-free, so it can run
 * anywhere (including the browser) and is the unit under test.
 */
export function validate(input: ValidationInput): ValidationResult {
  const { domain, fetched, options = {} } = input;
  const checks: Check[] = [];
  const downstream: CheckId[] = [
    'no-bom',
    'valid-json',
    'top-level-keys',
    'applinks-structure',
    'appid-format',
    'components',
    'identifier-match',
  ];

  // --- Hosting ---
  const reachable = checkReachable(fetched);
  checks.push(reachable);
  if (reachable.status === 'fail') {
    checks.push(
      ...skip(
        ['location', 'https', 'http-status', 'no-redirect', 'content-type', 'no-extension', 'size'],
        'The domain could not be reached.',
      ),
      ...skip(downstream, 'The domain could not be reached.'),
    );
    return finalize(domain, input, checks, null);
  }

  checks.push(checkLocation(fetched));
  checks.push(checkHttps(fetched));
  const status = checkStatus(fetched);
  checks.push(status);
  checks.push(checkRedirect(fetched));
  checks.push(checkContentType(fetched));
  checks.push(checkExtension(fetched));
  checks.push(checkSize(fetched));

  // --- Format ---
  if (fetched.body == null || status.status === 'fail') {
    checks.push(...skip(downstream, 'No file body was retrieved.'));
    return finalize(domain, input, checks, null);
  }
  const body = fetched.body;

  checks.push(checkBom(body));
  const { check: jsonCheck, parsed } = parseJson(body);
  checks.push(jsonCheck);
  if (!parsed) {
    checks.push(
      ...skip(
        ['top-level-keys', 'applinks-structure', 'appid-format', 'components', 'identifier-match'],
        'The file could not be parsed as JSON.',
      ),
    );
    return finalize(domain, input, checks, null);
  }

  // --- Structure ---
  checks.push(checkTopLevel(parsed));
  if (!parsed.applinks) {
    checks.push(
      ...skip(
        ['applinks-structure', 'appid-format', 'components', 'identifier-match'],
        'The file has no "applinks" key.',
      ),
    );
    return finalize(domain, input, checks, parsed);
  }
  checks.push(checkApplinks(parsed));
  checks.push(checkAppIDs(parsed));
  checks.push(checkComponents(parsed));

  // --- Identifier ---
  checks.push(checkIdentifier(parsed, options));

  return finalize(domain, input, checks, parsed);
}
