import { describe, expect, it } from 'bun:test';
import { Routes } from '../../server/routes.server';

describe('Fulfillment server proxy routes', () => {
	it('maps arrangement and lifecycle operations to the fulfillment UUID', () => {
		expect(Routes.Fulfillment.Update('batch-uuid')).toBe('fulfillment/batch-uuid');
		expect(Routes.Fulfillment.MarkProcessing('batch-uuid')).toBe('fulfillment/batch-uuid/processing');
		expect(Routes.Fulfillment.MarkPacked('batch-uuid')).toBe('fulfillment/batch-uuid/packed');
		expect(Routes.Fulfillment.MarkFulfilled('batch-uuid')).toBe('fulfillment/batch-uuid/fulfilled');
		expect(Routes.Fulfillment.MarkShipped('batch-uuid')).toBe('fulfillment/batch-uuid/shipped');
		expect(Routes.Fulfillment.MarkDelivered('batch-uuid')).toBe('fulfillment/batch-uuid/delivered');
	});

	it('keeps create-by-order and provides every supported Nitro handler', async () => {
		expect(Routes.Fulfillment.Create('ORD-1')).toBe('fulfillment/ORD-1/create');

		const routeFiles = [
			'[order_no].patch.ts',
			'[order_no]/create.post.ts',
			'[order_no]/processing.patch.ts',
			'[order_no]/packed.patch.ts',
			'[order_no]/fulfilled.patch.ts',
			'[order_no]/shipped.patch.ts',
			'[order_no]/delivered.patch.ts',
		];

		for (const routeFile of routeFiles) {
			const file = Bun.file(new URL(`../../server/routes/merchant/fulfillment/${routeFile}`, import.meta.url));
			expect(await file.exists(), routeFile).toBe(true);
		}
	});

	it('maps shipment arrangement list, export, preview, and apply routes', () => {
		expect(Routes.Fulfillment.Arrangement.List()).toBe('fulfillment/arrangement');
		expect(Routes.Fulfillment.Arrangement.Export()).toBe('fulfillment/arrangement/export');
		expect(Routes.Fulfillment.Arrangement.Preview()).toBe('fulfillment/arrangement/preview');
		expect(Routes.Fulfillment.Arrangement.Apply()).toBe('fulfillment/arrangement/apply');
	});

	it('provides every shipment arrangement Nitro handler with multipart preview signing', async () => {
		const routeFiles = ['index.get.ts', 'export.get.ts', 'preview.post.ts', 'apply.post.ts'];

		for (const routeFile of routeFiles) {
			const file = Bun.file(new URL(`../../server/routes/merchant/fulfillment/arrangement/${routeFile}`, import.meta.url));
			expect(await file.exists(), routeFile).toBe(true);
		}

		const previewFile = Bun.file(new URL('../../server/routes/merchant/fulfillment/arrangement/preview.post.ts', import.meta.url));
		const previewSource = await previewFile.text();
		expect(previewSource).toContain("body.append('merchant_id', merchantId)");
		expect(previewSource).toContain("body.append('file'");
		expect(previewSource).toContain('headers: generateImageHeaders(event, route)');
	});

	it('rejects missing, malformed, and over-5MB preview uploads before forwarding', async () => {
		const previewFile = Bun.file(new URL('../../server/routes/merchant/fulfillment/arrangement/preview.post.ts', import.meta.url));
		const previewSource = await previewFile.text();

		expect(previewSource).toContain("getRequestHeader(event, 'content-length')");
		expect(previewSource).toContain('const MAX_SHIPMENT_WORKBOOK_REQUEST_SIZE = MAX_SHIPMENT_WORKBOOK_SIZE + 64 * 1024;');
		expect(previewSource).toContain('contentLength > MAX_SHIPMENT_WORKBOOK_REQUEST_SIZE');
		expect(previewSource).toContain('file.size > MAX_SHIPMENT_WORKBOOK_SIZE');
		expect(previewSource).toContain('statusCode: 413');
		expect(previewSource).toContain('Shipment workbook must not exceed 5 MB');
		expect(previewSource).toContain('An XLSX shipment workbook is required');
	});

	it('translates portal $search to the backend search query in arrangement list and export proxies', async () => {
		for (const routeFile of ['index.get.ts', 'export.get.ts']) {
			const file = Bun.file(new URL(`../../server/routes/merchant/fulfillment/arrangement/${routeFile}`, import.meta.url));
			const source = await file.text();

			expect(source, routeFile).toContain('const { $search, ...query } = getQuery(event);');
			expect(source, routeFile).toContain('...($search ? { search: $search } : {})');
			expect(source, routeFile).not.toContain('query: getQuery(event)');
		}
	});

	it('does not expose a shipment route namespace or Nitro resource', async () => {
		expect('Shipment' in Routes).toBe(false);
		const legacyRoute = Bun.file(new URL('../../server/routes/merchant/shipment/index.get.ts', import.meta.url));
		expect(await legacyRoute.exists()).toBe(false);
	});
});
