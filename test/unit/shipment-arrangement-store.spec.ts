import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createPinia, setActivePinia } from 'pinia';
import { KEY } from 'yeppi-common';
import type {
	ShipmentArrangementApplyError,
	ShipmentArrangementPreviewResponse,
} from '../../app/utils/types/shipment-arrangement';
import { useShipmentArrangementStore } from '../../app/stores/ShipmentArrangement/ShipmentArrangement';

const getShipmentArrangement = mock();
const downloadShipmentArrangement = mock();
const previewShipmentArrangement = mock();
const applyShipmentArrangement = mock();
const createObjectURL = mock(() => 'blob:shipment-arrangement');
const revokeObjectURL = mock();
const click = mock();

const previewResponse: ShipmentArrangementPreviewResponse = {
	total: 3,
	valid: 1,
	warnings: 1,
	errors: 1,
	rows: [
		{
			fulfillment_id: '11111111-1111-4111-8111-111111111111',
			source_updated_at: '2026-07-18T01:00:00.000Z',
			order_no: 'WM-100',
			batch_no: 1,
			ordered_at: '2026-07-17T01:00:00.000Z',
			recipient: 'Alice',
			destination: 'Selangor',
			shipping_method: 'Standard',
			row_number: 2,
			courier: 'Pos Laju',
			tracking_no: 'PL-100',
			status: 'valid',
			messages: [],
		},
		{
			fulfillment_id: '22222222-2222-4222-8222-222222222222',
			source_updated_at: '2026-07-18T02:00:00.000Z',
			order_no: 'WM-101',
			batch_no: 2,
			ordered_at: '2026-07-17T02:00:00.000Z',
			recipient: 'Bob',
			destination: 'Johor',
			shipping_method: 'Express',
			row_number: 3,
			courier: '',
			tracking_no: 'WM-101-TRACK',
			status: 'warning',
			messages: ['Courier is blank'],
		},
		{
			fulfillment_id: '33333333-3333-4333-8333-333333333333',
			source_updated_at: '2026-07-18T03:00:00.000Z',
			order_no: 'WM-102',
			batch_no: 1,
			ordered_at: '2026-07-17T03:00:00.000Z',
			recipient: 'Carol',
			destination: 'Penang',
			shipping_method: 'Standard',
			row_number: 4,
			courier: 'DHL',
			tracking_no: '',
			status: 'error',
			messages: ['Tracking number is required'],
		},
	],
};

const applyError: ShipmentArrangementApplyError = {
	fulfillment_id: '22222222-2222-4222-8222-222222222222',
	order_no: 'WM-101',
	batch_no: 2,
	message: 'Fulfillment changed after export',
};

describe('useShipmentArrangementStore', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		getShipmentArrangement.mockReset();
		downloadShipmentArrangement.mockReset();
		previewShipmentArrangement.mockReset();
		applyShipmentArrangement.mockReset();
		createObjectURL.mockClear();
		revokeObjectURL.mockClear();
		click.mockClear();
		getShipmentArrangement.mockResolvedValue({ data: [], total: 0 });
		(globalThis as unknown as { useNuxtApp: () => unknown }).useNuxtApp = () => ({
			$api: {
				fulfillment: {
					getShipmentArrangement,
					downloadShipmentArrangement,
					previewShipmentArrangement,
					applyShipmentArrangement,
				},
			},
		});
		(globalThis as unknown as { useCookie: (key: string) => { value: string } }).useCookie = (key) => ({
			value: key === KEY.X_MERCHANT_ID ? 'merchant-1' : '',
		});
		Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
		Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
		(globalThis as unknown as { document: unknown }).document = {
			createElement: () => ({ href: '', download: '', click }),
		};
	});

	it('previews multipart files and applies only valid/warning rows', async () => {
		previewShipmentArrangement.mockResolvedValue(previewResponse);
		applyShipmentArrangement.mockResolvedValue({ total: 2, updated: 1, failed: 1, errors: [applyError] });
		const store = useShipmentArrangementStore();
		const file = new File(['xlsx'], 'shipments.xlsx');

		await store.previewFile(file);
		await store.applyPreview();

		expect(previewShipmentArrangement).toHaveBeenCalledWith(file);
		expect(applyShipmentArrangement).toHaveBeenCalledWith({
			merchant_id: 'merchant-1',
			rows: previewResponse.rows.filter((row) => row.status !== 'error').map((row) => ({
				fulfillment_id: row.fulfillment_id,
				source_updated_at: row.source_updated_at,
				order_no: row.order_no,
				batch_no: row.batch_no,
				courier: row.courier,
				tracking_no: row.tracking_no,
			})),
		});
		expect(store.applyResult?.updated).toBe(1);
		expect(getShipmentArrangement).toHaveBeenCalledWith({ $top: 15, $skip: 0 });
	});

	it('clamps and refetches when applying the only row on the final page', async () => {
		previewShipmentArrangement.mockResolvedValue({
			...previewResponse,
			total: 1,
			valid: 1,
			warnings: 0,
			errors: 0,
			rows: [previewResponse.rows[0]!],
		});
		applyShipmentArrangement.mockResolvedValue({ total: 1, updated: 1, failed: 0, errors: [] });
		getShipmentArrangement
			.mockResolvedValueOnce({ data: [], total: 4 })
			.mockResolvedValueOnce({ data: previewResponse.rows.slice(0, 2), total: 4 });
		const store = useShipmentArrangementStore();
		store.page = 3;
		store.pageSize = 2;
		await store.previewFile(new File(['xlsx'], 'shipments.xlsx'));

		await store.applyPreview();

		expect(store.page).toBe(2);
		expect(getShipmentArrangement).toHaveBeenNthCalledWith(1, { $top: 2, $skip: 4 });
		expect(getShipmentArrangement).toHaveBeenNthCalledWith(2, { $top: 2, $skip: 2 });
		expect(store.rows).toHaveLength(2);
		expect(store.total).toBe(4);
	});

	it('keeps date filters empty by default and exports current filters without paging', async () => {
		const blob = new Blob(['xlsx']);
		downloadShipmentArrangement.mockResolvedValue(blob);
		const store = useShipmentArrangementStore();

		expect(store.filters.dateRange).toEqual({ start: undefined, end: undefined });
		store.filters.search = ' WM-100 ';
		await store.exportPending();

		expect(downloadShipmentArrangement).toHaveBeenCalledWith({ $search: 'WM-100' });
		expect(createObjectURL).toHaveBeenCalledWith(blob);
		expect(click).toHaveBeenCalledTimes(1);
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:shipment-arrangement');
	});

	it('fetches the current page with shipping method and date filters', async () => {
		getShipmentArrangement.mockResolvedValue({ data: previewResponse.rows.slice(0, 1), total: 1 });
		const store = useShipmentArrangementStore();
		store.page = 3;
		store.pageSize = 25;
		store.filters.shippingMethodId = 7;
		store.filters.dateRange = {
			start: new Date('2026-07-01T12:00:00.000Z'),
			end: new Date('2026-07-18T12:00:00.000Z'),
		};

		await store.fetchPending();

		expect(getShipmentArrangement).toHaveBeenCalledWith({
			$top: 25,
			$skip: 50,
			shipping_method_id: 7,
			start_date: '2026-07-01',
			end_date: '2026-07-18',
		});
		expect(store.rows).toHaveLength(1);
		expect(store.total).toBe(1);
		expect(store.loading).toBe(false);
	});

	it('formats local-midnight dates as their local calendar day', async () => {
		const previousTimeZone = process.env.TZ;
		process.env.TZ = 'Asia/Kuala_Lumpur';
		try {
			const store = useShipmentArrangementStore();
			store.filters.dateRange = {
				start: new Date(2026, 6, 18, 0, 0, 0),
				end: new Date(2026, 6, 18, 0, 0, 0),
			};

			await store.fetchPending();

			expect(getShipmentArrangement).toHaveBeenCalledWith({
				$top: 15,
				$skip: 0,
				start_date: '2026-07-18',
				end_date: '2026-07-18',
			});
		} finally {
			if (previousTimeZone === undefined) {
				delete process.env.TZ;
			} else {
				process.env.TZ = previousTimeZone;
			}
		}
	});

	it('resets preview and apply result together', async () => {
		previewShipmentArrangement.mockResolvedValue(previewResponse);
		const store = useShipmentArrangementStore();
		await store.previewFile(new File(['xlsx'], 'shipments.xlsx'));
		store.applyResult = { total: 0, updated: 0, failed: 0, errors: [] };

		store.resetPreview();

		expect(store.preview).toBeUndefined();
		expect(store.applyResult).toBeUndefined();
	});
});
