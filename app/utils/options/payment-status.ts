import { getPaymentStatusColor as getCommonPaymentStatusColor, PaymentStatus, type UiBadgeColor } from 'yeppi-common';

type TranslateFn = (key: string) => string;

export const options_payment_status = [
	PaymentStatus.PAID,
	PaymentStatus.PENDING,
	PaymentStatus.PARTIALLY_PAID,
	PaymentStatus.PARTIALLY_REFUNDED,
	PaymentStatus.REFUNDED,
];

export function getPaymentStatusOptions(t: TranslateFn) {
	return [
		{ value: PaymentStatus.PAID, label: t('options.paid') },
		{ value: PaymentStatus.PENDING, label: t('options.pending') },
		{ value: PaymentStatus.PARTIALLY_PAID, label: t('options.partiallyPaid') },
		{ value: PaymentStatus.PARTIALLY_REFUNDED, label: t('options.partiallyRefunded') },
		{ value: PaymentStatus.REFUNDED, label: t('options.refunded') },
	];
}

export const getPaymentStatusColor = (status: string): UiBadgeColor | undefined => {
	if (status === 'All') {
		return 'neutral';
	}

	return getCommonPaymentStatusColor(status);
};
