import { KEY } from 'yeppi-common';
import { useAuthStore } from '~/stores';
import { resolveSessionMerchantId } from '~/utils/auth/merchant-id';

const publicPaths = ['/login', '/forgot-password', '/reset-password'];

export default defineNuxtRouteMiddleware(async (to, _from) => {
	const accessToken = useCookie(KEY.ACCESS_TOKEN);
	const merchantId = useCookie(KEY.X_MERCHANT_ID);

	// Client-only: visiting login while a cookie exists clears stale session cookies (existing behavior).
	if (import.meta.client && to.path === '/login' && accessToken.value) {
		const authStore = useAuthStore();
		authStore.clearCookies();
	}

	if (publicPaths.includes(to.path)) {
		return;
	}

	// Must run on server too; otherwise SSR renders the protected layout while the client redirects to /login,
	// causing hydration mismatches (e.g. UDashboardGroup shell vs auth layout).
	if (!accessToken.value || !resolveSessionMerchantId(merchantId.value)) {
		return navigateTo('/login');
	}

	// Match client init-app session checks during SSR so the rendered layout matches hydration.
	if (import.meta.server) {
		const authStore = useAuthStore();
		const verified = await authStore.verify();
		if (!verified) {
			authStore.clearCookies();
			return navigateTo('/login');
		}
	}
});
