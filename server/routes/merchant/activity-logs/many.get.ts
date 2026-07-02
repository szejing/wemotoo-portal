import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);

		const result = await signedFetch(event, Routes.ActivityLogs.Many(), {
			method: 'GET',
			query,
		});
		return result;
	} catch (err) {
		return err;
	}
});
