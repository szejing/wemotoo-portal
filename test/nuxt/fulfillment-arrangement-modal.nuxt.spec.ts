import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import FulfillmentArrangementModal from '~/components/Fulfillment/ArrangementModal.vue';
import type { FulfillmentBatch } from '~/utils/types/order-fulfillment-shipping';

const batch = (): FulfillmentBatch => ({
	id: 'batch-1',
	order_no: 'ORD-1',
	inv_no: 'INV-1',
	batch_no: 1,
	status: 'pending',
	shipment_status: 'pending',
	shipping_method: { id: 1, description: 'Standard' },
	shipping_zone_id: null,
	shipping_fee: 8,
	courier_id: 99,
	courier_name: 'Legacy Courier',
	tracking_no: 'OLD-TRACKING',
	packed_at: null,
	shipped_at: null,
	delivered_at: null,
	created_at: '2026-07-15T00:00:00.000Z',
	updated_at: null,
});

describe('FulfillmentArrangementModal', () => {
	it('preserves an absent courier snapshot for unrelated edits and clears its id when the name changes', async () => {
		const wrapper = await mountSuspended(FulfillmentArrangementModal, {
			props: {
				open: true,
				batch: batch(),
				shippingMethods: [],
				couriers: [{ id: 1, name: 'Active Courier', is_active: true }],
				save: vi.fn(),
			},
		});
		const internal = wrapper.vm.$ as unknown as {
			setupState: {
				state: {
					courier_id: number | null;
					courier_name: string;
					tracking_no: string;
				};
			};
		};
		const state = internal.setupState.state;

		state.tracking_no = 'NEW-TRACKING';
		await nextTick();
		expect(state.courier_id).toBe(99);
		expect(state.courier_name).toBe('Legacy Courier');

		state.courier_name = 'Manual replacement';
		await nextTick();
		expect(state.courier_id).toBeNull();
	});
});
