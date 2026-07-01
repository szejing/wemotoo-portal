import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';

export default defineEventHandler(async (event) => {
	try {
		const result = await signedFetch(event, `${Routes.Products.ImportTemplate()}`, {
			method: 'GET',
			responseType: 'blob',
		});

		setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		setHeader(event, 'Content-Disposition', 'attachment; filename="product-import-template.xlsx"');

		return result;
	} catch (err) {
		return err;
	}
});
