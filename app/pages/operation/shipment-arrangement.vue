<template>
	<ZPagePanel id="shipment-arrangement" :title="$t('shipmentArrangement.title')">
		<div class="min-w-0 space-y-5">
			<p class="max-w-3xl text-sm leading-5 text-muted">{{ $t('shipmentArrangement.subtitle') }}</p>

			<ShipmentArrangementWorkflowGuide
				:pending-count="store.total"
				:exporting="exporting"
				:importing="importing"
				@export="exportPending"
				@import="openFilePicker"
			/>

			<UAlert v-if="pageError" color="error" variant="soft" icon="i-lucide-circle-alert" :title="$t('shipmentArrangement.states.loadErrorTitle')" :description="pageError">
				<template #actions>
					<UButton data-testid="refresh-pending" color="error" variant="outline" size="sm" :label="$t('common.refresh')" @click="refreshPending" />
				</template>
			</UAlert>
			<UAlert v-if="uploadError" color="error" variant="soft" icon="i-lucide-file-warning" :title="$t('shipmentArrangement.states.uploadErrorTitle')" :description="uploadError" />

			<section class="rounded-lg border border-default bg-default p-4" :aria-label="$t('shipmentArrangement.filters.title')">
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1.4fr)_minmax(12rem,0.8fr)_auto_auto] xl:items-end">
					<label class="min-w-0 space-y-1.5 text-sm font-medium text-default">
						<span>{{ $t('shipmentArrangement.filters.searchLabel') }}</span>
						<UInput v-model="store.filters.search" icon="i-lucide-search" :placeholder="$t('shipmentArrangement.filters.search')" />
					</label>
					<label class="min-w-0 space-y-1.5 text-sm font-medium text-default">
						<span>{{ $t('shipmentArrangement.filters.shippingMethodLabel') }}</span>
						<USelectMenu
							v-model="store.filters.shippingMethodId"
							data-testid="shipping-method-filter"
							class="w-full"
							:items="shippingMethodOptions"
							value-key="value"
							:placeholder="$t('shipmentArrangement.filters.shippingMethod')"
						/>
					</label>
					<div class="min-w-0 space-y-1.5 text-sm font-medium text-default">
						<span>{{ $t('shipmentArrangement.filters.orderDate') }}</span>
						<ZDateRange v-model="store.filters.dateRange" hide-presets />
					</div>
					<div class="flex flex-col gap-2 sm:flex-row xl:justify-end">
						<UButton
							data-testid="clear-filters"
							class="min-h-11 justify-center"
							color="neutral"
							variant="ghost"
							icon="i-lucide-eraser"
							:label="$t('shipmentArrangement.actions.clearFilters')"
							:aria-label="$t('shipmentArrangement.actions.clearFilters')"
							@click="clearFilters"
						/>
						<UButton
							data-testid="export-pending"
							class="min-h-11 justify-center"
							color="primary"
							variant="outline"
							icon="i-lucide-file-spreadsheet"
							:label="$t('shipmentArrangement.actions.export')"
							:disabled="store.total === 0"
							:loading="exporting"
							@click="exportPending"
						/>
						<UButton
							class="min-h-11 justify-center"
							icon="i-lucide-upload"
							:label="$t('shipmentArrangement.actions.import')"
							:loading="importing"
							@click="openFilePicker"
						/>
					</div>
				</div>
				<input ref="fileInput" class="hidden" type="file" accept=".xlsx" @change="onFileSelected" />
			</section>

			<section class="min-w-0 rounded-lg border border-default bg-default" :aria-label="$t('shipmentArrangement.table.title')">
				<div class="flex flex-col gap-3 border-b border-default p-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 class="text-base font-semibold text-default">{{ $t('shipmentArrangement.table.pendingTitle') }}</h2>
						<p class="text-sm text-muted">{{ $t('shipmentArrangement.table.pendingCount', { count: store.total }) }}</p>
					</div>
					<ZTableToolbar
						v-model="store.pageSize"
						v-model:selected-column-keys="selectedColumnKeys"
						class="w-full sm:w-auto"
						:page-size-options="options_page_size"
						:export-enabled="false"
						:column-options="columnOptions"
						@update:model-value="updatePageSize"
					/>
				</div>

				<div v-if="store.loading" data-testid="pending-loading" class="space-y-0 divide-y divide-default">
					<div v-for="row in 6" :key="row" class="grid grid-cols-2 gap-4 p-4 sm:grid-cols-6">
						<USkeleton v-for="cell in 6" :key="cell" class="h-4" />
					</div>
				</div>

				<div v-else-if="store.rows.length === 0" data-testid="pending-empty" class="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
					<UIcon name="i-lucide-package-check" class="size-12 text-dimmed" />
					<div>
						<p class="font-semibold text-default">{{ $t('shipmentArrangement.states.emptyTitle') }}</p>
						<p class="mt-1 text-sm text-muted">{{ $t('shipmentArrangement.states.emptyDescription') }}</p>
					</div>
					<UButton data-testid="refresh-pending" color="neutral" variant="outline" icon="i-lucide-refresh-cw" :label="$t('common.refresh')" @click="refreshPending" />
				</div>

				<div v-else class="max-w-full overflow-x-auto">
					<UTable :data="store.rows" :columns="visibleColumns" class="min-w-[64rem]" />
				</div>

				<div v-if="!store.loading && store.rows.length > 0" class="flex flex-col gap-3 border-t border-default px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
					<span>{{ $t('shipmentArrangement.table.showing', { from: firstVisibleRow, to: lastVisibleRow, total: store.total }) }}</span>
					<UPagination v-model:page="store.page" :items-per-page="store.pageSize" :total="store.total" show-first show-last size="sm" />
				</div>
			</section>

			<ShipmentArrangementImportPreviewModal v-model="previewOpen" :applying="applying" :error="applyError" @apply="applyPreview" />
		</div>
	</ZPagePanel>
</template>

<script setup lang="ts">
import { options_page_size } from '~/utils/options';
import { getShipmentArrangementColumns } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';
import { failedNotification, successNotification } from '~/stores/AppUi/AppUi';
import type { ShippingMethodOption } from '~/utils/types/order-fulfillment-shipping';

const SHIPMENT_ARRANGEMENT_COLUMN_LABELS = {
	order_no: 'shipmentArrangement.table.order',
	batch_no: 'shipmentArrangement.table.batch',
	ordered_at: 'shipmentArrangement.table.ordered',
	recipient: 'shipmentArrangement.table.recipient',
	destination: 'shipmentArrangement.table.destination',
	shipping_method: 'shipmentArrangement.table.shippingMethod',
} as const;

const store = useShipmentArrangementStore();
const shippingStore = useShippingMethodStore();
const { t } = useI18n();
const fileInput = ref<HTMLInputElement>();
const previewOpen = ref(false);
const exporting = ref(false);
const importing = ref(false);
const applying = ref(false);
const pageError = ref<string>();
const uploadError = ref<string>();
const applyError = ref<string>();
const activeShippingMethods = ref<ShippingMethodOption[]>([]);
const resettingFilters = ref(false);
let filterRefreshGeneration = 0;

const columns = computed(() => getShipmentArrangementColumns(t));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, SHIPMENT_ARRANGEMENT_COLUMN_LABELS));
const { selectedColumnKeys, visibleColumns } = useTableColumnVisibility(columns, columnOptions);
const shippingMethodOptions = computed(() => [
	{ label: t('shipmentArrangement.filters.shippingMethod'), value: undefined },
	...activeShippingMethods.value.map((method) => ({ label: method.description, value: method.id })),
]);
const firstVisibleRow = computed(() => (store.total === 0 ? 0 : (store.page - 1) * store.pageSize + 1));
const lastVisibleRow = computed(() => Math.min(store.page * store.pageSize, store.total));

useHead({ title: () => t('shipmentArrangement.title') });

const refreshPending = async (): Promise<void> => {
	pageError.value = undefined;
	try {
		await store.fetchPending();
	} catch (error) {
		pageError.value = error instanceof Error ? error.message : String(error);
	}
};

const clearFilters = async (): Promise<void> => {
	filterRefreshGeneration += 1;
	resettingFilters.value = true;
	store.filters.search = '';
	store.filters.shippingMethodId = undefined;
	store.filters.dateRange = { start: undefined, end: undefined };
	store.page = 1;
	await nextTick();
	resettingFilters.value = false;
	await refreshPending();
};

const exportPending = async (): Promise<void> => {
	exporting.value = true;
	try {
		await store.exportPending();
		successNotification(t('shipmentArrangement.notifications.exported'));
	} catch (error) {
		failedNotification(error instanceof Error ? error.message : String(error));
	} finally {
		exporting.value = false;
	}
};

const openFilePicker = (): void => {
	fileInput.value?.click();
};

const onFileSelected = async (event: Event): Promise<void> => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	input.value = '';
	if (!file) return;

	uploadError.value = undefined;
	applyError.value = undefined;
	if (!file.name.toLowerCase().endsWith('.xlsx')) {
		uploadError.value = t('shipmentArrangement.states.invalidFile');
		failedNotification(uploadError.value);
		return;
	}

	importing.value = true;
	try {
		store.resetPreview();
		await store.previewFile(file);
		previewOpen.value = true;
	} catch (error) {
		uploadError.value = error instanceof Error ? error.message : String(error);
		failedNotification(uploadError.value);
	} finally {
		importing.value = false;
	}
};

const applyPreview = async (): Promise<void> => {
	applying.value = true;
	applyError.value = undefined;
	try {
		await store.applyPreview();
		if ((store.applyResult?.failed ?? 0) > 0) {
			failedNotification(t('shipmentArrangement.notifications.partial', { updated: store.applyResult?.updated ?? 0, failed: store.applyResult?.failed ?? 0 }));
		} else {
			successNotification(t('shipmentArrangement.notifications.applied', { count: store.applyResult?.updated ?? 0 }));
		}
	} catch (error) {
		applyError.value = error instanceof Error ? error.message : String(error);
		failedNotification(applyError.value);
	} finally {
		applying.value = false;
	}
};

const updatePageSize = async (size: number): Promise<void> => {
	store.pageSize = size;
	if (store.page !== 1) {
		store.page = 1;
		return;
	}
	await refreshPending();
};

watch(
	() => store.page,
	() => {
		if (!resettingFilters.value && !applying.value) void refreshPending();
	},
);

const refreshForFilterChange = useDebounceFn((generation: number) => {
	if (generation !== filterRefreshGeneration) return;
	if (store.page !== 1) {
		store.page = 1;
		return;
	}
	void refreshPending();
}, 300);

watch(
	() => [store.filters.search, store.filters.shippingMethodId, store.filters.dateRange.start, store.filters.dateRange.end],
	() => {
		if (!resettingFilters.value) void refreshForFilterChange(filterRefreshGeneration);
	},
);

onMounted(async () => {
	await Promise.all([
		refreshPending(),
		shippingStore.fetchActiveShippingMethodOptions().then((methods) => {
			activeShippingMethods.value = methods;
		}),
	]);
});
</script>
