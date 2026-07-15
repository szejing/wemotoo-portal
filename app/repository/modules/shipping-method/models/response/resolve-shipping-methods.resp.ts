import type { ShippingMethodOption } from '~/utils/types/order-fulfillment-shipping';

export type ResolvedShippingMethodRow = {
	matched_tier: string;
	effective_fee: number;
	effective_estimated_days?: number;
	shipping_id?: string;
	shipping_zone_id?: string;
	shipping_method: ShippingMethodOption;
};

export type ResolveShippingMethodsResp = {
	shipping_methods: ResolvedShippingMethodRow[];
};
