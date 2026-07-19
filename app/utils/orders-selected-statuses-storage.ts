import { OrderStatus } from 'yeppi-common';
import { getDefaultOrderStatuses } from '~/utils/options';

export const ORDERS_SELECTED_STATUSES_STORAGE_KEY = 'wemotoo-orders-selected-statuses';

const VALID_ORDER_STATUSES = new Set(Object.values(OrderStatus));

/** Resolve stored statuses; empty/invalid → all selectable statuses. */
export function resolveOrderStatusesFromStorage(stored: unknown): OrderStatus[] {
	if (!Array.isArray(stored) || stored.length === 0) {
		return getDefaultOrderStatuses();
	}

	const valid = stored.filter((value): value is OrderStatus => typeof value === 'string' && VALID_ORDER_STATUSES.has(value as OrderStatus));
	return valid.length > 0 ? valid : getDefaultOrderStatuses();
}
