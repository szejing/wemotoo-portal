import * as YeppiCommon from 'yeppi-common';

const { KEY, buildCanonicalString, hashBody, signRequest } = YeppiCommon;
const commonPlatform = YeppiCommon as typeof YeppiCommon & {
	APP_PLATFORM?: { WEMOTOO: string };
	X_PLATFORM_HEADER?: string;
};
const X_PLATFORM_HEADER = commonPlatform.X_PLATFORM_HEADER ?? 'x-platform';
const APP_PLATFORM_WEMOTOO = commonPlatform.APP_PLATFORM?.WEMOTOO ?? 'wemotoo';

const API_PATH_PREFIX = '/api';

function canonicalPathAndQueryForSignature(pathname: string, query?: Record<string, any>): string {
	const pathNormalized = (pathname || '/').replace(/\/+$/, '') || '/';
	if (!query || Object.keys(query).length === 0) {
		return pathNormalized;
	}

	const entries: [string, string][] = [];
	for (const key of Object.keys(query).sort((a, b) => a.localeCompare(b))) {
		const value = query[key];
		if (Array.isArray(value)) {
			for (const item of value) {
				entries.push([key, item == null ? '' : String(item)]);
			}
		} else {
			entries.push([key, value == null ? '' : String(value)]);
		}
	}

	entries.sort((a, b) => a[0].localeCompare(b[0]));
	const queryString = entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
	return `${pathNormalized}?${queryString}`;
}

function getSignatureHeaders(event: any, method: string, pathForSignature: string, body: string | undefined | null): Record<string, string> {
	const config = useRuntimeConfig(event);
	const secret = config.requestSignatureSecret;
	if (!secret) {
		return {};
	}
	const timestamp = new Date().toISOString();
	const bodyHash = hashBody(body ?? undefined);
	const canonical = buildCanonicalString(method, pathForSignature, timestamp, bodyHash);
	const signature = signRequest(canonical, secret);
	return {
		[KEY.X_TIMESTAMP]: timestamp,
		[KEY.X_SIGNATURE]: signature,
	};
}

/**
 * Build canonical path+query as used for X-Signature (path no trailing slash, query keys sorted).
 * Must match Nest `request.originalUrl`: the CRM sends `/api/auth/login`, `/api/shipping-methods/...`, etc.
 * RouterMiddleware rewrites `req.url` to `/merchant/...` for routing, but `originalUrl` stays `/api/...`
 * (see yeppi-ecommerce-backend RouterMiddleware + SignatureGuard).
 */
export function pathForSignature(pathSegment: string, query?: Record<string, any>): string {
	const trimmed = pathSegment.replace(/^\//, '').replace(/\/+$/, '');
	const rest = trimmed.replace(/^merchant\//, '');
	const pathname = `${API_PATH_PREFIX}/${rest}`;
	return canonicalPathAndQueryForSignature(pathname, query);
}

/**
 * Raw body bytes used for X-Signature body hash (passed to hashBody).
 * Must match yeppi-ecommerce-backend SignatureGuard: DELETE uses empty hash, not JSON body.
 */
export function rawBodyForSignature(method: string, body: unknown): string | undefined {
	const m = (method || 'GET').toUpperCase();
	if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS' || m === 'DELETE') {
		return undefined;
	}
	if (body === undefined || body === null) {
		return '';
	}
	if (typeof body === 'string') {
		return body;
	}
	return JSON.stringify(body);
}

type UpstreamFetchBody = Record<string, any> | BodyInit | null | undefined;

/**
 * Body bytes sent upstream. For POST/PUT/PATCH, plain objects are JSON.stringify'd once so the
 * signature matches Nest's `req.rawBody` (SignatureGuard hashes raw bytes, not a re-stringified object).
 */
export function upstreamFetchBody(method: string, body: unknown): UpstreamFetchBody {
	const m = (method || 'GET').toUpperCase();
	if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') {
		return undefined;
	}
	if (m === 'DELETE') {
		return body as UpstreamFetchBody;
	}
	if (body === undefined || body === null) {
		return body;
	}
	if (typeof body === 'string') {
		return body;
	}
	return JSON.stringify(body);
}

/**
 * $fetch to ecommerce backend with x-api-key, x-signature, and x-timestamp. Use this for all server-to-backend calls.
 * x-merchant-id is always set: from options.merchant_id, or from options.body.merchant_id, or from cookie.
 */
export async function signedFetch(
	event: any,
	pathSegment: string,
	options: {
		method?: string;
		query?: Record<string, any>;
		body?: any;
		headers?: Record<string, string>;
		includeAccessToken?: boolean;
		merchant_id?: string;
		[key: string]: any;
	} = {},
): Promise<any> {
	const config = useRuntimeConfig(event);
	const baseURL = config.public.baseUrl;
	const method = (options.method || 'GET').toUpperCase();
	const query = options.query ?? {};
	const normalizedSegment = pathSegment
		.replace(/^\//, '')
		.replace(/^api\//, '')
		.replace(/^merchant\//, '');
	const pathForSig = pathForSignature(normalizedSegment, query);
	const fetchBody = upstreamFetchBody(method, options.body);
	const bodyForHash = rawBodyForSignature(method, fetchBody);
	const sigHeaders = getSignatureHeaders(event, method, pathForSig, bodyForHash);
	const cookie_merchant_id = getCookie(event, KEY.X_MERCHANT_ID) || '';
	const merchant_id =
		options.merchant_id != null && options.merchant_id !== ''
			? String(options.merchant_id)
			: options.body != null && typeof options.body === 'object' && options.body.merchant_id != null && options.body.merchant_id !== ''
				? String(options.body.merchant_id)
				: cookie_merchant_id;
	const baseHeaders = generateHeaders(event, options.includeAccessToken !== false, merchant_id);
	const headers = { ...baseHeaders, ...sigHeaders, ...(options.headers || {}) };
	const { includeAccessToken, merchant_id: _omit, method: _method, body: _body, ...fetchOptions } = options;
	// Request path must match what we signed (/api/...). Avoid double "api" when baseURL already includes /api.
	const basePath = (baseURL || '').replace(/\/+$/, '');
	const baseHasApi = basePath.endsWith('/api');
	const requestPath = baseHasApi ? normalizedSegment : `api/${normalizedSegment}`;
	return $fetch(requestPath, {
		...fetchOptions,
		baseURL,
		method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS',
		headers,
		body: fetchBody,
	});
}

export const generateBasicHeaders = (event: any) => {
	const config = useRuntimeConfig(event);

	const headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'x-api-key': config.apiKey,
		[X_PLATFORM_HEADER]: APP_PLATFORM_WEMOTOO,
	};

	return headers;
};

export const generateHeaders = (event: any, includeAccessToken: boolean = true, merchant_id: string = '') => {
	const config = useRuntimeConfig(event);

	const cookie_access_token = getCookie(event, KEY.ACCESS_TOKEN) || '';
	const cookie_merchant_id = getCookie(event, KEY.X_MERCHANT_ID) || '';

	const headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'x-api-key': config.apiKey,
		'x-merchant-id': merchant_id != '' ? merchant_id : cookie_merchant_id,
		[X_PLATFORM_HEADER]: APP_PLATFORM_WEMOTOO,
	};

	if (!includeAccessToken) {
		return headers;
	}

	return {
		...headers,
		Authorization: 'Bearer ' + cookie_access_token,
	};
};

export const generateImageHeaders = (event: any) => {
	const config = useRuntimeConfig(event);

	const cookie_access_token = getCookie(event, KEY.ACCESS_TOKEN) || '';
	const cookie_merchant_id = getCookie(event, KEY.X_MERCHANT_ID) || '';

	const headers = {
		'Accept': 'application/json',
		'x-api-key': config.apiKey,
		'x-merchant-id': cookie_merchant_id,
		[X_PLATFORM_HEADER]: APP_PLATFORM_WEMOTOO,
	};

	return {
		...headers,
		Authorization: 'Bearer ' + cookie_access_token,
	};
};
