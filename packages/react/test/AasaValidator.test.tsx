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

  describe('class hooks and layout props', () => {
    async function validate(props: Parameters<typeof AasaValidator>[0] = {}) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => result }));
      const view = render(<AasaValidator {...props} />);
      fireEvent.change(screen.getByLabelText('Domain'), { target: { value: 'example.com' } });
      fireEvent.click(screen.getByRole('button', { name: 'Validate' }));
      await waitFor(() => expect(screen.getByText('Issues found')).toBeDefined());
      vi.unstubAllGlobals();
      return view.container;
    }

    it('keeps the default rendering: inline styles on, no source line, no raw file', async () => {
      const root = await validate();
      const button = root.querySelector<HTMLElement>('.aasa-button');
      expect(button?.style.padding).toBe('0.55rem 1.1rem');
      expect(root.querySelector<HTMLElement>('.aasa')?.style.fontFamily).toContain('--aasa-font');
      expect(root.querySelector('.aasa-source')).toBeNull();
      expect(root.querySelector('.aasa-raw')).toBeNull();
      expect(root.querySelector('details')).toBeNull();
    });

    it('puts a stable class name on the root and every section', async () => {
      const root = await validate({ className: 'host', advanced: true });
      expect(root.firstElementChild?.className).toBe('aasa host');
      for (const cls of [
        'aasa-form',
        'aasa-field-domain',
        'aasa-input',
        'aasa-button',
        'aasa-advanced',
        'aasa-result',
        'aasa-summary',
        'aasa-badge-issues',
        'aasa-counts',
        'aasa-group-hosting',
        'aasa-group-identifier',
        'aasa-group-title',
        'aasa-list',
        'aasa-item-pass',
        'aasa-item-fail',
        'aasa-icon',
        'aasa-check-label',
        'aasa-check-message',
        'aasa-details',
      ]) {
        expect(root.querySelector(`.${cls}`), cls).not.toBeNull();
      }
    });

    it('drops every built-in inline style when unstyled, but keeps the host style', async () => {
      const root = await validate({ unstyled: true, advanced: true, style: { maxWidth: 600 } });
      const styled = [...root.querySelectorAll<HTMLElement>('[style]')];
      expect(styled.map((e) => e.className)).toEqual(['aasa']);
      expect(root.querySelector<HTMLElement>('.aasa')?.style.maxWidth).toBe('600px');
    });

    it('shows the source URL and the raw file when asked', async () => {
      const root = await validate({ showSource: true, showRaw: true });
      expect(root.querySelector('.aasa-source')?.textContent).toBe(
        `Fetched from ${result.fetchedFrom}`,
      );
      const raw = root.querySelector('details.aasa-raw');
      expect(raw?.querySelector('summary')?.textContent).toBe('Raw file');
      expect(raw?.querySelector('pre')?.textContent).toBe('{}');
    });

    it('renders the raw file through renderRaw', async () => {
      const root = await validate({
        showRaw: true,
        renderRaw: (raw) => <code>{`len ${raw.length}`}</code>,
      });
      expect(root.querySelector('.aasa-raw pre code')?.textContent).toBe('len 2');
    });

    it('collapses the advanced fields into a details element', () => {
      const { container } = render(
        <AasaValidator advanced collapseAdvanced advancedSummary="Check your app" />,
      );
      const details = container.querySelector('details.aasa-advanced-toggle');
      expect(details?.querySelector('summary')?.textContent).toBe('Check your app');
      expect(details?.querySelector('#aasa-appid')).not.toBeNull();
    });
  });
});
