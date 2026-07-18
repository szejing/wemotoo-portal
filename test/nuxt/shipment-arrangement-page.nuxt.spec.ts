import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ShipmentArrangementPage from '~/pages/operation/shipment-arrangement.vue';
import { useShipmentArrangementStore } from '~/stores/ShipmentArrangement/ShipmentArrangement';
import { useShippingMethodStore } from '~/stores/ShippingMethod/ShippingMethod';

describe('ShipmentArrangementPage', () => {
	beforeEach(() => {
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
	});

	it('lists pending batches without a default date filter and previews a selected xlsx file', async () => {
		const store = useShipmentArrangementStore();
		const shippingStore = useShippingMethodStore();
		const fetchPending = vi.spyOn(store, 'fetchPending').mockResolvedValue();
		const previewFile = vi.spyOn(store, 'previewFile').mockResolvedValue();
		vi.spyOn(shippingStore, 'getShippingMethods').mockResolvedValue();

		const wrapper = await mountSuspended(ShipmentArrangementPage, {
			global: {
				stubs: {
					ZPagePanel: { template: '<main><slot name="navbar-right"/><slot/></main>' },
				},
			},
		});

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
		const shippingStore = useShippingMethodStore();
		vi.spyOn(store, 'fetchPending').mockResolvedValue();
		const exportPending = vi.spyOn(store, 'exportPending').mockResolvedValue();
		vi.spyOn(shippingStore, 'getShippingMethods').mockResolvedValue();

		const wrapper = await mountSuspended(ShipmentArrangementPage, {
			global: {
				stubs: {
					ZPagePanel: { template: '<main><slot name="navbar-right"/><slot/></main>' },
				},
			},
		});

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
		wrapper.unmount();
	});

	it('debounces filters, resets pagination, and fetches only once', async () => {
		const store = useShipmentArrangementStore();
		const shippingStore = useShippingMethodStore();
		store.page = 2;
		const fetchPending = vi.spyOn(store, 'fetchPending').mockResolvedValue();
		vi.spyOn(shippingStore, 'getShippingMethods').mockResolvedValue();

		const wrapper = await mountSuspended(ShipmentArrangementPage, {
			global: {
				stubs: {
					ZPagePanel: { template: '<main><slot name="navbar-right"/><slot/></main>' },
				},
			},
		});
		fetchPending.mockClear();
		store.filters.search = 'WM-100';
		await new Promise((resolve) => setTimeout(resolve, 350));

		expect(store.page).toBe(1);
		expect(fetchPending).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});
});
