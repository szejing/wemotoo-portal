import type { TableColumn } from '@nuxt/ui';
import { UBadge, UButton } from '#components';
import type { Category } from '~/utils/types/category';
import { getSortableHeader, headerCell, numberCell, tableCellMeta } from './styles';

type TranslateFn = (key: string) => string;

export function getCategoryColumns(t: TranslateFn): TableColumn<Category>[] {
	return [
		{
			accessorKey: 'code',
			header: ({ column }) => getSortableHeader(column, t('table.code')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-semibold text-sm text-highlighted' }, row.original.description),
					h('p', { class: 'text-xs text-muted font-mono italic' }, row.original.code),
				]);
			},
		},
		{
			accessorKey: 'total_items',
			header: () => headerCell(t('table.noOfItems'), 'right'),
			cell: ({ row }) => numberCell(row.original.total_products ?? 0),
			...tableCellMeta.rightNumeric,
		},
	];
}

/** Columns for tree table: expand + indent, then code, then count. */
export function getCategoryTreeColumns(t: TranslateFn): TableColumn<Category>[] {
	return [
		{
			id: 'category',
			header: () => headerCell(t('table.code')),
			cell: ({ row }) => {
				const depth = row.depth;
				const isParent = row.getCanExpand();
				const isExpanded = row.getIsExpanded();
				const isRoot = depth === 0;

				// Typography weight/color
				const nameClass = 'font-semibold text-sm text-highlighted';
				const descClass = 'text-xs text-muted font-mono italic';

				// Active/inactive dot
				const statusDot = h('span', {
					class: ['inline-block size-2 rounded-full flex-shrink-0', row.original.is_active !== false ? 'bg-success-500' : 'bg-neutral-300 dark:bg-neutral-600'],
					title: row.original.is_active !== false ? t('common.active') : t('common.inactive'),
				});

				return h(
					'div',
					{
						style: { paddingLeft: `${depth * 1.5}rem` },
						class: 'flex items-center gap-2 py-0.5',
					},
					[
						// Expand/collapse chevron (or spacer for leaves)
						isParent
							? h(UButton, {
									color: isExpanded ? 'primary' : 'neutral',
									variant: 'ghost',
									size: 'xs',
									icon: isExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right',
									ui: {
										base: 'p-0.5 rounded transition-transform duration-150',
										leadingIcon: 'size-4',
									},
									onClick: (e: Event) => {
										e.stopPropagation();
										row.getToggleExpandedHandler()();
									},
								})
							: h('span', { class: 'w-6' }),

						// Thumbnail (if available)
						row.original.thumbnail?.url
							? h('img', {
									src: row.original.thumbnail.url,
									alt: row.original.code,
									class: 'size-8 rounded object-cover flex-shrink-0 border border-default',
								})
							: null,

						// Description (primary), code (secondary), badges
						h('div', { class: 'flex-1 min-w-0' }, [
							h('div', { class: 'flex items-center gap-1.5' }, [statusDot, h('span', { class: nameClass }, row.original.description || row.original.code)]),
							h('p', { class: `truncate ${descClass}` }, row.original.code),
						]),
					],
				);
			},
		},
		{
			accessorKey: 'total_products',
			header: () => headerCell(t('table.noOfItems'), 'right'),
			...tableCellMeta.rightNumeric,
			cell: ({ row }) => {
				const count = row.original.total_products ?? 0;
				return h(
					UBadge,
					{
						variant: 'subtle',
						color: count > 0 ? 'primary' : 'neutral',
						size: 'lg',
					},
					() => String(count),
				);
			},
		},
	];
}
