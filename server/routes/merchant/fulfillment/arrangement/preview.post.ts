import { generateImageHeaders } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';
import {
	MAX_SHIPMENT_WORKBOOK_SIZE,
	validateShipmentWorkbookRequestLength,
} from '#root/server/utils/shipment-arrangement-upload';
import { KEY } from 'yeppi-common';

const INVALID_WORKBOOK_MESSAGE = 'An XLSX or Numbers shipment workbook is required';
const WORKBOOK_TOO_LARGE_MESSAGE = 'Shipment workbook must not exceed 5 MB';

export default defineEventHandler(async (event) => {
	const route = Routes.Fulfillment.Arrangement.Preview();
	const contentType = getRequestHeader(event, 'content-type');
	if (!contentType?.toLowerCase().startsWith('multipart/form-data')) {
		throw createError({ statusCode: 400, statusMessage: INVALID_WORKBOOK_MESSAGE });
	}
	const requestLength = validateShipmentWorkbookRequestLength(
		getRequestHeader(event, 'content-length'),
		getRequestHeader(event, 'transfer-encoding'),
	);
	if (!requestLength.ok) {
		throw createError({ statusCode: requestLength.statusCode, statusMessage: requestLength.statusMessage });
	}
	let incoming: FormData;
	try {
		incoming = await readFormData(event);
	} catch {
		throw createError({ statusCode: 400, statusMessage: INVALID_WORKBOOK_MESSAGE });
	}
	const file = incoming.get('file');
	const lowerName = file instanceof File ? file.name.toLowerCase() : '';
	if (!(file instanceof File) || (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.numbers'))) {
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
