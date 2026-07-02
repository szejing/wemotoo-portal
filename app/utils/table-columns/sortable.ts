import type { Column } from '@tanstack/vue-table';
import { h, resolveComponent } from 'vue';
import { TABLE_ALIGN_RIGHT, type TableCellAlign } from './styles';

export function getSortableHeader<TData>(column: Column<TData, unknown>, label: string, align: TableCellAlign = 'left') {
	const isSorted = column.getIsSorted();
	const icon = isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down';

	return h(
		'button',
		{
			type: 'button',
			class: [
				'inline-flex items-center gap-1 text-default hover:text-highlighted',
				align === 'right' ? `${TABLE_ALIGN_RIGHT} w-full justify-end` : undefined,
			],
			onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
		},
		[h('span', label), h(resolveComponent('UIcon'), { name: icon, class: 'size-3.5 shrink-0 text-muted' })],
	);
}
