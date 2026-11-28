module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are not allowed.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment: 'Domain code depends only on itself and shared/domain.',
      from: { path: '^src/(shared|modules/[^/]+)/domain/' },
      to: {
        dependencyTypes: ['local'],
        pathNot: ['^src/shared/domain/', '^src/$1/domain/'],
      },
    },
    {
      name: 'domain-no-external-packages',
      severity: 'error',
      comment:
        'Domain must not import NestJS, MikroORM, AWS SDK or any npm package except the decimal library.',
      from: { path: '(^src/shared/domain/|^src/modules/[^/]+/domain/)' },
      to: {
        dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer'],
        pathNot: '^node_modules/big\\.js/',
      },
    },
    {
      name: 'application-depends-on-domain-only',
      severity: 'error',
      comment: 'Application layer must not import infrastructure or presentation.',
      from: { path: '^src/(shared|modules/[^/]+)/application/' },
      to: { path: '^src/(shared|modules/[^/]+)/(infrastructure|presentation)/' },
    },
    {
      name: 'nothing-depends-on-presentation',
      severity: 'error',
      comment:
        'Presentation is an entry point; only module wiring and other presentation code import it.',
      from: {
        path: '^src/',
        pathNot: [
          '^src/modules/[^/]+/[^/]+\\.module\\.ts$',
          '^src/app\\.module\\.ts$',
          '^src/modules/[^/]+/presentation/',
        ],
      },
      to: { path: '^src/modules/[^/]+/presentation/' },
    },
    {
      name: 'shared-does-not-know-modules',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'messaging-does-not-know-business',
      severity: 'error',
      from: { path: '^src/modules/messaging/' },
      to: { path: '^src/modules/(?!messaging/)' },
    },
    {
      name: 'cross-module-through-application-only',
      severity: 'error',
      comment:
        'Another module is reached only through its application layer (ports, contracts) or its Nest module.',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/(?!$1/)[^/]+/',
        pathNot: ['^src/modules/[^/]+/application/', '^src/modules/[^/]+/[^/]+\\.module\\.ts$'],
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
  },
};
