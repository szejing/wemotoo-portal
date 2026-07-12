import type { OrderItemStatus, OrderStatus } from 'yeppi-common';

export type SummCountKey = 'total_orders' | 'total_txns';

export type SummCustomerVariant = 'order' | 'sale';

export type SummBillTableRow = {
	biz_date: Date;
	currency_code: string;
	status: OrderStatus;
	gross_amt: number;
	net_amt: number;
	disc_amt?: number;
	gross_amt_exc: number;
	net_amt_exc: number;
	tax_amt_inc?: number;
	tax_amt_exc?: number;
	void_amt?: number;
	adj_amt?: number;
	total_orders?: number;
	total_txns?: number;
	total_qty: number;
	total_voided_qty: number;
};

export type SummItemRow = {
	biz_date: Date;
	currency_code: string;
	item_status: OrderItemStatus;
	prod_code: string;
	prod_name: string;
	prod_variant_code?: string;
	prod_variant_name?: string;
	gross_amt: number;
	disc_amt?: number;
	net_amt: number;
	gross_amt_exc: number;
	disc_amt_exc?: number;
	net_amt_exc: number;
	tax_amt_inc?: number;
	tax_amt_exc?: number;
	adj_amt?: number;
	total_orders?: number;
	total_txns?: number;
	total_qty: number;
};

export type SummCustomerRow = {
	biz_date: Date;
	customer_no: string;
	customer_name: string;
	currency_code: string;
	status: OrderStatus;
	gross_amt: number;
	net_amt: number;
	total_txns?: number;
	total_qty?: number;
};

export type TranslateFn = (key: string) => string;
