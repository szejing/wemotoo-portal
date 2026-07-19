import type { TableColumn } from '@nuxt/ui';
import type { ProductVariation } from '~/utils/types/product-variation';
import { UBadge } from '#components';
import { getSortableHeader, headerCell, mutedCell } from './styles';

type TranslateFn = (key: string) => string;

export function getProductVariationColumns(t: TranslateFn): TableColumn<ProductVariation>[] {
	return [
		{
			accessorKey: 'name',
			header: ({ column }) => getSortableHeader(column, t('table.name')),
			cell: ({ row }) => {
				return h('p', { class: 'font-semibold text-highlighted' }, row.original.name);
			},
		},
		{
			accessorKey: 'options',
			header: () => headerCell(t('table.options')),
			cell: ({ row }) => {
				if (row.original.options.length === 0) {
					return h('div', { class: 'flex justify-center' }, [mutedCell(t('table.noOptions'))]);
				}

				return h(
					'div',
					{ class: 'flex justify-center flex-wrap gap-1' },
					row.original.options.map((value) => h(UBadge, { variant: 'subtle', color: 'info' }, () => value.value)),
				);
			},
		},
	];
}
