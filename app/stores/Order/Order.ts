/* eslint-disable indent */
/* eslint-disable @stylistic/indent */
import { defineStore } from 'pinia';
import { defaultOrderRelations, getFormattedDate, removeDuplicateExpands, OrderStatus, PaymentStatus, type OrderResendEmailAction } from 'yeppi-common';
import { getDefaultOrderStatuses, options_page_size } from '~/utils/options';
import { buildOrderStatusODataFilter } from '~/utils/order-status-filter';
import { buildOrderExportQueryParams, type OrderExportOptions } from '~/utils/order-export';
import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import type { CustomerModel } from '~/utils/models/customer.model';
import type { ItemModel } from '~/utils/models/item.model';
import type { PaymentModel } from '~/utils/models/payment.model';
import type { Range } from '~/utils/interface';
import { sub } from 'date-fns';
import type { CustomerRequest, OrderHistory } from '~/utils/types/order-history';

type OrderFilter = {
	query: string;
	/** Selected order statuses; defaults to all statuses selected. */
	statuses: OrderStatus[];
	payment_status: PaymentStatus | undefined;
	payment_method: string | undefined;
	date_range: Range;
	page_size: number;
	current_page: number;
	currency_code: string;
};

const initialEmptyOrderFilter: OrderFilter = {
	query: '',
	statuses: getDefaultOrderStatuses(),
	payment_status: undefined,
	payment_method: undefined,
	date_range: {
		start: sub(new Date(), { days: 14 }),
		end: new Date(),
	},
	page_size: options_page_size[0] as number,
	current_page: 1,
	currency_code: 'MYR',
};

const getPendingCustomerRequest = (order: OrderHistory): CustomerRequest | undefined =>
	order.customer_requests?.find((request) => request.status === 'pending');

const isPendingCustomerRequest = (order: OrderHistory) => getPendingCustomerRequest(order) != null;

export const useOrderStore = defineStore('orderStore', {
	state: () => ({
		loading: false as boolean,
		updating: false as boolean,
		exporting: false as boolean,
		resending_email: false as boolean,
		urgent_customer_requests_loading: false as boolean,
		orders: [] as OrderHistory[],
		urgent_customer_requests: [] as OrderHistory[],
		total_orders: 0 as number,
		filter: initialEmptyOrderFilter,
	}),
	actions: {
		async updateOrderPageSize(size: number) {
			this.filter.page_size = size;

			if (this.filter.page_size > this.total_orders) {
				this.filter.current_page = 1;
				return;
			}

			this.getOrders();
		},

		async updateOrderPage(page: number) {
			this.filter.current_page = page;

			if (this.filter.current_page < 0 || this.total_orders === this.orders.length) {
				return;
			}

			this.getOrders();
		},

		async getOrders(range?: Range, options?: { excludeCompleted?: boolean }) {
			this.loading = true;
			const { $api } = useNuxtApp();
			try {
				let filter = buildOrderStatusODataFilter(this.filter.statuses, {
					payment_method: this.filter.payment_method,
					excludeCompleted: options?.excludeCompleted,
				});

				if (this.filter.payment_status) {
					const paymentFilter = `payment_status eq '${this.filter.payment_status}'`;
					filter = filter ? `${filter} and ${paymentFilter}` : paymentFilter;
				}

				let { start, end } = range ?? this.filter.date_range;

				start = start ?? new Date();
				end = end ?? new Date();

				// Add date filter
				const dateFilter = end
					? `(biz_date between '${getFormattedDate(start, 'yyyy-MM-dd')}' and '${getFormattedDate(end, 'yyyy-MM-dd')}')`
					: `biz_date le '${getFormattedDate(start, 'yyyy-MM-dd')}'`;

				filter = filter ? `${filter} and ${dateFilter}` : dateFilter;

				const queryParams = {
					$top: this.filter.page_size,
					$skip: (this.filter.current_page - 1) * this.filter.page_size,
					$count: true,
					$filter: filter,
					$expand: removeDuplicateExpands(defaultOrderRelations).join(','),
					$orderby: 'biz_date desc, created_at desc',
				} as const;

				// Use backend $search support for text search
				if (this.filter.query) {
					(queryParams as any).$search = this.filter.query;
				}

				const { data, '@odata.count': total } = await $api.order.getOrders(queryParams);

				if (data) {
					this.orders = data;
					this.total_orders = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process order';
				failedNotification(message);
				throw err;
			} finally {
				this.loading = false;
			}
		},

		async getUrgentCustomerRequests(range?: Range) {
			this.urgent_customer_requests_loading = true;
			const { $api } = useNuxtApp();

			try {
				let { start, end } = range ?? this.filter.date_range;

				start = start ?? new Date();
				end = end ?? new Date();

				const dateFilter = end
					? `(biz_date between '${getFormattedDate(start, 'yyyy-MM-dd')}' and '${getFormattedDate(end, 'yyyy-MM-dd')}')`
					: `biz_date le '${getFormattedDate(start, 'yyyy-MM-dd')}'`;

				const { data } = await $api.order.getOrders({
					$top: 10,
					$skip: 0,
					$count: false,
					$filter: `status eq '${OrderStatus.REQUIRES_ACTION}' and ${dateFilter}`,
					$expand: removeDuplicateExpands(defaultOrderRelations).join(','),
					$orderby: 'updated_at desc, biz_date desc, created_at desc',
				});

				this.urgent_customer_requests = (data ?? []).filter(isPendingCustomerRequest);
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load customer requests';
				failedNotification(message);
				throw err;
			} finally {
				this.urgent_customer_requests_loading = false;
			}
		},

		async getOrderByOrderNo(order_no: string): Promise<OrderHistory | undefined> {
			this.loading = true;
			const { $api } = useNuxtApp();
			try {
				const data = await $api.order.getOrderByOrderNo(order_no);

				return data.order;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process order';
				failedNotification(message);
				throw err;
			} finally {
				this.loading = false;
			}
		},

		async updateStatus(order_no: string, customer_no: string, status: OrderStatus, type: string): Promise<boolean> {
			const { $api } = useNuxtApp();
			this.updating = true;

			try {
				if (type === 'order') {
					const data = await $api.order.updateStatus(order_no, customer_no, status);
					return !!(data?.status && status !== OrderStatus.COMPLETED);
				} else {
					const data = await $api.sale.updateStatus(order_no, customer_no, status);
					return !!data?.status;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process order';
				failedNotification(message);
				throw err;
			} finally {
				this.updating = false;
			}
		},

		async updateOrder(order_no: string, customer_no: string, payment_status: PaymentStatus) {
			const { $api } = useNuxtApp();

			try {
				const data = await $api.order.updateOrder(order_no, customer_no, payment_status);

				if (data.status) {
					successNotification('Payment status updated successfully');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process order';
				failedNotification(message);
				throw err;
			}
		},

		async updatePayments(order_no: string, customer_no: string, payment: PaymentModel, existingPayments: PaymentModel[]) {
			const { $api } = useNuxtApp();

			let payments: PaymentModel[] = [];

			if (existingPayments.length === 0) {
				payment.payment_line = 1;
				payments = [payment];
			} else {
				payments = existingPayments;
			}

			try {
				const data = await $api.order.updatePayments(order_no, customer_no, payments);

				if (data.status) {
					successNotification('Payment Info Added successfully');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process order';
				failedNotification(message);
				throw err;
			}
		},

		async updateCustomer(order_no: string, customer: CustomerModel) {
			const { $api } = useNuxtApp();

			try {
				const data = await $api.order.updateCustomer(order_no, customer);

				if (data.status) {
					successNotification('Customer updated successfully');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process order';
				failedNotification(message);
				throw err;
			}
		},

		async updateItems(order_no: string, customer_no: string, item: ItemModel, existingItems: ItemModel[]) {
			const { $api } = useNuxtApp();

			try {
				const items = existingItems.map((orderItem) => {
					if (orderItem.item_line === item.item_line) {
						return item;
					}
					return orderItem;
				});

				const data = await $api.order.updateItems(order_no, customer_no, items);

				if (data.status) {
					successNotification('Order item updated successfully');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process order';
				failedNotification(message);
				throw err;
			}
		},

		async resendCurrentStatusEmail(order_no: string, action: OrderResendEmailAction): Promise<boolean> {
			const { $api } = useNuxtApp();
			this.resending_email = true;

			try {
				const data = await $api.order.resendCurrentStatusEmail(order_no, action);

				if (data.status) {
					successNotification('Email resent successfully');
				}

				return !!data.status;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to resend email';
				failedNotification(message);
				throw err;
			} finally {
				this.resending_email = false;
			}
		},

		async exportOrders(options: OrderExportOptions) {
			this.exporting = true;
			const { $api } = useNuxtApp();
			try {
				const queryParams = buildOrderExportQueryParams(options);
				const blob = await $api.order.exportOrders(queryParams);

				if (blob) {
					// Create a download link and trigger download
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					const suffix = options.include_item_details ? '_detail' : '';
					link.download = `orders${suffix}_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
					document.body.appendChild(link);
					link.click();

					// Cleanup
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);

					successNotification('Orders exported successfully');
				} else {
					failedNotification('Failed to export orders');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process order';
				failedNotification(message);
				throw err;
			} finally {
				this.exporting = false;
			}
		},
	},
});
