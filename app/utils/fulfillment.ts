import type { FulfillmentBatch } from './types/order-fulfillment-shipping';
import type { UpdateFulfillmentReq } from '~/repository/modules/fulfillment/models/request/update-fulfillment.req';

export type FulfillmentArrangementState = {
	courier_id: number | null;
	courier_name: string;
	tracking_no: string;
};

export function buildFulfillmentArrangementPayload(state: FulfillmentArrangementState): Omit<UpdateFulfillmentReq, 'merchant_id'> {
	return {
		courier_id: state.courier_id,
		courier_name: state.courier_name.trim() || null,
		tracking_no: state.tracking_no.trim() || null,
	};
}

export function sumFulfillmentShippingFees(fulfillments: FulfillmentBatch[]): number {
	return fulfillments.reduce((total, fulfillment) => total + Number(fulfillment.shipping_fee || 0), 0);
}

export function getFulfillmentMethodDescriptions(fulfillments: FulfillmentBatch[]): string[] {
	return [...new Set(fulfillments.map((fulfillment) => fulfillment.shipping_method?.description.trim() ?? '').filter(Boolean))];
}
