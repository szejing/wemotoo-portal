import { defineStore } from 'pinia';
import { KEY } from 'yeppi-common';
import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import type { UpdateFulfillmentReq } from '~/repository/modules/fulfillment/models/request/update-fulfillment.req';
import type { FulfillmentBatch } from '~/utils/types/order-fulfillment-shipping';

export type FulfillmentAction = 'processing' | 'packed' | 'fulfilled' | 'shipped' | 'delivered';

export const useFulfillmentStore = defineStore('fulfillmentStore', {
	state: () => ({
		loading: false as boolean,
		creating: false as boolean,
		updating: false as boolean,
		lastFulfillment: undefined as FulfillmentBatch | undefined,
	}),
	actions: {
		async createFulfillment(order_no: string): Promise<FulfillmentBatch | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.creating = true;

			try {
				const response = await $api.fulfillment.create(order_no, {
					merchant_id: String(merchant_id ?? ''),
				});
				this.lastFulfillment = response.fulfillment;
				successNotification('Fulfillment created');
				return response.fulfillment;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to create fulfillment';
				failedNotification(message);
				throw err;
			} finally {
				this.creating = false;
			}
		},

		async updateArrangement(id: string, payload: Omit<UpdateFulfillmentReq, 'merchant_id'>): Promise<FulfillmentBatch | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.updating = true;

			try {
				const response = await $api.fulfillment.update(id, {
					merchant_id: String(merchant_id ?? ''),
					...payload,
				});
				this.lastFulfillment = response.fulfillment;
				successNotification('Fulfillment arrangement updated');
				return response.fulfillment;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to update fulfillment arrangement';
				failedNotification(message);
				throw err;
			} finally {
				this.updating = false;
			}
		},

		async markProcessing(id: string): Promise<FulfillmentBatch | undefined> {
			return this.runAction(id, 'processing');
		},

		async markPacked(id: string): Promise<FulfillmentBatch | undefined> {
			return this.runAction(id, 'packed');
		},

		async markFulfilled(id: string): Promise<FulfillmentBatch | undefined> {
			return this.runAction(id, 'fulfilled');
		},

		async markShipped(id: string): Promise<FulfillmentBatch | undefined> {
			return this.runAction(id, 'shipped');
		},

		async markDelivered(id: string): Promise<FulfillmentBatch | undefined> {
			return this.runAction(id, 'delivered');
		},

		async runAction(id: string, next: FulfillmentAction): Promise<FulfillmentBatch | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.updating = true;

			try {
				const body = { merchant_id: String(merchant_id ?? '') };
				let response;
				if (next === 'processing') response = await $api.fulfillment.markProcessing(id, body);
				else if (next === 'packed') response = await $api.fulfillment.markPacked(id, body);
				else if (next === 'fulfilled') response = await $api.fulfillment.markFulfilled(id, body);
				else if (next === 'shipped') response = await $api.fulfillment.markShipped(id, body);
				else response = await $api.fulfillment.markDelivered(id, body);

				this.lastFulfillment = response.fulfillment;
				successNotification(`Fulfillment marked as ${next}`);
				return response.fulfillment;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to update fulfillment';
				failedNotification(message);
				throw err;
			} finally {
				this.updating = false;
			}
		},
	},
});
