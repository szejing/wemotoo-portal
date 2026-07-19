# Orders Status Filter Badges & Client-Side Table Sorting

**Date:** 2026-07-19  
**Project:** wemotoo-portal  
**Status:** Approved for planning

## Goal

Improve the orders list filter UX by restyling the multi-status filter to match `ZSelectMenuOrderStatus` (badges + `USelectMenu`), and add client-side column sorting on the orders table for the current page only.

## Decisions

| Topic | Decision |
| --- | --- |
| Status filter cardinality | Keep **multi-select** (`string[]` / `OrderStatus[]`) |
| Status UI approach | Enhance generic `ZSectionFilterStatuses` (not extend single-select `OrderStatus.vue`) |
| Sorting scope | **Client-side only** on the current page of rows |
| Server `$orderby` | Out of scope |

## Status filter

### Current state

- `app/components/Z/Section/Filter/Statuses.vue` uses `USelect` with `multiple` and a generic `items` prop.
- `app/pages/orders/index.vue` binds `filter.statuses` and passes `getOrderStatusOptions` (excluding `All`).
- `app/components/Z/SelectMenu/OrderStatus.vue` is single-select with badge UI and an `All` option; used by summary filters and order detail. Leave it unchanged.

### Design

1. Replace `USelect` in `Statuses.vue` with `USelectMenu`:
   - `multiple`
   - `value-key="value"`
   - search input (same pattern as `OrderStatus.vue`)
   - keep existing props: `modelValue`, `items`, `label`, `placeholder`, `showLabel`, `disabled`, `wrapperClass`
2. Add optional `getColor?: (value: string) => UiBadgeColor | undefined` (or equivalent badge color type already used by the portal).
3. When `getColor` is provided:
   - selected values render as subtle `UBadge` chips in the trigger
   - dropdown items render as subtle `UBadge`s
4. When `getColor` is omitted, fall back to plain labels (generic reuse).
5. Orders page passes `getOrderStatusColor` into `ZSectionFilterStatuses`.
6. Preserve existing emit/`v-model` behavior and store filter semantics (`getDefaultOrderStatuses`, OData filter builder, query-string status parsing).

### Files

- Modify: `app/components/Z/Section/Filter/Statuses.vue`
- Modify: `app/pages/orders/index.vue` (pass `getColor`)
- Modify: `test/nuxt/z-section-filter-statuses.nuxt.spec.ts`

## Client-side sorting

### Current state

- `getOrderColumns` in `app/utils/table-columns/order/order.ts` has no sorting headers.
- Orders page `UTable` has no `sorting` binding.
- Order store fetch already uses a fixed `$orderby`; that stays as the server default and is not driven by column clicks.

### Design

1. Add a reusable sortable header helper (e.g. `sortableHeaderCell`) next to `headerCell` in `app/utils/table-columns/styles.ts` (or a sibling helper module if cleaner), following Nuxt UI’s TanStack Table sorting pattern (header button that toggles sort).
2. In `getOrderColumns`:
   - **Sortable:** `order_no` (via existing `order_date_time` accessor), `order_type`, `customer`, `status`, `gross_amt`, `tax_amt_exc`, `net_amt`
   - **Not sortable:** `index`
3. Keep existing `accessorFn` / `accessorKey` values so sorting uses meaningful values (datetime for order no, customer name, numeric amounts, status string, order type rank).
4. On `app/pages/orders/index.vue`:
   - local `ref<SortingState>([])` (or equivalent Nuxt UI typing)
   - bind `v-model:sorting` on `UTable`
   - no store / repository / OData changes
5. Sorting resets naturally when page data is replaced; no persistence across sessions.

### Files

- Modify: `app/utils/table-columns/styles.ts` (sortable header helper)
- Modify: `app/utils/table-columns/order/order.ts`
- Modify: `app/pages/orders/index.vue`
- Add: focused unit test for column sort flags / sortable columns

## Testing

- Update `test/nuxt/z-section-filter-statuses.nuxt.spec.ts`:
  - assert `USelectMenu` with `multiple`
  - assert badge path when `getColor` is provided
  - keep `update:modelValue` emit coverage
- Add unit coverage that order columns intended to sort are sortable and `index` is not.
- Manual check: multi-status filter shows colored badges; clicking headers reorders only the current page.

## Out of scope

- Server-side `$orderby` driven by column clicks
- Changing `ZSelectMenuOrderStatus` single-select API
- Applying the new status filter styling to non-orders consumers (none today beyond orders list)
- Sorting other listing tables (sales, products, etc.)

## Success criteria

1. Orders list status filter remains multi-select and visually matches order-status badge language.
2. Clicking sortable column headers reorders the currently loaded rows without refetch.
3. Existing status filter store/OData behavior is unchanged.
4. Focused tests pass for Statuses and order column sorting metadata.
