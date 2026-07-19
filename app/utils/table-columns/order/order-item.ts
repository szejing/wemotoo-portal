import type { ColumnDef } from '@tanstack/vue-table';
import { formatCurrency } from 'yeppi-common';
import { getSortableHeader, moneyCell, numberCell, primaryCell, tableCellMeta } from '../styles';

type TranslateFn = (key: string) => string;

export function getOrderItemColumns(t: TranslateFn): ColumnDef<any>[] {
	return [
		{
			accessorKey: 'prod_code',
			header: ({ column }) => getSortableHeader(column, t('table.prodCode')),
			cell: ({ row }) => primaryCell(row.getValue('prod_code')),
		},
		{
			accessorKey: 'prod_name',
			header: ({ column }) => getSortableHeader(column, t('table.prodName')),
			cell: ({ row }) => primaryCell(row.getValue('prod_name')),
		},
		{
			accessorKey: 'status',
			header: ({ column }) => getSortableHeader(column, t('table.itemStatus')),
			cell: ({ row }) => primaryCell(row.getValue('status')),
		},
		{
			accessorKey: 'order_qty',
			header: ({ column }) => getSortableHeader(column, t('table.qty'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('order_qty') as number),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'gross_amt',
			header: ({ column }) => getSortableHeader(column, t('table.grossAmt'), 'right'),
			cell: ({ row }) => moneyCell(row.getValue('gross_amt') as number, row.getValue('currency_code') as string),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'net_amt',
			header: ({ column }) => getSortableHeader(column, t('table.netAmt'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('net_amt') as number),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'total_amt',
			header: ({ column }) => getSortableHeader(column, t('table.totalAmt'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('total_amt') as number),
			...tableCellMeta.rightNumeric,
		},
	];
}
