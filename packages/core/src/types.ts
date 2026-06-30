/** Outcome of a single validation check. */
export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip';

/** Logical grouping for display purposes. */
export type CheckGroup = 'hosting' | 'format' | 'structure' | 'identifier';

/** A single validation check result. */
export interface Check {
  /** Stable machine id, e.g. `https`. */
  id: CheckId;
  /** Human-readable label. */
  label: string;
  /** Group the check belongs to. */
  group: CheckGroup;
  status: CheckStatus;
  /** Human-readable summary of the outcome. */
  message: string;
  /** Optional supporting detail lines (e.g. offending app IDs). */
  details?: string[];
}

/** Optional identifiers to confirm against the file. */
export interface ValidateOptions {
  /** Full app ID, e.g. `ABCDE12345.com.example.app`. */
  appID?: string;
  /** 10-character Team ID / app prefix, e.g. `ABCDE12345`. */
  teamID?: string;
  /** Reverse-DNS bundle identifier, e.g. `com.example.app`. */
  bundleID?: string;
}

/** Where the AASA file was served from. */
export type FileLocation = 'well-known' | 'root';

/** Raw result of attempting to fetch an AASA file. */
export interface FetchedFile {
  /** URL that was requested for the chosen location (or the primary attempt). */
  url: string;
  /** Which location served the file, or `null` if none did. */
  location: FileLocation | null;
  /** HTTP status code, or `null` if the request never completed. */
  status: number | null;
  /** Whether the request was redirected before the final response. */
  redirected: boolean;
  /** Final URL after any redirects. */
  finalUrl: string | null;
  /** `Content-Type` response header, lowercased, or `null`. */
  contentType: string | null;
  /** Raw response body, or `null` if the request failed. */
  body: string | null;
  /** Byte length of the body, or `null`. */
  byteLength: number | null;
  /** Network/transport error message, if the fetch itself failed. */
  error?: string;
}

/** Input to the pure {@link validate} function. */
export interface ValidationInput {
  domain: string;
  fetched: FetchedFile;
  options?: ValidateOptions;
}

/** A single component-matching entry in a modern `applinks` detail. */
export interface AASAComponent {
  '/'?: string;
  '?'?: string | Record<string, string>;
  '#'?: string;
  exclude?: boolean;
  comment?: string;
  caseSensitive?: boolean;
  percentEncoded?: boolean;
}

/** A detail entry in `applinks.details` (modern and/or legacy fields). */
export interface AASAAppLinksDetail {
  /** Modern (iOS 13+): one or more app IDs. */
  appIDs?: string[];
  /** Legacy: a single app ID. */
  appID?: string;
  /** Modern (iOS 13+): component matchers. */
  components?: AASAComponent[];
  /** Legacy: path patterns. */
  paths?: string[];
}

export interface AASAAppLinks {
  apps?: string[];
  details?: AASAAppLinksDetail[];
  substitutionVariables?: Record<string, string[]>;
  defaults?: { caseSensitive?: boolean; percentEncoded?: boolean };
}

/** Parsed Apple App Site Association file. */
export interface AASAFile {
  applinks?: AASAAppLinks;
  webcredentials?: { apps?: string[] };
  appclips?: { apps?: string[] };
  [key: string]: unknown;
}

/** Full result of validating a domain's AASA file. */
export interface ValidationResult {
  domain: string;
  /** `true` when there are no `fail` checks. */
  ok: boolean;
  /** URL the file was actually read from, or `null` if it could not be read. */
  fetchedFrom: string | null;
  location: FileLocation | null;
  checks: Check[];
  summary: { pass: number; warn: number; fail: number; skip: number };
  /** Raw file body, or `null`. */
  raw: string | null;
  /** Parsed file if JSON parsing succeeded, else `null`. */
  parsed: AASAFile | null;
}

/** A display-ready, presentation-neutral check (consumed by UIs). */
export interface ChecklistItem {
  id: CheckId;
  label: string;
  group: CheckGroup;
  status: CheckStatus;
  message: string;
  details: string[];
}

/**
 * Single source of truth for every check's id, label, and group.
 * Adding a check means adding an entry here.
 */
export const CHECK_META = {
  reachable: { label: 'Domain reachable', group: 'hosting' },
  location: { label: 'Hosted at /.well-known/', group: 'hosting' },
  https: { label: 'Served over HTTPS', group: 'hosting' },
  'http-status': { label: 'HTTP 200 response', group: 'hosting' },
  'no-redirect': { label: 'No redirects', group: 'hosting' },
  'content-type': { label: 'Content-Type is application/json', group: 'format' },
  'no-extension': { label: 'File has no extension', group: 'format' },
  size: { label: 'Reasonable file size', group: 'format' },
  'no-bom': { label: 'No byte-order mark', group: 'format' },
  'valid-json': { label: 'Valid JSON', group: 'format' },
  'top-level-keys': { label: 'Recognized top-level keys', group: 'structure' },
  'applinks-structure': { label: 'applinks structure', group: 'structure' },
  'appid-format': { label: 'App ID format', group: 'structure' },
  components: { label: 'Component patterns', group: 'structure' },
  'identifier-match': { label: 'Your identifier is present', group: 'identifier' },
} as const satisfies Record<string, { label: string; group: CheckGroup }>;

export type CheckId = keyof typeof CHECK_META;
