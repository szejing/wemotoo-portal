# Simplified Fulfillment UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the customer-facing fulfillment card and replace the portal's technical fulfillment workspace with a compact sidebar shipping card, courier/tracking editor, and valid-next-status popover.

**Architecture:** Keep the existing fulfillment API, stores, UUID actions, automatic first-tracking shipment promotion, and canonical money helpers. Simplify only the webapp composition and portal presentation: the portal list remains batch-aware internally, but hides batch metadata for one row and exposes it only when multiple rows need differentiation.

**Tech Stack:** Vue 3, Nuxt 4, Nuxt UI, Pinia, TypeScript, Vitest/Nuxt Test Utils, Bun test, Tailwind CSS.

## Global Constraints

- Do not change backend entities, endpoints, fulfillment rules, or email behavior.
- Webapp shipping progress remains in `TrackingTimeline.vue`; do not add another customer shipping summary.
- Portal shipping management appears only for delivery orders, in the desktop sidebar and mobile order-actions drawer.
- The edit popup exposes only Courier and Tracking number.
- The first non-empty tracking number relies on the backend's existing automatic shipped transition.
- Shipping method, fee, and zone are read-only portal display values.
- Batch count and lifecycle/shipment badges appear only when there are multiple batches.
- Status changes use one popover containing only currently valid next transitions.
- Do not expose delete, split, or a manual Mark shipped control.
- Use Node-based Nuxt commands; do not run portal Nuxt scripts with `bun --bun`.

---

### Task 1: Remove the customer-facing fulfillment section

**Files:**
- Create: `wemotoo-webapp/app/components/Order/order-detail-fulfillment-visibility.test.ts`
- Modify: `wemotoo-webapp/app/components/Order/DetailView.vue`
- Delete: `wemotoo-webapp/app/components/Order/FulfillmentBatches.vue`

**Interfaces:**
- Consumes: `OrderTrackingDetails` and its existing `TrackingTimeline.vue` activity-log rendering.
- Produces: A shared order/sale detail page with no standalone fulfillment-batch component.

- [x] **Step 1: Write the failing visibility test**

```ts
import { describe, expect, it } from 'bun:test';

describe('order detail fulfillment visibility', () => {
	it('keeps shipping progress in the activity timeline without a separate fulfillment section', async () => {
		const detailSource = await Bun.file(new URL('./DetailView.vue', import.meta.url)).text();
		const timelineSource = await Bun.file(new URL('./TrackingTimeline.vue', import.meta.url)).text();

		expect(detailSource).not.toContain('<OrderFulfillmentBatches');
		expect(detailSource).toContain('<OrderTrackingDetails');
		expect(timelineSource).toContain('props.order?.logs ?? []');
	});
});
```

- [x] **Step 2: Run the test and verify RED**

Run:

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-webapp
bun test app/components/Order/order-detail-fulfillment-visibility.test.ts
```

Expected: FAIL because `DetailView.vue` still contains `<OrderFulfillmentBatches>`.

- [x] **Step 3: Remove the standalone section**

Delete this invocation from `DetailView.vue`:

```vue
<OrderFulfillmentBatches :fulfillments="purchaseOrder?.fulfillments ?? []" />
```

Delete `FulfillmentBatches.vue`. Keep `app/utils/order-fulfillment.ts`, fulfillment response types, and payment-summary fee helpers because other consumers still require them.

- [x] **Step 4: Run focused and webapp regression tests**

Run:

```bash
bun test app/components/Order/order-detail-fulfillment-visibility.test.ts app/utils/order-fulfillment.test.ts app/utils/checkout-payload.test.ts
bun test app
```

Expected: both commands PASS; the full app run reports no failures.

- [x] **Step 5: Commit the webapp change**

```bash
git add app/components/Order/DetailView.vue app/components/Order/FulfillmentBatches.vue app/components/Order/order-detail-fulfillment-visibility.test.ts
git commit -m "refactor: keep fulfillment updates in order timeline"
```

---

### Task 2: Reduce portal arrangement editing to courier and tracking

**Files:**
- Modify: `wemotoo-portal/app/components/Fulfillment/ArrangementModal.vue`
- Modify: `wemotoo-portal/app/utils/fulfillment.ts`
- Modify: `wemotoo-portal/test/nuxt/fulfillment-arrangement-modal.nuxt.spec.ts`
- Create: `wemotoo-portal/test/unit/fulfillment-arrangement-payload.spec.ts`
- Delete: `wemotoo-portal/app/utils/schema/Fulfillment/ArrangementValidation.ts`
- Delete: `wemotoo-portal/test/unit/fulfillment-arrangement-validation.spec.ts`

**Interfaces:**
- Consumes: `FulfillmentBatch`, active `Courier[]`, and `save(payload: Omit<UpdateFulfillmentReq, 'merchant_id'>)`.
- Produces: `buildFulfillmentArrangementPayload(state)` returning only `courier_id`, `courier_name`, and `tracking_no`.

- [x] **Step 1: Write failing payload tests**

Create `fulfillment-arrangement-payload.spec.ts`:

```ts
import { describe, expect, it } from 'bun:test';
import { buildFulfillmentArrangementPayload } from '../../app/utils/fulfillment';

describe('simple fulfillment arrangement payload', () => {
	it('submits only courier and tracking values', () => {
		expect(buildFulfillmentArrangementPayload({
			courier_id: 2,
			courier_name: 'DHL',
			tracking_no: '  TRACK-2  ',
		})).toEqual({
			courier_id: 2,
			courier_name: 'DHL',
			tracking_no: 'TRACK-2',
		});
	});

	it('preserves a snapshot courier and normalizes blank tracking', () => {
		expect(buildFulfillmentArrangementPayload({
			courier_id: null,
			courier_name: 'Merchant Fleet',
			tracking_no: '   ',
		})).toEqual({
			courier_id: null,
			courier_name: 'Merchant Fleet',
			tracking_no: null,
		});
	});
});
```

Update the Nuxt modal test to assert that the rendered form contains one courier selector and one tracking input, and does not contain shipping method, shipping fee, or reason fields:

```ts
expect(wrapper.find('[data-testid="fulfillment-courier-select"]').exists()).toBe(true);
expect(wrapper.find('[data-testid="fulfillment-tracking-input"]').exists()).toBe(true);
expect(wrapper.find('[name="shipping_method_id"]').exists()).toBe(false);
expect(wrapper.find('[name="shipping_fee"]').exists()).toBe(false);
expect(wrapper.find('[name="reason"]').exists()).toBe(false);
```

- [x] **Step 2: Run tests and verify RED**

Run:

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
bun test test/unit/fulfillment-arrangement-payload.spec.ts
PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH" npx vitest run test/nuxt/fulfillment-arrangement-modal.nuxt.spec.ts
```

Expected: payload test FAIL because the helper still requires and returns method/fee/reason; Nuxt test FAIL because those controls remain visible.

- [x] **Step 3: Narrow the payload helper**

Replace the arrangement state and builder in `app/utils/fulfillment.ts` with:

```ts
export type FulfillmentArrangementState = {
	courier_id: number | null;
	courier_name: string;
	tracking_no: string;
};

export function buildFulfillmentArrangementPayload(
	state: FulfillmentArrangementState,
): Omit<UpdateFulfillmentReq, 'merchant_id'> {
	return {
		courier_id: state.courier_id,
		courier_name: state.courier_name.trim() || null,
		tracking_no: state.tracking_no.trim() || null,
	};
}
```

Keep `sumFulfillmentShippingFees` and `getFulfillmentMethodDescriptions` unchanged.

- [x] **Step 4: Simplify the modal**

Remove shipping-method sources, fee state, reason state, schema imports, and method/fee/reason fields. Model the single courier selector as an object so an existing inactive or custom snapshot can be included without a second text field:

```ts
type CourierOption = {
	id: number | null;
	name: string;
	description?: string;
};

const selectedCourier = ref<CourierOption>();
const trackingNo = ref('');

const courierOptions = computed<CourierOption[]>(() => {
	const options = props.couriers
		.filter((courier) => courier.is_active)
		.map((courier) => ({ id: courier.id, name: courier.name, description: courier.description ?? undefined }));
	const snapshotName = props.batch.courier_name?.trim();
	if (snapshotName && !options.some((option) => option.id === props.batch.courier_id)) {
		options.unshift({ id: props.batch.courier_id ?? null, name: snapshotName });
	}
	return options;
});

const applyBatch = () => {
	selectedCourier.value = courierOptions.value.find((option) => option.id === props.batch.courier_id)
		?? courierOptions.value.find((option) => option.name === props.batch.courier_name?.trim());
	trackingNo.value = props.batch.tracking_no ?? '';
};
```

Submit only:

```ts
await props.save(buildFulfillmentArrangementPayload({
	courier_id: selectedCourier.value?.id ?? null,
	courier_name: selectedCourier.value?.name ?? '',
	tracking_no: trackingNo.value,
}));
```

Render the two controls with stable test IDs:

```vue
<UFormField :label="$t('components.fulfillment.courierName')">
	<USelectMenu
		v-model="selectedCourier"
		data-testid="fulfillment-courier-select"
		:items="courierOptions"
		label-key="name"
		class="w-full"
	/>
</UFormField>
<UFormField :label="$t('components.fulfillment.trackingNumber')">
	<UInput v-model="trackingNo" data-testid="fulfillment-tracking-input" />
</UFormField>
```

Delete the now-unused arrangement schema and its old method/fee validation test.

- [x] **Step 5: Run focused tests and commit**

Run:

```bash
bun test test/unit/fulfillment-arrangement-payload.spec.ts
PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH" npx vitest run test/nuxt/fulfillment-arrangement-modal.nuxt.spec.ts
```

Expected: both suites PASS.

Commit:

```bash
git add app/components/Fulfillment/ArrangementModal.vue app/utils/fulfillment.ts app/utils/schema/Fulfillment/ArrangementValidation.ts test/nuxt/fulfillment-arrangement-modal.nuxt.spec.ts test/unit/fulfillment-arrangement-validation.spec.ts test/unit/fulfillment-arrangement-payload.spec.ts
git commit -m "refactor: simplify fulfillment shipping editor"
```

---

### Task 3: Build the compact batch-aware shipping card and status popover

**Files:**
- Modify: `wemotoo-portal/app/components/Fulfillment/BatchCard.vue`
- Modify: `wemotoo-portal/app/components/Fulfillment/BatchList.vue`
- Modify: `wemotoo-portal/test/nuxt/fulfillment-batch-card.nuxt.spec.ts`
- Modify: `wemotoo-portal/test/nuxt/order-detail-fulfillment-batches.nuxt.spec.ts`

**Interfaces:**
- Consumes: `FulfillmentBatch`, `currencyCode`, `showBatchMeta`, `FulfillmentStore.runAction(id, next)`, and the simplified arrangement modal from Task 2.
- Produces: A delivery shipping card that emits `edit(batch)` and `action(next, batch)` while exposing only valid next transitions.

- [x] **Step 1: Rewrite tests for the compact behavior**

Add assertions for one batch:

```ts
expect(wrapper.get('[data-testid="fulfillment-method"]').text()).toContain('Standard delivery');
expect(wrapper.get('[data-testid="fulfillment-fee"]').text()).toContain('8');
expect(wrapper.get('[data-testid="fulfillment-zone"]').text()).toBe('zone-1');
expect(wrapper.get('[data-testid="fulfillment-courier"]').text()).toBe('DHL');
expect(wrapper.get('[data-testid="fulfillment-tracking"]').text()).toBe('TRACK-1');
expect(wrapper.find('[data-testid="fulfillment-batch-number"]').exists()).toBe(false);
expect(wrapper.find('[data-testid="fulfillment-status-badges"]').exists()).toBe(false);
expect(wrapper.find('[data-testid^="fulfillment-action-"]').exists()).toBe(false);
expect(wrapper.find('[data-testid="fulfillment-update-status"]').exists()).toBe(true);
```

Add a multiple-batch list case:

```ts
expect(wrapper.get('[data-testid="fulfillment-batch-count"]').text()).toContain('2');
expect(wrapper.findAll('[data-testid="fulfillment-batch-number"]')).toHaveLength(2);
expect(wrapper.findAll('[data-testid="fulfillment-status-badges"]')).toHaveLength(2);
```

Add explicit popover transition assertions:

```ts
await wrapper.get('[data-testid="fulfillment-update-status"]').trigger('click');
await nextTick();
expect(document.body.querySelector('[data-testid="fulfillment-next-processing"]')).not.toBeNull();
expect(document.body.querySelector('[data-testid="fulfillment-next-shipped"]')).toBeNull();

const shippedWrapper = await mountSuspended(FulfillmentBatchCard, {
	props: { batch: batch({ status: 'fulfilled', shipment_status: 'shipped' }), showBatchMeta: false },
});
await shippedWrapper.get('[data-testid="fulfillment-update-status"]').trigger('click');
await nextTick();
expect(document.body.querySelector('[data-testid="fulfillment-next-delivered"]')).not.toBeNull();
```

- [x] **Step 2: Run Nuxt tests and verify RED**

Run:

```bash
PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH" npx vitest run test/nuxt/fulfillment-batch-card.nuxt.spec.ts test/nuxt/order-detail-fulfillment-batches.nuxt.spec.ts
```

Expected: FAIL because count/badges are unconditional, technical action buttons are visible, and zone/status popover behavior is missing.

- [x] **Step 3: Refactor `BatchCard.vue`**

Add the conditional metadata prop:

```ts
const props = withDefaults(defineProps<{
	batch: FulfillmentBatch;
	currencyCode?: string;
	showBatchMeta?: boolean;
	loading?: boolean;
}>(), {
	currencyCode: 'MYR',
	showBatchMeta: false,
	loading: false,
});
```

Build valid next actions without a shipped action:

```ts
const nextActions = computed(() => {
	const actions: { action: FulfillmentAction; label: string; color: 'primary' | 'success' }[] = [];
	if (props.batch.status === 'pending') actions.push({ action: 'processing', label: 'components.fulfillment.startProcessing', color: 'primary' });
	if (props.batch.status === 'processing') actions.push({ action: 'packed', label: 'components.fulfillment.markAsPacked', color: 'primary' });
	if (props.batch.status === 'packed') actions.push({ action: 'fulfilled', label: 'components.fulfillment.markAsFulfilled', color: 'primary' });
	if (['shipped', 'in_transit'].includes(props.batch.shipment_status)) actions.push({ action: 'delivered', label: 'components.fulfillment.markAsDelivered', color: 'success' });
	return actions;
});
```

Render a customer-friendly Shipping title for one batch, and gate the technical batch title plus badges with `showBatchMeta`:

```vue
<template #header>
	<div class="flex items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<UIcon name="i-heroicons-truck" class="size-5 text-main" />
			<h3 v-if="showBatchMeta" data-testid="fulfillment-batch-number" class="font-semibold text-default">
				{{ $t('components.fulfillment.batchNumber', { number: batch.batch_no }) }}
			</h3>
			<h3 v-else class="font-semibold text-default">{{ $t('components.fulfillment.shippingTitle') }}</h3>
		</div>
		<div v-if="showBatchMeta" data-testid="fulfillment-status-badges" class="flex gap-2">
			<UBadge :color="getFulfillmentStatusColor(batch.status)" variant="subtle">{{ $t(lifecycleLabels[batch.status]) }}</UBadge>
			<UBadge :color="getShipmentStatusColor(batch.shipment_status)" variant="subtle">{{ $t(shipmentLabels[batch.shipment_status]) }}</UBadge>
		</div>
	</div>
</template>
```

Render only the approved arrangement values in the body:

```vue
<dl class="grid grid-cols-1 gap-3 text-sm">
	<div><dt class="text-muted">{{ $t('components.fulfillment.shippingMethod') }}</dt><dd data-testid="fulfillment-method">{{ batch.shipping_method?.description || $t('components.fulfillment.notYetProvided') }}</dd></div>
	<div><dt class="text-muted">{{ $t('components.fulfillment.shippingFee') }}</dt><dd data-testid="fulfillment-fee">{{ formatCurrency(batch.shipping_fee, currencyCode) }}</dd></div>
	<div><dt class="text-muted">{{ $t('components.fulfillment.shippingZone') }}</dt><dd data-testid="fulfillment-zone">{{ batch.shipping_zone_id || $t('components.fulfillment.notYetProvided') }}</dd></div>
	<div><dt class="text-muted">{{ $t('components.fulfillment.courierName') }}</dt><dd data-testid="fulfillment-courier">{{ batch.courier_name?.trim() || $t('components.fulfillment.notYetProvided') }}</dd></div>
	<div><dt class="text-muted">{{ $t('components.fulfillment.trackingNumber') }}</dt><dd data-testid="fulfillment-tracking">{{ batch.tracking_no?.trim() || $t('components.fulfillment.notYetProvided') }}</dd></div>
</dl>
```

Remove all timestamps and the old separate transition buttons. Add Edit and one status popover:

```vue
<UPopover v-if="nextActions.length">
	<UButton
		data-testid="fulfillment-update-status"
		color="neutral"
		variant="soft"
		icon="i-heroicons-arrow-path"
		:disabled="loading"
	>
		{{ $t('components.fulfillment.updateStatus') }}
	</UButton>
	<template #content>
		<div class="w-64 space-y-2 p-3">
			<p class="text-sm font-medium text-default">{{ $t('components.fulfillment.chooseNextStatus') }}</p>
			<UButton
				v-for="item in nextActions"
				:key="item.action"
				:data-testid="`fulfillment-next-${item.action}`"
				block
				:color="item.color"
				variant="soft"
				:loading="loading"
				@click="emit('action', item.action, batch)"
			>
				{{ $t(item.label) }}
			</UButton>
		</div>
	</template>
</UPopover>
```

- [x] **Step 4: Refactor `BatchList.vue`**

Remove shipping-method loading and missing-batch creation UI. Load only active couriers when Edit opens. Pass `showBatchMeta` only when `batches.length > 1` and show the heading/count only in that case:

```vue
<section v-if="batches.length" class="space-y-3" aria-labelledby="fulfillment-shipping-heading">
	<div v-if="batches.length > 1" class="flex items-center justify-between gap-3">
		<h2 id="fulfillment-shipping-heading" class="text-base font-semibold text-default">
			{{ $t('components.fulfillment.batchesTitle') }}
		</h2>
		<UBadge data-testid="fulfillment-batch-count" color="neutral" variant="subtle">
			{{ $t('components.fulfillment.batchCount', { count: batches.length }) }}
		</UBadge>
	</div>
	<FulfillmentBatchCard
		v-for="batch in batches"
		:key="batch.id"
		:batch="batch"
		:currency-code="currencyCode"
		:show-batch-meta="batches.length > 1"
		:loading="loading"
		@edit="editBatch"
		@action="runAction"
	/>
</section>
```

Use `courierStore.fetchAllActiveCouriers()` before opening `LazyFulfillmentArrangementModal`; pass only `batch`, `couriers`, and `save`.

- [x] **Step 5: Run focused tests and commit**

Run:

```bash
PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH" npx vitest run test/nuxt/fulfillment-batch-card.nuxt.spec.ts test/nuxt/order-detail-fulfillment-batches.nuxt.spec.ts
bun test test/unit/fulfillment-active-couriers.spec.ts test/unit/fulfillment-server-routes.spec.ts
```

Expected: all suites PASS.

Commit:

```bash
git add app/components/Fulfillment/BatchCard.vue app/components/Fulfillment/BatchList.vue test/nuxt/fulfillment-batch-card.nuxt.spec.ts test/nuxt/order-detail-fulfillment-batches.nuxt.spec.ts
git commit -m "refactor: compact portal fulfillment controls"
```

---

### Task 4: Restore portal sidebar placement and verify the complete flow

**Files:**
- Modify: `wemotoo-portal/app/pages/orders/[order_no].vue`
- Modify: `wemotoo-portal/test/unit/order-detail-fulfillment-owner.spec.ts`
- Modify: `wemotoo-portal/i18n/locales/en.json`
- Modify: `wemotoo-portal/i18n/locales/ms.json`
- Modify: `wemotoo-portal/docs/merchant-portal-user-guide.md`

**Interfaces:**
- Consumes: `FulfillmentBatchList` from Task 3 and existing `ownerType`, `orderForModal`, `getOrderDetails`, `isLgUp`, and mobile drawer state.
- Produces: Delivery-only shipping management in both existing action surfaces, retaining order and sale behavior.

- [x] **Step 1: Write failing placement assertions**

Update `order-detail-fulfillment-owner.spec.ts` to read the page source and assert:

```ts
const occurrences = source.match(/<FulfillmentBatchList/g) ?? [];
expect(occurrences).toHaveLength(2);
expect(source.indexOf('<FulfillmentBatchList')).toBeGreaterThan(source.indexOf('<!-- Sidebar (desktop) -->'));
expect(source).toContain('(record?.order_type ?? OrderType.PICKUP) === OrderType.DELIVERY');
expect(source).toContain(':owner-type="ownerType"');
expect(source).toContain('@refresh="getOrderDetails"');
```

- [x] **Step 2: Run the test and verify RED**

Run:

```bash
bun test test/unit/order-detail-fulfillment-owner.spec.ts
```

Expected: FAIL because the list currently appears once in the main content column.

- [x] **Step 3: Move the component to desktop and mobile action areas**

Remove `FulfillmentBatchList` from `.main-wrapper`. Add this block after payment in both `.sticky-sidebar` and `.mobile-actions-drawer-body`:

```vue
<FulfillmentBatchList
	v-if="orderForModal && (record?.order_type ?? OrderType.PICKUP) === OrderType.DELIVERY"
	:order="orderForModal"
	:owner-type="ownerType"
	@refresh="getOrderDetails"
/>
```

Do not add the card to pickup orders or any customer-facing route.

- [x] **Step 4: Update concise copy and documentation**

Add matching English/Malay translations for:

```json
{
	"shippingTitle": "Shipping",
	"shippingZone": "Shipping zone",
	"updateStatus": "Update status",
	"chooseNextStatus": "Choose the next status"
}
```

Use natural Malay equivalents:

```json
{
	"shippingTitle": "Penghantaran",
	"shippingZone": "Zon penghantaran",
	"updateStatus": "Kemas kini status",
	"chooseNextStatus": "Pilih status seterusnya"
}
```

Update the merchant guide to state that courier/tracking are edited in the order sidebar, first tracking automatically marks shipped, and status changes live under one Update status popover.

- [x] **Step 5: Run complete affected verification**

Run portal tests:

```bash
bun test test/unit/order-detail-fulfillment-owner.spec.ts test/unit/fulfillment-arrangement-payload.spec.ts test/unit/fulfillment-active-couriers.spec.ts test/unit/fulfillment-server-routes.spec.ts
PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH" npx vitest run test/nuxt/fulfillment-arrangement-modal.nuxt.spec.ts test/nuxt/fulfillment-batch-card.nuxt.spec.ts test/nuxt/order-detail-fulfillment-batches.nuxt.spec.ts
```

Run portal checks:

```bash
git diff --check
node -e "JSON.parse(require('fs').readFileSync('i18n/locales/en.json')); JSON.parse(require('fs').readFileSync('i18n/locales/ms.json'))"
PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH" npm run build:dev
```

Run webapp checks:

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-webapp
git diff --check
bun test app
bun --bun node_modules/.bin/eslint app/components/Order/DetailView.vue app/components/Order/order-detail-fulfillment-visibility.test.ts
PATH="$HOME/.nvm/versions/node/v20.19.6/bin:$PATH" npm run build:local
```

Expected: focused tests and both builds PASS. Existing non-blocking Nuxt/Rollup warnings may remain, but no new test, lint, JSON, or build failure is accepted.

- [x] **Step 6: Commit the portal placement and copy**

```bash
cd /Users/szejinggo/Documents/Projects/ecommerce/wemotoo-portal
git add app/pages/orders/'[order_no].vue' test/unit/order-detail-fulfillment-owner.spec.ts i18n/locales/en.json i18n/locales/ms.json docs/merchant-portal-user-guide.md
git commit -m "refactor: move fulfillment shipping to order sidebar"
```
