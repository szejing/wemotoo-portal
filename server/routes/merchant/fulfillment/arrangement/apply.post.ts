import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => signedFetch(
	event,
	Routes.Fulfillment.Arrangement.Apply(),
	{ method: 'POST', body: await readBody(event) },
));
