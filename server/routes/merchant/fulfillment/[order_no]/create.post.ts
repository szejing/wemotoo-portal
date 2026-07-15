import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const order_no = getRouterParam(event, 'order_no');
		if (!order_no) throw createError({ statusCode: 400, statusMessage: 'Order number is required' });
		const body = await readBody(event);

		const result = await signedFetch(event, Routes.Fulfillment.Create(order_no), {
			method: 'POST',
			body,
		});
		return result;
	} catch (err) {
		return err;
	}
});
