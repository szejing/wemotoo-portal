import HttpFactory from '~/repository/factory';
import MerchantRoutes from '~/repository/routes.client';
import type { LoginReq } from './models/request/login.req';
import type { LoginResp } from './models/response/login.resp';
import type { VerifyResp } from './models/response/verify.resp';
import type { PasswordResetConfirmReq, PasswordResetReq } from './models/request/password-reset.req';

class AuthModule extends HttpFactory {
	private readonly RESOURCE = MerchantRoutes.Auth;

	async heartbeat(): Promise<void> {
		await this.call<void>({
			method: 'GET',
			url: this.RESOURCE.Heartbeat(),
		});
	}

	/**
	 * login with email_address and password
	 * @param email_address
	 * @param password
	 * @returns
	 */
	async login(data: LoginReq): Promise<LoginResp> {
		return await this.call<LoginResp>({
			method: 'POST',
			url: `${this.RESOURCE.Login()}`,
			body: data,
		});
	}

	async passwordReset(data: PasswordResetReq): Promise<void> {
		return await this.call<void>({
			method: 'POST',
			url: this.RESOURCE.PasswordReset(),
			body: data,
		});
	}

	async validatePasswordResetToken(token: string): Promise<boolean> {
		return await this.call<boolean>({
			method: 'POST',
			url: this.RESOURCE.PasswordResetValidate(),
			body: { token },
		});
	}

	async confirmResetPassword(data: PasswordResetConfirmReq): Promise<void> {
		return await this.call<void>({
			method: 'POST',
			url: this.RESOURCE.PasswordResetConfirm(),
			body: data,
		});
	}

	// async resetPassword(data: ResetPasswordReq): Promise<void> {
	// 	await this.call<void>({
	// 		method: 'POST',
	// 		url: this.RESOURCE.ResetPassword(),
	// 		body: data,
	// 	});
	// }

	/**
	 * refresh session
	 * @returns
	 */
	async verify(): Promise<VerifyResp> {
		return await this.call<VerifyResp>({
			method: 'POST',
			url: `${this.RESOURCE.Verify()}`,
		});
	}

	/**
	 * refresh session
	 * @returns
	 */
	async refreshToken(): Promise<string> {
		return await this.call<string>({
			method: 'POST',
			url: `${this.RESOURCE.Refresh()}`,
		});
	}

	/**
	 * logout
	 * @returns
	 */
	async logout(): Promise<number> {
		return await this.call<number>({
			method: 'POST',
			url: `${this.RESOURCE.Logout()}`,
		});
	}
}

export default AuthModule;
