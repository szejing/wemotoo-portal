import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ZInputShippingZoneDetailsSection from '~/components/Z/Input/ShippingZone/DetailsSection.vue';
import type { ShippingZoneFormFields } from '~/utils/types/form/shipping-zone-form';

describe('ZInputShippingZoneDetailsSection', () => {
	it('renders zone details section', async () => {
		const state = reactive<ShippingZoneFormFields>({
			code: '',
			description: '',
			rule: 0,
			is_active: true,
			country_code: '',
			state: [],
			postcodes_text: '',
			shipping_method_ids: [],
			method_pricing: {},
		});

		const wrapper = await mountSuspended(ZInputShippingZoneDetailsSection, {
			props: {
				state,
				methodOptions: [
					{ label: 'Standard', value: 'sm_1' },
					{ label: 'Express', value: 'sm_2' },
				],
			},
		});

		expect(wrapper.find('#section-shipping-zone-details').exists()).toBe(true);
		expect(wrapper.text()).toContain('Select states');
		expect(wrapper.text()).toContain('Stable identifier for this zone');
	});

	it('disables code input when codeReadonly is true', async () => {
		const state = reactive<ShippingZoneFormFields>({
			code: 'ZONE_A',
			description: '',
			rule: 0,
			is_active: true,
			country_code: '',
			state: ['Johor'],
			postcodes_text: '',
			shipping_method_ids: [],
			method_pricing: {},
		});

		const wrapper = await mountSuspended(ZInputShippingZoneDetailsSection, {
			props: {
				state,
				methodOptions: [],
				codeReadonly: true,
			},
		});

		const codeInput = wrapper.find('input[maxlength="32"]');
		expect(codeInput.exists()).toBe(true);
		expect((codeInput.element as HTMLInputElement).disabled).toBe(true);
	});

	it('uppercases code when codeForceUppercase is true', async () => {
		const state = reactive<ShippingZoneFormFields>({
			code: '',
			description: '',
			rule: 0,
			is_active: true,
			country_code: '',
			state: ['Johor'],
			postcodes_text: '',
			shipping_method_ids: [],
			method_pricing: {},
		});

		const wrapper = await mountSuspended(ZInputShippingZoneDetailsSection, {
			props: {
				state,
				methodOptions: [],
				codeForceUppercase: true,
			},
		});

		const codeInput = wrapper.get('input[maxlength="32"]');
		await codeInput.setValue('my_zone');
		expect(state.code).toBe('MY_ZONE');
	});

	it('renders order cutoff time for selected shipping methods', async () => {
		const state = reactive<ShippingZoneFormFields>({
			code: 'ZONE_A',
			description: '',
			rule: 0,
			is_active: true,
			country_code: '',
			state: ['Johor'],
			postcodes_text: '',
			shipping_method_ids: ['1'],
			method_pricing: {
				'1': { fee: 15, estimated_days: 1, order_cutoff_time: '12:00' },
			},
		});

		const wrapper = await mountSuspended(ZInputShippingZoneDetailsSection, {
			props: {
				state,
				methodOptions: [{ label: 'Same-Day Delivery', value: '1' }],
			},
		});

		const cutoffInput = wrapper.find('input[type="time"]');
		expect(cutoffInput.exists()).toBe(true);
		expect((cutoffInput.element as HTMLInputElement).value).toBe('12:00');
		await cutoffInput.setValue('11:30');
		expect(state.method_pricing['1']?.order_cutoff_time).toBe('11:30');
	});
});
