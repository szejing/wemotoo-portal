import { defineStore } from 'pinia';
import { KEY, ReasonType } from 'yeppi-common';
import { options_page_size } from '../../utils/options';
import { successNotification, failedNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import type { BaseODataReq } from '~/repository/base/base.req';
import type { Reason } from '~/utils/types/reason';
import type { ReasonCreateStorePayload, ReasonUpdateStorePayload } from '~/repository/modules/reason/models/request/create-reason.req';
import type { ReasonFormFields } from '~/utils/types/form/reason-form';

type ReasonFilter = {
	query: string;
	type: ReasonType | undefined;
	status: 'active' | 'inactive' | undefined;
	current_page: number;
	page_size: number;
};

const initialEmptyFilter: ReasonFilter = {
	query: '',
	type: undefined,
	status: undefined,
	current_page: 1,
	page_size: options_page_size[0] as number,
};

const initialEmptyNewReason: ReasonFormFields = {
	code: '',
	description: '',
	type: undefined,
	is_active: true,
};

const buildODataFilter = (filter: ReasonFilter): string | undefined => {
	const parts: string[] = [];

	if (filter.type) {
		parts.push(`type eq '${filter.type}'`);
	}

	if (filter.status === 'active') {
		parts.push('is_active eq true');
	} else if (filter.status === 'inactive') {
		parts.push('is_active eq false');
	}

	if (parts.length === 0) {
		return undefined;
	}

	return parts.join(' and ');
};

export const useReasonStore = defineStore('reasonStore', {
	state: () => ({
		loading: false as boolean,
		adding: false as boolean,
		updating: false as boolean,
		removing: false as boolean,
		exporting: false as boolean,
		reasons: [] as Reason[],
		total_reasons: 0 as number,
		current_reason: undefined as Reason | undefined,
		new_reason: structuredClone(initialEmptyNewReason),
		filter: initialEmptyFilter,
		errors: [] as string[],
	}),
	getters: {
		getDisplayReasons: (state) => state.reasons,
	},
	actions: {
		resetNewReason() {
			this.new_reason = structuredClone(initialEmptyNewReason);
		},

		async updatePageSize(size: number) {
			this.filter.page_size = size;
			this.filter.current_page = 1;
			await this.getReasons();
		},

		async updatePage(page: number) {
			this.filter.current_page = page;
			if (this.filter.current_page < 1) {
				return;
			}
			await this.getReasons();
		},

		async getReasons(append = false) {
			this.loading = true;
			try {
				const { $api } = useNuxtApp();
				const queryParams: BaseODataReq = {
					$top: this.filter.page_size,
					$count: true,
					$skip: (this.filter.current_page - 1) * this.filter.page_size,
					$orderby: 'code asc',
				};

				const q = this.filter.query.trim();
				if (q) {
					queryParams.$search = q;
				}

				const odataFilter = buildODataFilter(this.filter);
				if (odataFilter) {
					queryParams.$filter = odataFilter;
				}

				const response = await $api.reason.getMany(queryParams);
				const data = response.data ?? response.value ?? [];
				const total = response['@odata.count'] ?? response.count ?? 0;

				this.reasons = append ? [...this.reasons, ...data] : data;
				this.total_reasons = total ?? 0;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? (err instanceof Error ? err.message : 'Failed to load reasons');
				failedNotification(message);
				throw err;
			} finally {
				this.loading = false;
			}
		},

		async getReason(code: string): Promise<Reason | undefined> {
			const { $api } = useNuxtApp();
			this.loading = true;

			try {
				const response = await $api.reason.getSingle(code);
				this.current_reason = response.reason;
				return response.reason;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load reason';
				failedNotification(message);
				throw err;
			} finally {
				this.loading = false;
			}
		},

		async createReason(payload: ReasonCreateStorePayload): Promise<Reason | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = String(useCookie(KEY.X_MERCHANT_ID).value ?? '');
			this.adding = true;

			try {
				const resp = await $api.reason.create({
					merchant_id,
					...payload,
				});
				successNotification('Reason created');
				await this.getReasons();
				this.resetNewReason();
				return resp.reason;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to create reason';
				failedNotification(message);
				throw err;
			} finally {
				this.adding = false;
			}
		},

		async updateStatus(reason: Reason, is_active: boolean) {
			await this.updateReason(reason.code, { is_active });
		},

		async updateReason(code: string, payload: ReasonUpdateStorePayload): Promise<Reason | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = String(useCookie(KEY.X_MERCHANT_ID).value ?? '');
			this.updating = true;

			try {
				const resp = await $api.reason.update(code, {
					merchant_id,
					...payload,
				});
				this.current_reason = resp.reason;
				successNotification('Reason updated');
				await this.getReasons();
				return resp.reason;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to update reason';
				failedNotification(message);
				throw err;
			} finally {
				this.updating = false;
			}
		},

		async deleteReason(code: string): Promise<void> {
			const { $api } = useNuxtApp();
			this.removing = true;

			try {
				await $api.reason.remove(code);
				this.reasons = this.reasons.filter((r) => r.code !== code);
				successNotification('Reason deleted');
				await this.getReasons();
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to delete reason';
				failedNotification(message);
				throw err;
			} finally {
				this.removing = false;
			}
		},

		async exportReasons() {
			this.exporting = true;
			try {
				// Export not wired for reasons yet
			} finally {
				this.exporting = false;
			}
		},
	},
});
