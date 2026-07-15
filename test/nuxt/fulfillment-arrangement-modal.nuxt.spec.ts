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
	it('shows only the courier selector and tracking input', async () => {
		const wrapper = await mountSuspended(FulfillmentArrangementModal, {
			props: {
				open: true,
				batch: batch(),
				couriers: [{ id: 1, name: 'Active Courier', is_active: true }],
				save: vi.fn(),
			},
		});

		expect(wrapper.findAllComponents({ name: 'USelectMenu' })).toHaveLength(1);
		expect(wrapper.findAllComponents({ name: 'UInput' })).toHaveLength(1);
		expect(wrapper.findComponent({ name: 'UModal' }).props('title')).toBe('Update shipping');
		expect(wrapper.find('[name="shipping_method_id"]').exists()).toBe(false);
		expect(wrapper.find('[name="shipping_fee"]').exists()).toBe(false);
		expect(wrapper.find('[name="reason"]').exists()).toBe(false);
	});

	it('preserves an absent courier snapshot while editing its tracking number', async () => {
		const wrapper = await mountSuspended(FulfillmentArrangementModal, {
			props: {
				open: true,
				batch: batch(),
				couriers: [{ id: 1, name: 'Active Courier', is_active: true }],
				save: vi.fn(),
			},
		});
		const internal = wrapper.vm.$ as unknown as {
			setupState: {
				selectedCourier: { id: number | null; name: string };
				courierOptions: { id: number | null; name: string }[];
				state: { tracking_no: string };
			};
		};

		internal.setupState.state.tracking_no = 'NEW-TRACKING';
		await nextTick();
		expect(internal.setupState.selectedCourier).toEqual({ id: 99, name: 'Legacy Courier' });
		expect(internal.setupState.courierOptions[0]).toEqual({ id: 99, name: 'Legacy Courier' });
	});
});
