import { defineStore } from 'pinia';
import { KEY } from 'yeppi-common';
import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { ErrorResponse } from '~/repository/base/error';
import type { Courier } from '~/utils/types/courier';
import type { CourierWriteBody } from '~/repository/modules/courier/models/request/create-courier.req';
import type { UpdateCourierReq } from '~/repository/modules/courier/models/request/update-courier.req';
import type { CourierFormFields } from '~/utils/types/form/courier-form';
import { options_page_size } from '~/utils/options';

type CourierFilter = {
	query: string;
	status: 'active' | 'inactive' | undefined;
	current_page: number;
	page_size: number;
};

const initialEmptyFilter: CourierFilter = {
	query: '',
	status: undefined,
	current_page: 1,
	page_size: options_page_size[0] as number,
};

const initialEmptyNewCourier: CourierFormFields = {
	name: '',
	description: '',
	is_active: true,
};

export const useCourierStore = defineStore('courierStore', {
	state: () => ({
		loading: false,
		adding: false,
		updating: false,
		removing: false,
		exporting: false,
		couriers: [] as Courier[],
		total_couriers: 0,
		current_courier: undefined as Courier | undefined,
		new_courier: structuredClone(initialEmptyNewCourier),
		filter: structuredClone(initialEmptyFilter),
	}),
	getters: {
		getDisplayCouriers: (state) => state.couriers,
		activeCouriers: (state) => state.couriers.filter((courier) => courier.is_active),
	},
	actions: {
		resetNewCourier() {
			this.new_courier = structuredClone(initialEmptyNewCourier);
		},

		async updatePageSize(size: number) {
			this.filter.page_size = size;
			this.filter.current_page = 1;
			await this.getCouriers();
		},

		async updatePage(page: number) {
			this.filter.current_page = page;

			if (this.filter.current_page < 0) {
				return;
			}

			await this.getCouriers();
		},

		buildQuery(query?: BaseODataReq): BaseODataReq {
			if (query) {
				return query;
			}

			const queryParams: BaseODataReq = {
				$top: this.filter.page_size,
				$count: true,
				$skip: (this.filter.current_page - 1) * this.filter.page_size,
				$orderby: 'name asc',
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

			return queryParams;
		},

		async getCouriers(query?: BaseODataReq): Promise<Courier[]> {
			const { $api } = useNuxtApp();
			this.loading = true;

			try {
				const response = await $api.courier.getMany(this.buildQuery(query));
				const data = response.data ?? response.value ?? [];
				this.couriers = data;
				this.total_couriers = response['@odata.count'] ?? response.count ?? data.length;
				return this.couriers;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load couriers';
				failedNotification(message);
				throw err;
			} finally {
				this.loading = false;
			}
		},

		async fetchAllActiveCouriers(): Promise<Courier[]> {
			const { $api } = useNuxtApp();
			const pageSize = 100;
			const couriers: Courier[] = [];
			let skip = 0;

			try {
				while (true) {
					const response = await $api.courier.getMany({
						$top: pageSize,
						$count: true,
						$skip: skip,
						$orderby: 'name asc',
						$filter: 'is_active eq true',
					});
					const page = response.data ?? response.value ?? [];
					couriers.push(...page.filter((courier) => courier.is_active));
					skip += page.length;

					const total = response['@odata.count'] ?? response.count;
					if (page.length === 0 || (total != null ? skip >= total : page.length < pageSize)) break;
				}

				return [...new Map(couriers.map((courier) => [courier.id, courier])).values()];
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load active couriers';
				failedNotification(message);
				throw err;
			}
		},

		async getCourier(id: number | string): Promise<Courier | undefined> {
			const { $api } = useNuxtApp();
			this.loading = true;

			try {
				const response = await $api.courier.getSingle(id);
				this.current_courier = response.courier;
				return response.courier;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load courier';
				failedNotification(message);
				throw err;
			} finally {
				this.loading = false;
			}
		},

		async createCourier(payload: CourierWriteBody): Promise<Courier | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.adding = true;

			try {
				const response = await $api.courier.create({
					merchant_id: String(merchant_id ?? ''),
					...payload,
				});
				this.current_courier = response.courier;
				await this.getCouriers();
				this.resetNewCourier();
				successNotification('Courier created');
				return response.courier;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to create courier';
				failedNotification(message);
				throw err;
			} finally {
				this.adding = false;
			}
		},

		async updateCourier(id: number | string, payload: Omit<UpdateCourierReq, 'merchant_id'>): Promise<Courier | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.updating = true;

			try {
				const response = await $api.courier.update(id, {
					merchant_id: String(merchant_id ?? ''),
					...payload,
				});
				this.current_courier = response.courier;
				await this.getCouriers();
				successNotification('Courier updated');
				return response.courier;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to update courier';
				failedNotification(message);
				throw err;
			} finally {
				this.updating = false;
			}
		},

		async updateStatus(courier: Courier, is_active: boolean) {
			await this.updateCourier(courier.id, { is_active });
		},

		async deleteCourier(id: number | string): Promise<Courier | undefined> {
			const { $api } = useNuxtApp();
			this.removing = true;

			try {
				const response = await $api.courier.remove(id);
				this.current_courier = response.courier;
				await this.getCouriers();
				successNotification('Courier deleted');
				return response.courier;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to delete courier';
				failedNotification(message);
				throw err;
			} finally {
				this.removing = false;
			}
		},

		async exportCouriers() {
			this.exporting = true;
			try {
				// Export not wired for couriers yet.
			} finally {
				this.exporting = false;
			}
		},
	},
});
