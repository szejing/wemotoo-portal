import type { NitroFetchOptions } from 'nitropack';
import { ApiErrorModel } from '~/utils/types/api-error-model';

interface IHttpFactory {
	method:
		| 'GET'
		| 'HEAD'
		| 'PATCH'
		| 'POST'
		| 'PUT'
		| 'DELETE'
		| 'CONNECT'
		| 'OPTIONS'
		| 'TRACE'
		| 'get'
		| 'head'
		| 'patch'
		| 'post'
		| 'put'
		| 'delete'
		| 'connect'
		| 'options'
		| 'trace';
	url: string;
	fetchOptions?: NitroFetchOptions<'json'>;
	body?: object;
	query?: object;
	headers?: Record<string, string>;
}

class HttpFactory {
	async call<T>({
		method,
		url,
		fetchOptions,
		body,
		query,
		headers = {
			'Content-Type': 'application/json',
		},
	}: IHttpFactory): Promise<T> {
		try {
			return await $fetch<T>(url, {
				...fetchOptions,
				method,
				body,
				query,
				headers: {
					...headers,
					...(fetchOptions?.headers ?? {}),
				},
			});
		} catch (error: any) {
			// if (error instanceof 401) {
			// 	refresh token -> call again
			// }
			const apiError = error?.data?.data?.error;
			throw apiError?.message ? apiError : new ApiErrorModel(500, 'Internal Server Error');
		}
	}
}
export default HttpFactory;
