import { getOrderStatusColor } from 'yeppi-common';
import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { UBadge } from '#components';
import type { Bill } from '~/utils/types/bill';
import { getSortableHeader } from '../sortable';
import { numberCell, primaryCell, tableCellMeta } from '../styles';

type TranslateFn = (key: string) => string;

export function getSaleColumns(t: TranslateFn): TableColumn<Bill>[] {
	return [
		{
			accessorKey: 'order_no',
			header: ({ column }) => getSortableHeader(column, t('table.orderNo')),
			cell: ({ row }) => primaryCell(row.getValue('order_no')),
		},
		{
			accessorKey: 'status',
			header: ({ column }) => getSortableHeader(column, t('table.status')),
			cell: ({ row }) => {
				const color = getOrderStatusColor(row.getValue('status') as string) ?? 'neutral';
				return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => row.getValue('status'));
			},
		},
		{
			accessorKey: 'gross_amt',
			header: ({ column }) => getSortableHeader(column, t('table.grossAmt'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('gross_amt') as number),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'net_total',
			header: ({ column }) => getSortableHeader(column, t('table.netAmt'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('net_total') as number),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'shipping_fee',
			header: ({ column }) => getSortableHeader(column, t('components.fulfillment.shippingFee'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('shipping_fee') as number),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'payable_total',
			header: ({ column }) => getSortableHeader(column, t('table.totalAmt'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('payable_total') as number),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'disc_amt',
			header: ({ column }) => getSortableHeader(column, t('table.discountAmt'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('disc_amt') as number),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'void_amt',
			header: ({ column }) => getSortableHeader(column, t('table.voidAmt'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('void_amt') as number),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'total_item_qty',
			header: ({ column }) => getSortableHeader(column, t('table.totalQty'), 'right'),
			cell: ({ row }) => numberCell(row.getValue('total_item_qty') as number),
			...tableCellMeta.rightNumeric,
		},
	];
}
