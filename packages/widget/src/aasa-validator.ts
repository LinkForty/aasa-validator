import {
  type CheckGroup,
  type CheckStatus,
  type ChecklistItem,
  type ValidationResult,
  buildValidateUrl,
  toChecklist,
} from '@linkforty/aasa-core';
import { LitElement, type TemplateResult, css, html, nothing } from 'lit';

const GROUP_LABELS: Record<CheckGroup, string> = {
  hosting: 'Hosting',
  format: 'File format',
  structure: 'Structure',
  identifier: 'Your app',
};

const STATUS_SYMBOL: Record<CheckStatus, string> = {
  pass: '✓',
  warn: '!',
  fail: '✕',
  skip: '–',
};

const GROUP_ORDER: CheckGroup[] = ['hosting', 'format', 'structure', 'identifier'];

/**
 * `<aasa-validator>` — a self-contained UI for validating a domain's AASA file.
 * It calls a backend (`endpoint`) that performs the cross-origin fetch.
 */
export class AASAValidatorElement extends LitElement {
  static override properties = {
    endpoint: { type: String },
    advanced: { type: Boolean },
    _domain: { state: true },
    _appID: { state: true },
    _teamID: { state: true },
    _bundleID: { state: true },
    _loading: { state: true },
    _error: { state: true },
    _result: { state: true },
  };

  declare endpoint: string;
  declare advanced: boolean;
  declare _domain: string;
  declare _appID: string;
  declare _teamID: string;
  declare _bundleID: string;
  declare _loading: boolean;
  declare _error: string | null;
  declare _result: ValidationResult | null;

  constructor() {
    super();
    this.endpoint = '/validate';
    this.advanced = false;
    this._domain = '';
    this._appID = '';
    this._teamID = '';
    this._bundleID = '';
    this._loading = false;
    this._error = null;
    this._result = null;
  }

  static override styles = css`
    :host {
      --aasa-pass: var(--aasa-color-pass, #1a7f37);
      --aasa-warn: var(--aasa-color-warn, #9a6700);
      --aasa-fail: var(--aasa-color-fail, #cf222e);
      --aasa-skip: var(--aasa-color-skip, #6e7781);
      --aasa-border: var(--aasa-color-border, #d0d7de);
      --aasa-bg: var(--aasa-color-bg, #ffffff);
      --aasa-fg: var(--aasa-color-fg, #1f2328);
      --aasa-accent: var(--aasa-color-accent, #0969da);
      display: block;
      font-family: var(--aasa-font, system-ui, -apple-system, sans-serif);
      color: var(--aasa-fg);
      box-sizing: border-box;
    }
    * { box-sizing: border-box; }
    form { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: flex-end; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1 1 16rem; }
    label { font-size: 0.8rem; font-weight: 600; }
    input {
      padding: 0.55rem 0.65rem;
      border: 1px solid var(--aasa-border);
      border-radius: 6px;
      font-size: 1rem;
      background: var(--aasa-bg);
      color: var(--aasa-fg);
    }
    input:focus-visible { outline: 2px solid var(--aasa-accent); outline-offset: 1px; }
    button {
      padding: 0.55rem 1.1rem;
      border: 0;
      border-radius: 6px;
      background: var(--aasa-accent);
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled { opacity: 0.6; cursor: progress; }
    .advanced-toggle {
      background: none;
      color: var(--aasa-accent);
      padding: 0;
      font-size: 0.85rem;
      font-weight: 500;
      margin-top: 0.5rem;
    }
    .advanced { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .error {
      margin-top: 1rem;
      padding: 0.75rem;
      border: 1px solid var(--aasa-fail);
      border-radius: 6px;
      color: var(--aasa-fail);
    }
    .summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1.25rem 0 0.5rem;
      font-weight: 600;
    }
    .badge { padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.85rem; color: #fff; }
    .badge.ok { background: var(--aasa-pass); }
    .badge.bad { background: var(--aasa-fail); }
    .counts { font-weight: 400; color: var(--aasa-skip); font-size: 0.9rem; }
    .group-title {
      margin: 1rem 0 0.35rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--aasa-skip);
    }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
    li { display: flex; gap: 0.6rem; align-items: flex-start; }
    .icon {
      flex: 0 0 1.3rem;
      height: 1.3rem;
      width: 1.3rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: #fff;
    }
    .icon.pass { background: var(--aasa-pass); }
    .icon.warn { background: var(--aasa-warn); }
    .icon.fail { background: var(--aasa-fail); }
    .icon.skip { background: var(--aasa-skip); }
    .check-label { font-weight: 600; }
    .check-msg { color: var(--aasa-fg); font-size: 0.92rem; }
    .details { margin: 0.25rem 0 0; padding-left: 1rem; font-size: 0.85rem; color: var(--aasa-skip); }
    details.raw { margin-top: 1.25rem; }
    summary { cursor: pointer; font-size: 0.85rem; color: var(--aasa-accent); }
    pre {
      overflow: auto;
      padding: 0.75rem;
      border: 1px solid var(--aasa-border);
      border-radius: 6px;
      font-size: 0.8rem;
    }
  `;

  private async _submit(event: Event) {
    event.preventDefault();
    const domain = this._domain.trim();
    if (!domain) return;
    this._loading = true;
    this._error = null;
    this._result = null;
    try {
      const url = buildValidateUrl(this.endpoint, domain, {
        appID: this._appID.trim() || undefined,
        teamID: this._teamID.trim() || undefined,
        bundleID: this._bundleID.trim() || undefined,
      });
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const body = (await res.json()) as ValidationResult | { error: string };
      if (!res.ok || 'error' in body) {
        throw new Error('error' in body ? body.error : `Request failed (${res.status}).`);
      }
      this._result = body;
      this.dispatchEvent(
        new CustomEvent('aasa-result', { detail: body, bubbles: true, composed: true }),
      );
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Validation failed.';
    } finally {
      this._loading = false;
    }
  }

  private _bind(key: '_domain' | '_appID' | '_teamID' | '_bundleID') {
    return (e: Event) => {
      this[key] = (e.target as HTMLInputElement).value;
    };
  }

  private _renderItem(item: ChecklistItem): TemplateResult {
    return html`<li>
      <span class="icon ${item.status}" aria-hidden="true">${STATUS_SYMBOL[item.status]}</span>
      <div>
        <div class="check-label">${item.label}</div>
        <div class="check-msg">${item.message}</div>
        ${
          item.details.length > 0
            ? html`<ul class="details">
                ${item.details.map((d) => html`<li>${d}</li>`)}
              </ul>`
            : nothing
        }
      </div>
    </li>`;
  }

  private _renderResult(result: ValidationResult): TemplateResult {
    const items = toChecklist(result);
    const { summary } = result;
    return html`
      <div class="summary">
        <span class="badge ${result.ok ? 'ok' : 'bad'}">${result.ok ? 'Valid' : 'Issues found'}</span>
        <span class="counts">
          ${summary.pass} passed · ${summary.warn} warnings · ${summary.fail} failed
        </span>
      </div>
      ${GROUP_ORDER.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return nothing;
        return html`
          <div class="group-title">${GROUP_LABELS[group]}</div>
          <ul>
            ${groupItems.map((i) => this._renderItem(i))}
          </ul>
        `;
      })}
      ${
        result.raw
          ? html`<details class="raw">
              <summary>View AASA file</summary>
              <pre>${result.raw}</pre>
            </details>`
          : nothing
      }
    `;
  }

  override render() {
    return html`
      <form @submit=${this._submit}>
        <div class="field">
          <label for="aasa-domain">Domain</label>
          <input
            id="aasa-domain"
            type="text"
            placeholder="example.com"
            .value=${this._domain}
            @input=${this._bind('_domain')}
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <button type="submit" ?disabled=${this._loading}>
          ${this._loading ? 'Checking…' : 'Validate'}
        </button>
        ${
          this.advanced
            ? html`
                <div class="advanced">
                  <div class="field">
                    <label for="aasa-appid">App ID (optional)</label>
                    <input
                      id="aasa-appid"
                      type="text"
                      placeholder="ABCDE12345.com.example.app"
                      .value=${this._appID}
                      @input=${this._bind('_appID')}
                    />
                  </div>
                  <div class="field">
                    <label for="aasa-team">Team ID (optional)</label>
                    <input
                      id="aasa-team"
                      type="text"
                      placeholder="ABCDE12345"
                      .value=${this._teamID}
                      @input=${this._bind('_teamID')}
                    />
                  </div>
                  <div class="field">
                    <label for="aasa-bundle">Bundle ID (optional)</label>
                    <input
                      id="aasa-bundle"
                      type="text"
                      placeholder="com.example.app"
                      .value=${this._bundleID}
                      @input=${this._bind('_bundleID')}
                    />
                  </div>
                </div>
              `
            : nothing
        }
      </form>
      ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      ${this._result ? this._renderResult(this._result) : nothing}
    `;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('aasa-validator')) {
  customElements.define('aasa-validator', AASAValidatorElement);
}

declare global {
  interface HTMLElementTagNameMap {
    'aasa-validator': AASAValidatorElement;
  }
}
