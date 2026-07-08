import { defineStore } from 'pinia';
import { KEY } from 'yeppi-common';
import { useMerchantInfoStore } from '~/stores/MerchantInfo/MerchantInfo';
import { useAppStore } from '~/stores/App';
import { useAppUiStore } from '~/stores/AppUi/AppUi';
import { ensureMerchantIdCookie, resolveSessionMerchantId, writeWmidToStorage } from '~/utils/auth/merchant-id';
import type { User } from '~/utils/types/user';
import type { LoginResp } from '~/repository/modules/auth/models/response/login.resp';
import type { VerifyResp } from '~/repository/modules/auth/models/response/verify.resp';
import type { ErrorResponse } from '~/repository/base/error';

export const useAuthStore = defineStore('authStore', {
	state: () => ({
		loading: false as boolean,
		user: null as User | null,
		serverReachabilityError: false as boolean,
	}),
	actions: {
		async checkHeartbeat(): Promise<boolean> {
			const { $api } = useNuxtApp();
			const appUiStore = useAppUiStore();

			try {
				await $api.auth.heartbeat();
				this.serverReachabilityError = false;
				return true;
			} catch {
				this.serverReachabilityError = true;
				appUiStore.showToast({
					color: 'error',
					icon: ICONS.ERROR_OUTLINE,
					title: 'Unable to reach server',
					description: 'Please check your connection or try again later.',
				});
				return false;
			}
		},

		// login
		async login(merchant_id: string, email_address: string, password: string): Promise<boolean> {
			const { $api } = useNuxtApp();

			this.loading = true;
			const appUiStore = useAppUiStore();

			try {
				const mid = useCookie(KEY.X_MERCHANT_ID, { maxAge: 60 * 60 * 24 * 7 });
				mid.value = merchant_id;
				writeWmidToStorage(merchant_id);

				const data: LoginResp = await $api.auth.login({ merchant_id, email_address, password });

				mid.value = merchant_id;
				writeWmidToStorage(merchant_id);

				const access_token = useCookie(KEY.ACCESS_TOKEN, { maxAge: 60 * 60 * 24 * 7 });
				access_token.value = data.token;

				const refresh_token = useCookie(KEY.REFRESH_TOKEN, { maxAge: 60 * 60 * 24 * 7 });
				refresh_token.value = data.refresh_token;

				this.user = data.user;

				appUiStore.setExcludeRoutes(data.exclude_routes);
				const app = useAppStore();
				await app.init();

				appUiStore.showToast({
					color: 'success',
					icon: ICONS.CHECK_OUTLINE_ROUNDED,
					title: 'Login Successful',
					description: 'Welcome back!',
				});

				return true;
			} catch (err: unknown | ErrorResponse) {
				this.clearCookies();
				const message = (err as ErrorResponse).message ?? 'Failed to login';

				appUiStore.showToast({
					color: 'error',
					icon: ICONS.ERROR_OUTLINE,
					title: message,
				});

				return false;
			} finally {
				this.loading = false;
			}
		},

		// refresh session
		// async refreshToken() {
		// 	const { $api } = useNuxtApp();

		// 	try {
		// 		const token: string = await $api.auth.refreshToken();

		// 		const access_token = useCookie(KEY.ACCESS_TOKEN, { maxAge: 60 * 60 * 24 * 7 });
		// 		access_token.value = token;
		// 	} catch (err: any) {
		// 		this.clearCookies();
		// 		console.error(err);
		// 	}
		// },
		// logout

		async logout(): Promise<boolean> {
			const { $api } = useNuxtApp();
			this.loading = true;

			try {
				const response_code: number = await $api.auth.logout();

				if (response_code === 200) {
					this.clearCookies();
				}

				return response_code === 200;
			} catch (err: unknown | ErrorResponse) {
				return true;
			} finally {
				this.loading = false;
			}
		},

		async verify(): Promise<boolean> {
			const { $api } = useNuxtApp();
			this.loading = true;
			const appUiStore = useAppUiStore();

			try {
				const merchantCookie = useCookie(KEY.X_MERCHANT_ID);
				const accessTokenCookie = useCookie(KEY.ACCESS_TOKEN);
				const merchant_id = resolveSessionMerchantId(merchantCookie.value);
				ensureMerchantIdCookie(merchant_id);

				const accessToken = accessTokenCookie.value?.trim();
				const data: VerifyResp = await $api.auth.verify({
					merchant_id,
					authorization: accessToken ? `Bearer ${accessToken}` : undefined,
				});

				if (!data.user) {
					this.clearCookies();
				}

				this.user = data.user;
				appUiStore.setExcludeRoutes(data.exclude_routes);

				return true;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to verify session';
				appUiStore.showToast({
					color: 'error',
					icon: ICONS.ERROR_OUTLINE,
					title: message,
				});

				return false;
			} finally {
				this.loading = false;
			}
		},

		async validateResetPasswordToken(token: string): Promise<boolean> {
			const { $api } = useNuxtApp();
			const appUiStore = useAppUiStore();

			try {
				const isValid: boolean = await $api.auth.validatePasswordResetToken(token);

				if (!isValid) {
					appUiStore.showToast({
						color: 'error',
						icon: ICONS.ERROR_OUTLINE,
						title: 'Invalid or expired link',
						description: 'The link is invalid or expired.',
					});
				}

				return true;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to validate reset link';
				appUiStore.showToast({
					color: 'error',
					icon: ICONS.ERROR_OUTLINE,
					title: 'Failed to validate reset link',
					description: message,
				});
				return false;
			}
		},

		async forgotPassword(merchant_id: string, email_address: string): Promise<[boolean, string]> {
			const { $api } = useNuxtApp();
			this.loading = true;
			const appUiStore = useAppUiStore();

			try {
				await $api.auth.passwordReset({ merchant_id, email_address });

				appUiStore.showToast({
					color: 'success',
					icon: ICONS.CHECK_OUTLINE_ROUNDED,
					title: 'Reset link sent',
					description: 'We have successfully sent you a reset link to your email.',
				});
				return [true, ''];
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to send reset link';

				appUiStore.showToast({
					color: 'error',
					icon: ICONS.ERROR_OUTLINE,
					title: 'Failed to send reset link',
					description: message,
				});

				return [false, message];
			} finally {
				this.loading = false;
			}
		},

		async confirmResetPassword(token: string, password: string): Promise<boolean> {
			const { $api } = useNuxtApp();
			this.loading = true;
			const appUiStore = useAppUiStore();

			try {
				await $api.auth.confirmResetPassword({ token, password });

				appUiStore.showToast({
					color: 'success',
					icon: ICONS.CHECK_OUTLINE_ROUNDED,
					title: 'Password reset successful',
					description: 'Your password has been updated. You can now sign in with your new password.',
				});
				return true;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to reset password';

				appUiStore.showToast({
					color: 'error',
					icon: ICONS.ERROR_OUTLINE,
					title: 'Failed to reset password',
					description: message,
				});

				return false;
			} finally {
				this.loading = false;
			}
		},

		clearCookies() {
			const access_token = useCookie(KEY.ACCESS_TOKEN);
			access_token.value = null;
			const merchant_id = useCookie(KEY.X_MERCHANT_ID);
			merchant_id.value = null;
		},
	},
});
