import { KEY } from '~/composables/useWemotooCommon';

const publicPaths = ['/login', '/forgot-password', '/reset-password'];
const alwaysAllowedPaths = ['/notifications'];

const getAllowedPaths = (navigations: Array<{ links: Array<{ to?: string; children?: Array<{ to: string }> }> }>): string[] => {
	const paths: string[] = [];
	for (const group of navigations) {
		for (const link of group.links ?? []) {
			if (link.to) paths.push(link.to === '/' ? '/' : link.to.replace(/\/$/, ''));
			for (const child of link.children ?? []) {
				if (child.to) paths.push(child.to.replace(/\/$/, ''));
			}
		}
	}
	return paths;
};

const isPathAllowed = (path: string, allowedPaths: string[]): boolean => {
	const normalized = path === '/' ? '/' : path.replace(/\/$/, '');
	return allowedPaths.some((allowed) => normalized === allowed || (allowed !== '/' && normalized.startsWith(allowed + '/')));
};

export default defineNuxtRouteMiddleware((to) => {
	if (import.meta.server) return;

	const accessToken = useCookie(KEY.ACCESS_TOKEN);
	if (!accessToken.value || publicPaths.includes(to.path)) return;

	const appUiStore = useAppUiStore();
	const allowedPaths = [...getAllowedPaths(appUiStore.navigations), ...alwaysAllowedPaths];
	if (allowedPaths.length === 0) return;

	if (!isPathAllowed(to.path, allowedPaths)) {
		const { t } = useI18n();
		return showError(
			createError({
				statusCode: 403,
				statusMessage: 'Forbidden',
				data: { message: t('error.permissionRestricted') },
			}),
		);
	}
});
