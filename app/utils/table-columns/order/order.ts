import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { getOrderStatusColor, OrderStatus, OrderType } from 'yeppi-common';
import { UBadge, UIcon, UTooltip } from '#components';
import type { OrderHistory } from '~/utils/types/order-history';
import { headerCell, moneyCell, numberCell, tableCellMeta } from '../styles';

type TranslateFn = (key: string) => string;

export function getOrderColumns(t: TranslateFn): TableColumn<OrderHistory>[] {
	return [
		{
			id: 'index',
			accessorFn: (_row, index) => index,
			header: () => headerCell(t('table.no'), 'center'),
			cell: ({ row }) => numberCell(row.index + 1, 'center'),
		},
		{
			id: 'order_no',
			accessorFn: (row) => (row.order_date_time ? new Date(row.order_date_time).getTime() : 0),
			header: () => headerCell(t('table.orderNo')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-medium text-default' }, row.original.order_no),
					h('p', { class: 'text-sm text-muted' }, row.original.order_date_time),
				]);
			},
		},
		{
			id: 'order_type',
			accessorFn: (row) => ((row.order_type ?? OrderType.PICKUP) === OrderType.DELIVERY ? 1 : 0),
			header: () => headerCell(t('table.orderType'), 'center'),
			cell: ({ row }) => {
				const orderType = row.original.order_type ?? OrderType.PICKUP;
				const isDelivery = orderType === OrderType.DELIVERY;
				const orderTypeLabel = isDelivery ? t('components.orderDetail.orderTypeDelivery') : t('components.orderDetail.orderTypePickup');
				const description = row.original.shipping_method?.description?.trim();
				const tooltipText = description && description.length > 0 ? description : orderTypeLabel;
				const iconName = isDelivery ? 'i-heroicons-truck' : 'i-heroicons-building-storefront';

				return h(UTooltip, { text: tooltipText, popper: { placement: 'top' } }, () =>
					h(UIcon, {
						name: iconName,
						class: 'size-5 shrink-0 text-main',
					}),
				);
			},
			...tableCellMeta.center,
		},
		{
			id: 'customer',
			accessorFn: (row) => row.customer?.name ?? '',
			header: () => headerCell(t('table.customer')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-semibold text-highlighted' }, `${row.original.customer?.customer_no} | ${row.original.customer?.name}`),
					h('p', { class: 'text-sm text-muted' }, row.original.customer?.email_address),
				]);
			},
		},
		{
			accessorKey: 'status',
			header: () => headerCell(t('table.status'), 'center'),
			cell: ({ row }) => {
				const color = getOrderStatusColor(row.original.status) ?? 'neutral';

				const value = {
					[OrderStatus.COMPLETED]: t('options.completed'),
					[OrderStatus.PAID]: t('options.paid'),
					[OrderStatus.CANCELLED]: t('options.cancelled'),
					[OrderStatus.REFUNDED]: t('options.refunded'),
					[OrderStatus.PENDING_PAYMENT]: t('options.pendingPayment'),
					[OrderStatus.PROCESSING]: t('options.processing'),
					[OrderStatus.REQUIRES_ACTION]: t('options.requiresAction'),
				}[row.original.status as string];

				return h(UBadge, { class: 'capitalize', size: 'lg', variant: 'subtle', color }, () => value);
			},
			...tableCellMeta.center,
		},
		{
			accessorKey: 'gross_amt',
			header: () => headerCell(t('table.grossAmt'), 'right'),
			cell: ({ row }) => moneyCell(row.original.gross_amt ?? 0, row.original.currency.code),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'tax_amt_exc',
			header: () => headerCell(t('table.taxAmtExc'), 'right'),
			cell: ({ row }) => moneyCell(row.original.tax_amt_exc ?? 0, row.original.currency.code),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'net_amt',
			header: () => headerCell(t('table.netAmt'), 'right'),
			cell: ({ row }) => moneyCell(row.original.net_amt ?? 0, row.original.currency.code),
			...tableCellMeta.rightNumeric,
		},
	];
}
