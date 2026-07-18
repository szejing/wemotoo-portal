import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler((event) => signedFetch(
	event,
	Routes.Fulfillment.Arrangement.List(),
	{ method: 'GET', query: getQuery(event) },
));
