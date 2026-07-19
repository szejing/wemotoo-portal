import { describe, expect, it } from 'vitest';
import { OrderStatus } from 'yeppi-common';
import { getDefaultOrderStatuses } from '../../app/utils/options/order-status';
import { resolveOrderStatusesFromStorage } from '../../app/utils/orders-selected-statuses-storage';

describe('resolveOrderStatusesFromStorage', () => {
	it('returns all statuses when storage is empty', () => {
		expect(resolveOrderStatusesFromStorage(null)).toEqual(getDefaultOrderStatuses());
		expect(resolveOrderStatusesFromStorage(undefined)).toEqual(getDefaultOrderStatuses());
		expect(resolveOrderStatusesFromStorage([])).toEqual(getDefaultOrderStatuses());
	});

	it('returns stored valid statuses', () => {
		expect(resolveOrderStatusesFromStorage([OrderStatus.PROCESSING, OrderStatus.COMPLETED])).toEqual([
			OrderStatus.PROCESSING,
			OrderStatus.COMPLETED,
		]);
	});

	it('filters out invalid values and keeps valid ones', () => {
		expect(resolveOrderStatusesFromStorage([OrderStatus.PAID, 'not-a-status', 123])).toEqual([OrderStatus.PAID]);
	});

	it('returns all statuses when every stored value is invalid', () => {
		expect(resolveOrderStatusesFromStorage(['nope', 1, {}])).toEqual(getDefaultOrderStatuses());
	});
});
