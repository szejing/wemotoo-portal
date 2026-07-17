# Order Detail Sidebar Card Design Language

## Goal

Unify the four order-detail sidebar cards so they share Payment Information’s compact, scannable design language, with a clear section icon on every card. Primary redesign target is Shipping (`FulfillmentBatchCard` via `FulfillmentBatchList`). Keep behavior and APIs unchanged.

## Surfaces

Desktop sticky sidebar and mobile order-actions drawer on:

- `app/pages/orders/[order_no].vue`
- Equivalent sale detail placement that reuses the same components

Components:

- `Z/Section/Order/Detail/OrderStatus.vue`
- `Z/Section/Order/Detail/CustomerEmail.vue`
- `Z/Section/Order/Detail/Payment.vue` (reference)
- `Fulfillment/BatchList.vue` + `Fulfillment/BatchCard.vue`

## Shared Visual Language

Every card uses:

- `UCard` with Payment-matching shadow (`0 2px 8px rgba(0, 0, 0, 0.1)`)
- Header row: section icon (`w-5 h-5`) + title on the left; optional badge/actions on the right
- Compact body; prefer nested summary boxes for read-only info, not stacked label/value lists
- Mobile-safe wrapping: no fixed min-widths that overflow; soft action buttons `flex-wrap`; tracking/refs `break-all` / `break-words`

### Section icons

| Card | Icon |
|------|------|
| Order Status | `i-heroicons-clipboard-document-check` |
| Customer email | `i-heroicons-envelope` (existing) |
| Payment Information | `i-heroicons-banknotes` |
| Shipping | `i-heroicons-truck` (existing) |

## Shipping (`BatchCard`) — primary redesign

Replace the five stacked `dt`/`dd` rows with a Payment-style nested summary box.

### Header

- Truck icon + “Shipping” title (or batch number when multiple batches)
- Always show lifecycle and/or shipment status badge(s) in the header (including single-batch). This updates the earlier “hide badges for one batch” rule from the simplified fulfillment UI design for visual consistency with Payment’s Paid badge.
- Multi-batch list still shows batch count above the cards via `BatchList`

### Nested summary content priority

1. **Courier** — primary left line (bold), fallback “Not yet provided”
2. **Tracking** — secondary left line
3. **Shipping method** — tertiary left line when present
4. **Shipping fee** — primary right emphasis (currency + amount, Payment amount styling)
5. **Shipping zone** — quiet tertiary line only when present; omit when empty

### Actions

Keep Edit and Update status as small soft buttons under the summary box. Update status remains a popover of valid next transitions only. No behavior change to arrangement modal or fulfillment store actions.

### Mobile

On narrow widths, stack left metadata above the fee so the fee does not squeeze the courier/tracking text. Preserve existing `data-testid` hooks where possible; update tests that assert the old stacked labels layout.

## Order Status

- Add header icon
- Keep select + full-width Update Order Status button
- Optionally show current order status as a small header badge (right side), similar to Payment’s Paid badge
- No nested summary box (this card is an action form)

## Customer email

- Keep envelope icon + title
- Match Payment card shadow
- Optionally wrap the ready-to-resend description in a light nested box for visual parity
- Keep soft block Resend button and existing props/events

## Payment

- Add banknotes (or currency) header icon beside the title
- Leave payment-item layout unchanged (it is the reference pattern)

## Out of scope

- Backend fulfillment/payment APIs or status rules
- Arrangement modal fields
- Splitting batches, delete controls, or new status transitions
- Extracting a shared `SidebarInfoCard` abstraction (deferred; keep per-card CSS aligned instead)

## Verification

- Update `test/nuxt/fulfillment-batch-card.nuxt.spec.ts` for compact summary hierarchy, always-visible status badges, and retained Edit / Update status actions
- Confirm Order Status / Customer Email / Payment still mount and keep existing testids/events
- Run focused portal Nuxt tests for fulfillment batch card and any touched section specs; lint touched files
