# AI Rules Documentation (Cursor & Antigravity)

This directory contains coding rules and conventions for the Wemotoo CRM Portal (Nuxt 4 compatibility / Vue 3). **Shared across Cursor and Antigravity** via `.agent/rules/`.

- **Cursor**: Reads via `.cursorrules` symlink → `.agent/rules/`
- **Antigravity**: Reads `.agent/rules/` directly

File extension: `.mdc` (Markdown with Cursor frontmatter; valid for both editors).

## Rule Files

### Core

- **`general.mdc`** – Project structure, naming, TypeScript, security, and code quality. `alwaysApply: true`.

### Server and API

- **`server-routes.mdc`** – Nitro API route handlers in `server/routes/merchant/`. Proxy to backend using `signedFetch()` from `server/base_api.ts`; file naming follows `[param].get.ts`, `create.post.ts`, `many.get.ts`, etc. Use `generateImageHeaders()` only for upload routes that must not send JSON content headers.

- **`repository.mdc`** – Client API layer: `app/repository/` modules, `HttpFactory`, route definitions (`routes.client.ts`), and request/response models.

- **`repository-module-creation.mdc`** – Checklist when adding a new domain under `app/repository/modules/` (folder layout, `utils/types` alignment, plugin, tests). Full workflow: skill **repository-module-creation**.

### Validation and Types

- **`schema.mdc`** – Zod validation in `app/utils/schema/`. Create/Update/Filter schemas per entity; used by forms and filters.

- **`types.mdc`** – Shared TypeScript types and domain models: `app/utils/types/`, `app/utils/interface/`, and repository `models/`.

### UI and Client Logic

- **`vue-pages-components.mdc`** – Pages (`app/pages/`) and components (`app/components/`). File-based routing, layouts, data loading, shared components, and component conventions.

- **`styling-ui-nuxt-ui.mdc`** – Styling and UI: prefer **@nuxt/ui** components when creating or updating pages/components. Reference: https://ui.nuxt.com/docs/components (Layout, Element, Form, Data, Navigation, Overlay, etc.). Use Tailwind and project theme; see also `.agent/skills/nuxt-ui-usage/SKILL.md`.

- **`styling-legacy.mdc`** – Legacy CSS-only styling (no Tailwind). Enable only for non–Nuxt UI or legacy components; conflicts with @nuxt/ui.

- **`composables.mdc`** – Composables in `app/composables/`. Naming (`useXxx`), structure, and when to use them.

### Responsive / Mobile

- **`mobile-ui.mdc`** – Responsive and touch-friendly design checklist for UI changes: responsive grids, touch targets, tables, modals, forms, and typography.

### Cross-Cutting

- **`middleware.mdc`** – Nuxt route middleware (`app/middleware/`) and Nitro server middleware (`server/middleware/`). Auth, redirects, CORS.

- **`utility.mdc`** – Pure helpers, table-columns, constants, and types under `app/utils/`. What belongs in utils vs repository/schema/composables.

## How to Use

- **Cursor** and **Antigravity** both use these rules to guide edits and suggestions. Edit rules here (`.agent/rules/`) — changes apply to both editors.
- When adding features, open the relevant `.mdc` (and `general.mdc`) for the layer you’re editing (e.g. server-routes, repository, schema, pages/components).
- Keep rules under ~50 lines each where possible; add only patterns that match this codebase.

## Quick Reference

| Layer              | Location                     | Rule file              |
|--------------------|-----------------------------|------------------------|
| Server API proxy   | `server/routes/merchant/*`  | server-routes.mdc      |
| Client API         | `app/repository/*`          | repository.mdc         |
| New repo module    | `app/repository/modules/*`  | repository-module-creation.mdc |
| Validation         | `app/utils/schema/*`        | schema.mdc             |
| Types / models     | `app/utils/types`, repo models | types.mdc          |
| Pages & components | `app/pages/*`, `app/components/*` | vue-pages-components.mdc |
| Styling / UI       | Pages, components, layouts | styling-ui-nuxt-ui.mdc (prefer [Nuxt UI](https://ui.nuxt.com/docs/components)) |
| Mobile / Responsive| Pages, components, layouts | mobile-ui.mdc          |
| Composables        | `app/composables/*`         | composables.mdc        |
| Middleware         | `app/middleware/*`, `server/middleware/*` | middleware.mdc |
| Utils, constants   | `app/utils/*`               | utility.mdc            |

## Agent skills

Project-specific skills in `.agent/skills/` (use when relevant; Cursor reads via `.cursor/skills`):

- **nuxt-ui-usage** — Build UIs with @nuxt/ui v4; project theming, components, forms, tables, modals, i18n integration.
- **i18n-translation** — Locales (en, ms), translation patterns, validation schemas, options, table columns.
- **page-panel-layout** — ZPagePanel wrapper for dashboard pages; navbar, toolbar, footer slots.
- **listing-page** — Index/list pages: ZCreateButton + ZSectionFilter* + ZTableToolbar + skeleton UTable + empty state + pagination + store/i18n conventions.
- **form-creation** — Create-entity pages: Form*Creation + ZPagePanel footer submit, UForm/Zod, optional sticky review column.
- **crud-ui-pages** — Full create/edit/delete CRUD pages with Form*Creation/Form*Update, review summaries, Zod schemas, store-backed submit, and delete confirmation patterns.
- **product-crud** — Product-specific CRUD behavior: Product store actions, image upload mapping, create/update payload types, section-nav forms, and partial update rules.
- **shareable-components** — Extract duplicate UI into reusable components; placement, API patterns, workflow.
- **repository-module-creation** — Scaffold a new `HttpFactory` module: `MerchantRoutes`, `models/request` + `models/response`, typing against `~/utils/types`, unwrap helpers, `index.ts` + `01.api.ts`, integration tests.
- **implementation-and-tests** — Add or update automated tests for new or changed behavior and verify with portal package scripts.

For full Nuxt UI component reference, install the official skill: `npx skills add nuxt/ui` or add in Cursor Settings > Skills: `https://github.com/nuxt/ui/tree/v4/skills/nuxt-ui`.
