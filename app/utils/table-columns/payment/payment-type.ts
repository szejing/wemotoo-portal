import type { TableColumn } from '@nuxt/ui';
import type { PaymentType } from '~/utils/types/payment-type';
import { getSortableHeader, mutedCell, primaryCell } from '../styles';

type TranslateFn = (key: string) => string;

export function getPaymentTypeColumns(t: TranslateFn): TableColumn<PaymentType>[] {
	return [
		{
			accessorKey: 'code',
			header: ({ column }) => getSortableHeader(column, t('table.code')),
			cell: ({ row }) => primaryCell(row.original.code),
		},
		{
			accessorKey: 'desc',
			header: ({ column }) => getSortableHeader(column, t('table.description')),
			cell: ({ row }) => h('div', { class: 'text-sm text-default' }, row.original.desc),
		},
		{
			accessorKey: 'short_desc',
			header: ({ column }) => getSortableHeader(column, t('table.shortDescription')),
			cell: ({ row }) => (row.original.short_desc ? h('div', { class: 'text-sm text-muted' }, row.original.short_desc) : mutedCell()),
		},
	];
}
