import { describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ActivityLogActivities from '~/components/ActivityLog/Activities.vue';
import type { OrderActivity } from '~/utils/types/order-fulfillment-shipping';

const activityWithTracking = (overrides: Partial<OrderActivity> = {}): OrderActivity => ({
	id: 1,
	internal_desc: 'Shipment updated',
	created_by: 'admin',
	created_at: '2026-07-14T10:00:00.000Z',
	metadata: {
		courier_service: 'Pos Laju',
		tracking_no: 'ABC-999',
	},
	...overrides,
});

describe('ActivityLogActivities', () => {
	it('renders tracking copy affordance only when tracking number exists', async () => {
		const wrapper = await mountSuspended(ActivityLogActivities, {
			props: { activities: [activityWithTracking()] },
		});

		expect(wrapper.find('[data-testid="activity-copy-tracking"]').exists()).toBe(true);
	});

	it('omits tracking copy affordance without a tracking number', async () => {
		const wrapper = await mountSuspended(ActivityLogActivities, {
			props: {
				activities: [
					activityWithTracking({
						metadata: { courier_service: 'Pos Laju' },
					}),
				],
			},
		});

		expect(wrapper.find('[data-testid="activity-copy-tracking"]').exists()).toBe(false);
	});

	it('copies tracking number to clipboard via toast-ready flow', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal('navigator', { clipboard: { writeText } });
		try {
			const wrapper = await mountSuspended(ActivityLogActivities, {
				props: {
					activities: [
						activityWithTracking({
							metadata: { tracking_no: 'COPYME' },
						}),
					],
				},
			});

			await wrapper.get('[data-testid="activity-copy-tracking"]').trigger('click');

			await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('COPYME'));
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
