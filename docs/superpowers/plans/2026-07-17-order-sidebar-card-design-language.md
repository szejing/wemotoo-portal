# Order Sidebar Card Design Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Order Status, Customer Email, Payment, and Shipping sidebar cards to Payment’s compact design language with section icons, redesigning Shipping as the primary change.

**Architecture:** Keep APIs, stores, and fulfillment actions unchanged. Restyle `BatchCard` to a Payment-like nested summary (courier/tracking lead, fee on the right). Light polish on the other three cards (icons, shadow, status badge, nested email copy). Update Nuxt component tests for the new shipping layout and always-visible badges.

**Tech Stack:** Vue 3, Nuxt 4, Nuxt UI v4, TypeScript, Vitest / `@nuxt/test-utils`, Tailwind CSS.

## Global Constraints

- No backend API or fulfillment rule changes.
- Shipping content priority: courier → tracking → method; fee emphasized on the right; zone only when present.
- Always show lifecycle + shipment badges on Shipping (including single-batch); this updates the prior “hide badges for one batch” rule.
- Preserve Edit / Update status popover behavior and existing `data-testid` hooks where possible.
- Mobile: stack summary left column above fee; wrap action buttons; `break-all` on tracking.
- Use Node-based Nuxt commands; do not run portal Nuxt with `bun --bun`.

## File map

- Modify: `app/components/Fulfillment/BatchCard.vue`
- Modify: `test/nuxt/fulfillment-batch-card.nuxt.spec.ts`
- Modify: `app/components/Z/Section/Order/Detail/OrderStatus.vue`
- Modify: `app/components/Z/Section/Order/Detail/CustomerEmail.vue`
- Modify: `app/components/Z/Section/Order/Detail/Payment.vue`
- Touch only if needed: `app/components/Fulfillment/BatchList.vue` (shadow/spacing consistency)

---

### Task 1: Redesign Shipping `BatchCard` + tests

**Files:**
- Modify: `app/components/Fulfillment/BatchCard.vue`
- Modify: `test/nuxt/fulfillment-batch-card.nuxt.spec.ts`

**Interfaces:**
- Consumes: existing `batch`, `currencyCode`, `showBatchMeta`, `loading` props; `edit` / `action` emits
- Produces: Payment-style nested summary; badges always visible

- [ ] **Step 1: Update failing expectations in the batch card test**

Change the single-batch test to expect status badges always, and assert courier/tracking/fee hierarchy via existing testids (method/fee/courier/tracking still present; zone present only when set).

- [ ] **Step 2: Implement compact BatchCard template + scoped styles matching Payment nested item**

Header: truck + title + always-on status badges. Body: nested box with left courier/tracking/method(/zone) and right fee. Footer actions unchanged.

- [ ] **Step 3: Run focused Nuxt test**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
bun run test:vitest:run -- test/nuxt/fulfillment-batch-card.nuxt.spec.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/components/Fulfillment/BatchCard.vue test/nuxt/fulfillment-batch-card.nuxt.spec.ts
git commit -m "feat: compact Payment-style shipping batch card"
```

---

### Task 2: Polish Order Status, Customer Email, Payment headers

**Files:**
- Modify: `app/components/Z/Section/Order/Detail/OrderStatus.vue`
- Modify: `app/components/Z/Section/Order/Detail/CustomerEmail.vue`
- Modify: `app/components/Z/Section/Order/Detail/Payment.vue`

- [ ] **Step 1: OrderStatus — icon + current status badge via `getOrderStatusColor` / order-status option label**

- [ ] **Step 2: CustomerEmail — Payment-matching shadow + nested description box**

- [ ] **Step 3: Payment — banknotes icon in header title**

- [ ] **Step 4: Smoke-check / lint touched files; commit**

```bash
git add app/components/Z/Section/Order/Detail/OrderStatus.vue app/components/Z/Section/Order/Detail/CustomerEmail.vue app/components/Z/Section/Order/Detail/Payment.vue
git commit -m "feat: align order sidebar cards with section icons"
```

---

### Task 3: Verification

- [ ] **Step 1: Re-run fulfillment batch card Nuxt tests**
- [ ] **Step 2: Lint/typecheck if feasible on touched files**
