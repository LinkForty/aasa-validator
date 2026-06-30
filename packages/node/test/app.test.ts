import type { ValidationResult } from '@linkforty/aasa-core';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

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

describe('node app', () => {
  it('validates and returns JSON with CORS', async () => {
    const validate = vi.fn().mockResolvedValue(fakeResult);
    const res = await request(createApp({ validate })).get('/validate?domain=example.com');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.body).toEqual(fakeResult);
    expect(validate).toHaveBeenCalledWith('example.com', {
      appID: undefined,
      teamID: undefined,
      bundleID: undefined,
    });
  });

  it('forwards identifier options', async () => {
    const validate = vi.fn().mockResolvedValue(fakeResult);
    await request(createApp({ validate })).get(
      '/validate?domain=example.com&teamID=ABCDE12345&bundleID=com.example.app',
    );
    expect(validate).toHaveBeenCalledWith('example.com', {
      appID: undefined,
      teamID: 'ABCDE12345',
      bundleID: 'com.example.app',
    });
  });

  it('returns 400 when domain is missing', async () => {
    const res = await request(createApp({ validate: vi.fn() })).get('/validate');
    expect(res.status).toBe(400);
  });

  it('returns 500 when the validator throws', async () => {
    const validate = vi.fn().mockRejectedValue(new Error('boom'));
    const res = await request(createApp({ validate })).get('/validate?domain=example.com');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });
});
