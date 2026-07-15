import { describe, expect, it } from 'bun:test';
import { createFulfillmentArrangementValidation } from '../../app/utils/schema/Fulfillment/ArrangementValidation';
import { buildFulfillmentArrangementPayload } from '../../app/utils/fulfillment';

const t = (key: string) => key;

describe('fulfillment arrangement validation', () => {
	const schema = createFulfillmentArrangementValidation(t, {
		shipping_method_id: 1,
		shipping_fee: 10,
	});

	it('allows courier and tracking edits without a reason', () => {
		const result = schema.safeParse({
			shipping_method_id: 1,
			shipping_fee: 10,
			courier_id: 2,
			courier_name: 'DHL',
			tracking_no: 'TRACK-2',
			reason: '',
		});

		expect(result.success).toBe(true);
	});

	it('requires a nonblank reason when the method changes', () => {
		const result = schema.safeParse({
			shipping_method_id: 2,
			shipping_fee: 10,
			courier_id: null,
			courier_name: '',
			tracking_no: '',
			reason: '   ',
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.path).toEqual(['reason']);
	});

	it('requires a nonblank reason when the explicit fee changes', () => {
		const result = schema.safeParse({
			shipping_method_id: 1,
			shipping_fee: 12,
			courier_id: null,
			courier_name: '',
			tracking_no: '',
			reason: '',
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('validation.fulfillment.reasonRequired');
	});

	it('accepts a reason for method or fee changes and rejects negative fees', () => {
		expect(schema.safeParse({
			shipping_method_id: 2,
			shipping_fee: 12,
			courier_id: null,
			courier_name: '',
			tracking_no: '',
			reason: 'Customer approved the new rate',
		}).success).toBe(true);

		expect(schema.safeParse({
			shipping_method_id: 1,
			shipping_fee: -1,
			courier_id: null,
			courier_name: '',
			tracking_no: '',
			reason: 'Correction',
		}).success).toBe(false);
	});

	it('preserves a custom courier name without a registered courier id', () => {
		expect(buildFulfillmentArrangementPayload({
			shipping_method_id: 1,
			shipping_fee: 10,
			courier_id: null,
			courier_name: '  Merchant Fleet  ',
			tracking_no: '',
			reason: '',
		})).toEqual({
			shipping_method_id: 1,
			shipping_fee: 10,
			courier_id: null,
			courier_name: 'Merchant Fleet',
			tracking_no: null,
			reason: undefined,
		});
	});
});
