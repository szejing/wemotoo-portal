import { KEY } from 'yeppi-common';
import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const body = (await readBody(event).catch(() => ({}))) as { merchant_id?: string };
		const cookieAccessToken = getCookie(event, KEY.ACCESS_TOKEN) || '';
		const authorizationHeader = getHeader(event, 'authorization') || '';
		const accessToken =
			cookieAccessToken ||
			(authorizationHeader.startsWith('Bearer ') ? authorizationHeader.slice(7).trim() : '');

		const result = await signedFetch(event, `${Routes.Auth.Verify()}`, {
			method: 'POST',
			body: body?.merchant_id ? { merchant_id: body.merchant_id } : undefined,
			merchant_id: body?.merchant_id,
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
		});
		return result;
	} catch (err) {
		return err;
	}
});
