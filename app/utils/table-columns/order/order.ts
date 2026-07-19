import { Fragment, h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { getOrderStatusColor, OrderType, type UiBadgeColor } from 'yeppi-common';
import { UBadge, UIcon, UTooltip } from '#components';
import type { OrderHistory } from '~/utils/types/order-history';
import { getSortableHeader } from '../sortable';
import { headerCell, moneyCell, tableCellMeta } from '../styles';
import { getOrderStatusOption } from '~/utils/options/order-status';
import { formatCustomerNameEmail } from '~/utils/format-customer-name-email';
import { getFulfillmentMethodDescriptions } from '~/utils/fulfillment';

type TranslateFn = (key: string) => string;

/** Full-height left strip gradient by order status (matches status badge colors). */
const statusStripClassMap: Record<UiBadgeColor, string> = {
	primary: 'bg-gradient-to-r from-primary-500 to-transparent',
	secondary: 'bg-gradient-to-r from-secondary-500 to-transparent',
	success: 'bg-gradient-to-r from-success-500 to-transparent',
	warning: 'bg-gradient-to-r from-warning-500 to-transparent',
	error: 'bg-gradient-to-r from-error-500 to-transparent',
	info: 'bg-gradient-to-r from-info-500 to-transparent',
	neutral: 'bg-gradient-to-r from-gray-400 to-transparent dark:from-gray-500',
};

export function getOrderColumns(t: TranslateFn): TableColumn<OrderHistory>[] {
	return [
		{
			id: 'index',
			accessorFn: (_row, index) => index,
			enableSorting: false,
			header: () => headerCell(t('table.no'), 'center'),
			cell: ({ row }) => {
				const color = getOrderStatusColor(row.original.status) ?? 'neutral';
				const stripClass = statusStripClassMap[color] ?? statusStripClassMap.neutral;

				return h(Fragment, [
					h('div', {
						class: ['absolute inset-y-0 left-0 w-3 pointer-events-none', stripClass],
						'aria-hidden': 'true',
					}),
					h('span', { class: 'relative block text-center' }, row.index + 1),
				]);
			},
			meta: {
				class: {
					td: 'relative',
				},
			},
		},
		{
			id: 'order_no',
			accessorFn: (row) => (row.order_date_time ? new Date(row.order_date_time).getTime() : 0),
			header: ({ column }) => getSortableHeader(column, t('table.orderNo')),
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
			header: ({ column }) => getSortableHeader(column, t('table.orderType'), 'center'),
			cell: ({ row }) => {
				const orderType = row.original.order_type ?? OrderType.PICKUP;
				const isDelivery = orderType === OrderType.DELIVERY;
				const orderTypeLabel = isDelivery ? t('components.orderDetail.orderTypeDelivery') : t('components.orderDetail.orderTypePickup');
				const descriptions = getFulfillmentMethodDescriptions(row.original.fulfillments ?? []);
				const tooltipText = descriptions.length > 0 ? descriptions.join(', ') : orderTypeLabel;
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
			header: ({ column }) => getSortableHeader(column, t('table.customer')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-semibold text-highlighted' }, row.original.customer?.customer_no),
					h('p', { class: 'text-sm text-muted' }, formatCustomerNameEmail(row.original.customer?.name, row.original.customer?.email_address)),
				]);
			},
		},
		{
			accessorKey: 'status',
			header: ({ column }) => getSortableHeader(column, t('table.status'), 'center'),
			cell: ({ row }) => {
				const color = getOrderStatusColor(row.original.status) ?? 'neutral';
				const value = getOrderStatusOption(t, row.original.status)?.label;

				return h(UBadge, { class: 'capitalize', size: 'lg', variant: 'subtle', color }, () => value);
			},
			...tableCellMeta.center,
		},
		{
			accessorKey: 'gross_amt',
			header: ({ column }) => getSortableHeader(column, t('table.grossAmt'), 'right'),
			cell: ({ row }) => moneyCell(row.original.gross_amt ?? 0, row.original.currency.code),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'tax_amt_exc',
			header: ({ column }) => getSortableHeader(column, t('table.taxAmtExc'), 'right'),
			cell: ({ row }) => moneyCell(row.original.tax_amt_exc ?? 0, row.original.currency.code),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'net_amt',
			header: ({ column }) => getSortableHeader(column, t('table.netAmt'), 'right'),
			cell: ({ row }) => moneyCell(row.original.net_amt ?? 0, row.original.currency.code),
			...tableCellMeta.rightNumeric,
		},
	];
}
