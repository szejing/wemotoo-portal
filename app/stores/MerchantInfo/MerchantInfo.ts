import { defineStore } from 'pinia';
import { MerchantInfo } from '~/utils/types/merchant-info';
import { failedNotification, successNotification } from '../AppUi/AppUi';
import type { ErrorResponse } from '~/repository/base/error';
import type { Currency } from '~/utils/types/currency';
import { dir } from '~/utils/constants/dir';
import { GROUP_CODE, MERCHANT } from 'yeppi-common';

const initial: MerchantInfo[] = [];

type MerchantInfoUpdate = { group_code: string; set_code: string; set_value: string };

export const useMerchantInfoStore = defineStore('merchantInfoStore', {
	state: () => ({
		loading: false as boolean,
		updating: false as boolean,
		// merchant: undefined as MerchantInfo | undefined,
		merchant: structuredClone(initial),
		updatedInfo: [] as MerchantInfoUpdate[],
		currencies: [] as Currency[],
		errors: [] as string[],
	}),
	actions: {
		getMerchantInfo(group_code: string, set_code: string): MerchantInfo | null {
			const info = this.merchant.find((info) => info.group_code === group_code && info.set_code === set_code);

			return info || null;
		},

		updateMerchantInfoByGroupAndSet(group_code: string, set_code: string, set_value: string) {
			const info = new MerchantInfo({ group_code, set_code, set_value });
			const existingIdx = this.merchant.findIndex((m) => m.group_code === group_code && m.set_code === set_code);
			if (existingIdx >= 0) {
				this.merchant.splice(existingIdx, 1, info);
			} else {
				this.merchant.push(info);
			}
		},

		addToUpdatedInfo(info: MerchantInfoUpdate) {
			const existing = this.updatedInfo.find((s) => s.set_code === info.set_code);
			if (existing) {
				existing.set_value = info.set_value;
			} else {
				this.updatedInfo.push({ ...info });
			}
		},

		clearUpdatedInfo() {
			this.updatedInfo = [];
		},

		async updateMerchantInfo() {
			this.updating = true;

			const { $api } = useNuxtApp();
			try {
				if (this.updatedInfo.length === 0) return;

				const { data } = await $api.merchantInfo.saveMany({
					merchant_info: this.updatedInfo.map((info) => new MerchantInfo(info)),
				});

				if (data) {
					this.merchant = data.map((info) => new MerchantInfo(info));
					this.clearUpdatedInfo();
				}
				successNotification('Merchant information updated');
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to update merchant information';
				failedNotification(message);
			} finally {
				this.updating = false;
			}
		},

		async updateMerchantThumbnail(file: File) {
			this.updating = true;

			const { $api } = useNuxtApp();
			try {
				const { image } = await $api.image.upload(file, dir.merchant, 'merchant-thumbnail');
				if (image?.url) {
					await $api.merchantInfo.saveMany({
						merchant_info: [
							new MerchantInfo({
								group_code: GROUP_CODE.INFO,
								set_code: MERCHANT.THUMBNAIL,
								set_value: image.url,
							}),
						],
					});

					this.updateMerchantInfoByGroupAndSet(GROUP_CODE.INFO, MERCHANT.THUMBNAIL, image.url);
					this.addToUpdatedInfo({
						group_code: GROUP_CODE.INFO,
						set_code: MERCHANT.THUMBNAIL,
						set_value: image.url,
					});
				}
			} catch (err: unknown | ErrorResponse) {
				console.log(err);
				const message = (err as ErrorResponse).message ?? 'Failed to update merchant thumbnail';
				failedNotification(message);
			} finally {
				this.updating = false;
			}
		},

		async getMerchantInfos() {
			this.loading = true;
			const { $api } = useNuxtApp();
			try {
				const { data } = await $api.merchantInfo.getMany({
					$count: true,
					$top: 1000,
				});

				if (data) {
					this.merchant = data.map((info) => new MerchantInfo(info));
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load merchant information';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},

		async getCurrencies() {
			this.loading = true;
			const { $api } = useNuxtApp();
			try {
				const { data } = await $api.currency.getCurrencies({
					$top: 1,
					$skip: 0,
				});

				if (data) {
					this.currencies = data;
				}
			} catch (err: unknown | ErrorResponse) {
				const message = (err as ErrorResponse).message ?? 'Failed to load merchant information';
				failedNotification(message);
			} finally {
				this.loading = false;
			}
		},
	},
});
