export type ActivityLogAction =
	| 'created'
	| 'updated'
	| 'deleted'
	| 'restored'
	| 'imported'
	| 'checkout_created'
	| 'status_changed'
	| 'payment_status_changed'
	| 'customer_request_created'
	| 'refund_updated'
	| 'fulfillment_updated'
	| 'shipment_updated'
	| 'profile_updated'
	| 'login'
	| 'logout'
	| 'relogin'
	| 'email_sent';

export type ActivityLogActorType = 'admin' | 'customer' | 'system' | 'webhook';

export type ActivityLogSource = 'admin_portal' | 'storefront' | 'webhook' | 'system' | 'import';

export type ActivityLogVisibility = 'admin' | 'customer' | 'both';

export type ActivityLog = {
	id: number;
	entity_name?: string;
	entity_id?: string;
	desc: string;
	internal_desc?: string;
	action?: ActivityLogAction;
	actor_type?: ActivityLogActorType;
	actor_id?: string;
	source?: ActivityLogSource;
	visibility?: ActivityLogVisibility;
	request_id?: string;
	batch_id?: string;
	ref_no?: string;
	ref_no2?: string;
	user_id?: string;
	metadata?: Record<string, unknown>;
	created_at: string | Date;
};
