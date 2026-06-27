import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const data = await readBody(event);

		const result = await signedFetch(event, Routes.Reasons.Create(), {
			method: 'POST',
			body: data,
		});
		return result;
	} catch (err) {
		return err;
	}
});
