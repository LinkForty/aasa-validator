import { describe, expect, it } from 'vitest';
import { toChecklist, validate } from '../src/index.js';
import type { ValidateOptions } from '../src/types.js';
import * as fx from './fixtures.js';
import { makeFetched, statusOf } from './helpers.js';

function run(body: string | null, opts: ValidateOptions = {}, fetchedOverrides = {}) {
  return validate({
    domain: 'example.com',
    fetched: makeFetched(body, fetchedOverrides),
    options: opts,
  });
}

describe('valid files', () => {
  it('passes a modern file', () => {
    const r = run(fx.MODERN);
    expect(r.ok).toBe(true);
    expect(statusOf(r, 'valid-json')).toBe('pass');
    expect(statusOf(r, 'applinks-structure')).toBe('pass');
    expect(statusOf(r, 'appid-format')).toBe('pass');
    expect(statusOf(r, 'components')).toBe('pass');
    expect(statusOf(r, 'identifier-match')).toBe('skip');
  });

  it('accepts a legacy file but warns about format coverage', () => {
    const r = run(fx.LEGACY);
    expect(r.ok).toBe(true);
    expect(statusOf(r, 'applinks-structure')).toBe('warn');
  });

  it('passes a file with both formats and no warnings', () => {
    const r = run(fx.BOTH_FORMATS);
    expect(r.ok).toBe(true);
    expect(statusOf(r, 'applinks-structure')).toBe('pass');
  });
});

describe('hosting checks', () => {
  it('fails when unreachable and skips everything else', () => {
    const r = run(null, {}, { status: null, location: null, error: 'getaddrinfo ENOTFOUND' });
    expect(r.ok).toBe(false);
    expect(statusOf(r, 'reachable')).toBe('fail');
    expect(statusOf(r, 'valid-json')).toBe('skip');
  });

  it('fails on non-200 and skips parsing', () => {
    const r = run('Not Found', {}, { status: 404, location: null, body: 'Not Found' });
    expect(r.ok).toBe(false);
    expect(statusOf(r, 'http-status')).toBe('fail');
    expect(statusOf(r, 'location')).toBe('fail');
    expect(statusOf(r, 'valid-json')).toBe('skip');
  });

  it('fails on redirect', () => {
    const r = run(fx.MODERN, {}, { redirected: true, finalUrl: 'https://example.com/aasa' });
    expect(statusOf(r, 'no-redirect')).toBe('fail');
    expect(r.ok).toBe(false);
  });

  it('fails on HTTPS downgrade', () => {
    const r = run(fx.MODERN, {}, { finalUrl: 'http://example.com/apple-app-site-association' });
    expect(statusOf(r, 'https')).toBe('fail');
  });

  it('warns when only served from the legacy root path', () => {
    const r = run(fx.MODERN, {}, { location: 'root' });
    expect(statusOf(r, 'location')).toBe('warn');
    expect(r.ok).toBe(true);
  });
});

describe('format checks', () => {
  it('warns on wrong content-type but stays ok', () => {
    const r = run(fx.MODERN, {}, { contentType: 'text/html' });
    expect(statusOf(r, 'content-type')).toBe('warn');
    expect(r.ok).toBe(true);
  });

  it('warns on a BOM but still parses', () => {
    const r = run(fx.WITH_BOM);
    expect(statusOf(r, 'no-bom')).toBe('warn');
    expect(statusOf(r, 'valid-json')).toBe('pass');
  });

  it('warns on a file extension in the URL', () => {
    const r = run(
      fx.MODERN,
      {},
      { finalUrl: 'https://example.com/apple-app-site-association.json' },
    );
    expect(statusOf(r, 'no-extension')).toBe('warn');
  });

  it('warns on a large file', () => {
    const r = run(fx.MODERN, {}, { byteLength: 200 * 1024 });
    expect(statusOf(r, 'size')).toBe('warn');
  });

  it('fails on invalid JSON and skips structure', () => {
    const r = run(fx.INVALID_JSON);
    expect(statusOf(r, 'valid-json')).toBe('fail');
    expect(statusOf(r, 'applinks-structure')).toBe('skip');
    expect(r.ok).toBe(false);
    expect(r.parsed).toBeNull();
  });
});

describe('structure checks', () => {
  it('fails when no recognized top-level keys', () => {
    const r = run(fx.NO_RECOGNIZED_KEYS);
    expect(statusOf(r, 'top-level-keys')).toBe('fail');
    expect(r.ok).toBe(false);
  });

  it('warns and skips applinks rules when only webcredentials present', () => {
    const r = run(fx.WEBCREDENTIALS_ONLY);
    expect(statusOf(r, 'top-level-keys')).toBe('warn');
    expect(statusOf(r, 'applinks-structure')).toBe('skip');
  });

  it('fails when legacy apps array is not empty', () => {
    const r = run(fx.APPS_NOT_EMPTY);
    expect(statusOf(r, 'applinks-structure')).toBe('fail');
  });

  it('warns when a detail has no components or paths', () => {
    const r = run(fx.DETAIL_NO_COMPONENTS);
    expect(statusOf(r, 'applinks-structure')).toBe('warn');
  });

  it('fails on a malformed app ID', () => {
    const r = run(fx.MALFORMED_APPID);
    expect(statusOf(r, 'appid-format')).toBe('fail');
    expect(r.ok).toBe(false);
  });

  it('warns on an unknown component key', () => {
    const r = run(fx.UNKNOWN_COMPONENT_KEY);
    expect(statusOf(r, 'components')).toBe('warn');
  });
});

describe('identifier matching', () => {
  it('passes when the full appID is present', () => {
    const r = run(fx.MODERN, { appID: 'ABCDE12345.com.example.app' });
    expect(statusOf(r, 'identifier-match')).toBe('pass');
  });

  it('matches on team + bundle id', () => {
    const r = run(fx.MODERN, { teamID: 'ABCDE12345', bundleID: 'com.example.app' });
    expect(statusOf(r, 'identifier-match')).toBe('pass');
  });

  it('matches on bundle id alone', () => {
    const r = run(fx.MODERN, { bundleID: 'com.example.app' });
    expect(statusOf(r, 'identifier-match')).toBe('pass');
  });

  it('fails when the identifier is missing from an otherwise valid file', () => {
    const r = run(fx.MODERN, { appID: 'ZZZZZ99999.com.other.app' });
    expect(statusOf(r, 'identifier-match')).toBe('fail');
    expect(r.ok).toBe(false);
    // structural checks still pass — the file is valid, just missing the id
    expect(statusOf(r, 'applinks-structure')).toBe('pass');
  });
});

describe('toChecklist', () => {
  it('returns one item per check with details defaulted', () => {
    const r = run(fx.MODERN);
    const list = toChecklist(r);
    expect(list).toHaveLength(r.checks.length);
    for (const item of list) expect(Array.isArray(item.details)).toBe(true);
  });
});
