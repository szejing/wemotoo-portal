import { OrderResendEmailAction, OrderStatus, PaymentStatus } from 'yeppi-common';
import type { FulfillmentBatch } from './types/order-fulfillment-shipping';

type ResolveOrderResendEmailActionInput = {
	status: OrderStatus;
	payment_status: PaymentStatus;
	payment_method?: string | null;
	fulfillments?: readonly Pick<FulfillmentBatch, 'shipment_status' | 'tracking_no'>[];
};

const trackedShipmentStatuses = new Set<FulfillmentBatch['shipment_status']>(['shipped', 'in_transit', 'delivered']);

const hasTrackedFulfillment = (input: ResolveOrderResendEmailActionInput): boolean =>
	(input.fulfillments ?? []).some(
		(fulfillment) =>
			trackedShipmentStatuses.has(fulfillment.shipment_status) && String(fulfillment.tracking_no ?? '').trim().length > 0,
	);

const isCashPendingOrder = (input: ResolveOrderResendEmailActionInput): boolean => {
	const paymentMethod = String(input.payment_method ?? '')
		.trim()
		.toUpperCase();

	return (
		paymentMethod === 'CASH' &&
		(input.status === OrderStatus.PENDING_PAYMENT || input.status === OrderStatus.PROCESSING || input.status === OrderStatus.CONFIRMED) &&
		input.payment_status === PaymentStatus.PENDING
	);
};

/** Maps order status/payment to the customer email an admin can resend. */
export function resolveOrderResendEmailAction(input: ResolveOrderResendEmailActionInput): OrderResendEmailAction | undefined {
	if (hasTrackedFulfillment(input)) {
		return OrderResendEmailAction.SHIPPED;
	}

	if (isCashPendingOrder(input)) {
		return OrderResendEmailAction.ORDER_CONFIRMATION;
	}

	if (input.status === OrderStatus.CONFIRMED) {
		return OrderResendEmailAction.ORDER_CONFIRMATION;
	}

	if (input.status === OrderStatus.PROCESSING && input.payment_status === PaymentStatus.PENDING) {
		return OrderResendEmailAction.INVOICE;
	}

	if (
		(input.status === OrderStatus.PROCESSING || input.status === OrderStatus.PAID || input.status === OrderStatus.COMPLETED) &&
		input.payment_status === PaymentStatus.PAID
	) {
		return OrderResendEmailAction.RECEIPT;
	}

	if (input.status === OrderStatus.REFUNDED && input.payment_status === PaymentStatus.REFUNDED) {
		return OrderResendEmailAction.REFUND;
	}

	if (input.status === OrderStatus.CANCELLED) {
		return OrderResendEmailAction.CANCELLATION;
	}

	if (input.status === OrderStatus.SHIPPED) {
		return OrderResendEmailAction.SHIPPED;
	}

	return undefined;
}
