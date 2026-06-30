/** Raw AASA file bodies used across the test suite. */

export const MODERN = JSON.stringify({
  applinks: {
    details: [
      {
        appIDs: ['ABCDE12345.com.example.app'],
        components: [
          { '/': '/products/*', comment: 'Product pages' },
          { '/': '/', exclude: true },
        ],
      },
    ],
  },
});

export const LEGACY = JSON.stringify({
  applinks: {
    apps: [],
    details: [
      {
        appID: 'ABCDE12345.com.example.app',
        paths: ['/products/*', 'NOT /admin/*'],
      },
    ],
  },
});

export const BOTH_FORMATS = JSON.stringify({
  applinks: {
    apps: [],
    details: [
      {
        appID: 'ABCDE12345.com.example.app',
        appIDs: ['ABCDE12345.com.example.app'],
        paths: ['/products/*'],
        components: [{ '/': '/products/*' }],
      },
    ],
  },
});

export const WEBCREDENTIALS_ONLY = JSON.stringify({
  webcredentials: { apps: ['ABCDE12345.com.example.app'] },
});

export const APPS_NOT_EMPTY = JSON.stringify({
  applinks: {
    apps: ['ABCDE12345.com.example.app'],
    details: [{ appID: 'ABCDE12345.com.example.app', paths: ['*'] }],
  },
});

export const DETAIL_NO_COMPONENTS = JSON.stringify({
  applinks: { details: [{ appIDs: ['ABCDE12345.com.example.app'] }] },
});

export const MALFORMED_APPID = JSON.stringify({
  applinks: { details: [{ appIDs: ['not-an-app-id'], components: [{ '/': '/*' }] }] },
});

export const UNKNOWN_COMPONENT_KEY = JSON.stringify({
  applinks: {
    details: [{ appIDs: ['ABCDE12345.com.example.app'], components: [{ '/': '/*', bogus: 1 }] }],
  },
});

export const NO_RECOGNIZED_KEYS = JSON.stringify({ something: 'else' });

export const INVALID_JSON = '{ "applinks": { "details": [ ';

export const WITH_BOM = `﻿${MODERN}`;
