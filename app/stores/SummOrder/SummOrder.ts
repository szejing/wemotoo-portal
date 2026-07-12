import type { SummDaily, SummCustomer, SummProduct } from '~/utils/types/summ-orders';
import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import { initialEmptyOrderSumm } from './model/order-summ.model';
import { initialEmptyOrderSummItem } from './model/order-summ-item.model';
import { getFormattedDate } from 'yeppi-common';
import { initialEmptyOrderSummCustomer } from './model/order-summ-customer.model';
import type { Range } from '~/utils/interface';
import { buildSummOrderItemODataFilter } from '~/utils/summ-order-item-filter';

type TotalOrderAmt = {
	currency_code: string;
	total_order_amt: number;
};

export const useSummOrderStore = defineStore('summOrderStore', {
	state: () => ({
		loading: false as boolean,
		errors: [] as string[],
		daily_summaries: [] as SummDaily[],
		top_purchased_customers: [] as SummCustomer[],
		top_purchased_products: [] as SummProduct[],
		new_orders: 0 as number,
		new_customers: 0 as number,
		total_order_amt: [] as TotalOrderAmt[],
		new_appointments: 0 as number,
		pending_payments: 0 as number,
		pending_actions: 0 as number,
		dashboard_date_range: null as Range | null,
		order_summ: initialEmptyOrderSumm,
		order_summ_item: initialEmptyOrderSummItem,
		order_summ_customer: initialEmptyOrderSummCustomer,
	}),
	actions: {
		async getDashboardSummary(range?: Range) {
			this.loading = true;
			let { start, end } = range ?? { start: undefined, end: undefined };
			const { $api } = useNuxtApp();

			if (end == undefined) {
				end = new Date();
				end.setHours(0, 0, 0, 0);
			}

			if (start == undefined) {
				start = new Date(end);
				start.setDate(start.getDate() - 7);
			}

			this.dashboard_date_range = { start: start!, end: end! };

			try {
				const data = await $api.summOrder.getDashboardOrderSummary({
					start_date: getFormattedDate(start!),
					end_date: getFormattedDate(end!),
				});

				this.daily_summaries = data.daily_summaries;
				this.top_purchased_customers = data.top_purchased_customers;
				this.top_purchased_products = data.top_purchased_products;
				this.new_orders = data.new_orders;
				this.new_customers = data.new_customers;
				this.total_order_amt = data.total_order_amt;
				this.new_appointments = data.new_appointments;
				this.pending_payments = data.pending_payments;
				this.pending_actions = data.pending_actions;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load order summary';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},

		async updateOrderSummPageSize(size: number) {
			this.order_summ.page_size = size;

			if (this.order_summ.page_size > this.order_summ.total_data) {
				this.order_summ.current_page = 1;
				return;
			}

			this.getOrderSummary();
		},

		async updateOrderSummPage(page: number) {
			this.order_summ.current_page = page;

			if (this.order_summ.current_page < 0 || this.order_summ.total_data === this.order_summ.data.length) {
				return;
			}

			this.getOrderSummary();
		},

		async getOrderSummary() {
			this.order_summ.loading = true;
			const { $api } = useNuxtApp();

			try {
				let filter = '';

				if (this.order_summ.filter.status) {
					filter = `status eq '${this.order_summ.filter.status}'`;
				}

				if (this.order_summ.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.order_summ.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.order_summ.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.order_summ.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.order_summ.filter.date_range.end ? getFormattedDate(this.order_summ.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.order_summ.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const { data, '@odata.count': total } = await $api.summOrder.getSummOrders({
					$filter: filter,
					$orderby: 'biz_date desc,status asc',
					$count: true,
					$top: this.order_summ.page_size,
					$skip: (this.order_summ.current_page - 1) * this.order_summ.page_size,
				});

				if (data) {
					this.order_summ.data = data;
					this.order_summ.total_data = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load order summary';
				failedNotification(message);
			} finally {
				this.order_summ.loading = false;
			}
		},

		async exportOrderSummary() {
			this.order_summ.exporting = true;
			const { $api } = useNuxtApp();

			try {
				let filter = '';

				if (this.order_summ.filter.status) {
					filter = `status eq '${this.order_summ.filter.status}'`;
				}

				if (this.order_summ.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.order_summ.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.order_summ.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.order_summ.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.order_summ.filter.date_range.end ? getFormattedDate(this.order_summ.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.order_summ.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const blob = await $api.summOrder.exportSummOrders({
					$filter: filter,
					$orderby: 'biz_date desc,status asc',
				});

				if (blob) {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `summ_orders_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
					document.body.appendChild(link);
					link.click();

					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);

					successNotification('Order summary exported successfully');
				} else {
					failedNotification('Failed to export order summary');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load order summary';
				failedNotification(message);
			} finally {
				this.order_summ.loading = false;
			}
		},

		async updateOrderItemSummPageSize(size: number) {
			this.order_summ_item.page_size = size;
			this.getOrderItemSummary();

			if (this.order_summ_item.page_size > this.order_summ_item.total_data) {
				this.order_summ_item.current_page = 1;
				return;
			}
		},

		async updateOrderItemSummPage(page: number) {
			this.order_summ_item.current_page = page;

			if (this.order_summ_item.current_page < 0 || this.order_summ_item.total_data === this.order_summ_item.data.length) {
				return;
			}

			this.getOrderItemSummary();
		},

		async getOrderItemSummary() {
			this.order_summ_item.loading = true;
			const { $api } = useNuxtApp();

			try {
				const filter = buildSummOrderItemODataFilter(this.order_summ_item.filter);

				const { data, '@odata.count': total } = await $api.summOrder.getSummOrderItems({
					$filter: filter,
					$orderby: 'biz_date desc',
					$count: true,
					$top: this.order_summ_item.page_size,
					$skip: (this.order_summ_item.current_page - 1) * this.order_summ_item.page_size,
				});

				if (data) {
					this.order_summ_item.data = data;
					this.order_summ_item.total_data = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load order summary';
				failedNotification(message);
			} finally {
				this.order_summ_item.loading = false;
			}
		},

		async exportOrderItemSummary() {
			this.order_summ_item.exporting = true;
			const { $api } = useNuxtApp();

			try {
				const filter = buildSummOrderItemODataFilter(this.order_summ_item.filter);

				const blob = await $api.summOrder.exportSummOrderItems({
					$filter: filter,
					$orderby: 'biz_date desc',
				});

				if (blob) {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `summ_order_items_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
					document.body.appendChild(link);
					link.click();

					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);

					successNotification('Order items exported successfully');
				} else {
					failedNotification('Failed to export order items');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load order summary';
				failedNotification(message);
			} finally {
				this.order_summ_item.exporting = false;
			}
		},

		async updateOrderCustomerSummPageSize(size: number) {
			this.order_summ_customer.page_size = size;
			this.getOrderCustomerSummary();

			if (this.order_summ_customer.page_size > this.order_summ_customer.total_data) {
				this.order_summ_customer.current_page = 1;
				return;
			}
		},

		async updateOrderCustomerSummPage(page: number) {
			this.order_summ_customer.current_page = page;

			if (this.order_summ_customer.current_page < 0 || this.order_summ_customer.total_data === this.order_summ_customer.data.length) {
				return;
			}

			this.getOrderCustomerSummary();
		},

		async getOrderCustomerSummary() {
			this.order_summ_customer.loading = true;
			const { $api } = useNuxtApp();

			try {
				let filter = '';

				if (this.order_summ_customer.filter.status) {
					filter = `status eq '${this.order_summ_customer.filter.status}'`;
				}

				if (this.order_summ_customer.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.order_summ_customer.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.order_summ_customer.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.order_summ_customer.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.order_summ_customer.filter.date_range.end ? getFormattedDate(this.order_summ_customer.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.order_summ_customer.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const { data, '@odata.count': total } = await $api.summOrder.getSummOrderCustomers({
					$filter: filter,
					$orderby: 'biz_date desc',
					$count: true,
					$top: this.order_summ_customer.page_size,
					$skip: (this.order_summ_customer.current_page - 1) * this.order_summ_customer.page_size,
				});

				if (data) {
					this.order_summ_customer.data = data;
					this.order_summ_customer.total_data = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load order summary';
				failedNotification(message);
			} finally {
				this.order_summ_customer.loading = false;
			}
		},

		async exportOrderCustomerSummary() {
			this.order_summ_customer.exporting = true;
			const { $api } = useNuxtApp();

			try {
				let filter = `status eq '${this.order_summ_customer.filter.status}'`;

				if (this.order_summ_customer.filter.currency_code) {
					filter += ` and currency_code eq '${this.order_summ_customer.filter.currency_code}'`;
				}

				if (this.order_summ_customer.filter.date_range.end) {
					filter += ` and (biz_date between '${getFormattedDate(this.order_summ_customer.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.order_summ_customer.filter.date_range.end ? getFormattedDate(this.order_summ_customer.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
				} else {
					filter += ` and biz_date le '${getFormattedDate(this.order_summ_customer.filter.date_range.start!, 'yyyy-MM-dd')}'`;
				}

				const blob = await $api.summOrder.exportSummOrderCustomers({
					$filter: filter,
					$orderby: 'biz_date desc',
				});

				if (blob) {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `summ_order_customers_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
					document.body.appendChild(link);
					link.click();

					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);

					successNotification('Order customers exported successfully');
				} else {
					failedNotification('Failed to export order customers');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load order summary';
				failedNotification(message);
			} finally {
				this.order_summ_customer.exporting = false;
			}
		},
	},
});
