import type { TableColumn } from '@nuxt/ui';
import type { Tag } from '~/utils/types/tag';
import { UBadge } from '#components';
import { getSortableHeader, tableCellMeta } from './styles';

type TranslateFn = (key: string) => string;

export function getTagColumns(t: TranslateFn): TableColumn<Tag>[] {
	return [
		{
			accessorKey: 'value',
			header: ({ column }) => getSortableHeader(column, t('table.description')),
			cell: ({ row }) => {
				const statusDot = h('span', {
					class: ['inline-block size-2 rounded-full flex-shrink-0', row.original.is_active !== false ? 'bg-success-500' : 'bg-neutral-300 dark:bg-neutral-600'],
					title: row.original.is_active !== false ? t('common.active') : t('common.inactive'),
				});

				return h('div', { class: 'flex-1 min-w-0' }, [
					h('div', { class: 'flex items-center gap-1.5' }, [
						statusDot,
						h('span', { class: 'font-semibold text-sm text-highlighted' }, row.original.value),
					]),
				]);
			},
		},
		{
			accessorKey: 'total_products',
			header: ({ column }) => getSortableHeader(column, t('table.noOfItems'), 'right'),
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
