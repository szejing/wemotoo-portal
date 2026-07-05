/* eslint-disable indent */
import type { TableColumn } from '@nuxt/ui';
import type { Product } from '~/utils/types/product';
import type { PriceInput } from '../types/price';
import { UBadge, USwitch } from '#components';
import { formatCurrency, getFormattedDate, ProductType } from 'yeppi-common';
import { getSortableHeader } from './sortable';
import { mutedCell, tableCellMeta } from './styles';

type TranslateFn = (key: string) => string;

export function getProductColumns(t: TranslateFn): TableColumn<Product>[] {
	return [
		{
			accessorKey: 'name',
			header: ({ column }) => getSortableHeader(column, t('table.codeAndName')),
			meta: {
				class: {
					th: 'text-left max-w-sm',
					td: 'text-left max-w-sm min-w-[12rem]',
				},
			},
			cell: ({ row }) => {
				const thumbnailUrl = row.original.thumbnail?.url;
				const variants = row.original.variants;

				const statusDot = h('span', {
					class: ['inline-block size-2 rounded-full flex-shrink-0', row.original.is_active !== false ? 'bg-success-500' : 'bg-neutral-300 dark:bg-neutral-600'],
					title: row.original.is_active !== false ? t('common.active') : t('common.inactive'),
				});

				const variantBadge =
					variants && variants.length > 0
						? variants.map((variant) => h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'info' }, () => variant.name || variant.variant_code))
						: [];

				const children: any[] = [
					thumbnailUrl
						? h('img', { src: thumbnailUrl, alt: row.original.name || t('table.productThumbnail'), class: 'w-10 h-10 rounded-md object-cover flex-shrink-0' })
						: h('img', {
								src: '/svg/product-holder.svg',
								alt: row.original.name || t('table.productThumbnail'),
								class: 'w-10 h-10 rounded-md object-cover flex-shrink-0',
							}),
					h('div', { class: 'flex-1 min-w-0' }, [
						h('div', { class: 'flex items-center gap-1.5 min-w-0' }, [
							statusDot,
							h('span', { class: 'font-semibold text-sm text-highlighted truncate', title: row.original.name ?? undefined }, row.original.name),
						]),
						h('div', { class: 'text-xs text-muted font-mono italic truncate', title: row.original.code ?? undefined }, row.original.code),
						variantBadge.length > 0 ? h('div', { class: 'mt-1 flex flex-wrap items-center gap-1' }, [...variantBadge]) : null,
					]),
				];

				return h('div', { class: 'flex items-start gap-3' }, children);
			},
		},
		{
			accessorKey: 'type',
			header: ({ column }) => getSortableHeader(column, t('table.type')),
			cell: ({ row }) => {
				const productTypeStore = useProductTypeStore();
				const kind = row.original.type;

				let typeLabel: string;
				if (typeof kind === 'string') {
					const byKind = productTypeStore.prod_types.find((pt) => pt.value === kind);
					typeLabel = byKind?.value ?? kind;
				} else {
					typeLabel = kind != null ? `Type ${kind}` : '—';
				}

				const metadata = row.original.metadata as { duration?: string } | undefined;
				const duration = metadata?.duration;

				let isService = false;
				if (typeof kind === 'string') {
					isService = kind === ProductType.SERVICE;
				}

				isService ||= typeof typeLabel === 'string' && typeLabel.toLowerCase().includes('service');

				const typeColors = ['primary', 'success', 'warning', 'error', 'info', 'secondary'] as const;
				let badgeColor: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'neutral' = 'neutral';

				if (typeof kind === 'string') {
					const badgeColorIdx = Object.values(ProductType).indexOf(kind as ProductType);
					if (badgeColorIdx >= 0) {
						const picked = typeColors[badgeColorIdx % typeColors.length];
						if (picked !== undefined) {
							badgeColor = picked;
						}
					}
				}

				const children: ReturnType<typeof h>[] = [h(UBadge, { class: 'capitalize', variant: 'subtle', color: badgeColor }, () => typeLabel)];
				if (isService && duration) {
					children.push(h(UBadge, { class: 'mt-1', variant: 'subtle', color: 'info', size: 'sm' }, () => `${t('table.duration')}: ${duration}`));
				}
				return h('div', { class: 'flex flex-col items-start gap-1' }, children);
			},
		},
		{
			accessorKey: 'is_active',
			header: ({ column }) => getSortableHeader(column, t('table.status')),
			cell: ({ row }) => {
				const productStore = useProductStore();
				return h(
					'div',
					{
						class: 'flex items-center gap-2 leading-none',
						onClick: (e: Event) => e.stopPropagation(),
					},
					[
						h(USwitch, {
							'class': 'size-4 cursor-pointer',
							'modelValue': row.original.is_active,
							'disabled': false,
							'onUpdate:modelValue': (value: unknown) => void productStore.updateStatus(row.original, value === true),
						}),
					],
				);
			},
		},
		{
			accessorKey: 'updated_at',
			header: ({ column }) => getSortableHeader(column, t('table.lastUpdated')),
			cell: ({ row }) => {
				if (!row.original.updated_at) return mutedCell('—');
				const dateStr = getFormattedDate(row.original.updated_at, 'dd/MM/yyyy');
				const timeStr = getFormattedDate(row.original.updated_at, 'hh:mm a');
				return h('div', { class: 'flex flex-col gap-0.5 text-sm text-muted' }, [h('div', {}, timeStr), h('div', {}, dateStr)]);
			},
		},
		{
			id: 'price_types',
			accessorFn: (row) => {
				const priceType = row.price_types?.[0];
				if (!priceType) return 0;

				return priceType.sale_price != null && priceType.sale_price > 0 ? priceType.sale_price : (priceType.orig_sell_price ?? 0);
			},
			header: ({ column }) => getSortableHeader(column, t('table.price'), 'right'),
			cell: ({ row }) => {
				const price_types: PriceInput[] | undefined = row.original.price_types;
				const pt = price_types?.[0];
				if (!pt) return mutedCell('—');

				const hasSalePrice = pt.sale_price != null && pt.sale_price > 0;
				const sellingFormatted = pt.orig_sell_price != null ? formatCurrency(pt.orig_sell_price, pt.currency_code) : 'N/A';
				const saleFormatted = hasSalePrice ? formatCurrency(pt.sale_price!, pt.currency_code) : null;

				if (hasSalePrice && saleFormatted) {
					return h('div', { class: 'flex flex-col gap-0.5' }, [
						h('span', { class: 'text-sm font-semibold text-green-600 dark:text-green-400' }, saleFormatted),
						h('span', { class: 'text-xs text-muted line-through' }, sellingFormatted),
					]);
				}

				return h('div', { class: 'flex flex-col' }, [h('span', { class: 'text-sm font-semibold text-default' }, sellingFormatted)]);
			},
			...tableCellMeta.rightNumeric,
		},
	];
}
