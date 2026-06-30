import {
  type ValidateOptions,
  type ValidationResult,
  fetchAndValidate,
} from '@linkforty/aasa-core';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/** Validator function shape — injectable so the handler can be tested offline. */
export type Validator = (domain: string, options?: ValidateOptions) => Promise<ValidationResult>;

export interface HandlerDeps {
  validate?: Validator;
}

/** Build the Worker fetch handler. Defaults to the real network validator. */
export function createHandler({ validate = fetchAndValidate }: HandlerDeps = {}) {
  return {
    async fetch(request: Request): Promise<Response> {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      const url = new URL(request.url);
      if (url.pathname !== '/validate') {
        return json({ error: 'Not found. Use GET /validate?domain=example.com' }, 404);
      }

      const domain = url.searchParams.get('domain');
      if (!domain) {
        return json({ error: 'Missing required "domain" query parameter.' }, 400);
      }

      const options: ValidateOptions = {
        appID: url.searchParams.get('appID') ?? undefined,
        teamID: url.searchParams.get('teamID') ?? undefined,
        bundleID: url.searchParams.get('bundleID') ?? undefined,
      };

      try {
        return json(await validate(domain, options));
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : 'Validation failed.' }, 500);
      }
    },
  };
}

export default createHandler();
