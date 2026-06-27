export type ShippingZoneFormFields = {
	code: string;
	description: string;
	rule: number;
	is_active: boolean;
	country_code: string;
	/** Malaysia mode: multiple ISO-style names; full mode: zero or one entry synced from text input. */
	state: string[];
	postcodes_text: string;
	shipping_method_ids: string[];
	method_pricing: Record<
		string,
		{
			fee: number;
			estimated_days: number | undefined;
			order_cutoff_time?: string | undefined;
		}
	>;
};
