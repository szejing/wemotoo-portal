import type { ColumnDef } from '@tanstack/vue-table';
import type { Affiliate } from '~/utils/types/affiliate';
import { getSortableHeader, headerCell, mutedCell, numberCell, primaryCell, tableCellMeta } from './styles';

type TranslateFn = (key: string) => string;

export function getAffiliateColumns(t: TranslateFn): ColumnDef<Affiliate>[] {
	return [
		{
			accessorKey: 'row_index',
			header: () => headerCell('', 'center'),
			cell: ({ row }) => numberCell(row.index + 1),
		},
		{
			accessorKey: 'slug',
			header: ({ column }) => getSortableHeader(column, t('affiliate.slug')),
			cell: ({ row }) => {
				const a = row.original;
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-semibold text-highlighted' }, a.slug || '—'),
					h('p', { class: 'text-sm text-muted' }, a.user_id),
				]);
			},
		},
		{
			accessorKey: 'tier',
			header: () => headerCell(t('affiliate.tier')),
			cell: ({ row }) => {
				const tier = row.original.tier;
				return tier?.name ? h('p', { class: 'text-sm text-default' }, tier.name) : mutedCell();
			},
		},
		{
			accessorKey: 'total_referrals_count',
			header: ({ column }) => getSortableHeader(column, t('affiliate.referrals'), 'right'),
			cell: ({ row }) => numberCell(row.original.total_referrals_count ?? 0),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'current_balance',
			header: ({ column }) => getSortableHeader(column, t('affiliate.balance'), 'right'),
			cell: ({ row }) => numberCell(row.original.current_balance ?? 0),
			...tableCellMeta.rightNumeric,
		},
		{
			accessorKey: 'created_at',
			header: ({ column }) => getSortableHeader(column, t('affiliate.createdAt')),
			cell: ({ row }) => {
				const date = row.original.created_at;
				const str = date ? new Date(date).toLocaleDateString() : '—';
				return h('p', { class: 'text-sm text-muted' }, str);
			},
		},
	];
}
