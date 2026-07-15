export type ResolveShippingMethodsReq = {
	merchant_id: string;
	country_code: string;
	state?: string;
	postal_code?: string;
};
