import { defineStore } from 'pinia';
import { KEY } from 'yeppi-common';
import { options_page_size } from '~/utils/options';
import type { Customer } from '~/utils/types/customer';
import type { OrderHistory } from '~/utils/types/order-history';
import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import { sub } from 'date-fns';
import type { Range } from '~/utils/interface';
import { getFormattedDate } from 'yeppi-common';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { CustomerInsightInput } from '~/repository/modules/customer/models/request/customer-insights.req';
import type { CustomerImportResp } from '~/repository/modules/customer/customer';

type CustomerFilter = {
	query: string;
	joined_date: Range;
	page_size: number;
	current_page: number;
};

const initialEmptyCustomerFilter: CustomerFilter = {
	query: '',
	joined_date: {
		start: sub(new Date(), { days: 14 }),
		end: new Date(),
	},
	page_size: options_page_size[0] as number,
	current_page: 1,
};

export const useCustomerStore = defineStore('customerStore', {
	state: () => ({
		loading: false as boolean,
		processing: false as boolean,
		exporting: false as boolean,
		importing: false as boolean,
		customers: [] as Customer[],
		total_customers: 0 as number,
		errors: [] as string[],
		filter: initialEmptyCustomerFilter,
		current_customer: null as Customer | null,
		customer_orders: [] as OrderHistory[],
	}),
	actions: {
		async updatePageSize(size: number) {
			this.filter.page_size = size;

			if (this.filter.page_size > this.customers.length) {
				this.filter.current_page = 1;
				return;
			}

			this.getCustomers();
		},

		async updatePage(page: number) {
			this.filter.current_page = page;

			if (this.filter.current_page < 0 || this.customers.length === this.total_customers) {
				return;
			}

			this.getCustomers();
		},

		async getCustomers() {
			this.loading = true;
			const { $api } = useNuxtApp();
			try {
				const { query } = this.filter;

				const queryParams: BaseODataReq = {
					$top: this.filter.page_size,
					$count: true,
					$skip: (this.filter.current_page - 1) * this.filter.page_size,
					$orderby: 'created_at desc',
				};

				// Use backend $search support for text search
				if (query) {
					queryParams.$search = query;
				}

				const { data, '@odata.count': total } = await $api.customer.getMany(queryParams);

				console.log(data);
				if (data) {
					this.customers = data;
					this.total_customers = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load customers';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},

		async getCustomer(cust_no: string): Promise<Customer | null> {
			this.loading = true;
			const { $api } = useNuxtApp();
			try {
				const resp = await $api.customer.getSingle(cust_no);
				this.current_customer = resp?.customer ?? null;
				return this.current_customer;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load customer';
				failedNotification(message);
				return null;
			} finally {
				this.loading = false;
			}
		},

		async getCustomerOrders(cust_no: string): Promise<OrderHistory[]> {
			this.loading = true;
			const { $api } = useNuxtApp();
			try {
				const resp = await $api.customer.getOrders(cust_no);
				const list = resp?.data ?? resp?.value ?? [];
				this.customer_orders = list;

				console.log(this.customer_orders);
				return this.customer_orders;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load customer orders';
				failedNotification(message);
				return [];
			} finally {
				this.loading = false;
			}
		},

		async addCustomerInsight(cust_no: string, insight: CustomerInsightInput): Promise<Customer | null> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.processing = true;

			try {
				const response = await $api.customer.updateInsights(cust_no, {
					merchant_id: String(merchant_id ?? ''),
					action: 'add',
					insight,
				});
				this.current_customer = response?.customer ?? this.current_customer;
				successNotification('Customer insight added');
				return this.current_customer;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to add customer insight';
				failedNotification(message);
				return null;
			} finally {
				this.processing = false;
			}
		},

		async removeCustomerInsight(cust_no: string, insight_id: string): Promise<Customer | null> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.processing = true;

			try {
				const response = await $api.customer.updateInsights(cust_no, {
					merchant_id: String(merchant_id ?? ''),
					action: 'remove',
					insight_id,
				});
				this.current_customer = response?.customer ?? this.current_customer;
				successNotification('Customer insight removed');
				return this.current_customer;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to remove customer insight';
				failedNotification(message);
				return null;
			} finally {
				this.processing = false;
			}
		},

		async exportCustomers() {
			this.exporting = true;
			// const { $api } = useNuxtApp();
			// try {
			// 	const blob = await $api.customer.exportCustomers();
			// } catch (err: any) {
			// 	console.error(err);
			// 	failedNotification(err.message);
			// } finally {
			// 	this.exporting = false;
			// }
		},

		async importCustomers(file: File): Promise<CustomerImportResp> {
			this.importing = true;
			const { $api } = useNuxtApp();

			try {
				const result = await $api.customer.importCustomers(file);
				const created = result.created ?? 0;
				const updated = result.updated ?? 0;
				const failed = result.failed ?? 0;

				if (failed > 0) {
					failedNotification(`Customer import completed with ${failed} failed row(s)`);
				} else {
					successNotification(`Customer import completed: ${created} created, ${updated} updated`);
				}

				await this.getCustomers();
				return result;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? (err instanceof Error ? err.message : 'Failed to import customers');
				failedNotification(message);
				throw new Error(message);
			} finally {
				this.importing = false;
			}
		},

		async downloadImportTemplate() {
			const { $api } = useNuxtApp();
			this.processing = true;

			try {
				const blob = await $api.customer.downloadImportTemplate();
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `customer_import_template_${getFormattedDate(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
				successNotification('Customer import template downloaded');
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to download customer import template';
				failedNotification(message);
			} finally {
				this.processing = false;
			}
		},
	},
});
