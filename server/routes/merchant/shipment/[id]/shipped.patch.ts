import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const id = getRouterParams(event).id;
		const body = await readBody(event);

		const result = await signedFetch(event, Routes.Shipment.MarkShipped(id), {
			method: 'PATCH',
			body,
		});
		return result;
	} catch (err) {
		return err;
	}
});
