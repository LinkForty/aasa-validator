import {
  type ValidateOptions,
  type ValidationResult,
  fetchAndValidate,
} from '@linkforty/aasa-core';
import express, { type Express, type Request, type Response } from 'express';

/** Validator function shape — injectable so the app can be tested offline. */
export type Validator = (domain: string, options?: ValidateOptions) => Promise<ValidationResult>;

export interface AppDeps {
  validate?: Validator;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Build the Express app exposing `GET /validate`. */
export function createApp({ validate = fetchAndValidate }: AppDeps = {}): Express {
  const app = express();

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.options('/validate', (_req, res) => res.sendStatus(204));

  app.get('/validate', async (req: Request, res: Response) => {
    const domain = str(req.query.domain);
    if (!domain) {
      res.status(400).json({ error: 'Missing required "domain" query parameter.' });
      return;
    }
    const options: ValidateOptions = {
      appID: str(req.query.appID),
      teamID: str(req.query.teamID),
      bundleID: str(req.query.bundleID),
    };
    try {
      res.json(await validate(domain, options));
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Validation failed.' });
    }
  });

  return app;
}
