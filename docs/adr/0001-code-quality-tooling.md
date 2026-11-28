# ADR 0001 — Code quality tooling and conventions

- **Status:** accepted
- **Date:** 2026-11-27

## Context

The service must be correct under concurrency and keep a pure domain (no framework, ORM or SDK
in domain code). Quality gates have to run locally (git hooks) and in CI, on Bun 1.4, with
NestJS 12 (decorators and `emitDecoratorMetadata`).

## Decision

| Concern | Tool | Configuration |
|---|---|---|
| Type checking | TypeScript 6.0 (`tsc --noEmit`) | `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `isolatedModules`, decorator metadata. |
| Linting | oxlint (type-aware) | `.oxlintrc.json`: `correctness` and `suspicious` as errors, plus floating/misused promises, no `any`, no import cycles, no `console`. |
| Formatting | Biome (formatter only) | `biome.json`: 2 spaces, 100 columns, single quotes, trailing commas. |
| Architecture boundaries | dependency-cruiser | `.dependency-cruiser.cjs` (rules below). |
| Git hooks | lefthook | Pre-commit: format, type-check, lint, architecture. Commit message: commitlint. |
| Commit messages | commitlint | Conventional Commits. |

### Architecture rules

1. `no-circular` — no circular dependencies.
2. `domain-is-pure` — domain code imports only its own module's domain and `shared/domain`.
3. `domain-no-external-packages` — domain imports no npm package except the decimal library.
4. `application-depends-on-domain-only` — the application layer never imports infrastructure or presentation.
5. `nothing-depends-on-presentation` — only Nest module wiring imports controllers and handlers.
6. `shared-does-not-know-modules` — `shared` never imports a module.
7. `messaging-does-not-know-business` — `messaging` never imports `wagering`.
8. `cross-module-through-application-only` — a module reaches another only through its application layer or its Nest module.

### Lint rule adjustments

| Rule | Setting | Reason |
|---|---|---|
| `typescript/no-extraneous-class` | `allowWithDecorator: true` | NestJS modules are decorated classes, often empty or exposing only a static `forRoot()`. |
| `import/no-unassigned-import` | allows `reflect-metadata` | `reflect-metadata` is imported only for its side effect, before any decorated class loads. |
| `typescript/no-unsafe-class-instance-assignment` | off | NestJS types its option bags as classes; passing object literals is its documented API. |
| `no-warning-comments` | error | Pending work is tracked outside the code, never as `TODO`/`FIXME` comments. |
| `no-underscore-dangle` | off | Aggregates keep mutable state in `_field` members exposed through getters, as in the challenge's model skeletons. |
| `typescript/no-unsafe-type-assertion`, `no-unsafe-enum-assignment` | off in `src/modules/*/infrastructure/persistence/**` | Mappers narrow database strings to domain enums; the column values are already constrained by `CHECK` constraints. |
| `typescript/no-unsafe-type-assertion`, `no-unsafe-enum-comparison`, `restrict-template-expressions` | off in `*.spec.ts` and `test/**` | Tests read untyped JSON responses and SQL rows and assert on them. |

Rule 5 (`nothing-depends-on-presentation`) lets presentation files import each other inside a
module (request contracts and mappers shared by the HTTP controllers and the SQS handler).

### Comments policy

- No inline comments in code or configuration files.
- Design rationale lives in `ARCHITECTURE.md` and in ADRs under `docs/adr/`.
- A doc comment (TSDoc) is allowed only on a public contract whose behaviour cannot be expressed
  through names and types, and must describe the contract, not the implementation.

### Runtime for tooling

dependency-cruiser declares support for Node `^22 || ^24 || >=26`; it runs under Bun
(`bun --bun depcruise`) so the project depends on a single runtime.

## Consequences

- A boundary violation, a floating promise or an unformatted file fails the commit and CI.
- Rule adjustments are explicit and justified here; any new adjustment requires updating this ADR.
