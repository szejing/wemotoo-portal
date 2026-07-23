import { getFormattedDate, OrderStatus, removeDuplicateExpands } from 'yeppi-common';
import { buildOrderStatusODataFilter } from '~/utils/order-status-filter';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { Range } from '~/utils/interface';

export type OrderExportSortKey =
	| 'biz_date_desc'
	| 'biz_date_asc'
	| 'created_at_desc'
	| 'order_no_asc';

export type OrderExportOptions = {
	date_range: Range;
	statuses: OrderStatus[];
	sort: OrderExportSortKey;
	include_item_details: boolean;
};

export const ORDER_EXPORT_MAX_ROWS = 5000;

export const ORDER_EXPORT_SORT_ORDERBY: Record<OrderExportSortKey, string> = {
	biz_date_desc: 'biz_date desc, created_at desc',
	biz_date_asc: 'biz_date asc, created_at asc',
	created_at_desc: 'created_at desc',
	order_no_asc: 'order_no asc',
};

const ORDER_EXPORT_DETAIL_RELATIONS = [
	'currency',
	'items',
	'items.appointment',
	'items.discounts',
	'items.taxes',
	'payments',
	'discounts',
	'customer',
	'taxes',
] as const;

const ORDER_EXPORT_FLAT_RELATIONS = [
	'currency',
	'items',
	'payments',
	'discounts',
	'customer',
	'taxes',
] as const;

export function getOrderExportExpand(includeItemDetails: boolean): string {
	if (includeItemDetails) {
		return [...new Set(ORDER_EXPORT_DETAIL_RELATIONS)].join(',');
	}

	return removeDuplicateExpands([...ORDER_EXPORT_FLAT_RELATIONS]).join(',');
}

export function buildOrderExportDateFilter(dateRange: Range): string {
	let { start, end } = dateRange;

	start = start ?? new Date();
	end = end ?? new Date();

	return end
		? `(biz_date between '${getFormattedDate(start, 'yyyy-MM-dd')}' and '${getFormattedDate(end, 'yyyy-MM-dd')}')`
		: `biz_date le '${getFormattedDate(start, 'yyyy-MM-dd')}'`;
}

export function buildOrderExportQueryParams(
	options: OrderExportOptions,
): BaseODataReq & { include_item_details: boolean } {
	let filter = buildOrderStatusODataFilter(options.statuses);
	const dateFilter = buildOrderExportDateFilter(options.date_range);

	filter = filter ? `${filter} and ${dateFilter}` : dateFilter;

	return {
		$top: ORDER_EXPORT_MAX_ROWS,
		$skip: 0,
		$count: false,
		$filter: filter,
		$expand: getOrderExportExpand(options.include_item_details),
		$orderby: ORDER_EXPORT_SORT_ORDERBY[options.sort],
		include_item_details: options.include_item_details,
	};
}

export function getDefaultOrderExportOptions(): OrderExportOptions {
	const end = new Date();
	const start = new Date(end);
	start.setDate(start.getDate() - 14);

	return {
		date_range: { start, end },
		statuses: [],
		sort: 'biz_date_desc',
		include_item_details: false,
	};
}
