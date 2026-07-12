<template>
	<ZPagePanel id="analytics-orders-summary" :title="$t('pages.analyticsOrdersSummary')" back-to="/analytics/orders">
		<template #toolbar>
			<ZSectionFilterOrderSumm />
		</template>

		<div class="space-y-6">
			<ZTableToolbar
				v-model="order_summ.page_size"
				v-model:selected-column-keys="selectedColumnKeys"
				:page-size-options="options_page_size"
				:export-enabled="true"
				:exporting="order_summ.exporting"
				:column-options="columnOptions"
				@update:model-value="updatePageSize"
				@export="orderSummStore.exportOrderSummary"
			/>

			<UCard class="overflow-hidden" :ui="{ body: 'p-0 sm:p-0' }">
				<UTable
					:data="rows"
					:columns="visibleDailyColumns"
					:loading="loading"
					:ui="{
						root: 'relative overflow-auto',
						base: 'min-w-[980px]',
						th: 'whitespace-nowrap',
						td: 'whitespace-nowrap',
						tfoot: 'bg-elevated/50 border-t border-default',
					}"
				>
					<template #empty>
						<div class="flex flex-col items-center justify-center py-12 gap-3">
							<UIcon :name="ICONS.REPORT_ORDER" class="w-12 h-12 text-gray-400" />
							<p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('pages.noOrderSummaryFound') }}</p>
							<p class="text-xs text-gray-500 dark:text-gray-500">{{ $t('pages.tryAdjustingFilters') }}</p>
						</div>
					</template>
				</UTable>
			</UCard>

			<div v-if="data.length > 0" class="section-pagination">
				<UPagination v-model="current_page" :items-per-page="order_summ.page_size" :total="order_summ.total_data" @update:page="updatePage" />
			</div>
		</div>
	</ZPagePanel>
</template>

<script lang="ts" setup>
import { OrderStatus } from 'yeppi-common';
import { options_page_size } from '~/utils/options';
import { mapSummBillsToTableRows } from '~/utils/summ-bill-table-rows';
import { getSummColumns, getSummColumnLabels } from '~/utils/table-columns';
import { columnOptionsFromLabelMap } from '~/utils/table-columns/visibility';

const route = useRoute();
const { t } = useI18n();
useHead({ title: () => t('pages.orderSummaryTitle') });

const orderSummStore = useSummOrderStore();
const { order_summ } = storeToRefs(orderSummStore);
const loading = computed(() => order_summ.value.loading);

const VALID_ORDER_STATUSES = new Set(Object.values(OrderStatus));

const applyQueryToFilter = () => {
	const start = route.query.start_date;
	const end = route.query.end_date;
	const status = route.query.status;
	if (typeof start === 'string' && start) {
		const d = new Date(start);
		if (!Number.isNaN(d.getTime())) {
			orderSummStore.order_summ.filter.date_range.start = d;
		}
	}
	if (typeof end === 'string' && end) {
		const d = new Date(end);
		if (!Number.isNaN(d.getTime())) {
			orderSummStore.order_summ.filter.date_range.end = d;
		}
	}
	if (typeof status === 'string' && VALID_ORDER_STATUSES.has(status as OrderStatus)) {
		orderSummStore.order_summ.filter.status = status as OrderStatus;
	}
};

onMounted(async () => {
	applyQueryToFilter();
	await orderSummStore.getOrderSummary();
});

watch(
	() => ({ start: route.query.start_date, end: route.query.end_date, status: route.query.status }),
	() => {
		applyQueryToFilter();
		orderSummStore.getOrderSummary();
	},
	{ deep: true },
);

const data = computed(() => order_summ.value.data);
const current_page = computed({
	get: () => order_summ.value.current_page,
	set: (page: number) => {
		order_summ.value.current_page = page;
	},
});

const orderSummColumns = computed(() => getSummColumns(t, 'total_orders'));
const columnOptions = computed(() => columnOptionsFromLabelMap(t, getSummColumnLabels('total_orders')));
const { selectedColumnKeys, visibleColumns: visibleDailyColumns } = useTableColumnVisibility(orderSummColumns, columnOptions, {
	defaultHiddenKeys: ['currency_code', 'total_voided_qty'],
});

const rows = computed(() =>
	mapSummBillsToTableRows(data.value, {
		// Status filter All (undefined) → keep one row per status for the day
		groupByStatus: !order_summ.value.filter.status,
	}),
);

const updatePage = async (page: number) => {
	order_summ.value.current_page = page;
	await orderSummStore.getOrderSummary();
};

const updatePageSize = async (size: number) => {
	await orderSummStore.updateOrderSummPageSize(size);
};
</script>

<style scoped>
:deep(tfoot tr) {
	font-weight: 600;
}
</style>
