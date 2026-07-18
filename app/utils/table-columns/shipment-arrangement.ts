import { h } from 'vue';
import { getFormattedDate } from 'yeppi-common';
import type { TableColumn } from '@nuxt/ui';
import { UBadge } from '#components';
import type { ShipmentArrangementListRow, ShipmentArrangementPreviewRow } from '~/utils/types/shipment-arrangement';
import { headerCell } from './styles';

type TranslateFn = (key: string) => string;

export function getShipmentArrangementColumns(t: TranslateFn): TableColumn<ShipmentArrangementListRow>[] {
	return [
		{
			accessorKey: 'order_no',
			header: () => headerCell(t('shipmentArrangement.table.order')),
			cell: ({ row }) => h('span', { class: 'font-semibold text-default' }, row.original.order_no),
		},
		{
			accessorKey: 'batch_no',
			header: () => headerCell(t('shipmentArrangement.table.batch')),
			cell: ({ row }) => h('span', { class: 'font-medium text-default' }, `#${row.original.batch_no}`),
		},
		{
			accessorKey: 'ordered_at',
			header: () => headerCell(t('shipmentArrangement.table.ordered')),
			cell: ({ row }) => h('span', { class: 'whitespace-nowrap text-muted' }, getFormattedDate(new Date(row.original.ordered_at), 'dd-MM-yyyy HH:mm')),
		},
		{
			accessorKey: 'recipient',
			header: () => headerCell(t('shipmentArrangement.table.recipient')),
			cell: ({ row }) => h('span', { class: 'font-medium text-default' }, row.original.recipient),
		},
		{
			accessorKey: 'destination',
			header: () => headerCell(t('shipmentArrangement.table.destination')),
			cell: ({ row }) => h('span', { class: 'block min-w-48 whitespace-normal text-muted' }, row.original.destination),
		},
		{
			accessorKey: 'shipping_method',
			header: () => headerCell(t('shipmentArrangement.table.shippingMethod')),
			cell: ({ row }) => h(UBadge, { color: 'secondary', variant: 'soft', label: row.original.shipping_method }),
		},
	];
}

export function getShipmentArrangementPreviewColumns(t: TranslateFn): TableColumn<ShipmentArrangementPreviewRow>[] {
	return [
		{ accessorKey: 'row_number', header: () => headerCell(t('shipmentArrangement.table.row')) },
		{ accessorKey: 'order_no', header: () => headerCell(t('shipmentArrangement.table.order')) },
		{
			accessorKey: 'batch_no',
			header: () => headerCell(t('shipmentArrangement.table.batch')),
			cell: ({ row }) => h('span', { class: 'font-medium' }, `#${row.original.batch_no}`),
		},
		{ accessorKey: 'courier', header: () => headerCell(t('shipmentArrangement.table.courier')) },
		{ accessorKey: 'tracking_no', header: () => headerCell(t('shipmentArrangement.table.tracking')) },
		{
			accessorKey: 'status',
			header: () => headerCell(t('shipmentArrangement.table.result')),
			cell: ({ row }) =>
				h('div', { class: 'min-w-48 space-y-1' }, [
					h(
						UBadge,
						{
							color: row.original.status === 'error' ? 'error' : row.original.status === 'warning' ? 'warning' : 'success',
							variant: 'soft',
							label: t(`shipmentArrangement.preview.rowStatus.${row.original.status}`),
						},
					),
					...row.original.messages.map((message) => h('p', { class: 'whitespace-normal text-xs text-muted' }, message)),
				]),
		},
	];
}
