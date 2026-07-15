# Simplified Fulfillment UI Design

## Scope

Simplify the fulfillment presentation in `wemotoo-webapp` and the merchant workflow in `wemotoo-portal` without changing backend fulfillment persistence, status rules, or API contracts.

## Customer Webapp

- Remove the standalone fulfillment-batch section from the shared order/sale detail view.
- Do not render shipping method, fee, zone, batch status, courier, or tracking in a separate fulfillment card.
- Continue showing courier and tracking updates through the existing order activity timeline.
- Keep fulfillment response data and canonical money calculations intact because payment summaries and other consumers still use them.

## Merchant Portal Placement

- Remove the fulfillment list from the main order-detail column.
- Show fulfillment shipping management in the existing desktop sidebar.
- Show the same management card inside the existing mobile order-actions drawer.
- Show the card for delivery orders only; pickup orders do not expose shipping management.
- Keep order and converted-sale fulfillment editing supported.

## Merchant Portal Presentation

Every fulfillment card shows:

- Shipping method description.
- Shipping fee.
- Shipping zone.
- Courier.
- Tracking number.
- An Edit action.
- One compact Update status action.

For exactly one batch, do not show a batch count or lifecycle/shipment status badges. For multiple batches, show the total batch count and identify each batch with both lifecycle and shipment badges so the merchant can distinguish their progress.

Do not show timestamps, technical explanatory text, separate lifecycle buttons, separate Shipped/Delivered buttons, delete controls, or split-batch controls.

## Editing

- The edit popup contains only a Courier selector and Tracking number input.
- Shipping method, fee, and zone are read-only in the card and cannot be changed through this simplified popup.
- Saving the first non-empty tracking number uses the existing fulfillment update endpoint; the backend automatically promotes that batch to shipped and sends the shipped email once.
- Courier remains optional according to the backend contract. The selector uses registered active couriers and preserves an existing courier snapshot when reopening the form.

## Status Updates

- A single Update status button opens a small popover.
- The popover shows only valid next transitions supported by the existing UUID endpoints.
- Lifecycle transitions remain sequential: pending to processing, processing to packed, and packed to fulfilled.
- Shipment is not manually promoted to shipped; entering the first tracking number performs that transition automatically.
- Mark delivered is available only when shipment status is shipped or in transit.
- Failed or terminal states show no invalid next action.

## Data Flow and Error Handling

- Continue mutating fulfillment rows by UUID and refresh the current order or sale after a successful edit or status transition.
- Reuse existing store notifications for API failures and keep edit/status UI open when a request fails.
- Do not add backend endpoints, compatibility behavior, batch deletion, or split-batch creation.

## Verification

- Webapp tests prove the standalone fulfillment section is absent while the tracking timeline remains.
- Portal tests prove sidebar and mobile-drawer placement, delivery-only visibility, and continued sale editing.
- Portal component tests cover the single-batch hidden count/badges rule and multiple-batch visible count/badges rule.
- Portal tests cover the courier/tracking-only popup, automatic shipped update payload, compact valid-next-status popover, and UUID actions.
- Run focused webapp and portal tests, touched-file lint/format checks, and Node-based Nuxt builds for both applications.
