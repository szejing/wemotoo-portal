import type { OrderRequestType, OrderStatus, OrderType, PaymentStatus, ReasonType } from 'yeppi-common';
import type { TaxModel } from '../models/tax.model';
import type { Currency } from './currency';
import type { ItemModel, PaymentModel, CustomerModel } from '../models';
import type { FulfillmentLifecycleStatusValue, OrderActivity, OrderFulfillment, OrderShipment } from './order-fulfillment-shipping';

export type CustomerRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type CustomerRequest = {
	id: string;
	ref_type: 'order' | 'sale';
	ref_no: string;
	inv_no: string;
	customer_no: string;
	merchant_id: string;
	request_type: OrderRequestType;
	reason_type: ReasonType;
	reason_code: string;
	reason_description?: string;
	status: CustomerRequestStatus;
	requested_at: string | Date;
	resolved_at?: string | Date;
	resolved_by?: string;
	metadata?: Record<string, unknown>;
	created_at?: string | Date;
	updated_at?: string | Date;
};

export type OrderHistory = {
	biz_date: string;
	order_date_time: string;
	last_updated: string;
	type: 'order' | 'sale';
	total_qty: number;
	order_no: string;
	inv_no: string;
	status: OrderStatus;
	payment_status: PaymentStatus;
	customer_no: string;
	gross_amt: number;
	payable_total: number;
	net_amt: number;
	net_total: number;
	disc_amt?: number;
	gross_amt_exc: number;
	net_amt_exc: number;
	disc_amt_exc?: number;
	tax_amt_inc?: number;
	tax_amt_exc?: number;
	void_amt?: number;
	adj_amt?: number;
	total_order_qty: number;
	voided_qty: number;
	ref_no?: string;
	remarks?: string;
	metadata?: Record<string, unknown>;
	currency: Currency;
	items: ItemModel[];
	payments: PaymentModel[];
	customer: CustomerModel;
	taxes: TaxModel[];
	created_at: Date;
	fulfillment?: OrderFulfillment;
	shipment?: OrderShipment;
	activities?: OrderActivity[];
	logs?: OrderActivity[];
	shipping_method_id?: number;
	shipping_method?: { id: number; description: string };
	customer_requests?: CustomerRequest[];
	/** Pickup vs delivery (defaults to pickup on API when omitted) */
	order_type?: OrderType;
};

export type NextFulfillmentAction = FulfillmentLifecycleStatusValue | 'none';
