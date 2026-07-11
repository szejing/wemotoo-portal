import { getOrderStatusColor as getCommonOrderStatusColor, OrderStatus, type UiBadgeColor } from 'yeppi-common';

type TranslateFn = (key: string) => string;

export type UiOrderStatus = OrderStatus | 'paid' | 'shipped' | 'delivered';

export const options_order_status: Array<'All' | UiOrderStatus> = [
	'All',
	OrderStatus.PENDING_PAYMENT,
	'paid',
	OrderStatus.PROCESSING,
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
