import { signedFetch } from '#root/server/base_api';
import { Routes } from '#root/server/routes.server';
import { OrderResendEmailAction } from 'yeppi-common';

export default defineEventHandler(async (event) => {
	try {
		const order_no = getRouterParams(event).order_no;

		if (!order_no) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Order No is required',
			});
		}

		const { action } = await readBody<{ action?: OrderResendEmailAction }>(event);
		if (!Object.values(OrderResendEmailAction).includes(action as OrderResendEmailAction)) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Valid resend email action is required',
			});
		}

		const result = await signedFetch(event, `${Routes.Sales.ResendEmail(order_no)}`, {
			method: 'POST',
			body: { action },
		});
		return result;
	} catch (err) {
		return err;
	}
});
