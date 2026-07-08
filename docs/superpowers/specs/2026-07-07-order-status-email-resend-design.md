# Order Status Email Resend Design

## Goal

Allow merchant admins and staff to resend the customer-facing email that matches the current order or sale status from the existing order detail side action area.

## Backend

Add one status-aware endpoint for orders and one for sales:

- `POST /merchant/orders/:order_no/resend-email`
- `POST /merchant/sales/:order_no/resend-email`

Each endpoint reloads the current record with its customer, payment, currency, taxes, items, and merchant info. The backend chooses the email from current `status`, `payment_status`, and cash-payment metadata. Unsupported statuses return a bad request instead of silently sending the wrong template.

The mapping is:

- Cash pending order: order confirmation.
- `PROCESSING` with pending payment: invoice.
- `PROCESSING`, `PAID`, or `COMPLETED` with paid payment: receipt.
- `REFUNDED` with refunded payment: refund receipt.
- `CANCELLED`: cancellation email.

## Portal

Keep order and sale proxy routes separate under:

- `server/routes/merchant/orders/[order_no]/resend-email.post.ts`
- `server/routes/merchant/sales/[order_no]/resend-email.post.ts`

Add matching client repository/store methods and a shared sidebar section on `app/pages/orders/[order_no].vue`. The page already serves both order and sale detail views via `type=order|sale`, so the section will call the correct store method based on that existing value. If no matching email exists for the current status, disable the resend button and show that no email is available.

## Testing

Backend service tests cover the status-to-email mapping and unsupported status behavior. Portal tests cover route URL generation/repository calls and the side section's disabled state logic where practical.
