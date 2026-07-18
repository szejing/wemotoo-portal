import { generateImageHeaders } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';
import { KEY } from 'yeppi-common';

export default defineEventHandler(async (event) => {
	const route = Routes.Fulfillment.Arrangement.Preview();
	const incoming = await readFormData(event);
	const file = incoming.get('file');
	if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx')) {
		throw createError({ statusCode: 400, statusMessage: 'An XLSX shipment workbook is required' });
	}
	const merchantId = getCookie(event, KEY.X_MERCHANT_ID) || '';
	if (!merchantId) {
		throw createError({ statusCode: 400, statusMessage: 'Merchant ID is required' });
	}
	const body = new FormData();
	body.append('merchant_id', merchantId);
	body.append('file', new Blob([file], { type: file.type }), file.name);
	return $fetch(route, {
		baseURL: String(useRuntimeConfig(event).public.baseUrl ?? ''),
		method: 'POST',
		body,
		headers: generateImageHeaders(event, route),
	});
});
