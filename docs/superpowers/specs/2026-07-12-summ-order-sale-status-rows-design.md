# Order & Sale Summary — Per-Status Daily Rows — Design

Date: 2026-07-12  
Projects: `wemotoo-portal` (primary), `yeppi-ecommerce-backend` (no list-API change)  
Primary: analytics order/sale summary tables

## Problem

`GET /api/summ-orders` and `GET /api/summ-sales` already return one summary row per `(biz_date, currency_code, status, outlet_code)`. When the status filter is unset, all statuses are returned as separate rows.

The portal analytics summary pages then **combine** those rows by `biz_date`, summing totals across statuses into a single daily row and clearing `status` when more than one status is present. Merchants cannot see daily summaries broken down by order/sale status.

## Goals

1. Show one table row per `biz_date` + `status` (for the selected currency) on:
   - `app/pages/analytics/orders/summary.vue`
   - `app/pages/analytics/sales/summary.vue`
2. When status filter is unset, query all statuses and list them uncombined.
3. When a status is selected, keep filtering to that status only.
4. Apply the same behavior to CSV export ordering so export matches the table.

## Non-goals

- Backend list API contract changes for `summ-orders` / `summ-sales`.
- Dashboard rollup endpoints that intentionally aggregate across statuses by date (e.g. `getOrderSummaryByDateAndCurrency`).
- Items, customers, or payments analytics pages.
- Changing filter defaults or clear-filter status reset behavior.
- Outlet-level UI breakdown (outlet remains in the API row but is not a new grouping requirement for this change).

## Current behavior

### Backend (keep)

- Entity uniqueness: `biz_date` + `currency_code` + `status` + `outlet_code`.
- List endpoints return raw summary rows; optional OData `status eq '…'` filter.
- No status filter ⇒ all status rows for the date/currency window.

### Portal (change)

Both summary pages compute `dailyRows` by:

1. Grouping API rows by ISO date string.
2. Summing numeric fields across all statuses for that date.
3. Setting `status` only when exactly one status exists in the group.

Stores order with `$orderby=biz_date desc` only.

## Proposed behavior

### Table rows

Map each API record to one table row without date grouping:

- `biz_date`
- `status` (always present when returned by API)
- currency and amount/qty fields as returned

Pagination continues to use `@odata.count` / `$top` / `$skip` against API rows (status-level rows, not calendar days).

### Sorting

Update order and sale summary store fetch + export to:

```text
$orderby=biz_date desc,status asc
```

so same-day statuses appear in a stable order under each date.

### Filters

Unchanged:

- Optional `status eq '…'` when filter status is set.
- Currency and date-range filters as today.

### Columns / types

- Keep the existing `status` column in `getSummColumns` visible by default.
- Tighten `SummBillTableRow.status` to required (`OrderStatus`) for these summary tables, since uncombined rows always carry status. If a defensive empty fallback is needed in the cell renderer, keep the muted empty cell only as a last resort.

## Approach

**Portal-only stop-combine + stable sort** (chosen).

Alternatives considered:

1. Portal-only stop-combine without secondary sort — simpler but same-day status order may be unstable.
2. Force backend `status in (…)` on every list query — redundant with current “no filter = all rows” semantics.

## Files to touch

| Area | File | Change |
|------|------|--------|
| Orders UI | `app/pages/analytics/orders/summary.vue` | Remove date-group aggregation; bind API data 1:1 |
| Sales UI | `app/pages/analytics/sales/summary.vue` | Same |
| Orders store | `app/stores/SummOrder/SummOrder.ts` | `$orderby=biz_date desc,status asc` on get + export |
| Sales store | `app/stores/SummSale/SummSale.ts` | Same |
| Types | `app/utils/table-columns/analytics/types.ts` | `status` required on `SummBillTableRow` if safe |
| Tests | portal unit test(s) | Cover row mapping / no cross-status combine if a pure helper is extracted |

## Acceptance criteria

1. With no status filter, order summary lists multiple rows for the same date when multiple statuses have data, each showing its own status badge and amounts.
2. With a status filter, only that status’s rows appear.
3. Sale summary behaves the same way.
4. Export order matches table sort (`biz_date desc`, then `status asc`).
5. Footer totals on the current page sum the visible (uncombined) rows.
6. Dashboard / other analytics endpoints remain unchanged.

## Test plan

- Unit: if a mapper helper is extracted, assert two same-date different-status inputs produce two output rows with distinct statuses and no summed cross-status totals.
- Manual: open Orders → Summary with a date range that has multiple statuses; confirm separate rows; filter one status; confirm export columns include status and amounts match the list.
- Manual: repeat for Sales → Summary.
