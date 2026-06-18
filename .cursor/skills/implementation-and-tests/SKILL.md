---
name: implementation-and-tests
description: >-
  Requires adding or updating automated tests whenever implementing or changing
  behavior in the Wemotoo CRM Portal. Use when implementing features, fixing
  bugs, adding server routes, repository modules, composables, or when the user
  mentions tests, coverage, TDD, or verification.
---

# Implementation and tests (Wemotoo CRM Portal)

## Rule

**New or changed behavior must ship with tests.** Do not finish implementation without tests that prove the change (or clearly extend existing tests that already cover it).

- **Bugfix**: add or adjust a test that would have failed before the fix.
- **Feature**: add tests for the new public API, route, branch, or regression risk.
- **Refactor** (no behavior change): run existing tests; only add tests if coverage was missing for touched code.

## Where to put tests

| Area | Location | Runner | Notes |
|------|----------|--------|--------|
| Pure utils, server helpers (e.g. `server/base_api` exports) | `test/unit/**/*.spec.ts` | `vitest --project unit` | Node env, no Nuxt |
| Vue components / composables needing Nuxt (auto-imports, plugins) | `test/nuxt/**/*.nuxt.spec.ts` | `vitest --project nuxt` | `mountSuspended` / `@nuxt/test-utils/runtime` |
| Nitro merchant API proxies, HTTP integration | `test/e2e/**/*.spec.ts` | `vitest --project e2e` | `@nuxt/test-utils/e2e`, mock upstream as needed |
| Repository modules (`app/repository/`), `$fetch` contracts | `app/repository/**/*.test.ts` | `bun test` | Uses `test/repository-test-setup.ts` preload |

Config: `vitest.config.ts` (projects: `unit`, `e2e`, `nuxt`). Reference: [Nuxt 4 testing](https://nuxt.com/docs/4.x/getting-started/testing).

## Checklist before claiming done

1. Identify which table row above applies (or more than one).
2. Add or update the smallest set of tests that validates the change.
3. Run **`bun run test:vitest:run`** for Vitest projects.
4. Run **`bun run test:repository`** when repository code changed.
5. Run **`bun run typecheck`** and **`bun run lint`** for user-facing or shared TypeScript changes when feasible.
6. Fix failures before reporting completion.

## Practical guidance

- Prefer **one clear test** over many shallow ones; cover happy path and one meaningful edge case when risk warrants it.
- **Repository modules**: assert URL, method, query/body, and error shaping against `MerchantRoutes` / fixtures in `test/repository-model-fixtures.ts` when applicable.
- **Nitro routes**: prefer e2e proxy tests with a mock upstream (`test/e2e/`) or extend patterns already in that folder; avoid hitting a real backend in CI.
- Do **not** add unrelated refactors or new markdown docs unless the user asked.
