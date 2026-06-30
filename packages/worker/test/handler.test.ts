import type { ValidationResult } from '@linkforty/aasa-core';
import { describe, expect, it, vi } from 'vitest';
import { createHandler } from '../src/index.js';

const fakeResult: ValidationResult = {
  domain: 'example.com',
  ok: true,
  fetchedFrom: 'https://example.com/.well-known/apple-app-site-association',
  location: 'well-known',
  checks: [],
  summary: { pass: 0, warn: 0, fail: 0, skip: 0 },
  raw: '{}',
  parsed: {},
};

function req(path: string, method = 'GET') {
  return new Request(`https://api.test${path}`, { method });
}

describe('worker handler', () => {
  it('validates and returns JSON with CORS', async () => {
    const validate = vi.fn().mockResolvedValue(fakeResult);
    const res = await createHandler({ validate }).fetch(req('/validate?domain=example.com'));
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.json()).toEqual(fakeResult);
    expect(validate).toHaveBeenCalledWith('example.com', {
      appID: undefined,
      teamID: undefined,
      bundleID: undefined,
    });
  });

  it('forwards identifier options', async () => {
    const validate = vi.fn().mockResolvedValue(fakeResult);
    await createHandler({ validate }).fetch(
      req('/validate?domain=example.com&appID=ABCDE12345.com.example.app'),
    );
    expect(validate).toHaveBeenCalledWith('example.com', {
      appID: 'ABCDE12345.com.example.app',
      teamID: undefined,
      bundleID: undefined,
    });
  });

  it('returns 400 when domain is missing', async () => {
    const res = await createHandler({ validate: vi.fn() }).fetch(req('/validate'));
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown paths', async () => {
    const res = await createHandler({ validate: vi.fn() }).fetch(req('/nope'));
    expect(res.status).toBe(404);
  });

  it('handles preflight', async () => {
    const res = await createHandler({ validate: vi.fn() }).fetch(req('/validate', 'OPTIONS'));
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-methods')).toContain('GET');
  });

  it('returns 500 when the validator throws', async () => {
    const validate = vi.fn().mockRejectedValue(new Error('boom'));
    const res = await createHandler({ validate }).fetch(req('/validate?domain=example.com'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'boom' });
  });
});
