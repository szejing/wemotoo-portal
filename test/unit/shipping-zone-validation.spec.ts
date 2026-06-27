import { describe, expect, it } from 'vitest';
import { CreateShippingZoneValidation, UpdateShippingZoneValidation } from '../../app/utils/schema/ShippingZone/Create/ShippingZoneValidation';

const t = (key: string) => key;

const baseValid = {
	code: 'Z1',
	description: '',
	rule: 0,
	is_active: true,
	country_code: 'MY',
	postcodes_text: '',
	shipping_method_ids: ['1'],
	method_pricing: {
		'1': { fee: 0, estimated_days: undefined, order_cutoff_time: undefined },
	},
};

describe('ShippingZoneValidation', () => {
	it('CreateShippingZoneValidation rejects empty state', () => {
		const schema = CreateShippingZoneValidation(t);
		const r = schema.safeParse({ ...baseValid, state: [] });
		expect(r.success).toBe(false);
	});

	it('UpdateShippingZoneValidation allows empty state', () => {
		const schema = UpdateShippingZoneValidation(t);
		const r = schema.safeParse({ ...baseValid, state: [] });
		expect(r.success).toBe(true);
	});

	it('CreateShippingZoneValidation accepts non-empty state', () => {
		const schema = CreateShippingZoneValidation(t);
		const r = schema.safeParse({ ...baseValid, state: ['Johor'] });
		expect(r.success).toBe(true);
	});

	it('CreateShippingZoneValidation accepts HH:mm order cutoff time', () => {
		const schema = CreateShippingZoneValidation(t);
		const r = schema.safeParse({
			...baseValid,
			state: ['Johor'],
			method_pricing: {
				'1': { fee: 0, estimated_days: 1, order_cutoff_time: '12:00' },
			},
		});
		expect(r.success).toBe(true);
	});

	it('CreateShippingZoneValidation rejects invalid order cutoff time', () => {
		const schema = CreateShippingZoneValidation(t);
		const r = schema.safeParse({
			...baseValid,
			state: ['Johor'],
			method_pricing: {
				'1': { fee: 0, estimated_days: 1, order_cutoff_time: '25:00' },
			},
		});
		expect(r.success).toBe(false);
	});
});
