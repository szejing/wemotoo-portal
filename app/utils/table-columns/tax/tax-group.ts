import type { TableColumn } from '@nuxt/ui';
import type { TaxGroup } from '~/utils/types/tax-group';
import { getSortableHeader, headerCell, primaryCell } from '../styles';

type TranslateFn = (key: string) => string;

export function getTaxGroupColumns(t: TranslateFn): TableColumn<TaxGroup>[] {
	return [
		{
			accessorKey: 'code',
			header: ({ column }) => getSortableHeader(column, t('table.code')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-semibold text-highlighted' }, row.getValue('code')),
					h('p', { class: 'text-sm text-muted' }, row.getValue('description')),
				]);
			},
		},
		{
			accessorKey: 'taxes',
			header: () => headerCell(t('table.taxes')),
			cell: ({ row }) => primaryCell(row.getValue('taxes')),
		},
	];
}
