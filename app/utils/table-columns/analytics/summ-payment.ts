import { h } from 'vue';
import { UBadge } from '#components';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { getOrderStatusColor, OrderStatus } from 'yeppi-common';
import type { SummSalePayment } from '~/utils/types/summ-sales';
import { getSortableHeader, moneyCell, numberCell, primaryCell, tableCellMeta } from '../styles';
import type { TranslateFn } from './types';
import { getOrderStatusOption } from '~/utils/options/order-status';

export const SUMM_PAYMENT_COLUMN_LABELS = {
	payment_type_desc: 'table.desc',
	status: 'table.orderStatus',
	payment_amt: 'table.paymentAmt',
	total_txns: 'table.totalTxns',
} as const;

export function getSummPaymentColumns(t: TranslateFn): TableColumn<SummSalePayment>[] {
	return [
		{
			accessorKey: 'payment_type_desc',
			header: ({ column }) => getSortableHeader(column, t('table.desc')),
			cell: ({ row }) => primaryCell(row.getValue('payment_type_desc')),
		},
		{
			accessorKey: 'status',
			header: ({ column }) => getSortableHeader(column, t('table.orderStatus')),
			cell: ({ row }) => {
				const status = row.original.status as OrderStatus;
				const color = getOrderStatusColor(status) ?? 'neutral';
				const label = getOrderStatusOption(t, status)?.label;

				return h(UBadge, { variant: 'subtle', color }, () => label);
			},
		},
		{
			accessorKey: 'payment_amt',
			header: ({ column }) => getSortableHeader(column, t('table.paymentAmt'), 'right'),
			cell: ({ row }) => moneyCell(row.original.payment_amt, row.original.currency_code),
			footer: ({ column }) => {
				const rows = column.getFacetedRowModel().rows;
				const total = rows.reduce((acc: number, row: TableRow<SummSalePayment>) => acc + row.original.payment_amt, 0);
				return moneyCell(total, rows[0]?.original.currency_code ?? 'MYR');
			},
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'total_txns',
			header: ({ column }) => getSortableHeader(column, t('table.totalTxns'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('total_txns') as number),
			footer: ({ column }) => {
				const total = column.getFacetedRowModel().rows.reduce((acc: number, row: TableRow<SummSalePayment>) => acc + row.original.total_txns, 0);
				return numberCell(total);
			},
			...tableCellMeta.rightNumeric,
		},
	];
}
