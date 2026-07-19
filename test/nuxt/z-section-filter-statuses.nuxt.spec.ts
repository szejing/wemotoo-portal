import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { OrderStatus } from 'yeppi-common';
import ZSectionFilterStatuses from '~/components/Z/Section/Filter/Statuses.vue';

const items = [
	{ label: 'Pending Payment', value: OrderStatus.PENDING_PAYMENT },
	{ label: 'Processing', value: OrderStatus.PROCESSING },
	{ label: 'Completed', value: OrderStatus.COMPLETED },
];

describe('ZSectionFilterStatuses', () => {
	it('renders a multiple USelectMenu with status items', async () => {
		const wrapper = await mountSuspended(ZSectionFilterStatuses, {
			props: {
				modelValue: [OrderStatus.PENDING_PAYMENT],
				items,
			},
		});

		const select = wrapper.findComponent({ name: 'USelectMenu' });
		expect(select.exists()).toBe(true);
		expect(select.props('multiple')).toBe(true);
		expect(select.props('items')).toEqual(items);
		expect(select.props('modelValue')).toEqual([OrderStatus.PENDING_PAYMENT]);
	});

	it('renders status badges in the trigger when getColor is provided', async () => {
		const wrapper = await mountSuspended(ZSectionFilterStatuses, {
			props: {
				modelValue: [OrderStatus.PENDING_PAYMENT, OrderStatus.PROCESSING],
				items,
				getColor: () => 'warning',
			},
		});

		const badges = wrapper.findAllComponents({ name: 'UBadge' });
		expect(badges.length).toBeGreaterThanOrEqual(2);
	});

	it('emits update:modelValue when selection changes', async () => {
		const wrapper = await mountSuspended(ZSectionFilterStatuses, {
			props: {
				modelValue: [],
				items,
			},
		});

		const select = wrapper.findComponent({ name: 'USelectMenu' });
		await select.vm.$emit('update:modelValue', [OrderStatus.COMPLETED, OrderStatus.PROCESSING]);

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[OrderStatus.COMPLETED, OrderStatus.PROCESSING]]);
	});
});
