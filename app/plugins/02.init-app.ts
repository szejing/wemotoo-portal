const publicPaths = ['/login', '/forgot-password', '/reset-password'];

export default defineNuxtPlugin(async (_) => {
	if (!import.meta.client) {
		return;
	}

	const route = useRoute();
	if (publicPaths.includes(route.path)) {
		return;
	}

	try {
		const authStore = useAuthStore();
		const verified = await authStore.verify();
		if (!verified) {
			authStore.clearCookies();
			return navigateTo('/login');
		}

		const appStore = useAppStore();
		await appStore.init();
	} catch {
		// Session gating runs in auth.global; avoid duplicate redirects that race hydration.
	}
});
