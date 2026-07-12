import type { OrderStatus } from 'yeppi-common';
import type { SummBillTableRow } from '~/utils/table-columns/analytics/types';

export type SummBillSource = {
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

export type MapSummBillsOptions = {
	/** When true (status filter = All), keep separate rows per status. When false, combine by date+currency. */
	groupByStatus?: boolean;
};

function toDateKey(bizDate: Date): string {
	return new Date(bizDate).toISOString().split('T')[0] as string;
}

function emptyTotals(item: SummBillSource): SummBillTableRow {
	return {
		biz_date: new Date(toDateKey(item.biz_date)),
		currency_code: item.currency_code,
		status: item.status,
		gross_amt: 0,
		net_amt: 0,
		disc_amt: 0,
		gross_amt_exc: 0,
		net_amt_exc: 0,
		tax_amt_inc: 0,
		tax_amt_exc: 0,
		void_amt: 0,
		adj_amt: 0,
		total_orders: 0,
		total_txns: 0,
		total_qty: 0,
		total_voided_qty: 0,
	};
}

function addInto(target: SummBillTableRow, item: SummBillSource): void {
	target.gross_amt += item.gross_amt;
	target.net_amt += item.net_amt;
	target.disc_amt = (target.disc_amt ?? 0) + (item.disc_amt ?? 0);
	target.gross_amt_exc += item.gross_amt_exc;
	target.net_amt_exc += item.net_amt_exc;
	target.tax_amt_inc = (target.tax_amt_inc ?? 0) + (item.tax_amt_inc ?? 0);
	target.tax_amt_exc = (target.tax_amt_exc ?? 0) + (item.tax_amt_exc ?? 0);
	target.void_amt = (target.void_amt ?? 0) + (item.void_amt ?? 0);
	target.adj_amt = (target.adj_amt ?? 0) + (item.adj_amt ?? 0);
	target.total_orders = (target.total_orders ?? 0) + (item.total_orders ?? 0);
	target.total_txns = (target.total_txns ?? 0) + (item.total_txns ?? 0);
	target.total_qty += item.total_qty;
	target.total_voided_qty += item.total_voided_qty || 0;
}

/**
 * Map API summary bills to table rows.
 * - groupByStatus true (All): group by biz_date + currency_code + status
 * - groupByStatus false: group by biz_date + currency_code only
 */
export function mapSummBillsToTableRows(items: SummBillSource[], options: MapSummBillsOptions = {}): SummBillTableRow[] {
	const groupByStatus = options.groupByStatus ?? true;
	const grouped = new Map<string, SummBillTableRow>();

	for (const item of items) {
		const dateKey = toDateKey(item.biz_date);
		const key = groupByStatus ? `${dateKey}|${item.currency_code}|${item.status}` : `${dateKey}|${item.currency_code}`;

		let row = grouped.get(key);
		if (!row) {
			row = emptyTotals(item);
			grouped.set(key, row);
		}
		addInto(row, item);
	}

	return Array.from(grouped.values());
}
