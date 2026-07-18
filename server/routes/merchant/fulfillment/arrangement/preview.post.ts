import { generateImageHeaders } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';
import { KEY } from 'yeppi-common';

const MAX_SHIPMENT_WORKBOOK_SIZE = 5 * 1024 * 1024;
const INVALID_WORKBOOK_MESSAGE = 'An XLSX shipment workbook is required';
const WORKBOOK_TOO_LARGE_MESSAGE = 'Shipment workbook must not exceed 5 MB';

export default defineEventHandler(async (event) => {
	const route = Routes.Fulfillment.Arrangement.Preview();
	const contentType = getRequestHeader(event, 'content-type');
	if (!contentType?.toLowerCase().startsWith('multipart/form-data')) {
		throw createError({ statusCode: 400, statusMessage: INVALID_WORKBOOK_MESSAGE });
	}
	const contentLength = Number(getRequestHeader(event, 'content-length') ?? 0);
	if (Number.isFinite(contentLength) && contentLength > MAX_SHIPMENT_WORKBOOK_SIZE) {
		throw createError({ statusCode: 413, statusMessage: WORKBOOK_TOO_LARGE_MESSAGE });
	}
	let incoming: FormData;
	try {
		incoming = await readFormData(event);
	} catch {
		throw createError({ statusCode: 400, statusMessage: INVALID_WORKBOOK_MESSAGE });
	}
	const file = incoming.get('file');
	if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx')) {
		throw createError({ statusCode: 400, statusMessage: INVALID_WORKBOOK_MESSAGE });
	}
	if (file.size > MAX_SHIPMENT_WORKBOOK_SIZE) {
		throw createError({ statusCode: 413, statusMessage: WORKBOOK_TOO_LARGE_MESSAGE });
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
