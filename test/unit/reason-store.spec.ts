import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useReasonStore } from '../../app/stores/Reason/Reason';

const { successNotification, failedNotification } = vi.hoisted(() => ({
	successNotification: vi.fn(),
	failedNotification: vi.fn(),
}));

vi.mock('../../app/stores/AppUi/AppUi', () => ({
	successNotification,
	failedNotification,
}));

describe('useReasonStore', () => {
	const apiMock = {
		reason: {
			getMany: vi.fn(),
			getSingle: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			remove: vi.fn(),
		},
	};

	const reasonApiRow = (overrides: Record<string, unknown> = {}) => ({
		code: 'WRONG_SIZE',
		description: 'Wrong size',
		type: 'return_exchange',
		is_active: true,
		...overrides,
	});

	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		(globalThis as unknown as { useNuxtApp: () => unknown }).useNuxtApp = () => ({ $api: apiMock }) as unknown;
		(globalThis as unknown as { useCookie: (key: string) => { value: string } }).useCookie = () => ({ value: 'm1' });
	});

	const odataList = (rows: Record<string, unknown>[], total?: number) => {
		const t = total ?? rows.length;
		return { data: rows, value: rows, count: t, '@odata.count': t };
	};

	it('loads reasons with type filter', async () => {
		apiMock.reason.getMany.mockResolvedValue(odataList([reasonApiRow()], 1));

		const store = useReasonStore();
		store.filter.type = 'cancel_order' as import('yeppi-common').ReasonType;
		await store.getReasons();

		expect(apiMock.reason.getMany).toHaveBeenCalledWith(
			expect.objectContaining({
				$filter: "type eq 'cancel_order'",
			}),
		);
		expect(store.reasons).toHaveLength(1);
	});

	it('creates a reason and refreshes list', async () => {
		apiMock.reason.create.mockResolvedValue({ reason: reasonApiRow() });
		apiMock.reason.getMany.mockResolvedValue(odataList([reasonApiRow()], 1));

		const store = useReasonStore();
		await store.createReason({
			code: 'WRONG_SIZE',
			description: 'Wrong size',
			type: 'return_exchange' as import('yeppi-common').ReasonType,
			is_active: true,
		});

		expect(apiMock.reason.create).toHaveBeenCalled();
		expect(successNotification).toHaveBeenCalled();
	});
});
