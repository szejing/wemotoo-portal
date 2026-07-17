import { describe, expect, it } from 'vitest';
import { getDefaultOrderPaymentAmt } from '../../app/utils/order-payment-amt';

describe('getDefaultOrderPaymentAmt', () => {
	it('uses payable_total when present', () => {
		expect(
			getDefaultOrderPaymentAmt({
				payable_total: 114.35,
				net_total: 106,
				shipping_fee: 8.35,
			}),
		).toBe(114.35);
	});

	it('falls back to net_total + shipping_fee', () => {
		expect(
			getDefaultOrderPaymentAmt({
				net_total: 100,
				shipping_fee: 12.5,
			}),
		).toBe(112.5);
	});

	it('falls back to net_amt + shipping_fee when net_total is missing', () => {
		expect(
			getDefaultOrderPaymentAmt({
				net_amt: 90,
				shipping_fee: 10,
			}),
		).toBe(100);
	});

	it('treats missing shipping as zero', () => {
		expect(getDefaultOrderPaymentAmt({ net_total: 50 })).toBe(50);
	});
});
