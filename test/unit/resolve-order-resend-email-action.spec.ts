import { describe, expect, it } from 'vitest';
import { OrderResendEmailAction, OrderStatus, PaymentStatus } from 'yeppi-common';
import { resolveOrderResendEmailAction } from '../../app/utils/resolve-order-resend-email-action';

describe('resolveOrderResendEmailAction', () => {
	it('returns order-confirmation for confirmed orders regardless of payment status', () => {
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.CONFIRMED,
				payment_status: PaymentStatus.PAID,
				payment_method: 'FIUU',
			}),
		).toBe(OrderResendEmailAction.ORDER_CONFIRMATION);

		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.CONFIRMED,
				payment_status: PaymentStatus.PENDING,
				payment_method: 'FIUU',
			}),
		).toBe(OrderResendEmailAction.ORDER_CONFIRMATION);
	});

	it('returns order-confirmation for cash pending orders', () => {
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.PENDING_PAYMENT,
				payment_status: PaymentStatus.PENDING,
				payment_method: 'CASH',
			}),
		).toBe(OrderResendEmailAction.ORDER_CONFIRMATION);
	});

	it('returns invoice for processing with pending payment', () => {
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.PROCESSING,
				payment_status: PaymentStatus.PENDING,
			}),
		).toBe(OrderResendEmailAction.INVOICE);
	});

	it('returns receipt for paid processing/paid/completed orders', () => {
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.PROCESSING,
				payment_status: PaymentStatus.PAID,
			}),
		).toBe(OrderResendEmailAction.RECEIPT);
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.PAID,
				payment_status: PaymentStatus.PAID,
			}),
		).toBe(OrderResendEmailAction.RECEIPT);
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.COMPLETED,
				payment_status: PaymentStatus.PAID,
			}),
		).toBe(OrderResendEmailAction.RECEIPT);
	});

	it('returns refund for refunded orders', () => {
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.REFUNDED,
				payment_status: PaymentStatus.REFUNDED,
			}),
		).toBe(OrderResendEmailAction.REFUND);
	});

	it('returns cancellation for cancelled orders', () => {
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.CANCELLED,
				payment_status: PaymentStatus.PENDING,
			}),
		).toBe(OrderResendEmailAction.CANCELLATION);
	});

	it('returns shipped for shipped orders', () => {
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.SHIPPED,
				payment_status: PaymentStatus.PAID,
			}),
		).toBe(OrderResendEmailAction.SHIPPED);
	});

	it('returns undefined when no email matches', () => {
		expect(
			resolveOrderResendEmailAction({
				status: OrderStatus.PENDING_PAYMENT,
				payment_status: PaymentStatus.PENDING,
				payment_method: 'FIUU',
			}),
		).toBeUndefined();
	});
});
