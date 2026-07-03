import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const id = getRouterParam(event, 'id') ?? '';

		if (!id) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Affiliate id is required',
			});
		}

		const result = await signedFetch(event, Routes.Affiliates.Single(id), {
			method: 'GET',
		});
		return result;
	} catch (err) {
		return err;
	}
});
