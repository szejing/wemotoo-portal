import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import ShipmentArrangementPage from '~/pages/operation/shipment-arrangement.vue';
import { useShipmentArrangementStore } from '~/stores/ShipmentArrangement/ShipmentArrangement';
import { useShippingMethodStore } from '~/stores/ShippingMethod/ShippingMethod';
import { useAppUiStore } from '~/stores/AppUi/AppUi';

const mountPage = () =>
	mountSuspended(ShipmentArrangementPage, {
		global: {
			stubs: {
				ZPagePanel: { template: '<main><slot name="navbar-right"/><slot/></main>' },
			},
		},
	});

const mockShippingOptions = (options: Awaited<ReturnType<ReturnType<typeof useShippingMethodStore>['fetchActiveShippingMethodOptions']>> = []) => {
	const shippingStore = useShippingMethodStore();
	return {
		getShippingMethods: vi.spyOn(shippingStore, 'getShippingMethods').mockResolvedValue(),
		fetchActiveShippingMethodOptions: vi.spyOn(shippingStore, 'fetchActiveShippingMethodOptions').mockResolvedValue(options),
	};
};

describe('ShipmentArrangementPage', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		const store = useShipmentArrangementStore();
		store.filters.search = '';
		store.filters.shippingMethodId = undefined;
		store.filters.dateRange = { start: undefined, end: undefined };
		store.page = 1;
		store.pageSize = 15;
		store.rows = [];
		store.total = 0;
		store.loading = false;
		store.resetPreview();
		useShippingMethodStore().$reset();
		useAppUiStore().$reset();
	});

	it('lists pending batches without a default date filter and previews a selected xlsx file', async () => {
		const store = useShipmentArrangementStore();
		const fetchPending = vi.spyOn(store, 'fetchPending').mockResolvedValue();
		const previewFile = vi.spyOn(store, 'previewFile').mockResolvedValue();
		mockShippingOptions();

		const wrapper = await mountPage();

		expect(fetchPending).toHaveBeenCalledTimes(1);
		expect(store.filters.dateRange).toEqual({ start: undefined, end: undefined });

		const file = new File(['xlsx'], 'shipments.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
		const input = wrapper.get('input[type="file"]');
		Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
		await input.trigger('change');

		expect(previewFile).toHaveBeenCalledWith(file);
		expect(wrapper.findComponent({ name: 'ShipmentArrangementImportPreviewModal' }).props('modelValue')).toBe(true);
		wrapper.unmount();
	});

	it('exports pending batches and provides loading, empty, and refresh states', async () => {
		const store = useShipmentArrangementStore();
		const fetchPending = vi.spyOn(store, 'fetchPending').mockResolvedValue();
		const exportPending = vi.spyOn(store, 'exportPending').mockResolvedValue();
		mockShippingOptions();

		const wrapper = await mountPage();

		store.total = 1;
		await wrapper.vm.$nextTick();
		await wrapper.get('[data-testid="export-pending"]').trigger('click');
		expect(exportPending).toHaveBeenCalledTimes(1);

		store.loading = true;
		await wrapper.vm.$nextTick();
		expect(wrapper.find('[data-testid="pending-loading"]').exists()).toBe(true);

		store.loading = false;
		store.rows = [];
		await wrapper.vm.$nextTick();
		expect(wrapper.find('[data-testid="pending-empty"]').exists()).toBe(true);
		expect(wrapper.find('[data-testid="refresh-pending"]').exists()).toBe(true);
		fetchPending.mockClear();
		await wrapper.get('[data-testid="refresh-pending"]').trigger('click');
		expect(fetchPending).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('debounces filters, resets pagination, and fetches only once', async () => {
		const store = useShipmentArrangementStore();
		store.page = 2;
		const fetchPending = vi.spyOn(store, 'fetchPending').mockResolvedValue();
		mockShippingOptions();

		const wrapper = await mountPage();
		fetchPending.mockClear();
		store.filters.search = 'WM-100';
		await new Promise((resolve) => setTimeout(resolve, 350));

		expect(store.page).toBe(1);
		expect(fetchPending).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('clears every filter, resets pagination, and refetches all pending batches', async () => {
		const store = useShipmentArrangementStore();
		store.filters.search = 'WM-100';
		store.filters.shippingMethodId = 7;
		store.filters.dateRange = { start: new Date('2026-07-01'), end: new Date('2026-07-18') };
		store.page = 3;
		const fetchPending = vi.spyOn(store, 'fetchPending').mockResolvedValue();
		mockShippingOptions();
		const wrapper = await mountPage();
		fetchPending.mockClear();

		await wrapper.get('[data-testid="clear-filters"]').trigger('click');
		await flushPromises();

		expect(store.filters.search).toBe('');
		expect(store.filters.shippingMethodId).toBeUndefined();
		expect(store.filters.dateRange).toEqual({ start: undefined, end: undefined });
		expect(store.page).toBe(1);
		expect(fetchPending).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('cancels a pending filter debounce when filters are cleared', async () => {
		const store = useShipmentArrangementStore();
		const fetchPending = vi.spyOn(store, 'fetchPending').mockResolvedValue();
		mockShippingOptions();
		const wrapper = await mountPage();
		fetchPending.mockClear();
		vi.useFakeTimers();

		try {
			store.filters.search = 'WM-100';
			await wrapper.vm.$nextTick();
			await wrapper.get('[data-testid="clear-filters"]').trigger('click');
			await flushPromises();
			await vi.advanceTimersByTimeAsync(350);

			expect(fetchPending).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
			wrapper.unmount();
		}
	});

	it('loads active shipping method options independently from stale settings listing filters', async () => {
		const store = useShipmentArrangementStore();
		vi.spyOn(store, 'fetchPending').mockResolvedValue();
		const shippingStore = useShippingMethodStore();
		shippingStore.filter = { query: 'same day', status: 'inactive', current_page: 5, page_size: 15 };
		shippingStore.methods = [{ id: 99, description: 'Stale listing method', priority: 99, is_active: false }];
		const options = [{ id: 2, description: 'Express', priority: 2, is_active: true }];
		const shippingSpies = mockShippingOptions(options);

		const wrapper = await mountPage();

		expect(shippingSpies.fetchActiveShippingMethodOptions).toHaveBeenCalledTimes(1);
		expect(shippingSpies.getShippingMethods).not.toHaveBeenCalled();
		expect(shippingStore.filter).toEqual({ query: 'same day', status: 'inactive', current_page: 5, page_size: 15 });
		expect(shippingStore.methods.map((method) => method.id)).toEqual([99]);
		expect(wrapper.findComponent({ name: 'USelectMenu' }).props('items')).toEqual([
			{ label: 'All shipping methods', value: undefined },
			{ label: 'Express', value: 2 },
		]);
		wrapper.unmount();
	});

	it('shows and notifies workbook preview failures', async () => {
		const store = useShipmentArrangementStore();
		vi.spyOn(store, 'fetchPending').mockResolvedValue();
		vi.spyOn(store, 'previewFile').mockRejectedValue(new Error('Workbook parsing failed'));
		mockShippingOptions();
		const wrapper = await mountPage();
		const file = new File(['xlsx'], 'shipments.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
		const input = wrapper.get('input[type="file"]');
		Object.defineProperty(input.element, 'files', { value: [file], configurable: true });

		await input.trigger('change');
		await flushPromises();

		expect(wrapper.text()).toContain('Workbook parsing failed');
		expect(useAppUiStore().toastNotification).toMatchObject({ color: 'error', description: 'Workbook parsing failed' });
		wrapper.unmount();
	});

	it('wires partial apply results to the preview and failure notification', async () => {
		const store = useShipmentArrangementStore();
		vi.spyOn(store, 'fetchPending').mockResolvedValue();
		store.preview = { total: 1, valid: 1, warnings: 0, errors: 0, rows: [] };
		const applyPreview = vi.spyOn(store, 'applyPreview').mockImplementation(async () => {
			store.applyResult = {
				total: 2,
				updated: 1,
				failed: 1,
				errors: [{ fulfillment_id: 'f-2', order_no: 'WM-102', batch_no: 2, message: 'Shipment changed after export' }],
			};
		});
		mockShippingOptions();
		const wrapper = await mountPage();

		wrapper.findComponent({ name: 'ShipmentArrangementImportPreviewModal' }).vm.$emit('apply');
		await flushPromises();

		expect(applyPreview).toHaveBeenCalledTimes(1);
		expect(store.applyResult).toMatchObject({ updated: 1, failed: 1 });
		expect(useAppUiStore().toastNotification).toMatchObject({ color: 'error', description: '1 shipments updated; 1 failed' });
		wrapper.unmount();
	});
});
