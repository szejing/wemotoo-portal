import type { TableColumn } from '@nuxt/ui';
import type { Outlet } from '~/utils/types/outlet';
import { getSortableHeader, headerCell } from './styles';

type TranslateFn = (key: string) => string;

export function getOutletColumns(t: TranslateFn): TableColumn<Outlet>[] {
	return [
		{
			accessorKey: 'code',
			header: ({ column }) => getSortableHeader(column, t('table.code')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-semibold text-highlighted' }, row.original.code),
					h('p', { class: 'text-sm text-muted' }, row.original.description),
				]);
			},
		},
		{
			accessorKey: 'address',
			header: () => headerCell(t('table.address')),
			cell: ({ row }) => {
				const address = [row.original.address1, row.original.address2, row.original.address3].filter(Boolean).join(', ');
				const city = [row.original.city, row.original.postal_code, row.original.state, row.original.country_code].filter(Boolean).join(', ');
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'text-sm text-default' }, address),
					h('p', { class: 'text-sm text-muted' }, city),
				]);
			},
		},
	];
}
