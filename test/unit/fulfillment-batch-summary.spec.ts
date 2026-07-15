import { describe, expect, it } from 'bun:test';
import { getFulfillmentMethodDescriptions, sumFulfillmentShippingFees } from '../../app/utils/fulfillment';
import type { FulfillmentBatch } from '../../app/utils/types/order-fulfillment-shipping';

const batch = (shippingFee: number, method: string | null): FulfillmentBatch => ({
	id: crypto.randomUUID(),
	order_no: 'ORD-1',
	inv_no: 'INV-1',
	batch_no: 1,
	status: 'pending',
	shipment_status: 'pending',
	shipping_method: method ? { id: 1, description: method } : null,
	shipping_zone_id: null,
	shipping_fee: shippingFee,
	courier_id: null,
	courier_name: null,
	tracking_no: null,
	packed_at: null,
	shipped_at: null,
	delivered_at: null,
	created_at: '2026-07-15T00:00:00.000Z',
	updated_at: '2026-07-15T00:00:00.000Z',
});

describe('fulfillment batch summary', () => {
	it('sums every batch fee for the Shipping row', () => {
		expect(sumFulfillmentShippingFees([batch(5.5, 'Standard'), batch(12, 'Express')])).toBe(17.5);
	});

	it('returns distinct nonempty method descriptions in batch order', () => {
		expect(getFulfillmentMethodDescriptions([
			batch(5, ' Standard '),
			batch(6, ''),
			batch(7, 'Standard'),
			batch(8, 'Express'),
		])).toEqual(['Standard', 'Express']);
	});
});
