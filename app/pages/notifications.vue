<template>
	<ZPagePanel id="notifications" :title="$t('notifications.title')">
		<div class="space-y-6">
			<div class="notifications-toolbar">
				<div>
					<p class="notifications-kicker">{{ $t('notifications.actionCenter') }}</p>
					<h1>{{ $t('notifications.allTitle') }}</h1>
				</div>
				<UButton color="neutral" variant="soft" :icon="ICONS.REFRESH" :loading="loading" @click="loadNotifications">
					{{ $t('common.refresh') }}
				</UButton>
			</div>

			<template v-if="loading">
				<div class="rounded-lg overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-700">
					<div class="grid grid-cols-3 gap-4 p-4">
						<USkeleton v-for="i in 3" :key="i" class="h-4 flex-1 min-w-0" />
					</div>
					<div v-for="i in 5" :key="i" class="grid grid-cols-3 gap-4 p-4 items-center">
						<USkeleton v-for="j in 3" :key="j" class="h-4 flex-1 min-w-0" />
					</div>
				</div>
			</template>

			<template v-else-if="!initialize">
				<ZNotificationEmptyState v-if="dateGroups.length === 0" />

				<div v-else class="notifications-inbox">
					<section v-for="group in dateGroups" :key="group.key" class="notifications-date-group">
						<div class="notifications-date-header">
							<h2>{{ group.label }}</h2>
						</div>

						<UCard class="notifications-table" :ui="{ body: 'p-0 sm:p-0' }">
							<UTable
								:data="group.items"
								:columns="notificationColumns"
								:meta="notificationTableMeta"
								:get-row-id="(row) => row.key"
								@select="selectNotificationRow"
							>
								<template #ref_no-cell="{ row }">
									<span class="notifications-row__order">{{ row.original.ref_no === '-' ? '-' : `# ${row.original.ref_no}` }}</span>
								</template>

								<template #description-cell="{ row }">
									<span class="notifications-row__description">
										<span
											:class="[
												'notifications-row__dot',
												{ 'notifications-row__dot--read': row.original.isRead },
												`notifications-row__dot--${row.original.severity}`,
											]"
										/>
										<span>{{ row.original.descriptionPrefix ?? row.original.description }}</span>
										<UBadge v-if="row.original.statusBadge" :color="row.original.statusBadge.color" variant="subtle" size="sm" class="notifications-row__badge">
											{{ row.original.statusBadge.label }}
										</UBadge>
										<UBadge
											v-if="row.original.referenceBadge"
											:color="row.original.referenceBadge.color"
											variant="subtle"
											size="sm"
											class="notifications-row__badge"
										>
											{{ row.original.referenceBadge.label }}
										</UBadge>
									</span>
								</template>

								<template #lastUpdated-cell="{ row }">
									<span class="notifications-row__time">{{ row.original.lastUpdated }}</span>
								</template>
							</UTable>
						</UCard>
					</section>

					<div ref="loadMoreSentinel" class="notifications-load-more">
						<div v-if="loadingMore" class="flex justify-center py-4">
							<UIcon :name="ICONS.REFRESH" class="size-5 animate-spin text-neutral-400" />
						</div>
					</div>
				</div>
			</template>
		</div>
	</ZPagePanel>
</template>

<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core';
import type { Row, TableMeta } from '@tanstack/vue-table';
import type { TableRow } from '@nuxt/ui';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import type { NotificationType } from 'yeppi-common';
import { ICONS } from '~/utils/icons';
import { getNotificationDisplayDescription, getNotificationDisplayReferenceId } from '~/utils/notification-display';
import { getOrderStatusColor, getPaymentStatusColor } from '~/utils/options';
import { getNotificationColumns } from '~/utils/table-columns';
import type { NotificationBadgeColor, NotificationDisplayRow, NotificationEntry, NotificationItem } from '~/utils/types/notification';

const { t } = useI18n();
const notificationStore = useNotificationStore();
const { formatDateTime } = useNotificationItemDisplay();
const { loading, loadingMore, hasMoreAllNotifications } = storeToRefs(notificationStore);

const initialize = ref(true);
const loadMoreSentinel = useTemplateRef<HTMLElement>('loadMoreSentinel');

const notificationColumns = computed(() => getNotificationColumns(t));

const notificationTableMeta = computed<TableMeta<NotificationDisplayRow>>(() => ({
	class: {
		tr: (row: Row<NotificationDisplayRow>) => (row.original.isRead ? 'notifications-row notifications-row--read' : 'notifications-row'),
	},
}));

const loadNotifications = async () => {
	await notificationStore.getNotifications({ includeRead: true });
};

const loadMoreNotifications = async () => {
	await notificationStore.loadMoreAllNotifications();
};

const flatNotifications = computed<NotificationEntry[]>(() =>
	notificationStore.all_notifications
		.flatMap((notification) =>
			notification.items.map((item) => ({
				type: notification.type,
				severity: notification.severity,
				item,
			})),
		)
		.sort((a, b) => getItemTime(b.item) - getItemTime(a.item)),
);

const dateGroups = computed(() => {
	const groups = new Map<string, NotificationDisplayRow[]>();

	for (const entry of flatNotifications.value) {
		const date = getItemDate(entry.item);
		const key = format(date, 'yyyy-MM-dd');
		const row = createDisplayRow(entry);
		groups.set(key, [...(groups.get(key) ?? []), row]);
	}

	return Array.from(groups.entries()).map(([key, items]) => ({
		key,
		label: formatDateGroupLabel(key),
		items,
	}));
});

const openNotification = async (type: NotificationType, item: NotificationItem) => {
	const updated = item.read_at ? item : await notificationStore.openNotificationItem(type, item);

	if (!updated) {
		return;
	}

	await navigateTo(updated.action?.url ?? item.action?.url ?? '/notifications');
};

const selectNotificationRow = (_event: Event, row: TableRow<NotificationDisplayRow>) => {
	void openNotification(row.original.type, row.original.item);
};

const getItemTime = (item: NotificationItem) => new Date(item.updated_at ?? item.created_at ?? item.scheduled_at ?? 0).getTime();

const getItemDate = (item: NotificationItem) => new Date(item.updated_at ?? item.created_at ?? item.scheduled_at ?? Date.now());

const createDisplayRow = (entry: NotificationEntry): NotificationDisplayRow => {
	const description = getNotificationDisplayDescription(entry.item);
	const statusChange = parseStatusChange(description);
	const normalizedDescription = normalizeDescription(description);

	return {
		...entry,
		key: entry.item.id,
		ref_no: getNotificationDisplayReferenceId(entry.item),
		dateTime: formatDateTime(entry.item.created_at ?? entry.item.updated_at ?? entry.item.scheduled_at),
		description: normalizedDescription,
		lastUpdated: formatDateTime(entry.item.updated_at ?? entry.item.created_at ?? entry.item.scheduled_at),
		descriptionPrefix: statusChange ? t('notifications.orderStatusChangedTo') : undefined,
		statusBadge: statusChange,
		referenceBadge: isAppointmentCreated(description, entry.item) ? createReferenceBadge(entry.item.ref_no) : undefined,
		isRead: !!entry.item.read_at,
	};
};

const parseStatusChange = (description: string) => {
	const match = description.match(/(?:changed from|Status:)\s+[\w-]+\s+(?:to|->)\s+([\w-]+)/i);
	const status = match?.[1]?.replace(/\.$/, '');

	if (!status) {
		return undefined;
	}

	return {
		label: formatStatusLabel(status),
		color: getOrderStatusColor(status) ?? getPaymentStatusColor(status) ?? 'neutral',
	};
};

const normalizeDescription = (description: string) => {
	const trimmed = description.trim();

	if (/appointment created/i.test(trimmed)) {
		return t('notifications.appointmentCreated');
	}

	if (/new order waiting for admin review/i.test(trimmed)) {
		return t('notifications.newOrderWaitingAdminReview');
	}

	return trimmed.replace(/\.$/, '');
};

const isAppointmentCreated = (description: string, item: NotificationItem) => /appointment created/i.test(description) && !!item.ref_no;

const createReferenceBadge = (refNo?: string) =>
	refNo
		? {
				label: refNo,
				color: 'neutral' as NotificationBadgeColor,
			}
		: undefined;

const formatStatusLabel = (status: string) => {
	const statusLabelKeys: Record<string, string> = {
		completed: 'options.completed',
		paid: 'options.paid',
		pending_payment: 'options.pendingPayment',
		pending: 'options.pending',
		processing: 'options.processing',
		cancelled: 'options.cancelled',
		refunded: 'options.refunded',
		requires_action: 'options.requiresAction',
	};
	const labelKey = statusLabelKeys[status];

	return labelKey ? t(labelKey) : status.replace(/_/g, ' ');
};

const formatDateGroupLabel = (key: string) => {
	const date = parseISO(`${key}T00:00:00`);

	if (isToday(date)) {
		return t('notifications.today');
	}

	if (isYesterday(date)) {
		return t('notifications.yesterday');
	}

	return format(date, 'dd MMM yyyy');
};

useHead({ title: () => t('notifications.allTitle') });

onMounted(async () => {
	useInfiniteScroll(
		loadMoreSentinel,
		() => {
			void loadMoreNotifications();
		},
		{
			distance: 240,
			canLoadMore: () => !loading.value && !loadingMore.value && hasMoreAllNotifications.value,
		},
	);

	initialize.value = true;
	try {
		await loadNotifications();
	} finally {
		initialize.value = false;
	}
});
</script>

<style scoped>
.notifications-toolbar {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
}

.notifications-kicker {
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--color-neutral-500);
}

.notifications-toolbar h1 {
	font-size: 1.35rem;
	font-weight: 750;
	color: var(--color-neutral-950);
}

.notifications-inbox {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.notifications-date-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.notifications-date-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 0.25rem 0.25rem;
	color: var(--color-neutral-500);
}

.notifications-date-header h2 {
	font-size: 0.82rem;
	font-weight: 700;
	color: var(--color-neutral-700);
}

.notifications-date-header span {
	font-size: 0.75rem;
}

.notifications-table {
	width: 100%;
	overflow: hidden;
}

.notifications-table :deep(.notifications-row:not(.notifications-row--read)) {
	background: var(--color-main-50);
}

.notifications-table :deep(.notifications-row:not(.notifications-row--read):hover) {
	background: var(--color-main-100);
}

.notifications-table :deep(.notifications-row--read) {
	color: var(--color-neutral-500);
	background: white;
}

.notifications-table :deep(.notifications-row--read:hover) {
	background: var(--color-neutral-50);
}

.notifications-row__order {
	min-width: 0;
	overflow: hidden;
	font-size: 0.86rem;
	font-weight: 700;
	color: var(--color-neutral-900);
	text-overflow: ellipsis;
}

.notifications-row__time {
	font-size: 0.8rem;
	color: var(--color-neutral-500);
}

.notifications-row__description {
	display: flex;
	min-width: 0;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.86rem;
	color: var(--color-neutral-700);
}

.notifications-row__dot {
	width: 0.55rem;
	height: 0.55rem;
	flex: 0 0 0.55rem;
	border-radius: 9999px;
}

.notifications-row__dot--read {
	background: var(--color-neutral-300);
}

.notifications-row__dot--info {
	background: var(--color-info-500, #0ea5e9);
}

.notifications-row__dot--warning {
	background: var(--color-warning-500, #f59e0b);
}

.notifications-row__dot--critical {
	background: var(--color-error-500, #ef4444);
}

.notifications-row__badge {
	text-transform: capitalize;
}

.notifications-row__icon {
	width: 1rem;
	height: 1rem;
	margin-left: auto;
	color: var(--color-neutral-400);
}

.notifications-table :deep(.notifications-row--read .notifications-row__order),
.notifications-table :deep(.notifications-row--read .notifications-row__description),
.notifications-table :deep(.notifications-row--read .notifications-row__time),
.notifications-table :deep(.notifications-row--read .notifications-row__icon) {
	color: var(--color-neutral-400);
}

.notifications-load-more {
	min-height: 1px;
}

@media (max-width: 640px) {
	.notifications-toolbar {
		align-items: stretch;
		flex-direction: column;
	}

	.notifications-row__description {
		align-items: flex-start;
	}

	.notifications-row__dot {
		margin-top: 0.35rem;
	}
}
</style>
