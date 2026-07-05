import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const slug = getRouterParam(event, 'slug');

		if (!slug) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Product slug is required',
			});
		}

		const result = await signedFetch(event, `${Routes.Products.BySlug(slug)}`, {
			method: 'GET',
		});
		return result;
	} catch (err) {
		return err;
	}
});
