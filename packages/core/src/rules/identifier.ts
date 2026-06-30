import { check } from '../check.js';
import type { AASAFile, Check, ValidateOptions } from '../types.js';
import { collectAppIDs } from './structure.js';

/**
 * When the caller supplies an app ID / team ID / bundle ID, confirm a matching
 * entry exists. This is reported separately from file validity: the file can be
 * perfectly valid yet not contain *your* identifier.
 */
export function checkIdentifier(parsed: AASAFile, options: ValidateOptions): Check {
  const { appID, teamID, bundleID } = options;
  if (!appID && !teamID && !bundleID) {
    return check('identifier-match', 'skip', 'No identifier supplied to check.');
  }

  const ids = collectAppIDs(parsed);

  let predicate: (id: string) => boolean;
  let wanted: string;
  if (appID) {
    wanted = appID;
    predicate = (id) => id === appID;
  } else if (teamID && bundleID) {
    wanted = `${teamID}.${bundleID}`;
    predicate = (id) => id === wanted;
  } else if (bundleID) {
    wanted = `*.${bundleID}`;
    predicate = (id) => id.endsWith(`.${bundleID}`);
  } else {
    wanted = `${teamID}.*`;
    predicate = (id) => id.startsWith(`${teamID}.`);
  }

  if (ids.some(predicate)) {
    return check('identifier-match', 'pass', `Found a matching app ID for "${wanted}".`);
  }
  return check(
    'identifier-match',
    'fail',
    `The file is missing an app ID matching "${wanted}".`,
    ids.length > 0 ? [`App IDs in the file: ${ids.join(', ')}`] : ['The file lists no app IDs.'],
  );
}
