export type UpdateFulfillmentReq = {
	merchant_id: string;
	shipping_method_id?: number;
	shipping_fee?: number;
	courier_id?: number | null;
	courier_name?: string | null;
	tracking_no?: string | null;
	reason?: string;
	user?: {
		id: string;
	};
};
