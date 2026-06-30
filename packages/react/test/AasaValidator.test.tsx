import type { ValidationResult } from '@linkforty/aasa-core';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AasaValidator } from '../src/index.js';

const result: ValidationResult = {
  domain: 'example.com',
  ok: false,
  fetchedFrom: 'https://example.com/.well-known/apple-app-site-association',
  location: 'well-known',
  checks: [
    { id: 'https', label: 'Served over HTTPS', group: 'hosting', status: 'pass', message: 'ok' },
    {
      id: 'identifier-match',
      label: 'Your identifier is present',
      group: 'identifier',
      status: 'fail',
      message: 'missing',
      details: ['App IDs in the file: ABCDE12345.com.example.app'],
    },
  ],
  summary: { pass: 1, warn: 0, fail: 1, skip: 0 },
  raw: '{}',
  parsed: {},
};

afterEach(cleanup);

describe('<AasaValidator>', () => {
  it('renders the form', () => {
    render(<AasaValidator endpoint="/validate" />);
    expect(screen.getByLabelText('Domain')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Validate' })).toBeDefined();
  });

  it('fetches and renders grouped results on submit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => result,
    });
    vi.stubGlobal('fetch', fetchMock);
    const onResult = vi.fn();

    render(<AasaValidator endpoint="https://api.test/validate" onResult={onResult} />);
    fireEvent.change(screen.getByLabelText('Domain'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => expect(screen.getByText('Issues found')).toBeDefined());
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/validate?domain=example.com',
      expect.anything(),
    );
    expect(screen.getByText('Served over HTTPS')).toBeDefined();
    expect(screen.getByText('Hosting')).toBeDefined();
    expect(screen.getByText('Your app')).toBeDefined();
    expect(onResult).toHaveBeenCalledWith(result);

    vi.unstubAllGlobals();
  });

  it('shows an error when the backend fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'boom' }) }),
    );
    render(<AasaValidator />);
    fireEvent.change(screen.getByLabelText('Domain'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('boom'));
    vi.unstubAllGlobals();
  });
});
