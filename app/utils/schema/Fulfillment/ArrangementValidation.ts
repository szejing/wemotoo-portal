import { z } from 'zod';

type TranslateFn = (key: string) => string;

export type FulfillmentArrangementOriginal = {
	shipping_method_id: number | null;
	shipping_fee: number;
};

export function createFulfillmentArrangementValidation(
	t: TranslateFn,
	original: FulfillmentArrangementOriginal,
) {
	return z.object({
		shipping_method_id: z.number().int().nullable(),
		shipping_fee: z.coerce.number().min(0, t('validation.fulfillment.shippingFeeNonNegative')),
		courier_id: z.number().int().nullable(),
		courier_name: z.string(),
		tracking_no: z.string(),
		reason: z.string(),
	}).superRefine((value, context) => {
		const methodChanged = value.shipping_method_id !== original.shipping_method_id;
		const feeChanged = value.shipping_fee !== original.shipping_fee;
		if ((methodChanged || feeChanged) && !value.reason.trim()) {
			context.addIssue({
				code: 'custom',
				path: ['reason'],
				message: t('validation.fulfillment.reasonRequired'),
			});
		}
	});
}
