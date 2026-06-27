import { generateImageHeaders } from '../../../base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig(event);
		const formData = await readFormData(event);
		const file = formData.get('file');
		const dir = formData.get('dir');

		if (!file || !(file instanceof File)) {
			throw createError({
				statusCode: 400,
				statusMessage: 'File is required and must be a valid file',
			});
		}

		const newFormData = new FormData();
		const blob = new Blob([file], { type: file.type });
		newFormData.append('dir', dir as string);
		newFormData.append('file', blob, file.name);

		const result = await $fetch(`${Routes.Images.Upload()}`, {
			baseURL: config.public.baseUrl,
			method: 'POST',
			body: newFormData,
			headers: generateImageHeaders(event, Routes.Images.Upload()),
		});
		return result;
	} catch (err) {
		return err;
	}
});
