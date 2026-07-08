# Order Status Email Resend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add status-aware resend email actions for merchant order and sale detail pages.

**Architecture:** The backend owns the status-to-email mapping through resource-specific `resend-email` endpoints. The portal keeps existing order and sale proxy/fetch paths separate, while the shared order detail page renders one action section that calls the correct store method.

**Tech Stack:** NestJS, Jest, Nuxt 4, Pinia, Nuxt UI, Vitest/Bun test.

## Global Constraints

- Keep code changes minimal and scoped to the resend email feature.
- Do not modify unrelated files or revert existing local changes.
- Use the existing YEPPI signed portal proxy pattern for backend calls.
- Preserve separate order and sale fetch/access logic.
- Run targeted tests when possible.

---

### Task 1: Backend Status-Aware Resend APIs

**Files:**
- Modify: `yeppi-ecommerce-backend/src/modules/ecommerce/merchant-order/service/merchant-order.service.ts`
- Modify: `yeppi-ecommerce-backend/src/modules/ecommerce/merchant-order/controller/merchant-order.controller.ts`
- Modify: `yeppi-ecommerce-backend/src/modules/ecommerce/merchant-sale/service/merchant-sale.service.ts`
- Modify: `yeppi-ecommerce-backend/src/modules/ecommerce/merchant-sale/controller/merchant-sale.controller.ts`
- Modify: `yeppi-ecommerce-backend/src/modules/ecommerce/merchant-sale/merchant-sale.module.ts`
- Test: `yeppi-ecommerce-backend/src/modules/ecommerce/merchant-order/service/merchant-order.service.spec.ts`
- Test: `yeppi-ecommerce-backend/src/modules/ecommerce/merchant-sale/service/merchant-sale.service.spec.ts`

**Interfaces:**
- Produces: `MerchantOrderService.resendCurrentStatusEmail(order_no: string, merchant_id: string): Promise<boolean>`
- Produces: `MerchantSaleService.resendCurrentStatusEmail(order_no: string, merchant_id: string): Promise<boolean>`

- [ ] Write failing service tests for invoice, receipt, refund, cancellation, cash confirmation, and unsupported status.
- [ ] Run targeted Jest tests and confirm the new tests fail because methods are missing.
- [ ] Implement minimal service methods by injecting/reusing `EmailService`, converting entities to models, attaching merchant info, and calling the matching email service method.
- [ ] Add `POST :order_no/resend-email` controller endpoints with existing admin/staff guards.
- [ ] Run targeted Jest tests and confirm they pass.

### Task 2: Portal Proxy, Repository, Store, and Sidebar

**Files:**
- Modify: `wemotoo-portal/server/routes.server.ts`
- Modify: `wemotoo-portal/app/repository/routes.client.ts`
- Modify: `wemotoo-portal/app/repository/modules/order/order.ts`
- Modify: `wemotoo-portal/app/repository/modules/sale/sale.ts`
- Modify: `wemotoo-portal/app/stores/Order/Order.ts`
- Modify: `wemotoo-portal/app/stores/Sale/Sale.ts`
- Modify: `wemotoo-portal/app/pages/orders/[order_no].vue`
- Create: `wemotoo-portal/server/routes/merchant/orders/[order_no]/resend-email.post.ts`
- Create: `wemotoo-portal/server/routes/merchant/sales/[order_no]/resend-email.post.ts`
- Test: `wemotoo-portal/app/repository/modules/repository-modules.api.test.ts`

**Interfaces:**
- Consumes: backend `POST /merchant/orders/:order_no/resend-email` and `POST /merchant/sales/:order_no/resend-email`.
- Produces: `orderStore.resendCurrentStatusEmail(order_no: string): Promise<boolean>` and `saleStore.resendCurrentStatusEmail(order_no: string): Promise<boolean>`.

- [ ] Write failing repository tests for order and sale resend endpoints.
- [ ] Run targeted portal repository tests and confirm failures.
- [ ] Add server route builders, client routes, repository methods, and server proxy files.
- [ ] Add store actions with loading state and success/failure notifications.
- [ ] Render a side action section in both desktop sidebar and mobile drawer; disable it when the current status/payment combination has no email.
- [ ] Run targeted portal tests/type checks that are practical in the current workspace.

### Task 3: Final Verification

**Files:**
- No new files.

**Interfaces:**
- Consumes all Task 1 and Task 2 behavior.

- [ ] Run backend targeted Jest suites for merchant order and merchant sale services.
- [ ] Run portal targeted repository tests.
- [ ] Inspect `git diff --check` for whitespace/errors in each repo.
- [ ] Summarize modified files, test results, and any checks not run.
