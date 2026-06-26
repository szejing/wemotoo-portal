import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, defineStore, setActivePinia } from 'pinia';
import { mergeAppendedAllNotifications } from '../../app/stores/Notification/Notification';
import type { Notification } from '../../app/utils/types/notification';

const { failedNotification } = vi.hoisted(() => ({
	failedNotification: vi.fn(),
}));

vi.mock('../../app/stores/AppUi/AppUi', () => ({
	failedNotification,
}));

const createNotification = (id: string): Notification => ({
	type: 'order_created',
	title: 'Order',
	description: 'Order created',
	severity: 'info',
	count: 1,
	action: { label: 'View', url: '/orders/1' },
	items: [
		{
			id,
			title: 'Order',
			action: { label: 'View', url: '/orders/1' },
		},
	],
});

describe('mergeAppendedAllNotifications', () => {
	it('appends only notifications that are not already loaded', () => {
		const existing = [createNotification('n-1')];
		const incoming = [createNotification('n-2'), createNotification('n-1')];

		expect(mergeAppendedAllNotifications(existing, incoming)).toEqual([createNotification('n-1'), createNotification('n-2')]);
	});
});

describe('useNotificationStore all-notifications pagination', () => {
	const getMany = vi.fn();

	beforeEach(() => {
		setActivePinia(createPinia());
		getMany.mockReset();
		failedNotification.mockReset();
		(globalThis as unknown as { defineStore: typeof defineStore }).defineStore = defineStore;
		(globalThis as unknown as { useNuxtApp: () => unknown }).useNuxtApp = () =>
			({
				$api: {
					notification: {
						getMany,
					},
				},
			}) as unknown;
	});

	it('loads the first batch and replaces existing all-notifications data', async () => {
		getMany.mockResolvedValueOnce({
			data: [createNotification('n-1')],
			'@odata.count': 2,
			total_count: 1,
			handled_scenarios: [],
		});

		const { useNotificationStore } = await import('../../app/stores/Notification/Notification');
		const store = useNotificationStore();
		store.all_notifications = [createNotification('old')];
		store.all_filter.current_page = 3;

		await store.getNotifications({ includeRead: true });

		expect(getMany).toHaveBeenCalledWith(
			expect.objectContaining({
				$top: 20,
				$skip: 0,
				$count: true,
				$orderby: 'created_at desc',
			}),
		);
		expect(store.all_notifications).toHaveLength(1);
		expect(store.all_notifications[0]?.items[0]?.id).toBe('n-1');
		expect(store.all_filter.current_page).toBe(1);
		expect(store.hasMoreAllNotifications).toBe(true);
	});

	it('loads older notifications when scrolling triggers load more', async () => {
		getMany
			.mockResolvedValueOnce({
				data: [createNotification('n-1')],
				'@odata.count': 2,
				total_count: 1,
				handled_scenarios: [],
			})
			.mockResolvedValueOnce({
				data: [createNotification('n-2')],
				'@odata.count': 2,
				total_count: 1,
				handled_scenarios: [],
			});

		const { useNotificationStore } = await import('../../app/stores/Notification/Notification');
		const store = useNotificationStore();

		await store.getNotifications({ includeRead: true });
		await store.loadMoreAllNotifications();

		expect(getMany).toHaveBeenLastCalledWith(
			expect.objectContaining({
				$top: 20,
				$skip: 20,
			}),
		);
		expect(store.all_notifications).toHaveLength(2);
		expect(store.all_notifications.map((notification) => notification.items[0]?.id)).toEqual(['n-1', 'n-2']);
		expect(store.hasMoreAllNotifications).toBe(false);
	});

	it('does not request another page when all notifications are already loaded', async () => {
		getMany.mockResolvedValueOnce({
			data: [createNotification('n-1')],
			'@odata.count': 1,
			total_count: 1,
			handled_scenarios: [],
		});

		const { useNotificationStore } = await import('../../app/stores/Notification/Notification');
		const store = useNotificationStore();

		await store.getNotifications({ includeRead: true });
		await store.loadMoreAllNotifications();

		expect(getMany).toHaveBeenCalledTimes(1);
	});
});
