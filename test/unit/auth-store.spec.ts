import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const appInit = vi.fn();
const setExcludeRoutes = vi.fn();
const showToast = vi.fn();

(globalThis as unknown as { ICONS: Record<string, string> }).ICONS = new Proxy(
	{},
	{
		get: (_target, key) => String(key),
	},
) as Record<string, string>;

vi.mock('../../app/stores/App', () => ({
	useAppStore: () => ({
		init: appInit,
	}),
}));

vi.mock('~/stores/App', () => ({
	useAppStore: () => ({
		init: appInit,
	}),
}));

vi.mock('../../app/stores/AppUi/AppUi', () => ({
	useAppUiStore: () => ({
		setExcludeRoutes,
		showToast,
	}),
}));

vi.mock('~/stores/AppUi/AppUi', () => ({
	useAppUiStore: () => ({
		setExcludeRoutes,
		showToast,
	}),
}));

describe('useAuthStore', () => {
	let useAuthStore: typeof import('../../app/stores/Auth/Auth').useAuthStore;

	const apiMock = {
		auth: {
			heartbeat: vi.fn(),
			login: vi.fn(),
		},
	};

	beforeEach(async () => {
		setActivePinia(createPinia());
		vi.clearAllMocks();

		(globalThis as unknown as { useNuxtApp: () => unknown }).useNuxtApp = () => ({ $api: apiMock }) as unknown;
		(globalThis as unknown as { useCookie: (key: string) => { value: string | null } }).useCookie = () => ({ value: null });
		({ useAuthStore } = await import('../../app/stores/Auth/Auth'));
	});

	it('logs in without checking heartbeat during submit', async () => {
		const calls: string[] = [];
		apiMock.auth.heartbeat.mockImplementation(async () => {
			calls.push('heartbeat');
			return { status: 'ok' };
		});
		apiMock.auth.login.mockImplementation(async () => {
			calls.push('login');
			return {
				token: 'token',
				refresh_token: 'refresh',
				user: { id: 'u1' },
				exclude_routes: [],
			};
		});

		const store = useAuthStore();
		const success = await store.login('M1', 'user@example.com', 'secret');

		expect(success).toBe(true);
		expect(calls).toEqual(['login']);
	});

	it('shows a server unreachable error when heartbeat check fails', async () => {
		apiMock.auth.heartbeat.mockRejectedValue(new Error('fetch failed'));

		const store = useAuthStore();
		const success = await store.checkHeartbeat();

		expect(success).toBe(false);
		expect(store.serverReachabilityError).toBe(true);
		expect(apiMock.auth.login).not.toHaveBeenCalled();
		expect(showToast).toHaveBeenCalledWith(
			expect.objectContaining({
				color: 'error',
				title: 'Unable to reach server',
				description: 'Please check your connection or try again later.',
			}),
		);
	});
});
