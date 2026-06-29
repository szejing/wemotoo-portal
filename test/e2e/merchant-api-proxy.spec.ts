import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { getRandomPort } from 'get-port-please';
import { afterAll, describe, expect, test } from 'vitest';
import { $fetch, setup } from '@nuxt/test-utils/e2e';

/**
 * Spins up a minimal upstream API so Nitro merchant proxy routes can be exercised
 * without a real ecommerce backend (see https://nuxt.com/docs/4.x/getting-started/testing#end-to-end-testing).
 */
function startMockBackend(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
	return new Promise((resolve, reject) => {
		const server = createServer((req, res) => {
			const url = new URL(req.url ?? '/', 'http://127.0.0.1');
			const path = url.pathname.replace(/\/+$/, '') || '/';

			if (req.method === 'GET' && (path === '/api/settings' || path === '/api/settings/')) {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ value: [], '@odata.count': 0 }));
				return;
			}

			if (req.method === 'GET' && (path === '/api/heartbeat' || path === '/api/heartbeat/')) {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ status: 'ok', service: 'yeppi-ecommerce-backend' }));
				return;
			}

			if (req.method === 'POST' && (path === '/api/auth/login' || path === '/api/auth/login/')) {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ access_token: 'mock-token', token_type: 'Bearer' }));
				return;
			}

			res.writeHead(404, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'mock not found', path }));
		});

		server.listen(0, '127.0.0.1', () => {
			const addr = server.address() as AddressInfo;
			resolve({
				baseUrl: `http://127.0.0.1:${addr.port}`,
				close: () =>
					new Promise((resClose, rej) => {
						server.close((err) => (err ? rej(err) : resClose()));
					}),
			});
		});

		server.on('error', reject);
	});
}

describe('merchant Nitro API (proxied to mock upstream)', async () => {
	const mock = await startMockBackend();

	// Align Nitro bind port with NITRO_PORT (Nitro prefers NITRO_PORT over PORT; avoids clashes with a dev shell).
	const nitroPort = await getRandomPort('127.0.0.1');

	process.env.BASE_URL = mock.baseUrl;
	process.env.NUXT_PUBLIC_BASE_URL = mock.baseUrl;
	process.env.API_KEY = 'test-api-key';
	process.env.API_KEY_SECRET = 'test-api-secret';

	// `dev: true` uses nuxi dev + a readiness loop; production `node .output/server/index.mjs` + get-port-please's
	// waitForPort can fail when Nitro binds 0.0.0.0 (see https://nuxt.com/docs/4.x/getting-started/testing#end-to-end-testing).
	await setup({
		dev: true,
		port: nitroPort,
		env: {
			NITRO_PORT: String(nitroPort),
			BASE_URL: mock.baseUrl,
			NUXT_PUBLIC_BASE_URL: mock.baseUrl,
			API_KEY: 'test-api-key',
			API_KEY_SECRET: 'test-api-secret',
		},
		setupTimeout: 300_000,
		teardownTimeout: 60_000,
	});

	afterAll(async () => {
		await mock.close();
	});

	test('GET /merchant/settings/many returns upstream JSON', async () => {
		const data = await $fetch('/merchant/settings/many');
		expect(data).toEqual({ value: [], '@odata.count': 0 });
	});

	test('GET /merchant/heartbeat returns upstream JSON', async () => {
		const data = await $fetch('/merchant/heartbeat');
		expect(data).toMatchObject({ status: 'ok', service: 'yeppi-ecommerce-backend' });
	});

	test('POST /merchant/auth/login returns upstream JSON', async () => {
		const data = await $fetch('/merchant/auth/login', {
			method: 'POST',
			body: { email: 'a@b.com', password: 'x' },
		});
		expect(data).toMatchObject({ access_token: 'mock-token', token_type: 'Bearer' });
	});
});
