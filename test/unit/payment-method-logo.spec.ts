import { describe, expect, it } from 'vitest';
import { getPaymentMethodLogoUploadDir } from '../../app/utils/payment-method-logo';

describe('getPaymentMethodLogoUploadDir', () => {
	it('builds the payment method logo upload directory from the code', () => {
		expect(getPaymentMethodLogoUploadDir('CARD')).toBe('payment-methods/CARD');
	});
});
