import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, defineStore, setActivePinia } from 'pinia';
import { PaymentMethodType } from 'yeppi-common';

const successNotification = vi.fn();
const failedNotification = vi.fn();

vi.mock('../../app/stores/AppUi/AppUi', () => ({
	successNotification,
	failedNotification,
}));

describe('usePaymentMethodStore', () => {
	const update = vi.fn();
	const getMany = vi.fn();

	beforeEach(() => {
		setActivePinia(createPinia());
		update.mockReset();
		getMany.mockReset();
		successNotification.mockReset();
		failedNotification.mockReset();
		(globalThis as unknown as { defineStore: typeof defineStore }).defineStore = defineStore;

		update.mockResolvedValue({ method: { code: 'CASH' } });
		getMany.mockResolvedValue({ data: [], '@odata.count': 0 });
		(globalThis as unknown as { useNuxtApp: () => unknown }).useNuxtApp = () =>
			({
				$api: {
					paymentMethod: {
						update,
						getMany,
					},
				},
			}) as unknown;
	});

	it('sends every defined editable field when updating a payment method', async () => {
		const { usePaymentMethodStore } = await import('../../app/stores/PaymentMethod/PaymentMethod');
		const store = usePaymentMethodStore();
		const metadata = { terminal_id: 'T-88' };

		await store.updatePaymentMethod('CASH', {
			desc: 'Cash at counter',
			short_desc: 'Cash',
			logo: '/logo/cash.svg',
			is_active: true,
			is_sandbox: false,
			type: PaymentMethodType.CASH,
			currency_code: 'MYR',
			provider_code: 'MANUAL',
			metadata,
		});

		expect(update).toHaveBeenCalledWith('CASH', {
			desc: 'Cash at counter',
			short_desc: 'Cash',
			logo: '/logo/cash.svg',
			is_active: true,
			is_sandbox: false,
			type: PaymentMethodType.CASH,
			currency_code: 'MYR',
			provider_code: 'MANUAL',
			metadata,
		});
		expect(successNotification).toHaveBeenCalled();
	});
});
