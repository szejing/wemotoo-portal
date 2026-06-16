import type { TableColumn } from '@nuxt/ui';
import type { ItemModel } from '~/utils/models/item.model';
import { tableCellMeta } from '../styles';

type TranslateFn = (key: string) => string;

export function getOrderDetailItemColumns(t: TranslateFn): TableColumn<ItemModel>[] {
	return [
		{
			id: 'item',
			accessorKey: 'prod_code',
			header: t('components.orderDetail.item'),
			meta: {
				class: {
					th: 'text-left',
					td: 'text-left max-w-md min-w-[12rem]',
				},
			},
		},
		{
			id: 'unitSellPrice',
			accessorKey: 'unit_sell_price',
			header: t('components.orderDetail.unitPrice'),
			...tableCellMeta.center,
		},
		{
			accessorKey: 'qty',
			header: t('components.orderDetail.qty'),
			...tableCellMeta.center,
		},
		{
			id: 'lineTotal',
			accessorKey: 'net_amt',
			header: t('components.orderDetail.price'),
			...tableCellMeta.center,
		},
	];
}
