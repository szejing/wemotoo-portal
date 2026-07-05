import { describe, expect, it } from 'bun:test';
import { Routes } from '../../server/routes.server';

describe('Product server proxy routes', () => {
	it('defines backend product slug route paths', () => {
		expect(Routes.Products.BySlug('premium-shirt')).toBe('products/by-slug/premium-shirt');
	});

	it('has a Nitro proxy handler for product slug lookup', async () => {
		const file = Bun.file(
			new URL('../../server/routes/merchant/products/by-slug/[slug].get.ts', import.meta.url),
		);

		expect(await file.exists()).toBe(true);
	});
});
