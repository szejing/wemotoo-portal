import type { TableColumn } from '@nuxt/ui';
import { getSortableHeader, headerCell, numberCell } from '../styles';

type TranslateFn = (key: string) => string;

export function getPaymentTypeGroupColumns(t: TranslateFn): TableColumn<any>[] {
	return [
		{
			accessorKey: 'index',
			header: () => headerCell(t('table.no')),
			cell: ({ row }) => numberCell(row.index + 1),
		},
		{
			accessorKey: 'code',
			header: ({ column }) => getSortableHeader(column, t('table.groupCode')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-semibold text-sm text-highlighted' }, row.original.short_desc),
					h('p', { class: 'text-xs text-muted font-mono italic' }, row.original.code),
				]);
			},
		},
	];
}
