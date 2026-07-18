import { OrderStatus, PaymentStatus } from 'yeppi-common';
import { isAllOrderStatusesSelected } from './options/order-status';

type OrderStatusFilterOptions = {
	payment_method?: string;
	payment_status?: PaymentStatus;
	/** When true, exclude completed orders (`status ne 'completed'`). */
	excludeCompleted?: boolean;
};

/** Build OData status clause from selected order statuses. Empty or all selected = no status filter. */
export function buildOrderStatusODataFilter(statuses: OrderStatus[], options?: OrderStatusFilterOptions): string {
	let filter = '';

	if (options?.payment_method === 'CASH' && statuses.length === 1 && statuses[0] === OrderStatus.PENDING_PAYMENT) {
		filter = `status eq '${OrderStatus.PENDING_PAYMENT}' and payment_status eq '${PaymentStatus.PENDING}'`;
	} else if (!statuses.length || isAllOrderStatusesSelected(statuses)) {
		filter = '';
	} else if (statuses.length === 1) {
		filter = `status eq '${statuses[0]}'`;
	} else {
		filter = `status in (${statuses.map((status) => `'${status}'`).join(', ')})`;
	}

	if (options?.excludeCompleted) {
		const excludeCompleted = `status ne '${OrderStatus.COMPLETED}'`;
		filter = filter ? `${filter} and ${excludeCompleted}` : excludeCompleted;
	}

	return filter;
}
