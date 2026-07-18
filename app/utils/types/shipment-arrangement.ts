export type ShipmentArrangementRowStatus = 'valid' | 'warning' | 'error';

export interface ShipmentArrangementQuery {
	$top?: number;
	$skip?: number;
	$search?: string;
	start_date?: string;
	end_date?: string;
	shipping_method_id?: number;
}

export interface ShipmentArrangementListRow {
	fulfillment_id: string;
	source_updated_at: string;
	order_no: string;
	batch_no: number;
	ordered_at: string;
	recipient: string;
	destination: string;
	shipping_method: string;
}

export interface ShipmentArrangementPreviewRow extends ShipmentArrangementListRow {
	row_number: number;
	courier: string;
	tracking_no: string;
	status: ShipmentArrangementRowStatus;
	messages: string[];
}

export interface ShipmentArrangementPreviewResponse {
	total: number;
	valid: number;
	warnings: number;
	errors: number;
	rows: ShipmentArrangementPreviewRow[];
}

export interface ShipmentArrangementApplyRow {
	fulfillment_id: string;
	source_updated_at: string;
	order_no: string;
	batch_no: number;
	courier: string;
	tracking_no: string;
}

export interface ShipmentArrangementApplyError {
	fulfillment_id: string;
	order_no: string;
	batch_no: number;
	message: string;
}

export interface ShipmentArrangementApplyResponse {
	total: number;
	updated: number;
	failed: number;
	errors: ShipmentArrangementApplyError[];
}

export interface ShipmentArrangementApplyRequest {
	merchant_id: string;
	rows: ShipmentArrangementApplyRow[];
}

export interface ShipmentArrangementListResponse {
	data: ShipmentArrangementListRow[];
	total: number;
}
