import { describe, expect, it } from 'bun:test';
import { productDetailPath, productRouteSegment } from '../../app/utils/product-route';

describe('product route helpers', () => {
	it('uses slug for product detail paths', () => {
		expect(productRouteSegment({ code: 'PROD-1', slug: 'premium-shirt' })).toBe('premium-shirt');
		expect(productDetailPath({ code: 'PROD-1', slug: 'premium-shirt' })).toBe('/products/premium-shirt');
	});

	it('falls back to product code when slug is missing', () => {
		expect(productRouteSegment({ code: 'PROD-1' })).toBe('PROD-1');
		expect(productDetailPath({ code: 'PROD-1' })).toBe('/products/PROD-1');
	});
});
