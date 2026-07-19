import type { ColumnDef } from '@tanstack/vue-table';
import type { Customer } from '~/utils/types/customer';
import { getSortableHeader, headerCell, numberCell, primaryCell, tableCellMeta } from './styles';

type TranslateFn = (key: string) => string;

export function getCustomerColumns(t: TranslateFn): ColumnDef<Customer>[] {
	return [
		{
			accessorKey: 'row_index',
			header: () => headerCell('', 'center'),
			cell: ({ row }) => numberCell(row.index + 1, 'center'),
			...tableCellMeta.center,
		},
		{
			accessorKey: 'name',
			header: ({ column }) => getSortableHeader(column, t('table.name')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1 items-start min-w-0' }, [
					h('p', { class: 'font-semibold text-highlighted' }, row.original.customer_no),
					h('p', { class: 'text-sm text-muted' }, row.original.name),
				]);
			},
		},
		{
			accessorKey: 'email_address',
			header: ({ column }) => getSortableHeader(column, t('table.email')),
			cell: ({ row }) => primaryCell(row.original.email_address),
		},
		{
			accessorKey: 'phone_number',
			header: () => headerCell(t('table.phone')),
			cell: ({ row }) => {
				return h('p', { class: 'text-sm text-muted' }, `(${row.original.dial_code}) ${row.original.phone_no}`);
			},
		},
	];
}
