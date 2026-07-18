import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import FulfillmentBatchCard from '~/components/Fulfillment/BatchCard.vue';
import type { FulfillmentAction } from '~/stores/Fulfillment/Fulfillment';
import type { FulfillmentBatch } from '~/utils/types/order-fulfillment-shipping';

const batch = (override: Partial<FulfillmentBatch> = {}): FulfillmentBatch => ({
	id: 'batch-1',
	order_no: 'ORD-1',
	inv_no: 'INV-1',
	batch_no: 1,
	status: 'processing',
	shipment_status: 'pending',
	shipping_method: { id: 1, description: 'Standard delivery' },
	shipping_zone_id: 'zone-1',
	shipping_fee: 8,
	courier_id: 2,
	courier_name: 'DHL',
	tracking_no: 'TRACK-1',
	packed_at: null,
	shipped_at: null,
	delivered_at: null,
	created_at: '2026-07-15T00:00:00.000Z',
	updated_at: '2026-07-15T01:00:00.000Z',
	...override,
});

const nextActions = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) => {
	const internal = wrapper.vm.$ as unknown as {
		setupState: { nextActions: { action: FulfillmentAction; label: string }[] };
	};
	return internal.setupState.nextActions;
};

describe('FulfillmentBatchCard', () => {
	it('shows a compact shipping summary with shipment status only', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchCard, {
			props: { batch: batch(), currencyCode: 'MYR' },
		});

		expect(wrapper.get('[data-testid="fulfillment-courier"]').text()).toBe('DHL');
		expect(wrapper.get('[data-testid="fulfillment-tracking"]').text()).toContain('TRACK-1');
		expect(wrapper.get('[data-testid="fulfillment-method"]').text()).toContain('Standard delivery');
		expect(wrapper.get('[data-testid="fulfillment-fee"]').text()).toContain('8');
		expect(wrapper.get('[data-testid="fulfillment-zone"]').text()).toBe('zone-1');
		expect(wrapper.find('[data-testid="fulfillment-batch-number"]').exists()).toBe(false);
		expect(wrapper.get('[data-testid="fulfillment-status-badges"]').findAllComponents({ name: 'UBadge' })).toHaveLength(1);
		expect(wrapper.find('[data-testid^="fulfillment-action-"]').exists()).toBe(false);
		expect(wrapper.find('[data-testid="fulfillment-created-at"]').exists()).toBe(false);
		expect(wrapper.findComponent({ name: 'UPopover' }).exists()).toBe(false);
		expect(wrapper.find('[data-testid="fulfillment-update-status"]').exists()).toBe(false);
	});

	it('hides zone when empty and shows fallbacks for missing courier/tracking', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchCard, {
			props: {
				batch: batch({
					courier_name: '',
					tracking_no: '',
					shipping_zone_id: '',
					shipping_method: null,
				}),
			},
		});

		expect(wrapper.get('[data-testid="fulfillment-courier"]').text().length).toBeGreaterThan(0);
		expect(wrapper.get('[data-testid="fulfillment-tracking"]').text().length).toBeGreaterThan(0);
		expect(wrapper.find('[data-testid="fulfillment-zone"]').exists()).toBe(false);
	});

	it('shows the batch number when batch metadata is requested', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchCard, {
			props: { batch: batch(), showBatchMeta: true },
		});

		expect(wrapper.get('[data-testid="fulfillment-batch-number"]').text()).toContain('1');
		expect(wrapper.get('[data-testid="fulfillment-status-badges"]').findAllComponents({ name: 'UBadge' })).toHaveLength(1);
	});

	it('does not expose packing lifecycle actions on the shipping card', async () => {
		const pendingWrapper = await mountSuspended(FulfillmentBatchCard, {
			props: { batch: batch({ status: 'pending', shipment_status: 'pending' }) },
		});
		const processingWrapper = await mountSuspended(FulfillmentBatchCard, {
			props: { batch: batch({ status: 'processing', shipment_status: 'pending' }) },
		});

		expect(nextActions(pendingWrapper)).toEqual([]);
		expect(nextActions(processingWrapper)).toEqual([]);
		expect(pendingWrapper.find('[data-testid="fulfillment-update-status"]').exists()).toBe(false);
	});

	it('offers delivered only after a shipped or in-transit batch', async () => {
		const shippedWrapper = await mountSuspended(FulfillmentBatchCard, {
			props: { batch: batch({ status: 'fulfilled', shipment_status: 'shipped' }) },
		});
		const failedWrapper = await mountSuspended(FulfillmentBatchCard, {
			props: { batch: batch({ status: 'fulfilled', shipment_status: 'failed' }) },
		});

		expect(nextActions(shippedWrapper).map(({ action }) => action)).toEqual(['delivered']);
		expect(nextActions(failedWrapper)).toEqual([]);
		expect(failedWrapper.find('[data-testid="fulfillment-update-status"]').exists()).toBe(false);
	});
});
