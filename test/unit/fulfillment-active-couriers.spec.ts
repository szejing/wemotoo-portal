import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createPinia, setActivePinia } from 'pinia';

mock.module('../../app/stores/AppUi/AppUi', () => ({
	failedNotification: mock(),
	successNotification: mock(),
}));

const { useCourierStore } = await import('../../app/stores/Courier/Courier');

describe('fulfillment courier options', () => {
	const getMany = mock();

	beforeEach(() => {
		setActivePinia(createPinia());
		getMany.mockClear();
		(globalThis as unknown as { useNuxtApp: () => unknown }).useNuxtApp = () => ({
			$api: { courier: { getMany } },
		});
	});

	it('loads every active courier independently from the paginated listing cache', async () => {
		getMany
			.mockResolvedValueOnce({
				data: [
					{ id: 2, name: 'Courier B', is_active: true },
					{ id: 3, name: 'Inactive', is_active: false },
				],
				'@odata.count': 3,
			})
			.mockResolvedValueOnce({
				data: [{ id: 4, name: 'Courier C', is_active: true }],
				'@odata.count': 3,
			});
		const store = useCourierStore();
		store.couriers = [{ id: 1, name: 'Stale listing row', is_active: true }];

		const couriers = await store.fetchAllActiveCouriers();

		expect(couriers.map((courier) => courier.id)).toEqual([2, 4]);
		expect(store.couriers.map((courier) => courier.id)).toEqual([1]);
		expect(getMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
			$filter: 'is_active eq true',
			$count: true,
			$skip: 0,
		}));
		expect(getMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ $skip: 2 }));
	});
});
