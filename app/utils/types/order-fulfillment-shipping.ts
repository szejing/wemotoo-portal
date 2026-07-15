export type FulfillmentLifecycleStatusValue = 'pending' | 'processing' | 'packed' | 'fulfilled';

export type ShipmentStatusValue = 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'failed';

export type ShippingZonePostcodePattern = {
	kind: 'exact' | 'prefix' | 'regex';
	value: string;
};

export type ShippingZoneRule = {
	code: string;
	description?: string | null;
	country_code: string;
	state?: string;
	postcode_patterns: ShippingZonePostcodePattern[];
	rule?: number;
	is_default?: boolean;
	fee: number;
	estimated_days?: number | null;
	order_cutoff_time?: string | null;
};

export type ShippingMethodZoneLink = {
	id: string;
	fee: number;
	estimated_days?: number;
	order_cutoff_time?: string;
	shipping_zone?: {
		code: string;
		description?: string;
		country_code: string;
		state?: string;
		postcode_patterns: ShippingZonePostcodePattern[];
		rule: number;
		is_default: boolean;
	};
};

export type ShippingMethodOption = {
	id: number;
	description: string;
	/** Present when methods are enriched for shipment UI (e.g. resolved fee). */
	fee?: number;
	currency_code?: string;
	priority?: number;
	/** @deprecated Prefer method_zones */
	zone?: Record<string, unknown>;
	method_zones?: ShippingMethodZoneLink[];
	is_active: boolean;
};

/** Editable fields for a merchant shipping zone (standalone CRUD). */
export type ShippingZoneMutableFields = {
	code: string;
	description?: string;
	rule?: number;
	is_active: boolean;
	country_code: string;
	state?: string;
	postcode_patterns: ShippingZonePostcodePattern[];
	/** Per-method pricing for this zone (API payload). */
	methods: {
		shipping_method_id: number;
		fee: number;
		estimated_days?: number | null;
		order_cutoff_time?: string | null;
	}[];
	/** Shipping methods that support delivery under this zone (derived for UI). */
	shipping_method_ids: string[];
};

/** Persisted shipping zone row. TODO(api): load/save via API instead of in-memory store. */
export type ShippingZoneRecord = ShippingZoneMutableFields & {
	created_at: string;
	updated_at: string;
	/** Short summary for list tables when fees differ per method. */
	pricing_summary?: string;
};

export type FulfillmentBatch = {
	id: string;
	order_no: string;
	inv_no: string;
	batch_no: number;
	status: FulfillmentLifecycleStatusValue;
	shipment_status: ShipmentStatusValue;
	shipping_method: { id: number; description: string } | null;
	shipping_zone_id: string | null;
	shipping_fee: number;
	courier_id: number | null;
	courier_name: string | null;
	tracking_no: string | null;
	packed_at: string | Date | null;
	shipped_at: string | Date | null;
	delivered_at: string | Date | null;
	created_at: string | Date;
	updated_at: string | Date | null;
};

export type OrderActivity = {
	id?: number | string;
	action?: string;
	desc?: string;
	internal_desc?: string;
	created_by?: string;
	user_id?: string;
	created_at: string | Date;
	metadata?: Record<string, unknown>;
};
