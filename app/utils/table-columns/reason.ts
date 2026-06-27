/* eslint-disable indent */
import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { ReasonType } from 'yeppi-common';
import { UBadge, USwitch } from '#components';
import type { Reason } from '~/utils/types/reason';
import { headerCell } from './styles';

type TranslateFn = (key: string) => string;

const typeLabel = (t: TranslateFn, type: ReasonType) => {
	if (type === ReasonType.RETURN_EXCHANGE) {
		return t('options.reasonType.returnExchange');
	}
	if (type === ReasonType.CANCEL_ORDER) {
		return t('options.reasonType.cancelOrder');
	}
	return type;
};

export function getReasonColumns(t: TranslateFn): TableColumn<Reason>[] {
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
				}
				if (description) {
					children.push(h('span', {}, description));
				}
				return h('div', { class: 'flex flex-col gap-1 items-start min-w-0' }, children);
			},
		},
		{
			id: 'type',
			accessorKey: 'type',
			header: () => headerCell(t('table.reasonType')),
			cell: ({ row }) =>
				h(
					UBadge,
					{
						variant: 'subtle',
						color: 'error',
						size: 'sm',
						class: 'capitalize',
					},
					() => typeLabel(t, row.original.type),
				),
		},
		{
			accessorKey: 'is_active',
			header: () => headerCell(t('common.status')),
			cell: ({ row }) => {
				const reasonStore = useReasonStore();
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
								void reasonStore.updateStatus(row.original, value === true);
							},
						}),
					],
				);
			},
		},
	];
}
