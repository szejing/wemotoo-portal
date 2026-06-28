/* eslint-disable indent */
import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { formatCurrency } from 'yeppi-common';
import { parsePricingSummarySegments } from '~/utils/shipping-zone-pricing-summary';
import { UBadge, USwitch } from '#components';
import type { ShippingZone } from '../types/shipping-zone';
import { headerCell, mutedCell } from './styles';

type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

const DEFAULT_ZONE_CURRENCY = 'MYR';

export function getShippingZoneColumns(t: TranslateFn): TableColumn<ShippingZone>[] {
	return [
		{
			id: 'code_description',
			accessorKey: 'code',
			header: () => headerCell(`${t('common.code')} / ${t('common.description')}`),
			cell: ({ row }) => {
				const code = row.original.code?.trim();
				const description = row.original.description?.trim();
				const children: ReturnType<typeof h>[] = [];
				if (code) {
					children.push(
						h(
							UBadge,
							{
								variant: 'subtle',
								color: 'neutral',
								size: 'sm',
								class: 'shrink-0 font-mono uppercase tracking-wide',
							},
							() => code,
						),
					);
				} else {
					children.push(mutedCell());
				}
				if (description) {
					children.push(h('span', {}, description));
				}
				const orderCutoffTime = row.original.methods?.find((method) => method.order_cutoff_time?.trim())?.order_cutoff_time?.trim();
				if (orderCutoffTime) {
					children.push(h('p', { class: 'text-xs text-muted tabular-nums' }, t('components.shippingZoneForm.reviewCutoffSuffix', { time: orderCutoffTime })));
				}
				return h('div', { class: 'flex flex-col gap-1 items-start min-w-0' }, children);
			},
		},
		{
			id: 'region',
			header: () => headerCell(t('table.shippingZoneRegion')),
			cell: ({ row }) => {
				const z = row.original;
				const state = z.state?.trim();
				const country = z.country_code?.trim() ?? '';
				if (!state && !country) {
					return mutedCell();
				}
				const regionParts: ReturnType<typeof h>[] = [];
				if (country) {
					regionParts.push(
						h(
							UBadge,
							{
								variant: 'subtle',
								color: 'neutral',
								size: 'sm',
								class: 'shrink-0 font-mono uppercase tracking-wide',
							},
							() => country,
						),
					);
				}
				if (state) {
					regionParts.push(h('span', { class: 'text-sm font-medium text-default leading-snug min-w-0' }, state));
				}
				return h('div', { class: 'flex items-start gap-2 min-w-0' }, regionParts);
			},
		},
		{
			id: 'pricing_summary',
			header: () => headerCell(t('table.shippingZonePricing')),
			cell: ({ row }) => {
				const text = row.original.methods?.[0]?.fee.toFixed(2);
				if (!text) {
					return mutedCell();
				}
				const segments = parsePricingSummarySegments(text);
				if (segments.length === 0) {
					return mutedCell();
				}
				return h(
					'div',
					{
						class: 'flex flex-col gap-1 items-start min-w-0',
					},
					segments.map((seg) => {
						const amount = formatCurrency(seg.fee, DEFAULT_ZONE_CURRENCY);
						if (!seg.label) {
							return h('span', { class: 'text-sm font-medium tabular-nums text-default' }, amount);
						}
						return h(
							'div',
							{
								class: 'flex w-fit max-w-full items-baseline gap-2 text-sm',
							},
							[
								h('span', { class: 'min-w-0 break-words text-sm text-muted' }, seg.label),
								h('span', { class: 'font-medium tabular-nums text-default shrink-0' }, amount),
							],
						);
					}),
				);
			},
		},
		{
			accessorKey: 'is_active',
			header: () => headerCell(t('common.status')),
			cell: ({ row }) => {
				const zoneStore = useShippingZoneStore();
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
							'onUpdate:modelValue': (value: unknown) => {
								void zoneStore.updateZoneStatus(row.original, value === true);
							},
						}),
					],
				);
			},
		},
	];
}
