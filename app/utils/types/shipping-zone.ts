import type { ShippingZonePostcodePattern } from './order-fulfillment-shipping';

/** Mirrors `ShippingMethodBriefDto` in yeppi-ecommerce-backend shipping-zone response DTO. */
export type ShippingMethodBrief = {
	id: number;
	description: string;
};

/** Mirrors `ShippingMethodZoneWithMethodDto` in yeppi-ecommerce-backend shipping-zone response DTO. */
export type ShippingMethodZoneWithMethod = {
	id: string;
	fee: number;
	estimated_days?: number;
	order_cutoff_time?: string;
	shipping_method?: ShippingMethodBrief;
};

/** Mirrors `ShippingZoneWithLinksDto` in yeppi-ecommerce-backend shipping-zone response DTO. */
export type ShippingZone = {
	code: string;
	description?: string;
	country_code: string;
	state?: string;
	postcode_patterns: ShippingZonePostcodePattern[];
	rule: number;
	is_default: boolean;
	is_active: boolean;
	methods?: ShippingMethodZoneWithMethod[];
};

/** Mirrors `GetShippingZoneResponseDto` in yeppi-ecommerce-backend shipping-zone response DTO. */
export type GetShippingZoneResponse = {
	shipping_zone: ShippingZone;
};

/** Mirrors `GetShippingZonesResponseDto` in yeppi-ecommerce-backend shipping-zone response DTO. */
export type GetShippingZonesResponse = {
	shipping_zones: ShippingZone[];
	total: number;
};
