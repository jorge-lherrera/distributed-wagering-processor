# ADR 0002 — Branching strategy

- **Status:** accepted
- **Date:** 2026-11-27

## Context

The service is a single deliverable with one maintainer, delivered in phases, each closed by a
quality gate. There is one production line: no versions supported in parallel and no release
stabilisation period. `main` is what reviewers read.

## Decision

GitHub Flow, with one branch per delivery phase.

- `main` is always green and never receives direct commits; the only exception is the root
  commit that created the repository.
- Each phase is developed on its own branch created from `main`, named by type:
  `feat/…`, `fix/…`, `test/…`, `docs/…`, `chore/…` (for example `chore/f0-foundations`).
- One commit per unit of work, following Conventional Commits. Every commit installs, type-checks
  and runs on its own, so `git bisect` stays usable.
- A phase reaches `main` through a pull request, only after its quality gate and CI pass, using a
  merge commit to keep the per-unit history.
- Merged branches are kept.

### Considered options

| Option | Outcome | Reason |
|---|---|---|
| Git Flow (`develop`, `release/*`, `hotfix/*`) | Rejected | Designed for explicitly versioned software with several supported versions; its author advises a simpler flow for continuously delivered software ([note of reflection](https://nvie.com/posts/a-successful-git-branching-model/)). Here `develop` would duplicate `main` and add a merge per phase. |
| Direct commits to `main` | Rejected | No review point; a phase could reach `main` without passing its gate. |
| Squash merge | Rejected | Collapses the per-unit commits that document how each phase was built. |

## Consequences

- `main` only changes through pull requests that passed the phase quality gate.
- Phase branches live for several days instead of hours, a deliberate deviation from short-lived
  branches; acceptable with a single maintainer and no parallel branches to integrate.
- References: [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow),
  [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/),
  [DORA — trunk-based development](https://dora.dev/capabilities/trunk-based-development/).
