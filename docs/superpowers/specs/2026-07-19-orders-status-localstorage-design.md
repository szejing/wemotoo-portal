# Orders Status Filter LocalStorage Persistence

**Date:** 2026-07-19  
**Project:** wemotoo-portal  
**Status:** Approved

## Goal

On orders list load, restore the multi-status filter from localStorage. If none/invalid, default to all statuses.

## Behavior

1. Storage key: `wemotoo-orders-selected-statuses`
2. Load order:
   - URL `?status=...` (if valid) wins for that visit and is persisted
   - Else valid localStorage selection
   - Else all statuses (`getDefaultOrderStatuses()`)
3. Any change to `filter.statuses` (selector or clear) is persisted
4. Empty/invalid stored data → all statuses

## Files

- Add: `app/utils/orders-selected-statuses-storage.ts` (key + sanitize/resolve)
- Modify: `app/pages/orders/index.vue` (`useStorage` + apply on mount + watch persist)
- Add: unit test for sanitize/resolve

## Out of scope

- Persisting date/query/currency filters
- Changing generic `ZSectionFilterStatuses` API
