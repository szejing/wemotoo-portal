import type { TableColumn } from '@nuxt/ui';
import { UBadge } from '#components';
import { format } from 'date-fns';
import { h, type VNode } from 'vue';
import { parseActivityLogRichText, type ActivityLogRichTextSegment } from '~/utils/activity-log-rich-text';
import { getActivityLogActionLabel, getActivityLogActorTypeLabel, getActivityLogSourceLabel } from '~/utils/options';
import type { ActivityLog } from '~/utils/types/activity-log';
import { getSortableHeader } from './sortable';
import { headerCell } from './styles';

type TranslateFn = (key: string) => string;

export const ACTIVITY_LOG_COLUMN_LABELS = {
	created_at: 'table.createdAt',
	desc: 'table.description',
	action: 'table.action',
	actor: 'table.actor',
	source: 'table.source',
} as const;

type BadgeColor = 'neutral' | 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning';

const badge = (label: string, color: BadgeColor = 'neutral') =>
	h(
		UBadge,
		{
			variant: 'subtle',
			color,
			size: 'sm',
		},
		() => label,
	);

const actionColor = (action?: string): BadgeColor => {
	if (!action) return 'neutral';
	if (['created', 'restored', 'checkout_created', 'customer_request_created', 'email_sent'].includes(action)) return 'success';
	if (['updated', 'status_changed', 'payment_status_changed', 'fulfillment_updated', 'shipment_updated', 'profile_updated'].includes(action)) {
		return 'info';
	}
	if (['deleted', 'refund_updated'].includes(action)) return 'error';
	if (action === 'imported') return 'warning';
	return 'neutral';
};

const nowrapMeta = {
	meta: {
		class: {
			th: 'whitespace-nowrap',
			td: 'whitespace-nowrap overflow-hidden',
		},
	},
} as const;

const descriptionMeta = {
	meta: {
		class: {
			th: 'min-w-[16rem] max-w-lg',
			td: 'min-w-[16rem] max-w-lg overflow-hidden',
		},
	},
} as const;

const renderRichTextSegment = (segment: ActivityLogRichTextSegment, key: string): VNode => {
	if (segment.type === 'text') {
		return h('span', { key }, segment.text);
	}
	if (segment.type === 'identifier') {
		return h('span', { key, class: 'italic underline decoration-dotted underline-offset-4 text-highlighted' }, segment.text);
	}
	if (segment.type === 'bold') {
		return h('span', { key, class: 'font-bold text-highlighted' }, segment.text);
	}
	return h(
		UBadge,
		{
			key,
			color: segment.color,
			variant: 'subtle',
			size: 'md',
			class: 'capitalize',
		},
		() => segment.text,
	);
};

const renderActivityLogRichText = (value: string | undefined, className: string) =>
	h(
		'div',
		{ class: `flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 whitespace-normal break-words ${className}` },
		parseActivityLogRichText(value).map((segment, index) => renderRichTextSegment(segment, `${segment.type}-${index}`)),
	);

const getActivityDescriptionText = (log: ActivityLog): string => log.internal_desc ?? log.desc ?? '-';

export function getActivityLogColumns(t: TranslateFn): TableColumn<ActivityLog>[] {
	return [
		{
			accessorKey: 'created_at',
			header: ({ column }) => getSortableHeader(column, t('table.createdAt')),
			cell: ({ row }) => {
				const value = row.original.created_at;
				if (!value) return '-';
				const date = new Date(value);
				return h('div', { class: 'min-w-0' }, [
					h('p', { class: 'text-sm text-highlighted' }, format(date, 'HH:mm')),
					h('p', { class: 'text-xs text-muted' }, format(date, 'dd/MM/yyyy')),
				]);
			},
			...nowrapMeta,
		},
		{
			accessorKey: 'action',
			header: () => headerCell(t('table.action')),
			cell: ({ row }) => badge(getActivityLogActionLabel(t, row.original.action), actionColor(row.original.action)),
			...nowrapMeta,
		},
		{
			accessorKey: 'desc',
			header: () => headerCell(t('table.description')),
			cell: ({ row }) =>
				h('div', { class: 'min-w-0 max-w-full overflow-hidden' }, [
					renderActivityLogRichText(getActivityDescriptionText(row.original), 'text-sm text-highlighted'),
				]),
			...descriptionMeta,
		},
		{
			accessorKey: 'source',
			header: () => headerCell(t('table.source')),
			cell: ({ row }) => h('div', { class: 'relative z-[1] min-w-0' }, [badge(getActivityLogSourceLabel(t, row.original.source))]),
			...nowrapMeta,
		},
		{
			id: 'actor',
			header: () => headerCell(t('table.actor')),
			cell: ({ row }) =>
				h('div', { class: 'relative z-[1] min-w-0 max-w-[12rem] overflow-hidden' }, [
					h('p', { class: 'text-sm text-highlighted' }, getActivityLogActorTypeLabel(t, row.original.actor_type)),
					row.original.actor_id ? h('p', { class: 'truncate text-xs text-muted font-mono' }, row.original.actor_id) : null,
				]),
			meta: {
				class: {
					th: 'whitespace-nowrap',
					td: 'whitespace-nowrap overflow-hidden',
				},
			},
		},
	];
}
