import { USwitch } from '#components';
import type { TableColumn } from '@nuxt/ui';
import type { PaymentMethod } from '~/utils/types/payment-method';
import { getSortableHeader } from '../sortable';
import { headerCell } from '../styles';

type TranslateFn = (key: string) => string;

export function getPaymentMethodColumns(t: TranslateFn): TableColumn<PaymentMethod>[] {
	return [
		{
			id: 'code_description',
			accessorKey: 'code',
			header: ({ column }) => getSortableHeader(column, `${t('common.code')} / ${t('table.shortDescription')}`),
			cell: ({ row }) => {
				return h('div', { class: 'flex flex-col gap-1 items-start min-w-0' }, [
					h('p', { class: 'font-semibold text-sm text-highlighted' }, row.original.short_desc),
					h('p', { class: 'text-xs text-muted font-mono italic' }, row.original.code),
				]);
			},
		},
		{
			accessorKey: 'is_active',
			header: () => headerCell(t('common.status')),
			cell: ({ row }) => {
				const paymentMethodStore = usePaymentMethodStore();
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
								void paymentMethodStore.updateStatus(row.original, value === true);
							},
						}),
					],
				);
			},
		},
	];
}
