export const MAX_SHIPMENT_WORKBOOK_SIZE = 5 * 1024 * 1024;
// Allow bounded multipart boundary/header overhead while enforcing the exact file limit after parsing.
export const MAX_SHIPMENT_WORKBOOK_REQUEST_SIZE = MAX_SHIPMENT_WORKBOOK_SIZE + 64 * 1024;

export type ShipmentWorkbookRequestLengthResult =
	| { ok: true; contentLength: number }
	| { ok: false; statusCode: number; statusMessage: string };

export function validateShipmentWorkbookRequestLength(contentLengthHeader?: string, transferEncodingHeader?: string): ShipmentWorkbookRequestLengthResult {
	const usesChunkedTransfer = transferEncodingHeader
		?.split(',')
		.some((encoding) => encoding.trim().toLowerCase() === 'chunked');
	if (contentLengthHeader === undefined || usesChunkedTransfer) {
		return { ok: false, statusCode: 411, statusMessage: 'Content-Length is required' };
	}
	if (!/^[1-9]\d*$/.test(contentLengthHeader)) {
		return { ok: false, statusCode: 400, statusMessage: 'Content-Length must be a positive safe integer' };
	}
	const contentLength = Number(contentLengthHeader);
	if (!Number.isSafeInteger(contentLength)) {
		return { ok: false, statusCode: 400, statusMessage: 'Content-Length must be a positive safe integer' };
	}
	if (contentLength > MAX_SHIPMENT_WORKBOOK_REQUEST_SIZE) {
		return { ok: false, statusCode: 413, statusMessage: 'Shipment workbook must not exceed 5 MB' };
	}
	return { ok: true, contentLength };
}
