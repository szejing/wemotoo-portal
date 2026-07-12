import { defineStore } from 'pinia';
import { KEY } from 'yeppi-common';
import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import type { OrderShipment } from '~/utils/types/order-fulfillment-shipping';
import type { CreateShipmentReq } from '~/repository/modules/shipment/models/request/create-shipment.req';
import type { UpdateShipmentReq } from '~/repository/modules/shipment/models/request/update-shipment.req';

export const useShipmentStore = defineStore('shipmentStore', {
	state: () => ({
		loading: false as boolean,
		creating: false as boolean,
		updating: false as boolean,
		removing: false as boolean,
		shipments: [] as OrderShipment[],
		lastShipment: undefined as OrderShipment | undefined,
	}),
	actions: {
		async getShipments(): Promise<OrderShipment[]> {
			const { $api } = useNuxtApp();
			this.loading = true;

			try {
				const response = await $api.shipment.getMany();
				this.shipments = response.shipments ?? [];
				return this.shipments;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load shipments';
				failedNotification(message);
				throw err;
			} finally {
				this.loading = false;
			}
		},

		async getShipment(id: string): Promise<OrderShipment | undefined> {
			const { $api } = useNuxtApp();
			this.loading = true;

			try {
				const response = await $api.shipment.getSingle(id);
				this.lastShipment = response.shipment;
				return response.shipment;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load shipment';
				failedNotification(message);
				throw err;
			} finally {
				this.loading = false;
			}
		},

		async createShipment(payload: Omit<CreateShipmentReq, 'merchant_id'>): Promise<OrderShipment | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.creating = true;

			try {
				const response = await $api.shipment.create({
					merchant_id: String(merchant_id ?? ''),
					...payload,
				});
				this.lastShipment = response.shipment;
				successNotification('Shipment created');
				return response.shipment;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to create shipment';
				failedNotification(message);
				throw err;
			} finally {
				this.creating = false;
			}
		},

		async updateShipment(id: string, payload: Omit<UpdateShipmentReq, 'merchant_id'>): Promise<OrderShipment | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.updating = true;

			try {
				const response = await $api.shipment.update(id, {
					merchant_id: String(merchant_id ?? ''),
					...payload,
				});
				this.lastShipment = response.shipment;
				this.shipments = this.shipments.map((shipment) => (shipment.id === id ? response.shipment : shipment));
				successNotification('Shipment updated');
				return response.shipment;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to update shipment';
				failedNotification(message);
				throw err;
			} finally {
				this.updating = false;
			}
		},

		async deleteShipment(id: string): Promise<OrderShipment | undefined> {
			const { $api } = useNuxtApp();
			this.removing = true;

			try {
				const response = await $api.shipment.remove(id);
				this.lastShipment = response.shipment;
				this.shipments = this.shipments.filter((shipment) => shipment.id !== id);
				successNotification('Shipment deleted');
				return response.shipment;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to delete shipment';
				failedNotification(message);
				throw err;
			} finally {
				this.removing = false;
			}
		},

		async markShipped(id: string): Promise<OrderShipment | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.updating = true;

			try {
				const response = await $api.shipment.markShipped(id, {
					merchant_id: String(merchant_id ?? ''),
				});
				this.lastShipment = response.shipment;
				this.shipments = this.shipments.map((shipment) => (shipment.id === id ? response.shipment : shipment));
				successNotification('Shipment marked as shipped');
				return response.shipment;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to mark shipment shipped';
				failedNotification(message);
				throw err;
			} finally {
				this.updating = false;
			}
		},

		async markDelivered(id: string): Promise<OrderShipment | undefined> {
			const { $api } = useNuxtApp();
			const merchant_id = useCookie(KEY.X_MERCHANT_ID).value;
			this.updating = true;

			try {
				const response = await $api.shipment.markDelivered(id, {
					merchant_id: String(merchant_id ?? ''),
				});
				this.lastShipment = response.shipment;
				this.shipments = this.shipments.map((shipment) => (shipment.id === id ? response.shipment : shipment));
				successNotification('Shipment marked as delivered');
				return response.shipment;
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to mark shipment delivered';
				failedNotification(message);
				throw err;
			} finally {
				this.updating = false;
			}
		},
	},
});
