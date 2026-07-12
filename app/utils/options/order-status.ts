import { getOrderStatusColor as getCommonOrderStatusColor, OrderStatus, type UiBadgeColor } from 'yeppi-common';

type TranslateFn = (key: string) => string;

export type UiOrderStatus = OrderStatus | 'paid' | 'shipped' | 'delivered';

/** All selectable order statuses for multi-select filters (excludes "All"). */
export const ORDER_STATUS_FILTER_VALUES: OrderStatus[] = [
	OrderStatus.PENDING_PAYMENT,
	OrderStatus.PAID,
	OrderStatus.PROCESSING,
	OrderStatus.READY_FOR_PICKUP,
	OrderStatus.SHIPPED,
	OrderStatus.DELIVERED,
	OrderStatus.CANCELLED,
	OrderStatus.REFUNDED,
	OrderStatus.COMPLETED,
	OrderStatus.REQUIRES_ACTION,
	OrderStatus.CONFIRMED,
];

export function getDefaultOrderStatuses(): OrderStatus[] {
	return [...ORDER_STATUS_FILTER_VALUES];
}

export function isAllOrderStatusesSelected(statuses: OrderStatus[]): boolean {
	if (statuses.length !== ORDER_STATUS_FILTER_VALUES.length) {
		return false;
	}
	const selected = new Set(statuses);
	return ORDER_STATUS_FILTER_VALUES.every((status) => selected.has(status));
}

export const options_order_status: Array<'All' | UiOrderStatus> = [
	'All',
	OrderStatus.PENDING_PAYMENT,
	'paid',
	OrderStatus.PROCESSING,
	OrderStatus.READY_FOR_PICKUP,
	'shipped',
	'delivered',
	OrderStatus.CANCELLED,
	OrderStatus.REFUNDED,
	OrderStatus.COMPLETED,
	OrderStatus.REQUIRES_ACTION,
];

export function getOrderStatusOptions(t: TranslateFn) {
	return [
		{ value: 'All', label: t('options.all') },
		{ value: OrderStatus.PENDING_PAYMENT, label: t('options.pendingPayment') },
		{ value: OrderStatus.PAID, label: t('options.paid') },
		{ value: OrderStatus.PROCESSING, label: t('options.processing') },
		{ value: OrderStatus.READY_FOR_PICKUP, label: t('options.readyForPickup') },
		{ value: OrderStatus.SHIPPED, label: t('options.shipped') },
		{ value: OrderStatus.DELIVERED, label: t('options.delivered') },
		{ value: OrderStatus.CANCELLED, label: t('options.cancelled') },
		{ value: OrderStatus.REFUNDED, label: t('options.refunded') },
		{ value: OrderStatus.COMPLETED, label: t('options.completed') },
		{ value: OrderStatus.REQUIRES_ACTION, label: t('options.requiresAction') },
		{ value: OrderStatus.CONFIRMED, label: t('options.confirmed') },
	];
}

export function getOrderStatusOption(t: TranslateFn, status: OrderStatus) {
	return getOrderStatusOptions(t).find((option) => option.value === status);
}

export const getOrderStatusColor = (status: string): UiBadgeColor | undefined => {
	if (status === 'All') {
		return 'neutral';
	}

	return getCommonOrderStatusColor(status);
};
