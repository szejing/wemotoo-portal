import { OrderStatus, PaymentStatus } from 'yeppi-common';

export type OrderResendEmailAction = 'order-confirmation' | 'invoice' | 'receipt' | 'refund' | 'cancellation';

type ResolveOrderResendEmailActionInput = {
	status: OrderStatus;
	payment_status: PaymentStatus;
	payment_method?: string | null;
};

function isCashPendingOrder(input: ResolveOrderResendEmailActionInput): boolean {
	const paymentMethod = String(input.payment_method ?? '')
		.trim()
		.toUpperCase();

	return (
		paymentMethod === 'CASH' &&
		(input.status === OrderStatus.PENDING_PAYMENT ||
			input.status === OrderStatus.PROCESSING ||
			input.status === OrderStatus.CONFIRMED) &&
		input.payment_status === PaymentStatus.PENDING
	);
}

/** Maps order status/payment to the customer email an admin can resend. */
export function resolveOrderResendEmailAction(
	input: ResolveOrderResendEmailActionInput,
): OrderResendEmailAction | undefined {
	if (isCashPendingOrder(input)) {
		return 'order-confirmation';
	}

	if (input.status === OrderStatus.CONFIRMED) {
		return 'order-confirmation';
	}

	if (input.status === OrderStatus.PROCESSING && input.payment_status === PaymentStatus.PENDING) {
		return 'invoice';
	}

	if (
		(input.status === OrderStatus.PROCESSING ||
			input.status === OrderStatus.PAID ||
			input.status === OrderStatus.COMPLETED) &&
		input.payment_status === PaymentStatus.PAID
	) {
		return 'receipt';
	}

	if (input.status === OrderStatus.REFUNDED && input.payment_status === PaymentStatus.REFUNDED) {
		return 'refund';
	}

	if (input.status === OrderStatus.CANCELLED) {
		return 'cancellation';
	}

	return undefined;
}
