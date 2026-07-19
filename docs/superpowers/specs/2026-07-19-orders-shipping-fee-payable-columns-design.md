# Orders Shipping Fee and Payable Total Columns

**Date:** 2026-07-19  
**Project:** wemotoo-portal  
**Status:** Approved

## Goal

Show shipping fee and payable total on the Orders list and Dashboard Orders table, without removing existing money columns.

## Column order (money)

After existing columns, money columns are:

1. Gross Amt (`gross_amt`) — unchanged
2. Tax Amt Exc (`tax_amt_exc`) — unchanged
3. Net Amt (`net_amt`) — unchanged
4. Shipping Fee (`shipping_fee`) — new
5. Payable Total (`payable_total`) — new

Format both new columns with `moneyCell` and the row currency code (same as Gross/Tax/Net).

## Data

`OrderHistory` already includes `shipping_fee` and `payable_total`. No API, store, or type changes.

## Files

- Modify: `app/utils/table-columns/order/order.ts` — add the two columns
- Modify: `app/pages/orders/index.vue` — add keys to `ORDER_COLUMN_LABELS` for column visibility
- Modify: `test/unit/order-columns-sorting.spec.ts` — assert new columns are sortable like other money columns
- Dashboard `Orders.vue` needs no change; it uses `getOrderColumns`

## i18n

Reuse existing keys (no new locale strings):

- Shipping Fee: `components.fulfillment.shippingFee` (same as Sales)
- Payable Total: `table.totalAmt` (same as Sales payable header)

## Out of scope

- Replacing `net_amt` with `net_total`
- Changing Sales columns
- Backend/API contract changes
