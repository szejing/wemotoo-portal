import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import FulfillmentBatchCard from '~/components/Fulfillment/BatchCard.vue';
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

describe('FulfillmentBatchCard', () => {
	it('shows batch statuses, arrangement, values, and relevant timestamps', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchCard, {
			props: { batch: batch(), currencyCode: 'MYR' },
		});

		expect(wrapper.get('[data-testid="fulfillment-batch-number"]').text()).toContain('1');
		expect(wrapper.get('[data-testid="fulfillment-method"]').text()).toContain('Standard delivery');
		expect(wrapper.get('[data-testid="fulfillment-fee"]').text()).toContain('8');
		expect(wrapper.get('[data-testid="fulfillment-courier"]').text()).toBe('DHL');
		expect(wrapper.get('[data-testid="fulfillment-tracking"]').text()).toBe('TRACK-1');
		expect(wrapper.text()).not.toContain('Courier:');
		expect(wrapper.text()).not.toContain('Tracking:');
		expect(wrapper.find('[data-testid="fulfillment-created-at"]').exists()).toBe(true);
	});

	it('offers only valid lifecycle and shipment actions and never offers delete or split', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchCard, {
			props: { batch: batch(), currencyCode: 'MYR' },
		});

		expect(wrapper.find('[data-testid="fulfillment-action-packed"]').exists()).toBe(true);
		expect(wrapper.find('[data-testid="fulfillment-action-shipped"]').exists()).toBe(true);
		expect(wrapper.find('[data-testid="fulfillment-action-delivered"]').exists()).toBe(false);
		expect(wrapper.find('[data-testid="fulfillment-delete"]').exists()).toBe(false);
		expect(wrapper.find('[data-testid="fulfillment-split"]').exists()).toBe(false);
	});

	it('enables delivered only after a shipped or in-transit batch', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchCard, {
			props: {
				batch: batch({ status: 'fulfilled', shipment_status: 'shipped', shipped_at: '2026-07-15T02:00:00.000Z' }),
				currencyCode: 'MYR',
			},
		});

		expect(wrapper.find('[data-testid="fulfillment-action-shipped"]').exists()).toBe(false);
		expect(wrapper.find('[data-testid="fulfillment-action-delivered"]').exists()).toBe(true);
	});

	it('does not offer a shipment transition from a failed shipment state', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchCard, {
			props: {
				batch: batch({ shipment_status: 'failed' }),
				currencyCode: 'MYR',
			},
		});

		expect(wrapper.find('[data-testid="fulfillment-action-shipped"]').exists()).toBe(false);
		expect(wrapper.find('[data-testid="fulfillment-action-delivered"]').exists()).toBe(false);
	});

	it('omits a nullable updated timestamp without hiding valid timestamps', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchCard, {
			props: {
				batch: batch({ updated_at: null }),
				currencyCode: 'MYR',
			},
		});

		expect(wrapper.find('[data-testid="fulfillment-created-at"]').exists()).toBe(true);
		expect(wrapper.find('[data-testid="fulfillment-updated-at"]').exists()).toBe(false);
	});
});
