import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { KEY } from 'yeppi-common';
import type { Range } from '~/utils/interface/range';
import type {
	ShipmentArrangementApplyResponse,
	ShipmentArrangementApplyRow,
	ShipmentArrangementListRow,
	ShipmentArrangementPreviewResponse,
	ShipmentArrangementPreviewRow,
	ShipmentArrangementQuery,
} from '~/utils/types/shipment-arrangement';

export const useShipmentArrangementStore = defineStore('shipment-arrangement', () => {
	const filters = reactive({
		search: '',
		shippingMethodId: undefined as number | undefined,
		dateRange: { start: undefined, end: undefined } as Range,
	});
	const page = ref(1);
	const pageSize = ref(15);
	const rows = ref<ShipmentArrangementListRow[]>([]);
	const total = ref(0);
	const preview = ref<ShipmentArrangementPreviewResponse>();
	const applyResult = ref<ShipmentArrangementApplyResponse>();
	const loading = ref(false);

	const toQuery = (paginate: boolean): ShipmentArrangementQuery => ({
		...(paginate ? { $top: pageSize.value, $skip: (page.value - 1) * pageSize.value } : {}),
		...(filters.search.trim() ? { $search: filters.search.trim() } : {}),
		...(filters.shippingMethodId ? { shipping_method_id: filters.shippingMethodId } : {}),
		...(filters.dateRange.start ? { start_date: `${filters.dateRange.start.getFullYear()}-${String(filters.dateRange.start.getMonth() + 1).padStart(2, '0')}-${String(filters.dateRange.start.getDate()).padStart(2, '0')}` } : {}),
		...(filters.dateRange.end ? { end_date: `${filters.dateRange.end.getFullYear()}-${String(filters.dateRange.end.getMonth() + 1).padStart(2, '0')}-${String(filters.dateRange.end.getDate()).padStart(2, '0')}` } : {}),
	});

	const toApplyRow = (row: ShipmentArrangementPreviewRow): ShipmentArrangementApplyRow => ({
		fulfillment_id: row.fulfillment_id,
		source_updated_at: row.source_updated_at,
		order_no: row.order_no,
		batch_no: row.batch_no,
		courier: row.courier,
		tracking_no: row.tracking_no,
	});

	async function fetchPending(): Promise<void> {
		loading.value = true;
		try {
			const response = await useNuxtApp().$api.fulfillment.getShipmentArrangement(toQuery(true));
			rows.value = response.data;
			total.value = response.total;
		} finally {
			loading.value = false;
		}
	}

	async function exportPending(): Promise<void> {
		const blob = await useNuxtApp().$api.fulfillment.downloadShipmentArrangement(toQuery(false));
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `shipment-arrangement-${new Date().toISOString().slice(0, 10)}.xlsx`;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	async function previewFile(file: File): Promise<void> {
		preview.value = await useNuxtApp().$api.fulfillment.previewShipmentArrangement(file);
		applyResult.value = undefined;
	}

	async function applyPreview(): Promise<void> {
		if (!preview.value) return;
		const eligible = preview.value.rows.filter((row) => row.status !== 'error').map(toApplyRow);
		const merchantId = useCookie(KEY.X_MERCHANT_ID).value;
		applyResult.value = await useNuxtApp().$api.fulfillment.applyShipmentArrangement({
			merchant_id: String(merchantId ?? ''),
			rows: eligible,
		});
		await fetchPending();
	}

	function resetPreview(): void {
		preview.value = undefined;
		applyResult.value = undefined;
	}

	return {
		filters,
		page,
		pageSize,
		rows,
		total,
		preview,
		applyResult,
		loading,
		fetchPending,
		exportPending,
		previewFile,
		applyPreview,
		resetPreview,
	};
});
