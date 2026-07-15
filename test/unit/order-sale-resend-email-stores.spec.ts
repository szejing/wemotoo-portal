import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { OrderResendEmailAction } from 'yeppi-common';
import { useOrderStore } from '../../app/stores/Order/Order';
import { useSaleStore } from '../../app/stores/Sale/Sale';

const { successNotification, failedNotification } = vi.hoisted(() => ({
	successNotification: vi.fn(),
	failedNotification: vi.fn(),
}));

vi.mock('../../app/stores/AppUi/AppUi', () => ({
	successNotification,
	failedNotification,
}));

vi.mock('~/utils/options', () => ({
	getDefaultOrderStatuses: () => [],
	options_page_size: [10],
}));

vi.mock('~/utils/order-status-filter', () => ({
	buildOrderStatusODataFilter: () => '',
}));

describe('order/sale resend email stores', () => {
	const apiMock = {
		order: { resendCurrentStatusEmail: vi.fn() },
		sale: { resendCurrentStatusEmail: vi.fn() },
	};

	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		apiMock.order.resendCurrentStatusEmail.mockResolvedValue({ status: true });
		apiMock.sale.resendCurrentStatusEmail.mockResolvedValue({ status: true });
		(globalThis as unknown as { useNuxtApp: () => unknown }).useNuxtApp = () => ({ $api: apiMock }) as unknown;
	});

	it('passes the selected action through the order store', async () => {
		const store = useOrderStore();

		await store.resendCurrentStatusEmail('ORD-1', OrderResendEmailAction.SHIPPED);

		expect(apiMock.order.resendCurrentStatusEmail).toHaveBeenCalledWith('ORD-1', OrderResendEmailAction.SHIPPED);
		expect(store.resending_email).toBe(false);
	});

	it('passes the selected action through the sale store', async () => {
		const store = useSaleStore();

		await store.resendCurrentStatusEmail('ORD-1', OrderResendEmailAction.SHIPPED);

		expect(apiMock.sale.resendCurrentStatusEmail).toHaveBeenCalledWith('ORD-1', OrderResendEmailAction.SHIPPED);
		expect(store.resending_email).toBe(false);
	});
});
