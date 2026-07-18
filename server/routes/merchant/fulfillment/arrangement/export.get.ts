import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	const result = await signedFetch(event, Routes.Fulfillment.Arrangement.Export(), {
		method: 'GET',
		query: getQuery(event),
		responseType: 'blob',
	});
	setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	setHeader(event, 'Content-Disposition', `attachment; filename="shipment-arrangement-${new Date().toISOString().slice(0, 10)}.xlsx"`);
	return result;
});
