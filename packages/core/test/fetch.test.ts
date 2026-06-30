import { describe, expect, it, vi } from 'vitest';
import { fetchAASA, fetchAndValidate, normalizeDomain } from '../src/index.js';
import { MODERN } from './fixtures.js';

describe('normalizeDomain', () => {
  it.each([
    ['https://example.com/path?q=1', 'example.com'],
    ['http://Example.com:8443/', 'example.com'],
    ['example.com.', 'example.com'],
    ['  example.com  ', 'example.com'],
    ['sub.example.com/.well-known/apple-app-site-association', 'sub.example.com'],
  ])('normalizes %s -> %s', (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });
});

function jsonResponse(body: string, init: ResponseInit & { url?: string } = {}) {
  const res = new Response(body, {
    status: init.status ?? 200,
    headers: init.headers ?? { 'content-type': 'application/json' },
  });
  Object.defineProperty(res, 'url', {
    value: init.url ?? 'https://example.com/.well-known/apple-app-site-association',
  });
  return res;
}

describe('fetchAASA', () => {
  it('uses the .well-known location when it returns 200', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(MODERN));
    const result = await fetchAASA('example.com', { fetchImpl });
    expect(result.location).toBe('well-known');
    expect(result.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toContain('/.well-known/apple-app-site-association');
  });

  it('falls back to the root path when .well-known 404s', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse('not found', { status: 404 }))
      .mockResolvedValueOnce(
        jsonResponse(MODERN, { url: 'https://example.com/apple-app-site-association' }),
      );
    const result = await fetchAASA('example.com', { fetchImpl });
    expect(result.location).toBe('root');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('reports location null when neither path serves the file', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse('nope', { status: 404 }));
    const result = await fetchAASA('example.com', { fetchImpl });
    expect(result.location).toBeNull();
    expect(result.status).toBe(404);
  });

  it('captures network errors', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ENOTFOUND'));
    const result = await fetchAASA('nope.invalid', { fetchImpl });
    expect(result.status).toBeNull();
    expect(result.error).toContain('ENOTFOUND');
  });
});

describe('fetchAndValidate', () => {
  it('fetches then validates end to end', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(MODERN));
    const result = await fetchAndValidate('https://example.com/', {}, { fetchImpl });
    expect(result.ok).toBe(true);
    expect(result.domain).toBe('example.com');
    expect(result.parsed?.applinks?.details?.[0]?.appIDs?.[0]).toBe('ABCDE12345.com.example.app');
  });
});
