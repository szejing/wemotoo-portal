/* eslint-disable indent */
import { UBadge } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { TaxRule } from '~/utils/types/tax-rule';
import type { TaxRuleDetail } from '~/utils/types/tax-rule-detail';
import { getSortableHeader, headerCell } from '../styles';

type TranslateFn = (key: string) => string;

function getAmountTypeLabel(amountType: string, t: TranslateFn): string {
	const keyMap: Record<string, string> = {
		gross_amount: 'table.grossAmt',
		net_amount: 'table.netAmt',
	};
	return keyMap[amountType] ? t(keyMap[amountType]) : amountType;
}

export function getTaxRuleColumns(t: TranslateFn): TableColumn<TaxRule>[] {
	return [
		{
			accessorKey: 'code',
			header: ({ column }) => getSortableHeader(column, t('table.code')),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1' }, [
					h('p', { class: 'font-semibold text-highlighted' }, row.getValue('code')),
					h('p', { class: 'text-sm text-muted' }, row.getValue('description')),
				]);
			},
		},
		{
			accessorKey: 'details',
			header: () => headerCell(t('table.details')),
			cell: ({ row }) => {
				const details: TaxRuleDetail[] = row.original.details;

				if (!details || details.length === 0) {
					return h('div', { class: 'flex flex-col gap-3' }, [
						h('div', { class: 'text-xs text-muted' }, t('table.noDetailsConfigured')),
					]);
				}

				return h('div', { class: 'flex flex-col gap-3 text-default' }, [
					h(
						'div',
						{ class: 'space-y-3' },
						details.map((detail) =>
							h('div', { class: 'text-sm' }, [
								h('div', { class: 'border-l-2 border-border pl-2 space-y-1' }, [
									h('p', { class: 'font-semibold text-highlighted' }, `${detail.tax?.description} - ${detail.description}`),
									detail.tax_condition
										? h('div', { class: 'flex items-center gap-2 mt-2' }, [
												h(UBadge, {
													label: getAmountTypeLabel(detail.tax_condition.amount_type, t),
													variant: 'soft',
													size: 'md',
												}),
												h(UBadge, {
													label: `${detail.tax_condition.rate}%`,
													variant: 'soft',
													color: 'success',
													size: 'md',
												}),
											])
										: null,
								]),
							]),
						),
					),
				]);
			},
		},
	];
}
