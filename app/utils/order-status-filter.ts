import { OrderStatus, PaymentStatus } from 'yeppi-common';
import { isAllOrderStatusesSelected } from './options/order-status';

type OrderStatusFilterOptions = {
	payment_method?: string;
	payment_status?: PaymentStatus;
};

/** Build OData status clause from selected order statuses. Empty or all selected = no status filter. */
export function buildOrderStatusODataFilter(statuses: OrderStatus[], options?: OrderStatusFilterOptions): string {
	if (options?.payment_method === 'CASH' && statuses.length === 1 && statuses[0] === OrderStatus.PENDING_PAYMENT) {
		return `status eq '${OrderStatus.PENDING_PAYMENT}' and payment_status eq '${PaymentStatus.PENDING}'`;
	}

	if (!statuses.length || isAllOrderStatusesSelected(statuses)) {
		return '';
	}

	if (statuses.length === 1) {
		return `status eq '${statuses[0]}'`;
	}

	return `status in (${statuses.map((status) => `'${status}'`).join(', ')})`;
}
