import { h } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { getFormattedDate, getOrderStatusColor, OrderStatus } from 'yeppi-common';
import { UBadge } from '#components';
import { headerCell, moneyCell, numberCell, tableCellMeta } from '../styles';
import type { SummCustomerRow, SummCustomerVariant, TranslateFn } from './types';
import { getOrderStatusOption } from '~/utils/options/order-status';

const SUMM_CUSTOMER_BASE_COLUMN_LABELS = {
	biz_date: 'table.bizDate',
	customer: 'table.customer',
	gross_amt: 'table.grossAmt',
	net_amt: 'table.netAmt',
} as const;

export function getSummCustomerColumnLabels(variant: SummCustomerVariant) {
	if (variant === 'order') {
		return {
			...SUMM_CUSTOMER_BASE_COLUMN_LABELS,
			status: 'table.orderStatus',
		} as const;
	}

	return {
		...SUMM_CUSTOMER_BASE_COLUMN_LABELS,
		status: 'table.status',
		total_txns: 'table.totalTxns',
		total_qty: 'table.totalQty',
	} as const;
}

const statusCell = (t: TranslateFn, status: OrderStatus) =>
	h(UBadge, { variant: 'subtle', color: getOrderStatusColor(status) ?? 'neutral', class: 'capitalize' }, () => getOrderStatusOption(t, status)?.label);

const moneyFooter = (column: { getFacetedRowModel: () => { rows: TableRow<SummCustomerRow>[] } }, key: 'gross_amt' | 'net_amt') => {
	const rows = column.getFacetedRowModel().rows;
	const total = rows.reduce((acc, row) => acc + row.original[key], 0);

	return moneyCell(total, rows[0]?.original.currency_code ?? 'MYR');
};

const countFooter = (column: { getFacetedRowModel: () => { rows: TableRow<SummCustomerRow>[] } }, key: 'total_txns' | 'total_qty') => {
	const total = column.getFacetedRowModel().rows.reduce((acc, row) => acc + (row.original[key] ?? 0), 0);

	return numberCell(total);
};

export function getSummCustomerColumns<T extends SummCustomerRow>(t: TranslateFn, variant: SummCustomerVariant): TableColumn<T>[] {
	const statusLabel = variant === 'order' ? t('table.orderStatus') : t('table.status');

	const columns: TableColumn<SummCustomerRow>[] = [
		{
			accessorKey: 'biz_date',
			header: () => headerCell(t('table.bizDate')),
			cell: ({ row }) => h(UBadge, { variant: 'outline', color: 'primary' }, () => getFormattedDate(new Date(row.original.biz_date))),
			footer: () => h('div', { class: 'font-semibold text-default' }, t('pages.totalLabel')),
		},
		{
			id: 'customer',
			accessorFn: (row) => row.customer_no,
			header: () => headerCell(t('table.customer')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-semibold text-highlighted' }, row.original.customer_no),
					h('p', { class: 'text-sm text-muted' }, row.original.customer_name),
				]);
			},
		},
		{
			accessorKey: 'status',
			header: () => headerCell(statusLabel),
			cell: ({ row }) => statusCell(t, row.original.status),
		},
	];

	if (variant === 'sale') {
		columns.push(
			{
				accessorKey: 'total_txns',
				header: () => headerCell(t('table.totalTxns'), 'right'),
				footer: ({ column }) => countFooter(column, 'total_txns'),
				cell: ({ row }) => numberCell(row.original.total_txns ?? 0),
				...tableCellMeta.rightNumeric,
			},
			{
				accessorKey: 'total_qty',
				header: () => headerCell(t('table.totalQty'), 'right'),
				footer: ({ column }) => countFooter(column, 'total_qty'),
				cell: ({ row }) => numberCell(row.original.total_qty ?? 0),
				...tableCellMeta.rightNumeric,
			},
		);
	}

	columns.push(
		{
			accessorKey: 'gross_amt',
			header: () => headerCell(t('table.grossAmt'), 'right'),
			footer: ({ column }) => moneyFooter(column, 'gross_amt'),
			cell: ({ row }) => moneyCell(row.original.gross_amt, row.original.currency_code),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'net_amt',
			header: () => headerCell(t('table.netAmt'), 'right'),
			footer: ({ column }) => moneyFooter(column, 'net_amt'),
			cell: ({ row }) => moneyCell(row.original.net_amt, row.original.currency_code),
			...tableCellMeta.rightNumeric,
		},
	);

	return columns as TableColumn<T>[];
}
