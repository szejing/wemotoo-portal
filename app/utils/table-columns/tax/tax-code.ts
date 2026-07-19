import { UBadge, USwitch } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { Tax } from '~/utils/types/tax';
import { getSortableHeader, headerCell } from '../styles';

type TranslateFn = (key: string) => string;

export function getTaxCodeColumns(t: TranslateFn): TableColumn<Tax>[] {
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
			accessorKey: 'type',
			header: () => headerCell(t('table.taxType')),
			cell: ({ row }) => {
				return h(UBadge, { color: row.original.is_inclusive ? 'primary' : 'warning', variant: 'subtle' }, () =>
					row.original.is_inclusive ? t('table.inclusive') : t('table.exclusive'),
				);
			},
		},
		{
			accessorKey: 'is_active',
			header: () => headerCell(t('table.active')),
			cell: ({ row }) => {
				const taxStore = useTaxStore();
				return h(USwitch, {
					'class': 'size-5',
					'modelValue': row.original.is_active,
					'disabled': false,
					'onUpdate:modelValue': (value: boolean) => taxStore.updateStatus(row.original, value),
				});
			},
		},
	];
}
