import { UCheckbox, UIcon } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { ProductVariation } from '~/utils/types/product-variation';
import { getSortableHeader, headerCell } from './styles';

type TranslateFn = (key: string) => string;

export function getSelectableProductVariationColumns(t: TranslateFn): TableColumn<ProductVariation>[] {
	return [
		{
			id: 'select',
			header: ({ table }) =>
				h(UCheckbox, {
					'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
					'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
					'aria-label': t('table.selectAll'),
				}),
			cell: ({ row }) =>
				h(UCheckbox, {
					'modelValue': row.getIsSelected(),
					'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
					'aria-label': t('table.selectRow'),
				}),
		},
		{
			accessorKey: 'name',
			header: ({ column }) => getSortableHeader(column, t('table.optionName')),
			cell: ({ row }) => {
				const count = row.original.options?.length || 0;
				const valueLabel = count === 1 ? t('table.value') : t('table.values');
				return h('div', { class: 'flex flex-col gap-0.5' }, [
					h('p', { class: 'text-sm font-semibold text-highlighted' }, row.original.name),
					h('p', { class: 'text-xs text-muted' }, `${count} ${valueLabel}`),
				]);
			},
		},
		{
			accessorKey: 'values',
			header: () => headerCell(t('table.values')),
			cell: ({ row }) => {
				if (!row.original.options || row.original.options.length === 0) {
					return h('div', { class: 'flex items-center gap-1.5 text-xs text-warning' }, [
						h(UIcon, { name: 'i-heroicons-exclamation-triangle', class: 'w-3 h-3' }),
						h('span', t('table.noValues')),
					]);
				}

				return h(
					'div',
					{ class: 'flex flex-wrap gap-1.5' },
					row.original.options.map((value) =>
						h(
							'span',
							{ class: 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-default border border-border' },
							value.value,
						),
					),
				);
			},
		},
	];
}
