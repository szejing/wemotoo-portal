import { defineStore } from 'pinia';
import { defaultShippingMethodRelations, KEY, removeDuplicateExpands } from 'yeppi-common';
import { options_page_size } from '../../utils/options';
import { successNotification, failedNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { ShippingMethodOption } from '~/utils/types/order-fulfillment-shipping';
import type { ShippingMethodUpdateBody, ShippingMethodWriteBody } from '~/repository/modules/shipping-method/models/request/create-shipping-method.req';
import type { ShippingMethodFormFields } from '~/utils/types/form/shipping-method-form';
import type { ResolveShippingMethodsReq } from '~/repository/modules/shipping-method/models/request/resolve-shipping-methods.req';

type ShippingMethodFilter = {
	query: string;
	status: 'active' | 'inactive' | undefined;
	current_page: number;
	page_size: number;
};

const initialEmptyFilter: ShippingMethodFilter = {
	query: '',
	status: undefined,
	current_page: 1,
	page_size: options_page_size[0] as number,
};

const initialEmptyNewShippingMethod: ShippingMethodFormFields = {
	description: '',
	priority: 1,
	is_active: true,
};

export const useShippingMethodStore = defineStore('shippingMethodStore', {
	state: () => ({
		loading: false as boolean,
		adding: false as boolean,
		updating: false as boolean,
		removing: false as boolean,
		exporting: false as boolean,
		methods: [] as ShippingMethodOption[],
		total_shipping_methods: 0 as number,
		current_shipping_method: undefined as ShippingMethodOption | undefined,
		new_shipping_method: structuredClone(initialEmptyNewShippingMethod),
		filter: initialEmptyFilter,
		errors: [] as string[],
	}),
	getters: {
		getDisplayMethods: (state) => state.methods,
	},
	actions: {
		resetNewShippingMethod() {
			this.new_shipping_method = structuredClone(initialEmptyNewShippingMethod);
		},

		async updatePageSize(size: number) {
			this.filter.page_size = size;
			this.filter.current_page = 1;
			await this.getShippingMethods();
		},

		async updatePage(page: number) {
			this.filter.current_page = page;

			if (this.filter.current_page < 0) {
				return;
			}

			await this.getShippingMethods();
		},

		async getShippingMethods(append = false) {
			const { $api } = useNuxtApp();

			try {
				const queryParams: BaseODataReq = {
					$top: this.filter.page_size,
					$count: true,
					$skip: (this.filter.current_page - 1) * this.filter.page_size,
					$expand: removeDuplicateExpands(defaultShippingMethodRelations).join(','),
					$orderby: 'priority desc',
				};

				const q = this.filter.query.trim();
				if (q) {
					queryParams.$search = q;
				}

				if (this.filter.status === 'active') {
					queryParams.$filter = 'is_active eq true';
				} else if (this.filter.status === 'inactive') {
					queryParams.$filter = 'is_active eq false';
				}

				const resp = await $api.shippingMethod.getMany(queryParams);
				const data = resp.data ?? resp.value ?? [];
				const total = resp['@odata.count'] ?? resp.count ?? 0;

				if (data) {
					this.methods = append ? [...this.methods, ...data] : data;
					this.total_shipping_methods = total ?? 0;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load shipping methods';
				failedNotification(message);
				throw err;
			}
		},

		async loadMoreShippingMethods() {
			if (this.loading || this.methods.length >= this.total_shipping_methods) return;

			this.loading = true;
			this.filter.current_page += 1;

			try {
				await this.getShippingMethods(true);
			} finally {
				this.loading = false;
			}
		},

		async resolveFulfillmentMethods(params: Omit<ResolveShippingMethodsReq, 'merchant_id'>): Promise<ShippingMethodOption[]> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;

			try {
				const response = await $api.shippingMethod.resolveMethods({
					merchant_id: String(merchant_id ?? ''),
					...params,
				});
				return (response.shipping_methods ?? [])
					.map((row) => ({ ...row.shipping_method, fee: Number(row.effective_fee) }))
					.filter((method) => method.is_active);
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to resolve shipping methods';
				failedNotification(message);
				throw err;
			}
		},

		async exportShippingMethods() {
			this.exporting = true;
			try {
				// Export not wired for shipping methods yet
			} finally {
				this.exporting = false;
			}
		},

		async getShippingMethod(id: string): Promise<ShippingMethodOption | undefined> {
			const { $api } = useNuxtApp();
			this.loading = true;

			try {
				const response = await $api.shippingMethod.getSingle(id);

				this.current_shipping_method = response.shipping_method;
				return response.shipping_method;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load shipping method';
				failedNotification(message);
				throw err;
			} finally {
				this.loading = false;
			}
		},

		async createShippingMethod(payload: ShippingMethodWriteBody): Promise<ShippingMethodOption | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.adding = true;

			try {
				const response = await $api.shippingMethod.create({
					merchant_id: String(merchant_id ?? ''),
					...payload,
				});
				this.current_shipping_method = response.shipping_method;
				await this.getShippingMethods();
				this.resetNewShippingMethod();
				successNotification('Shipping method created');
				return response.shipping_method;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to create shipping method';
				failedNotification(message);
				throw err;
			} finally {
				this.adding = false;
			}
		},

		async updateStatus(method: ShippingMethodOption, is_active: boolean) {
			await this.updateShippingMethod(String(method.id), { is_active });
		},

		async updateShippingMethod(id: string | number, payload: ShippingMethodUpdateBody): Promise<ShippingMethodOption | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.updating = true;

			try {
				const response = await $api.shippingMethod.update(String(id), {
					merchant_id: String(merchant_id ?? ''),
					...payload,
				});
				this.current_shipping_method = response.shipping_method;
				await this.getShippingMethods();
				successNotification('Shipping method updated');
				return response.shipping_method;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to update shipping method';
				failedNotification(message);
				throw err;
			} finally {
				this.updating = false;
			}
		},

		async deleteShippingMethod(id: string | number): Promise<ShippingMethodOption | undefined> {
			const { $api } = useNuxtApp();
			this.removing = true;

			try {
				const response = await $api.shippingMethod.remove(String(id));
				this.current_shipping_method = response.shipping_method;
				await this.getShippingMethods();
				successNotification('Shipping method deleted');
				return response.shipping_method;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to delete shipping method';
				failedNotification(message);
				throw err;
			} finally {
				this.removing = false;
			}
		},
	},
});
