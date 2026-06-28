import { signedFetch } from '#root/server/base_api';

export default defineEventHandler(async (event) => {
	return signedFetch(event, 'heartbeat', {
		method: 'GET',
		includeAccessToken: false,
	});
});
