import type { PaymentMethod } from '~/utils/types/payment-method';
import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import { options_page_size } from '~/utils/options';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { UpdatePaymentMethodBody } from '~/repository/modules/payment-method/models/request/update-payment-method.req';

type PaymentMethodFilter = {
	query: string;
	currency_code: string;
	page_size: number;
	current_page: number;
};

const initialEmptyPaymentMethodFilter: PaymentMethodFilter = {
	query: '',
	currency_code: 'MYR',
	page_size: options_page_size[0] as number,
	current_page: 1,
};

export const usePaymentMethodStore = defineStore('paymentMethodStore', {
	state: () => ({
		payment_methods: [] as PaymentMethod[],
		total_payment_methods: 0 as number,
		filter: initialEmptyPaymentMethodFilter,
		loading: false as boolean,
		updating: false as boolean,
		exporting: false as boolean,
	}),

	actions: {
		async updatePageSize(size: number) {
			this.filter.page_size = size;

			if (this.filter.page_size > this.payment_methods.length) {
				this.filter.current_page = 1;
				return;
			}

			this.getPaymentMethods();
		},

		async updatePage(page: number) {
			this.filter.current_page = page;

			if (this.filter.current_page < 0 || this.payment_methods.length === this.total_payment_methods) {
				return;
			}

			this.getPaymentMethods();
		},

		async getPaymentMethods() {
			this.loading = true;
			const { $api } = useNuxtApp();
			try {
				const { query, currency_code } = this.filter;

				let filter = '';

				// Add currency filter
				if (currency_code && currency_code !== 'MYR') {
					filter = `currency_code eq '${currency_code}'`;
				}

				const queryParams: BaseODataReq = {
					$top: this.filter.page_size,
					$count: true,
					$skip: (this.filter.current_page - 1) * this.filter.page_size,
					$orderby: 'short_desc asc',
				};

				// Only add $filter if it's not empty
				if (filter) {
					queryParams.$filter = filter;
				}

				// Use backend $search support for text search
				if (query) {
					queryParams.$search = query;
				}

				const { data, '@odata.count': total } = await $api.paymentMethod.getMany(queryParams);

				if (data) {
					this.payment_methods = data;
					this.total_payment_methods = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process payment method';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},

		async updateStatus(request: PaymentMethod, is_active: boolean) {
			await this.updatePaymentMethod(request.code, { is_active });
		},

		async updatePaymentMethod(code: string, paymentMethod: UpdatePaymentMethodBody) {
			this.updating = true;

			const { $api } = useNuxtApp();

			try {
				// Build payload with only defined fields (partial update: omit = no change)
				const body: UpdatePaymentMethodBody = {};
				if (paymentMethod.desc !== undefined) body.desc = paymentMethod.desc;
				if (paymentMethod.short_desc !== undefined) body.short_desc = paymentMethod.short_desc;
				if (paymentMethod.logo !== undefined) body.logo = paymentMethod.logo;
				if (paymentMethod.is_active !== undefined) body.is_active = paymentMethod.is_active;
				if (paymentMethod.is_sandbox !== undefined) body.is_sandbox = paymentMethod.is_sandbox;
				if (paymentMethod.type !== undefined) body.type = paymentMethod.type;
				if (paymentMethod.currency_code !== undefined) body.currency_code = paymentMethod.currency_code;
				if (paymentMethod.provider_code !== undefined) body.provider_code = paymentMethod.provider_code;
				if (paymentMethod.metadata !== undefined) body.metadata = paymentMethod.metadata;

				const data = await $api.paymentMethod.update(code, body);

				if (data.method) {
					successNotification(`${data.method.code} - Payment method updated`);
					await this.getPaymentMethods();
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to process payment method';
				failedNotification(message);
			} finally {
				this.updating = false;
			}
		},

		async exportPaymentMethods() {
			this.exporting = true;
			// const { $api } = useNuxtApp();
			// try {
			// 	const blob = await $api.paymentMethod.exportPaymentMethods();
			// } catch (err: any) {
			// 	console.error(err);
			// 	failedNotification(err.message);
			// } finally {
			// 	this.exporting = false;
			// }
		},
	},
});
