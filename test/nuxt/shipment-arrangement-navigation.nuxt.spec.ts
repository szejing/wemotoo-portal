import { beforeEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { useRouter } from '#imports';
import OperationPage from '~/pages/operation/index.vue';
import { useAppUiStore } from '~/stores/AppUi/AppUi';

describe('shipment arrangement navigation', () => {
	beforeEach(() => {
		useAppUiStore().$reset();
	});

	it('groups shipment arrangement under Orders instead of Operation', () => {
		const links = useAppUiStore().navigations.flatMap((group) => group.links);
		const orders = links.find((link) => link.label === 'nav.orders');
		const operation = links.find((link) => link.label === 'nav.operation');

		expect(orders?.children ?? []).toContainEqual({
			label: 'nav.shipmentArrangement',
			icon: 'i-lucide-package-search',
			to: '/orders/shipment-arrangement',
		});
		expect(operation?.children ?? []).not.toContainEqual(expect.objectContaining({ label: 'nav.shipmentArrangement' }));
	});

	it('registers the shipment arrangement page in the Orders route', () => {
		const route = useRouter().resolve('/orders/shipment-arrangement');

		expect(route.name).toBe('orders-shipment-arrangement');
	});

	it('does not present shipment arrangement as an Operation option', async () => {
		const wrapper = await mountSuspended(OperationPage, {
			global: {
				stubs: {
					ZPagePanel: { template: '<main><slot /></main>' },
				},
			},
		});
		const operationGroup = wrapper.findComponent({ name: 'ZSettingsGroup' });

		expect(operationGroup.props('items')).not.toContainEqual(expect.objectContaining({ label: 'Shipment Arrangement' }));
		wrapper.unmount();
	});
});
