import { defineStore } from 'pinia';
import { failedNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import type { Notification, NotificationCenter, NotificationItem } from '~/utils/types/notification';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { NotificationType } from 'yeppi-common';

type NotificationQueryOptions = BaseODataReq & {
	includeRead?: boolean;
	append?: boolean;
};

type NotificationListFilter = {
	page_size: number;
	current_page: number;
};

export const ALL_NOTIFICATIONS_BATCH_SIZE = 20;

const initialNotificationListFilter: NotificationListFilter = {
	page_size: ALL_NOTIFICATIONS_BATCH_SIZE,
	current_page: 1,
};

export const mergeAppendedAllNotifications = (existing: Notification[], incoming: Notification[]): Notification[] => {
	const seenIds = new Set(existing.flatMap((notification) => notification.items.map((item) => item.id)));

	return [
		...existing,
		...incoming.filter((notification) => {
			const itemId = notification.items[0]?.id;

			if (!itemId || seenIds.has(itemId)) {
				return false;
			}

			seenIds.add(itemId);
			return true;
		}),
	];
};

export const useNotificationStore = defineStore('notificationStore', {
	state: () => ({
		loading: false as boolean,
		loadingMore: false as boolean,
		total_count: 0 as number,
		all_total_count: 0 as number,
		generated_at: undefined as string | Date | undefined,
		notifications: [] as Notification[],
		all_notifications: [] as Notification[],
		all_filter: { ...initialNotificationListFilter },
		handled_scenarios: [] as NotificationCenter['handled_scenarios'],
	}),
	getters: {
		activeNotifications: (state) =>
			state.notifications
				.map((notification) => ({
					...notification,
					items: notification.items.filter((item) => !item.read_at),
					count: notification.items.filter((item) => !item.read_at).length,
				}))
				.filter((notification) => notification.count > 0),
		hasNotifications: (state) => state.notifications.some((notification) => notification.items.some((item) => !item.read_at)),
		unreadCount: (state) => state.notifications.reduce((total, notification) => total + notification.items.filter((item) => !item.read_at).length, 0),
		allLoadedItemCount: (state) => state.all_notifications.reduce((total, notification) => total + notification.items.length, 0),
		hasMoreAllNotifications: (state) =>
			state.all_notifications.reduce((total, notification) => total + notification.items.length, 0) < state.all_total_count,
	},
	actions: {
		async getNotifications(options: NotificationQueryOptions = {}): Promise<void> {
			const { includeRead, append = false, ...query } = options;

			if (!append) {
				this.loading = true;
			}

			const { $api } = useNuxtApp();
			try {
				const queryParams: BaseODataReq = { ...query };

				if (includeRead) {
					if (!append) {
						this.all_filter.current_page = 1;
					}

					queryParams.$top = this.all_filter.page_size;
					queryParams.$skip = (this.all_filter.current_page - 1) * this.all_filter.page_size;
					queryParams.$count = true;
					queryParams.$orderby = 'created_at desc';
				}

				const data = await $api.notification.getMany(queryParams);

				this.total_count = data.total_count ?? 0;
				this.generated_at = data.generated_at;
				const decorated = this.decorateNotifications(data.data ?? []);

				if (includeRead) {
					this.all_notifications = append ? mergeAppendedAllNotifications(this.all_notifications, decorated) : decorated;
					this.all_total_count = data['@odata.count'] ?? data.count ?? 0;
				} else {
					this.notifications = decorated;
				}

				this.handled_scenarios = data.handled_scenarios ?? [];
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load notifications';
				failedNotification(message);
			} finally {
				if (!append) {
					this.loading = false;
				}
			}
		},
		async loadMoreAllNotifications(): Promise<void> {
			if (this.loading || this.loadingMore || !this.hasMoreAllNotifications) {
				return;
			}

			this.loadingMore = true;
			this.all_filter.current_page += 1;

			try {
				await this.getNotifications({ includeRead: true, append: true });
			} finally {
				this.loadingMore = false;
			}
		},
		async openNotificationItem(type: NotificationType, item: NotificationItem) {
			const { $api } = useNuxtApp();
			const itemIds = item.notification_ids?.length ? item.notification_ids : [item.id];
			let updatedItems: NotificationItem[];

			try {
				updatedItems = await Promise.all(itemIds.map((id) => $api.notification.open(id)));
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to open notification';
				failedNotification(message);
				return undefined;
			}

			const readAt = updatedItems.find((updated) => updated.read_at)?.read_at ?? new Date().toISOString();
			const openedAt = updatedItems.find((updated) => updated.opened_at)?.opened_at ?? readAt;
			const updatedGroup = {
				...item,
				read_at: readAt,
				opened_at: openedAt,
			};

			const updateCollection = (notifications: Notification[]) =>
				notifications.map((notification) => {
					if (notification.type !== type) {
						return notification;
					}

					return {
						...notification,
						items: notification.items.map((item) =>
							itemIds.includes(item.id) || item.notification_ids?.some((id) => itemIds.includes(id))
								? {
										...item,
										...updatedGroup,
										notification_type: notification.type,
										notification_title: notification.title,
										notification_description: notification.description,
										notification_severity: notification.severity,
									}
								: item,
						),
					};
				});

			this.notifications = updateCollection(this.notifications);
			this.all_notifications = updateCollection(this.all_notifications);

			return this.notifications.find((notification) => notification.type === type)?.items.find((candidate) => candidate.id === item.id) ?? updatedGroup;
		},
		decorateNotifications(notifications: Notification[]): Notification[] {
			return notifications.map((notification) => ({
				...notification,
				items: notification.items.map((item) => ({
					...item,
					notification_type: notification.type,
					notification_title: notification.title,
					notification_description: notification.description,
					notification_severity: notification.severity,
				})),
			}));
		},
	},
});
