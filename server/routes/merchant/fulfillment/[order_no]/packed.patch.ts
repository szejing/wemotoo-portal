import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const id = getRouterParam(event, 'order_no');
		if (!id) throw createError({ statusCode: 400, statusMessage: 'Fulfillment id is required' });
		const body = await readBody(event);

		const result = await signedFetch(event, Routes.Fulfillment.MarkPacked(id), {
			method: 'PATCH',
			body,
		});
		return result;
	} catch (err) {
		return err;
	}
});
