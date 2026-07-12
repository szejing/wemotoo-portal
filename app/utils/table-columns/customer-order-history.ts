import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { formatCurrency, OrderStatus } from 'yeppi-common';
import { UBadge, UIcon } from '#components';
import type { OrderHistory } from '~/utils/types/order-history';
import type { ItemModel } from '~/utils/models';
import { getSortableHeader } from './sortable';
import { headerCell, moneyCell, mutedCell, tableCellMeta } from './styles';
import { getOrderStatusColor } from '../options';
import { getOrderStatusOption } from '../options/order-status';

type TranslateFn = (key: string) => string;

export function getCustomerOrderHistoryColumns(
	t: TranslateFn,
	formatOrderItemsSummary: (items: ItemModel[] | undefined) => string,
): TableColumn<OrderHistory>[] {
	return [
		{
			id: 'order_no',
			accessorKey: 'order_no',
			accessorFn: (row) => (row.order_date_time ? new Date(row.order_date_time).getTime() : 0),
			header: ({ column }) => getSortableHeader(column, t('table.orderNo')),
			cell: ({ row }) => {
				const d = row.original.order_date_time;
				let dateLabel = '—';
				if (d) {
					try {
						const date = typeof d === 'string' ? new Date(d) : d;
						dateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
					} catch {
						dateLabel = String(d);
					}
				}

				return h('div', { class: 'flex flex-col gap-0.5' }, [
					h('span', { class: 'font-medium text-default' }, `#${row.original.order_no}`),
					h('span', { class: 'text-sm text-muted' }, dateLabel),
				]);
			},
		},
		{
			id: 'items',
			header: () => headerCell(t('table.items')),
			cell: ({ row }) => h('span', { class: 'text-default' }, formatOrderItemsSummary(row.original.items)),
		},
		{
			id: 'order_status',
			accessorKey: 'order_status',
			header: ({ column }) => getSortableHeader(column, t('table.orderStatus')),
			cell: ({ row }) => {
				const status = row.original.status;

				if (!status) return mutedCell();

				return h(
					UBadge,
					{ variant: 'subtle', color: getOrderStatusColor(status) ?? 'neutral', class: 'capitalize' },
					() => getOrderStatusOption(t, status)?.label,
				);
			},
		},
		{
			id: 'net_total',
			accessorKey: 'net_total',
			accessorFn: (row) => row.net_total ?? 0,
			header: ({ column }) => getSortableHeader(column, t('table.totalAmt'), 'right'),
			cell: ({ row }) => {
				const o = row.original;
				const code = o.currency?.code ?? 'MYR';
				return moneyCell(o.net_total ?? 0, code);
			},
			...tableCellMeta.rightNumeric,
		},
	];
}
