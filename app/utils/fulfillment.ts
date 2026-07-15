import type { FulfillmentBatch } from './types/order-fulfillment-shipping';
import type { UpdateFulfillmentReq } from '~/repository/modules/fulfillment/models/request/update-fulfillment.req';

export type FulfillmentArrangementState = {
	shipping_method_id: number | null;
	shipping_fee: number;
	courier_id: number | null;
	courier_name: string;
	tracking_no: string;
	reason: string;
};

export function buildFulfillmentArrangementPayload(state: FulfillmentArrangementState): Omit<UpdateFulfillmentReq, 'merchant_id'> {
	return {
		shipping_method_id: state.shipping_method_id ?? undefined,
		shipping_fee: Number(state.shipping_fee),
		courier_id: state.courier_id,
		courier_name: state.courier_name.trim() || null,
		tracking_no: state.tracking_no.trim() || null,
		reason: state.reason.trim() || undefined,
	};
}

export function sumFulfillmentShippingFees(fulfillments: FulfillmentBatch[]): number {
	return fulfillments.reduce((total, fulfillment) => total + Number(fulfillment.shipping_fee || 0), 0);
}

export function getFulfillmentMethodDescriptions(fulfillments: FulfillmentBatch[]): string[] {
	return [...new Set(fulfillments.map((fulfillment) => fulfillment.shipping_method?.description.trim() ?? '').filter(Boolean))];
}
