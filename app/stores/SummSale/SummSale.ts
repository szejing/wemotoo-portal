import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import { getFormattedDate } from 'yeppi-common';
import { initialEmptySaleSumm } from './models/sale-summ.model';
import { initialEmptySaleSummItem } from './models/sale-summ-items.model';
import { initialEmptySaleSummPayment } from './models/sale-summ-payments.model';
import { initialEmptySaleSummCustomer } from './models/sale-summ-customer.model';
import type { Range } from '~/utils/interface';
import type { SummDaily_, SummCustomer_, SummProduct_, TotalSaleAmt_ } from '~/repository/modules/summ-sale/models/response/get-dashboard-summ.resp';

export const useSummSaleStore = defineStore('summSaleStore', {
	state: () => ({
		loading: false as boolean,
		errors: [] as string[],
		daily_summaries: [] as SummDaily_[],
		top_purchased_customers: [] as SummCustomer_[],
		top_purchased_products: [] as SummProduct_[],
		total_sale_amt: [] as TotalSaleAmt_[],
		sale_summ: initialEmptySaleSumm,
		sale_summ_items: initialEmptySaleSummItem,
		sale_summ_payments: initialEmptySaleSummPayment,
		sale_summ_customer: initialEmptySaleSummCustomer,
	}),
	actions: {
		async getDashboardSummary(range?: Range) {
			this.loading = true;
			const { $api } = useNuxtApp();

			let { start, end } = range ?? { start: undefined, end: undefined };

			if (end == undefined) {
				end = new Date();
				end.setHours(0, 0, 0, 0);
			}

			if (start == undefined) {
				start = new Date(end);
				start.setDate(start.getDate() - 7);
			}

			try {
				const data = await $api.summSales.getDashboardSalesSummary({
					start_date: getFormattedDate(start!),
					end_date: getFormattedDate(end!),
				});

				if (data.daily_summaries) {
					this.daily_summaries = data.daily_summaries;
				}

				if (data.top_purchased_customers) {
					this.top_purchased_customers = data.top_purchased_customers;
				}

				if (data.top_purchased_products) {
					this.top_purchased_products = data.top_purchased_products;
				}

				if (data.total_sale_amt) {
					this.total_sale_amt = data.total_sale_amt;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load sales summary';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},

		async updateSaleSummPageSize(size: number) {
			this.sale_summ.page_size = size;

			if (this.sale_summ.page_size > this.sale_summ.total_data) {
				this.sale_summ.current_page = 1;
				return;
			}

			this.getSaleSummary();
		},

		async updateSaleSummPage(page: number) {
			this.sale_summ.current_page = page;

			if (this.sale_summ.current_page < 0 || this.sale_summ.total_data === this.sale_summ.data.length) {
				return;
			}

			this.getSaleSummary();
		},

		async getSaleSummary() {
			this.sale_summ.loading = true;
			const { $api } = useNuxtApp();

			try {
				let filter = '';

				if (this.sale_summ.filter.status) {
					filter = `status eq '${this.sale_summ.filter.status}'`;
				}

				if (this.sale_summ.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.sale_summ.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.sale_summ.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.sale_summ.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.sale_summ.filter.date_range.end ? getFormattedDate(this.sale_summ.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.sale_summ.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const { data, '@odata.count': total } = await $api.summSales.getSummSales({
					$filter: filter,
					$orderby: 'biz_date desc,status asc',
					$top: this.sale_summ.page_size,
					$skip: (this.sale_summ.current_page - 1) * this.sale_summ.page_size,
				});

				if (data) {
					this.sale_summ.data = data;
					this.sale_summ.total_data = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load sales summary';
				failedNotification(message);
			} finally {
				this.sale_summ.loading = false;
			}
		},

		async exportSalesSummary() {
			this.sale_summ.exporting = true;
			const { $api } = useNuxtApp();

			try {
				let filter = '';

				if (this.sale_summ.filter.status) {
					filter = `status eq '${this.sale_summ.filter.status}'`;
				}

				if (this.sale_summ.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.sale_summ.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.sale_summ.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.sale_summ.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.sale_summ.filter.date_range.end ? getFormattedDate(this.sale_summ.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.sale_summ.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const blob = await $api.summSales.exportSalesSummary({
					$filter: filter,
					$orderby: 'biz_date desc,status asc',
					$top: this.sale_summ.page_size,
					$skip: (this.sale_summ.current_page - 1) * this.sale_summ.page_size,
				});

				if (blob) {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `sales_summary_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
					document.body.appendChild(link);
					link.click();

					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);

					successNotification('Sales summary exported successfully');
				} else {
					failedNotification('Failed to export sales summary');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load sales summary';
				failedNotification(message);
			} finally {
				this.sale_summ.loading = false;
			}
		},

		async updateSaleItemSummPageSize(size: number) {
			this.sale_summ_items.page_size = size;
			this.getSaleItemSummary();

			if (this.sale_summ_items.page_size > this.sale_summ_items.total_data) {
				this.sale_summ_items.current_page = 1;
				return;
			}

			this.getSaleItemSummary();
		},

		async updateSaleItemSummPage(page: number) {
			this.sale_summ_items.current_page = page;

			if (this.sale_summ_items.current_page < 0 || this.sale_summ_items.total_data === this.sale_summ_items.data.length) {
				return;
			}

			this.getSaleItemSummary();
		},

		async getSaleItemSummary() {
			this.sale_summ_items.loading = true;
			const { $api } = useNuxtApp();
			try {
				let filter = '';

				if (this.sale_summ_items.filter.item_status) {
					filter = `item_status eq '${this.sale_summ_items.filter.item_status}'`;
				}

				if (this.sale_summ_items.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.sale_summ_items.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.sale_summ_items.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.sale_summ_items.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.sale_summ_items.filter.date_range.end ? getFormattedDate(this.sale_summ_items.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.sale_summ_items.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const { data, '@odata.count': total } = await $api.summSales.getSummSalesItems({
					$filter: filter,
					$orderby: 'biz_date desc',
					$count: true,
					$top: this.sale_summ_items.page_size,
					$skip: (this.sale_summ_items.current_page - 1) * this.sale_summ_items.page_size,
				});
				if (data) {
					this.sale_summ_items.data = data;
					this.sale_summ_items.total_data = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load sales summary';
				failedNotification(message);
			} finally {
				this.sale_summ_items.loading = false;
			}
		},

		async exportSaleItemSummary() {
			this.sale_summ_items.exporting = true;
			const { $api } = useNuxtApp();
			try {
				let filter = '';

				if (this.sale_summ_items.filter.item_status) {
					filter = `item_status eq '${this.sale_summ_items.filter.item_status}'`;
				}

				if (this.sale_summ_items.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.sale_summ_items.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.sale_summ_items.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.sale_summ_items.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.sale_summ_items.filter.date_range.end ? getFormattedDate(this.sale_summ_items.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.sale_summ_items.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const blob = await $api.summSales.exportSalesItems({
					$filter: filter,
					$orderby: 'biz_date desc',
					$count: true,
					$top: this.sale_summ_items.page_size,
					$skip: (this.sale_summ_items.current_page - 1) * this.sale_summ_items.page_size,
				});

				if (blob) {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `sales_items_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
					document.body.appendChild(link);
					link.click();

					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
					successNotification('Sales items exported successfully');
				} else {
					failedNotification('Failed to export sales items');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load sales summary';
				failedNotification(message);
			} finally {
				this.sale_summ_items.exporting = false;
			}
		},

		async updateSalePaymentSummPageSize(size: number) {
			this.sale_summ_payments.page_size = size;
			this.getSalePaymentSummary();

			if (this.sale_summ_payments.page_size > this.sale_summ_payments.total_data) {
				this.sale_summ_payments.current_page = 1;
				return;
			}

			this.getSalePaymentSummary();
		},

		async updateSalePaymentSummPage(page: number) {
			this.sale_summ_payments.current_page = page;

			if (this.sale_summ_payments.current_page < 0 || this.sale_summ_payments.total_data === this.sale_summ_payments.data.length) {
				return;
			}

			this.getSalePaymentSummary();
		},

		async getSalePaymentSummary() {
			this.sale_summ_payments.loading = true;
			const { $api } = useNuxtApp();
			try {
				let filter = '';

				if (this.sale_summ_payments.filter.status) {
					filter = `status eq '${this.sale_summ_payments.filter.status}'`;
				}

				if (this.sale_summ_payments.filter.payment_status) {
					const paymentStatusFilter = `payment_status eq '${this.sale_summ_payments.filter.payment_status}'`;
					filter = filter ? `${filter} and ${paymentStatusFilter}` : paymentStatusFilter;
				}

				if (this.sale_summ_payments.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.sale_summ_payments.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.sale_summ_payments.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.sale_summ_payments.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.sale_summ_payments.filter.date_range.end ? getFormattedDate(this.sale_summ_payments.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.sale_summ_payments.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const { data, '@odata.count': total } = await $api.summSales.getSummSalesPayments({
					$filter: filter,
					$orderby: 'biz_date desc',
					$count: true,
					$top: this.sale_summ_payments.page_size,
					$skip: (this.sale_summ_payments.current_page - 1) * this.sale_summ_payments.page_size,
				});

				if (data) {
					this.sale_summ_payments.data = data;
					this.sale_summ_payments.total_data = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load sales summary';
				failedNotification(message);
			} finally {
				this.sale_summ_payments.loading = false;
			}
		},

		async exportSalePaymentSummary() {
			this.sale_summ_payments.exporting = true;
			const { $api } = useNuxtApp();
			try {
				let filter = '';

				if (this.sale_summ_payments.filter.status) {
					filter = `status eq '${this.sale_summ_payments.filter.status}'`;
				}

				if (this.sale_summ_payments.filter.payment_status) {
					const paymentStatusFilter = `payment_status eq '${this.sale_summ_payments.filter.payment_status}'`;
					filter = filter ? `${filter} and ${paymentStatusFilter}` : paymentStatusFilter;
				}

				if (this.sale_summ_payments.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.sale_summ_payments.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.sale_summ_payments.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.sale_summ_payments.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.sale_summ_payments.filter.date_range.end ? getFormattedDate(this.sale_summ_payments.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.sale_summ_payments.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const blob = await $api.summSales.exportSalesPayments({
					$filter: filter,
					$orderby: 'biz_date desc',
					$count: true,
					$top: this.sale_summ_payments.page_size,
					$skip: (this.sale_summ_payments.current_page - 1) * this.sale_summ_payments.page_size,
				});

				if (blob) {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `sales_payments_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
					document.body.appendChild(link);
					link.click();

					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);

					successNotification('Sales payments exported successfully');
				} else {
					failedNotification('Failed to export sales payments');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load sales summary';
				failedNotification(message);
			} finally {
				this.sale_summ_payments.loading = false;
			}
		},

		async getSaleCustomerSummary() {
			this.sale_summ_customer.loading = true;
			const { $api } = useNuxtApp();

			try {
				let filter = '';

				if (this.sale_summ_customer.filter.status) {
					filter = `status eq '${this.sale_summ_customer.filter.status}'`;
				}

				if (this.sale_summ_customer.filter.currency_code) {
					const currencyFilter = `currency_code eq '${this.sale_summ_customer.filter.currency_code}'`;
					filter = filter ? `${filter} and ${currencyFilter}` : currencyFilter;
				}

				if (this.sale_summ_customer.filter.date_range.end) {
					const dateFilter = `(biz_date between '${getFormattedDate(this.sale_summ_customer.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.sale_summ_customer.filter.date_range.end ? getFormattedDate(this.sale_summ_customer.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				} else {
					const dateFilter = `biz_date le '${getFormattedDate(this.sale_summ_customer.filter.date_range.start!, 'yyyy-MM-dd')}'`;
					filter = filter ? `${filter} and ${dateFilter}` : dateFilter;
				}

				const { data } = await $api.summSales.getSummSalesCustomers({
					$filter: filter,
					$orderby: 'biz_date desc',
					$count: true,
					$top: this.sale_summ_customer.page_size,
					$skip: (this.sale_summ_customer.current_page - 1) * this.sale_summ_customer.page_size,
				});

				if (data) {
					this.sale_summ_customer.data = data;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load sales summary';
				failedNotification(message);
			} finally {
				this.sale_summ_customer.loading = false;
			}
		},

		async exportSaleCustomerSummary() {
			this.sale_summ_customer.exporting = true;
			const { $api } = useNuxtApp();

			try {
				let filter = `status eq '${this.sale_summ_customer.filter.status}'`;

				if (this.sale_summ_customer.filter.currency_code) {
					filter += ` and currency_code eq '${this.sale_summ_customer.filter.currency_code}'`;
				}

				if (this.sale_summ_customer.filter.date_range.end) {
					filter += ` and (biz_date between '${getFormattedDate(this.sale_summ_customer.filter.date_range.start!, 'yyyy-MM-dd')}' and '${
						this.sale_summ_customer.filter.date_range.end ? getFormattedDate(this.sale_summ_customer.filter.date_range.end!, 'yyyy-MM-dd') : undefined
					}')`;
				} else {
					filter += ` and biz_date le '${getFormattedDate(this.sale_summ_customer.filter.date_range.start!, 'yyyy-MM-dd')}'`;
				}

				const blob = await $api.summSales.exportSalesCustomers({
					$filter: filter,
					$orderby: 'biz_date desc',
					$count: true,
					$top: this.sale_summ_customer.page_size,
					$skip: (this.sale_summ_customer.current_page - 1) * this.sale_summ_customer.page_size,
				});

				if (blob) {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `sales_customers_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
					document.body.appendChild(link);
					link.click();

					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);

					successNotification('Sales customers exported successfully');
				} else {
					failedNotification('Failed to export sales customers');
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load sales summary';
				failedNotification(message);
			} finally {
				this.sale_summ_customer.exporting = false;
			}
		},
	},
});
