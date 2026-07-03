import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const id = getRouterParam(event, 'id') ?? '';
		const body = await readBody(event);

		if (!id) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Affiliate tier id is required',
			});
		}

		const result = await signedFetch(event, Routes.Affiliates.TierUpdate(id), {
			method: 'PATCH',
			body,
		});
		return result;
	} catch (err) {
		return err;
	}
});
