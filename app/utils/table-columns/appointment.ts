import { h } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { getFormattedDate, isSameDate } from 'yeppi-common';
import { UBadge } from '#components';
import { getAppointmentStatusColor } from '~/utils/options';
import type { Appointment } from '~/utils/types/appointment';
import { getSortableHeader, headerCell, mutedCell } from './styles';

type TranslateFn = (key: string, params?: Record<string, number | string>) => string;

export function getAppointmentColumns(t: TranslateFn): TableColumn<Appointment>[] {
	return [
		{
			id: 'date_time',
			accessorFn: (row) => (row.start_date_time ? new Date(row.start_date_time).getTime() : 0),
			header: ({ column }) => getSortableHeader(column, t('table.dateTime')),
			cell: ({ row }) => {
				const start = row.original.start_date_time ? new Date(row.original.start_date_time) : null;
				const end = row.original.end_date_time ? new Date(row.original.end_date_time) : null;
				if (!start) return mutedCell('—');
				const dateLine = getFormattedDate(start, 'dd MMM yyyy');
				const timeLine =
					!end || isSameDate(start, end)
						? getFormattedDate(start, 'hh:mm aa') + (end ? ` - ${getFormattedDate(end, 'hh:mm aa')}` : '')
						: `${getFormattedDate(start, 'hh:mm aa')} - ${getFormattedDate(end, 'dd MMM yyyy, hh:mm aa')}`;
				return h('div', { class: 'flex flex-col gap-0.5' }, [
					h('span', { class: 'font-medium text-default' }, dateLine),
					h('span', { class: 'text-sm text-muted' }, timeLine),
				]);
			},
		},
		{
			accessorKey: 'code',
			header: () => headerCell(t('table.code')),
			cell: ({ row }) => h('span', { class: 'font-semibold text-highlighted' }, row.original.code),
		},
		{
			id: 'customer',
			accessorFn: (row) => row.customer_name ?? '',
			header: () => headerCell(t('table.customer')),
			cell: ({ row }) =>
				h('div', { class: 'flex flex-col gap-0.5' }, [
					h('p', { class: 'font-medium text-default truncate max-w-[180px]' }, row.original.customer_name),
					h('p', { class: 'text-sm text-muted truncate max-w-[180px]' }, row.original.customer_phone || '—'),
				]),
		},
		{
			id: 'service',
			accessorKey: 'appt_desc',
			header: () => headerCell(t('pages.service')),
			cell: ({ row }) => {
				const desc = row.original.appt_desc || t('pages.noDescription');
				const n = row.original.duration;
				const children = [h('p', { class: 'text-sm text-default truncate max-w-[200px]' }, desc)];
				if (n != null) {
					children.push(h('p', { class: 'text-sm text-muted' }, t('pages.durationMinutes', { n })));
				}
				return h('div', { class: 'flex flex-col gap-0.5' }, children);
			},
		},
		{
			accessorKey: 'status',
			header: ({ column }) => getSortableHeader(column, t('table.status')),
			cell: ({ row }) => {
				const status = row.original.status;
				const color = getAppointmentStatusColor(status);
				const label = t('options.' + status.toLowerCase());
				return h(UBadge, { variant: 'subtle', color }, () => label);
			},
			meta: {
				class: {
					td: 'text-center',
				},
			},
		},
	];
}
