/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'queries-not-import-commands',
      severity: 'error',
      comment: 'CQRS read handlers must not depend on CQRS write command handlers (ARCH-04).',
      from: {
        path: '(^|/)queries/.*\\.(ts|js)$',
      },
      to: {
        path: '(^|/)commands/.*\\.(ts|js)$',
      },
    },
    {
      name: 'commands-not-import-queries',
      severity: 'error',
      comment: 'CQRS write command handlers must not depend on CQRS query handlers (ARCH-04).',
      from: {
        path: '(^|/)commands/.*\\.(ts|js)$',
      },
      to: {
        path: '(^|/)queries/.*\\.(ts|js)$',
      },
    },
    {
      name: 'apps-never-import-backend',
      severity: 'error',
      comment: 'Client applications must never import backend service code directly (ARCH-01, ARCH-03).',
      from: {
        path: '^apps/',
      },
      to: {
        path: '^services/',
      },
    },
    {
      name: 'desktop-not-import-admin',
      severity: 'error',
      comment: 'apps/desktop and apps/admin-portal are isolated client applications.',
      from: {
        path: '^apps/desktop/',
      },
      to: {
        path: '^apps/admin-portal/',
      },
    },
    {
      name: 'admin-not-import-desktop',
      severity: 'error',
      comment: 'apps/admin-portal and apps/desktop are isolated client applications.',
      from: {
        path: '^apps/admin-portal/',
      },
      to: {
        path: '^apps/desktop/',
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies break deterministic module initialization and tree-shaking.',
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: [
        '(^|/)node_modules(/|$)',
        '(^|/)\\.next(/|$)',
        '(^|/)dist(/|$)',
        '(^|/)target(/|$)',
        '(^|/)coverage(/|$)',
      ],
    },
    baseline: {
      mode: 'shrink-only',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
