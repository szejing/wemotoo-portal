# Wemotoo Merchant Portal User Guide

This guide covers common merchant staff workflows in `wemotoo-portal`: signing in, creating products and service/appointment products, managing appointments, and updating order details.

> Note: `wemotoo-webapp` is the customer-facing storefront. Merchant operations such as products, appointments, and orders are handled in `wemotoo-portal`.

## Sign In

1. Open the merchant portal.
2. Enter the merchant ID, email address, and password.
3. Click **Submit**.

Example test credentials:

- Merchant ID: `M00001`
- Email: `szejing.go@gmail.com`
- Password: `Testing123!@#`

Screenshot:

![Wemotoo CRM login screen](screenshots/01-live-login.jpg)

Some list screenshots below blur customer/order rows to keep real merchant data private while still showing the portal workflow.

## Main Navigation

The main merchant workflows are available from the sidebar:

- **Dashboard**: overview of recent order and appointment activity.
- **Appointments**: search, filter, view, update, or delete appointment bookings.
- **Orders**: search, filter, export, and update order records.
- **Products**: create products, edit products, manage categories, brands, and tags.
- **Customers**: view customer profiles, order history, and appointment history.
- **Settings**: manage store profile, configuration, payment, tax, and shipping settings.

## Create a Product

![Product creation screen](screenshots/03-live-product-create.jpg)

1. Go to **Products** > **All Products**.
2. Click **Add Product**.
3. Complete **Basic Information**:
   - Product type
   - Product code, optional but useful as a unique SKU-style identifier
   - Product name
   - Short description
   - Show in store / Hide in store
   - Thumbnail and up to 3 additional images
4. Complete **Classification**, if needed:
   - Categories
   - Tags
   - Brands
5. Complete **Pricing**:
   - Selling price
   - Cost price, optional
6. Complete **Additional Info**, if needed:
   - Variations, such as size or color
   - Variant prices
   - Tax settings, when available
7. Review the summary panel on the right.
8. Click **Create Product**.

You can also click **Save Draft**. Draft products are saved as inactive, so they do not immediately appear in the storefront.

## Create a Service / Appointment Product

Appointment booking is configured through a service-type product.

1. Go to **Products** > **All Products**.
2. Click **Add Product**.
3. In **Basic Information**, set **Product Type** to a service type.
4. Fill in the required product name, description, images, and pricing.
5. Open **Additional Info** > **Service**.
6. Configure the service booking settings:
   - Enable **Requires booking**.
   - Select the appointment duration.
   - Choose off days.
   - Use store operating hours or set custom start and end times.
7. Click **Create Product**.

Customers book appointments from the storefront when purchasing a service product. The merchant portal then shows those bookings under **Appointments**.

## Manage Appointments

![Appointments listing screen with booking rows blurred](screenshots/04-live-appointments.jpg)

1. Go to **Appointments**.
2. Use the filters:
   - Date range
   - Search by customer name or phone
   - View mode: Listing, Daily, Weekly, or Monthly
   - Status tabs: All, Pending, Confirmed, Completed, Cancelled
3. Select an appointment from the table or calendar.
4. Review the appointment details:
   - Appointment code
   - Date and time
   - Duration
   - Service details
   - Customer name and phone number
5. Click **Edit Appointment** to update:
   - Appointment status
   - Start date and time
   - End date and time
6. Click **Update** to save.

To remove an appointment, select it, click the delete action, and confirm the deletion.

## Update Order Details

![Orders listing screen with order rows blurred](screenshots/05-live-orders.jpg)

1. Go to **Orders**.
2. Use the filters:
   - Date range
   - Order number search
   - Status tabs: All, Pending, Completed, Cancelled, Refunded, Requires Action
3. Select an order from the table.
4. On the order detail page, review:
   - Order number, invoice number, reference number, and order date
   - Fulfilment method, such as pickup, delivery, or shipping method
   - Customer information
   - Order items
   - Remarks
   - Activity history
   - Order status, payment information, and shipment information

### Edit Customer Information

1. In **Customer Information**, click **Edit**.
2. Update contact details:
   - Customer name
   - Email address
   - Phone number
3. Update shipping and billing address details, if present.
4. Use **Same as shipping address** when billing address should match shipping address.
5. Click **Update**.

### Edit Order Items

Order items are editable only when the order is in an editable state, such as **Pending Payment**.

1. In **Order Items**, select an active item row.
2. Update the item status.
3. If the item has an appointment, update:
   - Appointment date
   - Appointment status
4. Review the pricing summary.
5. Click **Update**.

### Update Order Status

1. In the order actions panel, choose the new status.
2. Click **Update Order Status**.
3. Confirm the action if the portal asks for confirmation.

Completion validation is owned by the backend and follows the merchant's order-completion setting. If an update is rejected, review the required payment and fulfillment batch states before retrying.

### Add or Update Payment Information

1. In **Payment Information**, click **Add Payment** when there is no payment, or select an existing payment.
2. Enter or update:
   - Payment date and time
   - Payment type
   - Reference numbers
   - Payment amount
   - Currency
3. Click **Update**.

### Manage Fulfillment Batches

Order and sale details show one card for each fulfillment batch. Each card includes its fulfillment and shipment statuses, shipping method and fee, courier and tracking values, and relevant timestamps.

1. In **Fulfillment batches**, choose the next available lifecycle action: **Start Processing**, **Mark as Packed**, or **Mark as Fulfilled**.
2. Click **Edit** to update the batch's shipping method, explicit fee, courier, or tracking number.
3. Enter a nonblank reason when changing the shipping method or fee. A reason is optional when only courier or tracking details change.
4. Add a tracking number before using **Mark as Shipped**, then use **Mark as Delivered** when delivery is complete.
5. Refresh the detail after an update if you need to confirm the latest aggregate order status.

Fulfillment batches on completed sales remain editable. Batch deletion and splitting are not available yet; the portal only offers creation when the first repair or pickup batch is missing. Completion validation remains backend-owned.

## Tips

- Use table filters before exporting data so the exported CSV matches the view you need.
- Use the refresh button on order detail pages after payment or fulfillment batch changes.
- Keep product codes short and stable, because they are used as identifiers in product detail pages.
- For services, confirm the store operating hours before using **Follow operation hour**.
