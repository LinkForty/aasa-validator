import { describe, expect, it } from 'vitest';
import { buildValidateUrl } from '../src/index.js';

describe('buildValidateUrl', () => {
  it('builds an absolute endpoint URL with the domain', () => {
    expect(buildValidateUrl('https://api.test/validate', 'example.com')).toBe(
      'https://api.test/validate?domain=example.com',
    );
  });

  it('keeps relative endpoints relative', () => {
    expect(buildValidateUrl('/validate', 'example.com')).toBe('/validate?domain=example.com');
  });

  it('appends only the identifier options that are set', () => {
    expect(
      buildValidateUrl('/validate', 'example.com', { teamID: 'ABCDE12345', bundleID: 'com.x.y' }),
    ).toBe('/validate?domain=example.com&teamID=ABCDE12345&bundleID=com.x.y');
  });

  it('encodes special characters', () => {
    expect(buildValidateUrl('/validate', 'ex ample.com', { appID: 'A.B C' })).toContain(
      'domain=ex+ample.com',
    );
  });
});
