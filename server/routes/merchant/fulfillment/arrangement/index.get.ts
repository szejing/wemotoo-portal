import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler((event) => {
	const { $search, ...query } = getQuery(event);
	return signedFetch(
		event,
		Routes.Fulfillment.Arrangement.List(),
		{ method: 'GET', query: { ...query, ...($search ? { search: $search } : {}) } },
	);
});
