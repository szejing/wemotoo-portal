import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useFulfillmentStore } from '../../app/stores/Fulfillment/Fulfillment';
import { useShipmentStore } from '../../app/stores/Shipment/Shipment';
import { useShippingMethodStore } from '../../app/stores/ShippingMethod/ShippingMethod';

const { successNotification, failedNotification } = vi.hoisted(() => ({
	successNotification: vi.fn(),
	failedNotification: vi.fn(),
}));

vi.mock('../../app/stores/AppUi/AppUi', () => ({
	successNotification,
	failedNotification,
}));

describe('fulfillment/shipment/shipping stores', () => {
	const apiMock = {
		fulfillment: {
			create: vi.fn(),
			markProcessing: vi.fn(),
			markPacked: vi.fn(),
			markFulfilled: vi.fn(),
		},
		shipment: {
			getMany: vi.fn(),
			getSingle: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			remove: vi.fn(),
			markShipped: vi.fn(),
			markDelivered: vi.fn(),
		},
		shippingMethod: {
			getMany: vi.fn(),
			getSingle: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			remove: vi.fn(),
		},
	};

	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		(globalThis as unknown as { useNuxtApp: () => unknown }).useNuxtApp = () => ({ $api: apiMock }) as unknown;
		(globalThis as unknown as { useCookie: (key: string) => { value: string } }).useCookie = () => ({ value: 'm1' });
	});

	it('creates fulfillment and stores the response', async () => {
		apiMock.fulfillment.create.mockResolvedValue({
			fulfillment: { id: 'f1', order_no: 'O1', inv_no: 'I1', status: 'pending' },
		});
		const store = useFulfillmentStore();

		const result = await store.createFulfillment('O1');

		expect(result?.id).toBe('f1');
		expect(store.creating).toBe(false);
		expect(successNotification).toHaveBeenCalled();
	});

	it('marks shipment as shipped', async () => {
		apiMock.shipment.markShipped.mockResolvedValue({
			shipment: {
				id: 's1',
				order_no: 'O1',
				inv_no: 'I1',
				courier_name: 'J&T',
				tracking_no: 'TRK-1',
				shipping_fee: 6,
				status: 'shipped',
			},
		});
		const store = useShipmentStore();

		const result = await store.markShipped('s1');

		expect(result?.status).toBe('shipped');
		expect(store.updating).toBe(false);
		expect(successNotification).toHaveBeenCalled();
	});

	it('marks shipment as delivered', async () => {
		apiMock.shipment.markDelivered.mockResolvedValue({
			shipment: {
				id: 's1',
				order_no: 'O1',
				inv_no: 'I1',
				courier_name: 'J&T',
				tracking_no: 'TRK-1',
				shipping_fee: 6,
				status: 'delivered',
			},
		});
		const store = useShipmentStore();

		const result = await store.markDelivered('s1');

		expect(result?.status).toBe('delivered');
		expect(store.updating).toBe(false);
		expect(successNotification).toHaveBeenCalled();
	});

	it('updates a shipment', async () => {
		apiMock.shipment.update.mockResolvedValue({
			shipment: {
				id: 's1',
				order_no: 'O1',
				inv_no: 'I1',
				courier_name: 'DHL',
				tracking_no: 'TRK-1',
				shipping_fee: 6,
				status: 'in_transit',
			},
		});
		const store = useShipmentStore();

		const result = await store.updateShipment('s1', {
			courier_name: 'DHL',
		});

		expect(result?.courier_name).toBe('DHL');
		expect(store.updating).toBe(false);
		expect(successNotification).toHaveBeenCalled();
	});

	it('deletes a shipment', async () => {
		apiMock.shipment.remove.mockResolvedValue({
			shipment: {
				id: 's1',
				order_no: 'O1',
				inv_no: 'I1',
				courier_name: 'DHL',
				tracking_no: 'TRK-1',
				shipping_fee: 6,
				status: 'failed',
			},
		});
		const store = useShipmentStore();
		store.shipments = [
			{
				id: 's1',
				order_no: 'O1',
				inv_no: 'I1',
				courier_name: 'DHL',
				tracking_no: 'TRK-1',
				shipping_fee: 6,
				status: 'failed',
			},
		];

		await store.deleteShipment('s1');

		expect(store.shipments).toHaveLength(0);
		expect(store.removing).toBe(false);
		expect(successNotification).toHaveBeenCalled();
	});

	it('loads shipping methods into state with OData pagination', async () => {
		apiMock.shippingMethod.getMany.mockResolvedValue({
			data: [{ id: 1, description: 'Standard', priority: 1, is_active: true }],
			count: 1,
		});
		const store = useShippingMethodStore();

		await store.getShippingMethods();

		expect(store.getDisplayMethods).toHaveLength(1);
		expect(store.methods[0]?.description).toBe('Standard');
		expect(store.total_shipping_methods).toBe(1);
		expect(store.loading).toBe(false);
		expect(apiMock.shippingMethod.getMany).toHaveBeenCalledWith(
			expect.objectContaining({
				$top: store.filter.page_size,
				$count: true,
				$skip: 0,
			}),
		);
	});

	it('refetches when inactive filter is applied', async () => {
		apiMock.shippingMethod.getMany.mockResolvedValue({
			data: [{ id: 2, description: 'Express', priority: 2, is_active: false }],
			count: 1,
		});
		const store = useShippingMethodStore();
		store.filter.status = 'inactive';
		await store.getShippingMethods();

		expect(store.methods).toHaveLength(1);
		expect(store.methods[0]?.description).toBe('Express');
		expect(apiMock.shippingMethod.getMany).toHaveBeenCalledWith(
			expect.objectContaining({
				$filter: 'is_active eq false',
			}),
		);
	});

	it('creates a shipping method', async () => {
		apiMock.shippingMethod.create.mockResolvedValue({
			shipping_method: { id: 1, description: 'Standard', is_active: true },
		});
		apiMock.shippingMethod.getMany.mockResolvedValue({
			data: [{ id: 1, description: 'Standard', is_active: true }],
			count: 1,
		});
		const store = useShippingMethodStore();

		const method = await store.createShippingMethod({
			description: 'Standard',
			priority: 1,
			is_active: true,
		});

		expect(method?.description).toBe('Standard');
		expect(store.adding).toBe(false);
		expect(successNotification).toHaveBeenCalled();
		expect(apiMock.shippingMethod.create).toHaveBeenCalledWith(
			expect.objectContaining({
				merchant_id: 'm1',
				description: 'Standard',
				priority: 1,
			}),
		);
	});

	it('updates a shipping method', async () => {
		apiMock.shippingMethod.update.mockResolvedValue({
			shipping_method: { id: 1, description: 'Express', priority: 2, is_active: true },
		});
		apiMock.shippingMethod.getMany.mockResolvedValue({
			data: [{ id: 1, description: 'Express', priority: 2, is_active: true }],
			count: 1,
		});
		const store = useShippingMethodStore();

		const method = await store.updateShippingMethod('1', {
			description: 'Express',
			priority: 2,
		});

		expect(method?.description).toBe('Express');
		expect(store.updating).toBe(false);
		expect(successNotification).toHaveBeenCalled();
	});

	it('updates shipping method active status from the table switch', async () => {
		apiMock.shippingMethod.update.mockResolvedValue({
			shipping_method: { id: '1', description: 'Express', priority: 2, is_active: false },
		});
		apiMock.shippingMethod.getMany.mockResolvedValue({
			data: [{ id: '1', description: 'Express', priority: 2, is_active: false }],
			count: 1,
		});
		const store = useShippingMethodStore();

		await store.updateStatus({ id: 1, description: 'Express', is_active: true }, false);

		expect(apiMock.shippingMethod.update).toHaveBeenCalledWith('1', expect.objectContaining({ merchant_id: 'm1', is_active: false }));
		expect(store.updating).toBe(false);
		expect(successNotification).toHaveBeenCalled();
	});

	it('fetches all shipping methods without replacing paginated listing', async () => {
		apiMock.shippingMethod.getMany
			.mockResolvedValueOnce({
				data: [{ id: 1, description: 'Standard', priority: 1, is_active: true }],
				count: 1,
			})
			.mockResolvedValueOnce({
				data: [
					{ id: 1, description: 'Standard', priority: 1, is_active: true },
					{ id: 2, description: 'Express', priority: 2, is_active: true },
				],
				count: 2,
			});
		const store = useShippingMethodStore();
		await store.getShippingMethods();
		expect(store.methods).toHaveLength(1);

		const all = await store.fetchAllShippingMethods();

		expect(all).toHaveLength(2);
		expect(store.methods).toHaveLength(1);
	});

	it('deletes a shipping method', async () => {
		apiMock.shippingMethod.remove.mockResolvedValue({
			shipping_method: { id: 1, description: 'Standard', priority: 1, is_active: true },
		});
		apiMock.shippingMethod.getMany.mockResolvedValue({
			data: [],
			count: 0,
		});
		const store = useShippingMethodStore();
		store.methods = [{ id: 1, description: 'Standard', priority: 1, is_active: true }];

		await store.deleteShippingMethod('1');

		expect(store.methods).toHaveLength(0);
		expect(store.removing).toBe(false);
		expect(successNotification).toHaveBeenCalled();
	});

	it('handles shipping methods API errors', async () => {
		apiMock.shippingMethod.getMany.mockRejectedValue({
			message: 'failed',
		});
		const store = useShippingMethodStore();

		await expect(store.getShippingMethods()).rejects.toEqual({ message: 'failed' });
		expect(failedNotification).toHaveBeenCalled();
	});
});
