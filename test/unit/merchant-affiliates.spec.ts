import { describe, expect, it } from 'bun:test';
import { Routes } from '../../server/routes.server';

const affiliateRouteFiles = [
	'affiliates/index.get.ts',
	'affiliates/index.post.ts',
	'affiliates/by-slug/[slug].get.ts',
	'affiliates/[id].get.ts',
	'affiliates/tiers/index.get.ts',
	'affiliates/tiers/index.post.ts',
	'affiliates/tiers/[id].patch.ts',
	'affiliates/tiers/[id].delete.ts',
	'affiliates/my-report.get.ts',
] as const;

describe('Affiliate server proxy routes', () => {
	it('defines backend affiliate route paths', () => {
		expect(Routes.Affiliates.Many()).toBe('affiliates');
		expect(Routes.Affiliates.Create()).toBe('affiliates');
		expect(Routes.Affiliates.BySlug('abc')).toBe('affiliates/by-slug/abc');
		expect(Routes.Affiliates.Single('a1')).toBe('affiliates/a1');
		expect(Routes.Affiliates.Tiers()).toBe('affiliates/tiers');
		expect(Routes.Affiliates.TierCreate()).toBe('affiliates/tiers');
		expect(Routes.Affiliates.TierUpdate(1)).toBe('affiliates/tiers/1');
		expect(Routes.Affiliates.TierDelete(2)).toBe('affiliates/tiers/2');
		expect(Routes.Affiliates.MyReport()).toBe('affiliates/my-report');
	});

	it('has Nitro proxy handlers for affiliate API endpoints', async () => {
		for (const routeFile of affiliateRouteFiles) {
			const file = Bun.file(new URL(`../../server/routes/merchant/${routeFile}`, import.meta.url));
			expect(await file.exists(), routeFile).toBe(true);
		}
	});
});
