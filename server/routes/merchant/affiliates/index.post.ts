import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);

		const result = await signedFetch(event, Routes.Affiliates.Create(), {
			method: 'POST',
			body,
		});
		return result;
	} catch (err) {
		return err;
	}
});
