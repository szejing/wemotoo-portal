import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import FulfillmentBatchList from '~/components/Fulfillment/BatchList.vue';
import { useFulfillmentStore } from '~/stores/Fulfillment/Fulfillment';
import type { FulfillmentBatch } from '~/utils/types/order-fulfillment-shipping';
import type { OrderHistory } from '~/utils/types/order-history';

const batch = (id: string, batchNo: number, override: Partial<FulfillmentBatch> = {}): FulfillmentBatch => ({
	id,
	order_no: 'ORD-1',
	inv_no: 'INV-1',
	batch_no: batchNo,
	status: 'pending',
	shipment_status: 'pending',
	shipping_method: { id: batchNo, description: batchNo === 1 ? 'Standard' : 'Express' },
	shipping_zone_id: null,
	shipping_fee: batchNo * 5,
	courier_id: null,
	courier_name: null,
	tracking_no: null,
	packed_at: null,
	shipped_at: null,
	delivered_at: null,
	created_at: '2026-07-15T00:00:00.000Z',
	updated_at: '2026-07-15T00:00:00.000Z',
	...override,
});

const order = (fulfillments: FulfillmentBatch[]): OrderHistory => ({
	order_no: 'ORD-1',
	inv_no: 'INV-1',
	type: 'order',
	fulfillments,
	currency: { code: 'MYR', name: 'Malaysian ringgit', symbol: 'RM', is_active: true },
} as unknown as OrderHistory);

describe('FulfillmentBatchList', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('renders one editable card per batch, including on sale detail', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchList, {
			props: { order: order([batch('batch-1', 1), batch('batch-2', 2)]), ownerType: 'sale' },
		});

		expect(wrapper.findAll('[data-testid="fulfillment-batch-card"]')).toHaveLength(2);
		const editButtons = wrapper.findAll('[data-testid="fulfillment-edit"]');
		expect(editButtons).toHaveLength(2);
		expect(editButtons.every((button) => button.attributes('disabled') === undefined)).toBe(true);
		expect(wrapper.find('[data-testid="fulfillment-delete"]').exists()).toBe(false);
		expect(wrapper.find('[data-testid="fulfillment-split"]').exists()).toBe(false);
	});

	it.each([
		['processing', batch('batch-processing', 1), 'fulfillment-action-processing'],
		['shipped', batch('batch-shipped', 1, { tracking_no: 'TRACK-1' }), 'fulfillment-action-shipped'],
		['delivered', batch('batch-delivered', 1, { status: 'fulfilled', shipment_status: 'shipped' }), 'fulfillment-action-delivered'],
	] as const)('runs the %s action with the batch UUID and refreshes the owner detail', async (action, fulfillment, testId) => {
		const wrapper = await mountSuspended(FulfillmentBatchList, {
			props: { order: order([fulfillment]), ownerType: 'sale' },
		});
		const store = useFulfillmentStore();
		const runAction = vi.spyOn(store, 'runAction').mockResolvedValue(fulfillment);

		await wrapper.get(`[data-testid="${testId}"]`).trigger('click');

		await vi.waitFor(() => expect(runAction).toHaveBeenCalledWith(fulfillment.id, action));
		expect(wrapper.emitted('refresh')).toHaveLength(1);
	});

	it('offers only first-missing repair creation when there are no batches', async () => {
		const wrapper = await mountSuspended(FulfillmentBatchList, {
			props: { order: order([]), ownerType: 'order' },
		});

		expect(wrapper.find('[data-testid="fulfillment-create-missing"]').exists()).toBe(true);
		expect(wrapper.find('[data-testid="fulfillment-split"]').exists()).toBe(false);
	});
});
