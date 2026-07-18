import { describe, expect, it } from 'vitest';
import { OrderStatus, PaymentStatus } from 'yeppi-common';
import { getDefaultOrderStatuses } from '../../app/utils/options/order-status';
import { buildOrderStatusODataFilter } from '../../app/utils/order-status-filter';

describe('buildOrderStatusODataFilter', () => {
	it('returns empty string when no statuses are selected', () => {
		expect(buildOrderStatusODataFilter([])).toBe('');
	});

	it('returns empty string when all statuses are selected', () => {
		expect(buildOrderStatusODataFilter(getDefaultOrderStatuses())).toBe('');
	});

	it('uses eq for a single status', () => {
		expect(buildOrderStatusODataFilter([OrderStatus.COMPLETED])).toBe(`status eq '${OrderStatus.COMPLETED}'`);
	});

	it('uses in for multiple statuses', () => {
		expect(buildOrderStatusODataFilter([OrderStatus.PENDING_PAYMENT, OrderStatus.PROCESSING])).toBe(
			`status in ('${OrderStatus.PENDING_PAYMENT}', '${OrderStatus.PROCESSING}')`,
		);
	});

	it('applies cash pending-payment special case', () => {
		expect(
			buildOrderStatusODataFilter([OrderStatus.PENDING_PAYMENT], {
				payment_method: 'CASH',
			}),
		).toBe(`status eq '${OrderStatus.PENDING_PAYMENT}' and payment_status eq '${PaymentStatus.PENDING}'`);
	});

	it('excludes completed when excludeCompleted is true', () => {
		expect(buildOrderStatusODataFilter(getDefaultOrderStatuses(), { excludeCompleted: true })).toBe(
			`status ne '${OrderStatus.COMPLETED}'`,
		);
	});

	it('appends excludeCompleted to a status in filter', () => {
		expect(
			buildOrderStatusODataFilter([OrderStatus.PENDING_PAYMENT, OrderStatus.PROCESSING], {
				excludeCompleted: true,
			}),
		).toBe(
			`status in ('${OrderStatus.PENDING_PAYMENT}', '${OrderStatus.PROCESSING}') and status ne '${OrderStatus.COMPLETED}'`,
		);
	});
});
