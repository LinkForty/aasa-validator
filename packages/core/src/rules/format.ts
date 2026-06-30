import { check } from '../check.js';
import type { AASAFile, Check, FetchedFile } from '../types.js';

const MAX_RECOMMENDED_BYTES = 100 * 1024;

/** Content-Type should be application/json (warn-only — Apple is lenient since iOS 9.3). */
export function checkContentType(fetched: FetchedFile): Check {
  const ct = fetched.contentType;
  if (ct == null) {
    return check(
      'content-type',
      'warn',
      'No Content-Type header was returned. application/json is recommended.',
    );
  }
  if (ct.includes('application/json')) {
    return check('content-type', 'pass', `Content-Type is "${ct}".`);
  }
  return check('content-type', 'warn', `Content-Type is "${ct}". application/json is recommended.`);
}

/** The served file should have no file extension. */
export function checkExtension(fetched: FetchedFile): Check {
  const effective = fetched.finalUrl ?? fetched.url;
  let pathname: string;
  try {
    pathname = new URL(effective).pathname;
  } catch {
    pathname = effective;
  }
  const lastSegment = pathname.split('/').pop() ?? '';
  if (lastSegment.includes('.')) {
    return check(
      'no-extension',
      'warn',
      `The file appears to have an extension ("${lastSegment}"). The AASA file must be named "apple-app-site-association" with no extension.`,
    );
  }
  return check('no-extension', 'pass', 'The file has no extension.');
}

/** The file should be reasonably small. */
export function checkSize(fetched: FetchedFile): Check {
  const bytes = fetched.byteLength ?? 0;
  if (bytes > MAX_RECOMMENDED_BYTES) {
    return check(
      'size',
      'warn',
      `The file is ${(bytes / 1024).toFixed(1)} KB. Keep it small (under ~100 KB) so Apple can fetch it reliably.`,
    );
  }
  return check('size', 'pass', `The file is ${(bytes / 1024).toFixed(1)} KB.`);
}

/** The file must not start with a byte-order mark. */
export function checkBom(body: string): Check {
  if (body.charCodeAt(0) === 0xfeff) {
    return check(
      'no-bom',
      'warn',
      'The file begins with a byte-order mark (BOM). Save it as UTF-8 without a BOM.',
    );
  }
  return check('no-bom', 'pass', 'The file has no byte-order mark.');
}

/** Strip a leading BOM if present. */
export function stripBom(body: string): string {
  return body.charCodeAt(0) === 0xfeff ? body.slice(1) : body;
}

/** Parse the file as JSON. Returns the check plus the parsed object (or `null`). */
export function parseJson(body: string): { check: Check; parsed: AASAFile | null } {
  try {
    const parsed = JSON.parse(stripBom(body)) as AASAFile;
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        check: check('valid-json', 'fail', 'The file must be a JSON object.'),
        parsed: null,
      };
    }
    return { check: check('valid-json', 'pass', 'The file is valid JSON.'), parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      check: check('valid-json', 'fail', `The file is not valid JSON: ${message}`),
      parsed: null,
    };
  }
}
