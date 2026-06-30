import {
  type CheckGroup,
  type CheckStatus,
  type ChecklistItem,
  type ValidationResult,
  buildValidateUrl,
  toChecklist,
} from '@linkforty/aasa-core';
import { type CSSProperties, type FormEvent, useState } from 'react';

const GROUP_LABELS: Record<CheckGroup, string> = {
  hosting: 'Hosting',
  format: 'File format',
  structure: 'Structure',
  identifier: 'Your app',
};

const GROUP_ORDER: CheckGroup[] = ['hosting', 'format', 'structure', 'identifier'];

const STATUS_SYMBOL: Record<CheckStatus, string> = { pass: '✓', warn: '!', fail: '✕', skip: '–' };
const STATUS_VAR: Record<CheckStatus, string> = {
  pass: 'var(--aasa-color-pass, #1a7f37)',
  warn: 'var(--aasa-color-warn, #9a6700)',
  fail: 'var(--aasa-color-fail, #cf222e)',
  skip: 'var(--aasa-color-skip, #6e7781)',
};

const ACCENT = 'var(--aasa-color-accent, #0969da)';
const BORDER = 'var(--aasa-color-border, #d0d7de)';
const FG = 'var(--aasa-color-fg, #1f2328)';
const SKIP = 'var(--aasa-color-skip, #6e7781)';

const s = {
  root: {
    fontFamily: 'var(--aasa-font, system-ui, -apple-system, sans-serif)',
    color: FG,
    boxSizing: 'border-box',
  },
  form: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 16rem' },
  label: { fontSize: '0.8rem', fontWeight: 600 },
  input: {
    padding: '0.55rem 0.65rem',
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    fontSize: '1rem',
  },
  button: {
    padding: '0.55rem 1.1rem',
    border: 0,
    borderRadius: 6,
    background: ACCENT,
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  advanced: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.5rem',
    width: '100%',
  },
  error: {
    marginTop: '1rem',
    padding: '0.75rem',
    border: `1px solid ${STATUS_VAR.fail}`,
    borderRadius: 6,
    color: STATUS_VAR.fail,
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1.25rem 0 0.5rem',
    fontWeight: 600,
  },
  counts: { fontWeight: 400, color: SKIP, fontSize: '0.9rem' },
  groupTitle: {
    margin: '1rem 0 0.35rem',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: SKIP,
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  item: { display: 'flex', gap: '0.6rem', alignItems: 'flex-start' },
  icon: {
    flex: '0 0 1.3rem',
    height: '1.3rem',
    width: '1.3rem',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#fff',
  },
  checkLabel: { fontWeight: 600 },
  checkMsg: { fontSize: '0.92rem' },
  details: { margin: '0.25rem 0 0', paddingLeft: '1rem', fontSize: '0.85rem', color: SKIP },
} satisfies Record<string, CSSProperties>;

function badgeStyle(ok: boolean): CSSProperties {
  return {
    padding: '0.15rem 0.6rem',
    borderRadius: 999,
    fontSize: '0.85rem',
    color: '#fff',
    background: ok ? STATUS_VAR.pass : STATUS_VAR.fail,
  };
}

export interface AasaValidatorProps {
  /** Backend `/validate` endpoint URL (default `/validate`). */
  endpoint?: string;
  /** Show optional App ID / Team ID / Bundle ID fields. */
  advanced?: boolean;
  /** Called with the result after each successful validation. */
  onResult?: (result: ValidationResult) => void;
  /** Extra props applied to the root element (e.g. className, style). */
  className?: string;
  style?: CSSProperties;
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <li style={s.item}>
      <span style={{ ...s.icon, background: STATUS_VAR[item.status] }} aria-hidden>
        {STATUS_SYMBOL[item.status]}
      </span>
      <div>
        <div style={s.checkLabel}>{item.label}</div>
        <div style={s.checkMsg}>{item.message}</div>
        {item.details.length > 0 && (
          <ul style={s.details}>
            {item.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function AasaValidator({
  endpoint = '/validate',
  advanced = false,
  onResult,
  className,
  style,
}: AasaValidatorProps) {
  const [domain, setDomain] = useState('');
  const [appID, setAppID] = useState('');
  const [teamID, setTeamID] = useState('');
  const [bundleID, setBundleID] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const d = domain.trim();
    if (!d) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const url = buildValidateUrl(endpoint, d, {
        appID: appID.trim() || undefined,
        teamID: teamID.trim() || undefined,
        bundleID: bundleID.trim() || undefined,
      });
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const body = (await res.json()) as ValidationResult | { error: string };
      if (!res.ok || 'error' in body) {
        throw new Error('error' in body ? body.error : `Request failed (${res.status}).`);
      }
      setResult(body);
      onResult?.(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed.');
    } finally {
      setLoading(false);
    }
  }

  const items = result ? toChecklist(result) : [];

  return (
    <div className={className} style={{ ...s.root, ...style }}>
      <form style={s.form} onSubmit={onSubmit}>
        <div style={s.field}>
          <label style={s.label} htmlFor="aasa-domain">
            Domain
          </label>
          <input
            id="aasa-domain"
            style={s.input}
            type="text"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button style={s.button} type="submit" disabled={loading}>
          {loading ? 'Checking…' : 'Validate'}
        </button>
        {advanced && (
          <div style={s.advanced}>
            <div style={s.field}>
              <label style={s.label} htmlFor="aasa-appid">
                App ID (optional)
              </label>
              <input
                id="aasa-appid"
                style={s.input}
                type="text"
                placeholder="ABCDE12345.com.example.app"
                value={appID}
                onChange={(e) => setAppID(e.target.value)}
              />
            </div>
            <div style={s.field}>
              <label style={s.label} htmlFor="aasa-team">
                Team ID (optional)
              </label>
              <input
                id="aasa-team"
                style={s.input}
                type="text"
                placeholder="ABCDE12345"
                value={teamID}
                onChange={(e) => setTeamID(e.target.value)}
              />
            </div>
            <div style={s.field}>
              <label style={s.label} htmlFor="aasa-bundle">
                Bundle ID (optional)
              </label>
              <input
                id="aasa-bundle"
                style={s.input}
                type="text"
                placeholder="com.example.app"
                value={bundleID}
                onChange={(e) => setBundleID(e.target.value)}
              />
            </div>
          </div>
        )}
      </form>

      {error && (
        <div style={s.error} role="alert">
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={s.summary}>
            <span style={badgeStyle(result.ok)}>{result.ok ? 'Valid' : 'Issues found'}</span>
            <span style={s.counts}>
              {result.summary.pass} passed · {result.summary.warn} warnings · {result.summary.fail}{' '}
              failed
            </span>
          </div>
          {GROUP_ORDER.map((group) => {
            const groupItems = items.filter((i) => i.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group}>
                <div style={s.groupTitle}>{GROUP_LABELS[group]}</div>
                <ul style={s.list}>
                  {groupItems.map((i) => (
                    <ChecklistRow key={i.id} item={i} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
